import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import { transitionBookingState } from "@/lib/bookingStateMachine";
import { settleCompletedRidePayment } from "@/lib/settlePayment";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await connectDb();
  const session = await auth();

  const actorRole = session?.user?.role === "vendor" || session?.user?.role === "driver" ? "driver" : session?.user?.role === "admin" ? "admin" : "driver";
  const actorId = session?.user?.id;

  const now = new Date();

  const transitionRes = await transitionBookingState({
    bookingId: id,
    targetStatus: "completed",
    actorId,
    actorRole,
    payload: {
      completedAt: now,
      actualDropoffTime: now,
    },
  });

  if (!transitionRes.success) {
    const status = transitionRes.errorCode === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json({ message: transitionRes.message || "Could not complete ride" }, { status });
  }

  const booking = transitionRes.booking!;

  // If this was an active transition (not a duplicate call), calculate duration & settle earnings
  if (!transitionRes.isDuplicateCall) {
    if (booking.startedAt) {
      const durationMins = Math.max(
        1,
        Math.round((now.getTime() - new Date(booking.startedAt).getTime()) / (1000 * 60))
      );
      booking.tripDurationMinutes = durationMins;
      await booking.save();
    }

    /* Settle commission and driver wallet earnings */
    await settleCompletedRidePayment(booking._id);
  }

  return NextResponse.json({ success: true, booking, isDuplicate: transitionRes.isDuplicateCall });
}