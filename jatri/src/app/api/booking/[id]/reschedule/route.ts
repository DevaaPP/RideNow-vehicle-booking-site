import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { newPickupTime } = body;

    if (!newPickupTime) {
      return NextResponse.json({ message: "New pickup time is required" }, { status: 400 });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    if (booking.user.toString() !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "scheduled") {
      return NextResponse.json(
        { message: "Only upcoming scheduled rides can be rescheduled" },
        { status: 400 }
      );
    }

    const parsedTime = new Date(newPickupTime);
    if (isNaN(parsedTime.getTime()) || parsedTime.getTime() < Date.now() + 25 * 60 * 1000) {
      return NextResponse.json(
        { message: "New pickup time must be at least 30 minutes in advance" },
        { status: 400 }
      );
    }

    booking.scheduledPickupTime = parsedTime;
    await booking.save();

    return NextResponse.json({
      success: true,
      message: "Ride rescheduled successfully",
      scheduledPickupTime: booking.scheduledPickupTime,
    });
  } catch (error: any) {
    console.error("Reschedule error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
