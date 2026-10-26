import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import { transitionBookingState } from "@/lib/bookingStateMachine";

function timingSafeCheck(provided?: string | null, expected?: string | null): boolean {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const id = (await context.params).id;

    // 1. Authorization: check Vercel / internal CRON_SECRET or authenticated session
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const cronSecret = process.env.CRON_SECRET;

    // Timing-safe cron authorization. Fails closed if CRON_SECRET is not configured.
    const isCronAuthorized =
      Boolean(cronSecret) && timingSafeCheck(bearerToken, cronSecret);

    const session = await auth();
    const isAdmin = session?.user?.role === "admin";
    const sessionUserId = session?.user?.id?.toString();

    const booking = await Booking.findById(id).select(
      "user driver status createdAt updatedAt"
    );
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const isRider = sessionUserId && booking.user?.toString() === sessionUserId;

    // 2. Strict actor validation: only CRON, Admin, or the rider (under search timeout) may proceed
    if (!isCronAuthorized && !isAdmin && !isRider) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to expire this booking." },
        { status: 403 }
      );
    }

    // 3. Deadline and State Verification for Rider Calls
    // Riders can ONLY expire unfulfilled search requests whose deadline has actually elapsed.
    if (!isCronAuthorized && !isAdmin) {
      if (booking.status !== "requested" && booking.status !== "searching_driver") {
        return NextResponse.json(
          {
            message:
              "Invalid state: Only unfulfilled search requests can expire. For active rides, request cancellation.",
          },
          { status: 400 }
        );
      }

      const SEARCH_WINDOW_MS = 90 * 1000; // 90 seconds search window
      const createdAtMs = booking.createdAt
        ? new Date(booking.createdAt).getTime()
        : 0;
      const elapsedMs = Date.now() - createdAtMs;

      if (elapsedMs < SEARCH_WINDOW_MS) {
        return NextResponse.json(
          {
            message: `Premature expiration: Search timeout deadline has not elapsed (${Math.ceil((SEARCH_WINDOW_MS - elapsedMs) / 1000)}s remaining).`,
          },
          { status: 400 }
        );
      }
    }

    // 4. State Machine Transition Execution
    // State machine enforces terminal transition and unlocks any reserved student discounts.
    const transitionRes = await transitionBookingState({
      bookingId: id,
      targetStatus: "expired",
      actorId: sessionUserId,
      actorRole: "system", // Executed under system transition authority with verified deadline
    });

    if (!transitionRes.success) {
      return NextResponse.json(
        { message: transitionRes.message || "Could not expire booking" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, booking: transitionRes.booking });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
