import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { auth } from "@/auth";
import { transitionBookingState } from "@/lib/bookingStateMachine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const id = (await context.params).id;

    // 1. Authorization: check Vercel / internal CRON_SECRET or authenticated session
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    const session = await auth();
    const isAdmin = session?.user?.role === "admin";
    const sessionUserId = session?.user?.id?.toString();

    const booking = await Booking.findById(id).select("user driver status");
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const isRider = sessionUserId && booking.user?.toString() === sessionUserId;

    if (!isCronAuthorized && !isAdmin && !isRider) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to expire this booking." },
        { status: 403 }
      );
    }

    const actorRole = isCronAuthorized || isAdmin ? "system" : "user";
    const transitionRes = await transitionBookingState({
      bookingId: id,
      targetStatus: "expired",
      actorId: sessionUserId,
      actorRole,
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
