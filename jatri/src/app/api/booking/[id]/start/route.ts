import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import { transitionBookingState } from "@/lib/bookingStateMachine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDb();
    const session = await auth();
    const actorRole = session?.user?.role === "vendor" || session?.user?.role === "driver" ? "driver" : session?.user?.role === "admin" ? "admin" : "driver";
    const actorId = session?.user?.id;

    const body = await req.json().catch(() => ({}));
    const { otp } = body;

    const Booking = (await import("@/models/booking.model")).default;
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    // Security Gate: Enforce Pickup OTP for non-admin actors
    if (actorRole !== "admin") {
      if (!otp) {
        return NextResponse.json(
          { success: false, message: "Pickup OTP is required to start the ride" },
          { status: 400 }
        );
      }
      if (!booking.pickupOtp) {
        const { generateSecureOtp } = await import("@/lib/cryptoOtp");
        booking.pickupOtp = generateSecureOtp(4);
        booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
        await booking.save();
        return NextResponse.json(
          { success: false, message: "A fresh PIN has been generated on the customer's screen. Please ask the passenger for the code." },
          { status: 400 }
        );
      }
      if (String(booking.pickupOtp).trim() !== String(otp).trim()) {
        return NextResponse.json(
          { success: false, message: "Invalid Pickup OTP. Please check the 4-digit code on the customer's screen." },
          { status: 400 }
        );
      }
    }

    const { generateSecureOtp } = await import("@/lib/cryptoOtp");
    let newDropOtp = generateSecureOtp(4);
    while (newDropOtp === String(otp).trim()) {
      newDropOtp = generateSecureOtp(4);
    }

    const transitionRes = await transitionBookingState({
      bookingId: id,
      targetStatus: "started",
      actorId,
      actorRole,
      payload: {
        startedAt: new Date(),
        actualPickupTime: new Date(),
        pickupOtp: "", // Clear used OTP
        pickupOtpExpires: null,
        dropOtp: newDropOtp,
        dropOtpExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    if (!transitionRes.success) {
      const status = transitionRes.errorCode === "UNAUTHORIZED" ? 403 : 400;
      return NextResponse.json({ success: false, message: transitionRes.message || "Could not start ride" }, { status });
    }

    // Notify passenger and driver via socket
    try {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
        await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: booking.user.toString(),
            event: "booking-updated",
            data: {
              bookingId: booking._id.toString(),
              status: "started",
              pickupOtp: "",
              dropOtp: newDropOtp,
            },
          }),
        });
      }
    } catch (sockErr) {
      console.warn("Socket emit error in start route:", sockErr);
    }

    return NextResponse.json({
      success: true,
      message: "Ride started successfully",
      booking: transitionRes.booking,
    });
  } catch (error) {
    console.error("Start booking error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}