import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { settleCompletedRidePayment } from "@/lib/settlePayment";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await context.params;
    await connectDb();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { message: `Cannot settle booking in '${booking.status}' state. Only completed bookings can be settled.` },
        { status: 400 }
      );
    }

    if (booking.settlementStatus === "success") {
      return NextResponse.json({
        success: true,
        alreadySettled: true,
        message: "This booking is already settled.",
        booking,
      });
    }

    const result = await settleCompletedRidePayment(booking._id);
    const updatedBooking = await Booking.findById(id);

    return NextResponse.json({
      success: result.success,
      settlementStatus: result.settlementStatus,
      error: result.error,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("POST /api/admin/booking/[id]/retry-settlement error:", error);
    return NextResponse.json({ message: error?.message || "Failed to retry settlement" }, { status: 500 });
  }
}
