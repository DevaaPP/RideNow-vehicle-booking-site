import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";

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

    if (!booking.pickupOtp) {
      return NextResponse.json(
        { message: "OTP not generated" },
        { status: 400 }
      );
    }

    if (booking.pickupOtp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (booking.pickupOtpExpires < new Date()) {
      return NextResponse.json(
        { message: "OTP expired" },
        { status: 400 }
      );
    }

    /* update status */

    const now = new Date();
    booking.status = "started";
    booking.startedAt = now;
    const duration = booking.tripDurationMinutes || (booking.fareBreakdown?.timeMinutes ? Math.round(booking.fareBreakdown.timeMinutes) : 15);
    booking.estimatedDropoffTime = new Date(now.getTime() + duration * 60 * 1000);

    booking.pickupOtp = "";
    booking.pickupOtpExpires = undefined as any;

    await booking.save();

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
            status: "started",
            startedAt: booking.startedAt,
            estimatedDropoffTime: booking.estimatedDropoffTime,
            tripDurationMinutes: duration,
            pickupOtp: "",
          },
        }),
      });
    } catch (err) {
      console.error("Socket notification for verified pickup OTP failed:", err);
    }

    // Trigger Web Push to passenger
    try {
      const { sendPushToUser } = await import("@/lib/webPush");
      const dropTimeStr = booking.estimatedDropoffTime
        ? new Date(booking.estimatedDropoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "shortly";
      await sendPushToUser(booking.user.toString(), {
        title: "Trip Started 🛣️",
        body: `Heading to ${booking.dropAddress}. Est. drop-off by ${dropTimeStr}.`,
        url: `/ride/${booking._id}`,
      });
    } catch (pushErr) {
      console.warn("Push notification error on ride start:", pushErr);
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified. Ride started."
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { message: "OTP verification failed" },
      { status: 500 }
    );

  }

}