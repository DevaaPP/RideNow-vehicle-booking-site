import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import axios from "axios";

export async function POST(req: Request) {
  try {
    await connectDb();

    // Look for scheduled bookings whose pickup time is within the next 25 minutes and not yet dispatched
    const now = new Date();
    const dispatchHorizon = new Date(now.getTime() + 25 * 60 * 1000); // 25 minutes from now

    const upcomingBookings = await Booking.find({
      status: "scheduled",
      isScheduled: true,
      scheduledPickupTime: { $lte: dispatchHorizon },
    }).populate("driver");

    const dispatched = [];

    for (const booking of upcomingBookings) {
      booking.status = "requested";
      await booking.save();

      // Emit new-booking to assigned driver
      if (booking.driver?._id) {
        try {
          await axios.post(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
            userId: booking.driver._id.toString(),
            event: "new-booking",
            data: booking,
          });
        } catch (socketErr) {
          console.error(`Socket dispatch error for booking ${booking._id}:`, socketErr);
        }
      }
      dispatched.push(booking._id);
    }

    return NextResponse.json({
      success: true,
      count: dispatched.length,
      dispatchedBookingIds: dispatched,
    });
  } catch (error: any) {
    console.error("Scheduled dispatch error:", error);
    return NextResponse.json(
      { success: false, message: "Dispatch error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDb();
    const count = await Booking.countDocuments({
      status: "scheduled",
      isScheduled: true,
    });
    return NextResponse.json({ success: true, pendingScheduledCount: count });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
