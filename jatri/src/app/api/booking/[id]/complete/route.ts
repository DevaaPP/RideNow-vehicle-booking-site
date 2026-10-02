import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { settleCompletedRidePayment } from "@/lib/settlePayment";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await connectDb();

  const booking = await Booking.findById(id);

  if (!booking) {
    return NextResponse.json(
      { message: "Not found" },
      { status: 404 }
    );
  }

  const now = new Date();
  booking.status = "completed";
  booking.completedAt = now;
  booking.actualDropoffTime = now;
  if (booking.startedAt) {
    booking.tripDurationMinutes = Math.max(
      1,
      Math.round((now.getTime() - new Date(booking.startedAt).getTime()) / (1000 * 60))
    );
  }

  await booking.save();

  /* Settle commission and driver wallet earnings */
  await settleCompletedRidePayment(booking._id);

  return NextResponse.json({ success: true });
}