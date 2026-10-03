import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import { settleCompletedRidePayment } from "@/lib/settlePayment";
import { sendPushToUser } from "@/lib/webPush";

export async function POST(req: Request) {

  await connectDB();

  try {

    const { bookingId, otp } = await req.json();

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    if (!booking.dropOtp) {
      return NextResponse.json(
        { message: "OTP not generated" },
        { status: 400 }
      );
    }

    if (booking.dropOtp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if ((booking.dropOtpExpires || (booking as any).dropExpires) && (booking.dropOtpExpires || (booking as any).dropExpires) < new Date()) {
      return NextResponse.json(
        { message: "OTP expired" },
        { status: 400 }
      );
    }

    /* update status */

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

    booking.dropOtp = "";
    booking.dropOtpExpires = undefined as any;

    await booking.save();

    /* Settle commission and driver wallet earnings */
    await settleCompletedRidePayment(booking._id);

    /* Notify passenger via socket */
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: booking.user.toString(),
          event: "booking-updated",
          data: {
            bookingId: booking._id.toString(),
            status: "completed",
            completedAt: booking.completedAt,
            actualDropoffTime: booking.actualDropoffTime,
            tripDurationMinutes: booking.tripDurationMinutes,
            dropOtp: "",
          },
        }),
      });
    } catch (err) {
      console.error("Socket notification for verified drop OTP failed:", err);
    }

    /* Send Web Push notification to passenger */
    try {
      await sendPushToUser(booking.user.toString(), {
        title: "Trip Completed! 🎉",
        body: `You've arrived at your destination. Total: ₹${booking.fare}. Thanks for riding with Jatri!`,
        url: `/ride/${booking._id.toString()}`,
        tag: `booking-${booking._id.toString()}`,
      });
    } catch (pushErr) {
      console.error("Push notification for trip completion failed:", pushErr);
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified. Ride completed."
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "OTP verification failed" },
      { status: 500 }
    );

  }

}