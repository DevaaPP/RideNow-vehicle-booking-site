import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import { escalateToNextCandidate } from "@/lib/driverMatchingEngine";

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

    // 1. Check CRON_SECRET authorization for automated dispatch timers
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      Boolean(cronSecret) && timingSafeCheck(bearerToken, cronSecret);

    const session = await auth();
    const isAdmin = session?.user?.role === "admin";
    const sessionUserId = session?.user?.id?.toString();

    if (!isCronAuthorized && !isAdmin && !sessionUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const booking = await Booking.findById(id).select(
      "user driver status candidateDrivers currentDriverIndex createdAt updatedAt"
    );
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // 2. State Guard: Only unfulfilled search states can be timed out
    if (booking.status !== "requested" && booking.status !== "searching_driver") {
      return NextResponse.json(
        {
          message: `Booking is in status '${booking.status}' and cannot be timed out.`,
        },
        { status: 400 }
      );
    }

    // 3. Tenancy & Role Validation
    const isRider = sessionUserId && booking.user?.toString() === sessionUserId;
    const isAssignedCandidateDriver =
      sessionUserId && booking.driver?.toString() === sessionUserId;

    if (!isCronAuthorized && !isAdmin && !isAssignedCandidateDriver && !isRider) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to timeout this booking." },
        { status: 403 }
      );
    }

    // 4. Rate / Timing Guard for Rider Escalation
    // Prevents riders from looping /timeout to immediately skip candidates
    if (isRider && !isCronAuthorized && !isAdmin) {
      const CANDIDATE_WINDOW_MS = 15 * 1000; // 15-second minimum acceptance window
      const lastUpdateMs = booking.updatedAt
        ? new Date(booking.updatedAt).getTime()
        : new Date(booking.createdAt).getTime();
      const elapsedMs = Date.now() - lastUpdateMs;

      if (elapsedMs < CANDIDATE_WINDOW_MS) {
        return NextResponse.json(
          {
            message: `Premature candidate timeout: Driver has ${Math.ceil((CANDIDATE_WINDOW_MS - elapsedMs) / 1000)}s remaining to accept.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Atomic dispatch escalation
    const result = await escalateToNextCandidate(id, "timeout");

    return NextResponse.json({
      success: result.success,
      status: result.status,
      currentDriverIndex: result.currentDriverIndex,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
