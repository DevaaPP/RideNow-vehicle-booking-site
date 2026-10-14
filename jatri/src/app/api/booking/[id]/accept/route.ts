import connectDb from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import axios from "axios";
import Booking from "@/models/booking.model";
import { transitionBookingState } from "@/lib/bookingStateMachine";
import { generateSecureOtp } from "@/lib/cryptoOtp";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const session = await auth();
  const id = (await context.params).id;

  const actorRole = session?.user?.role === "vendor" || session?.user?.role === "driver" ? "driver" : session?.user?.role === "admin" ? "admin" : "driver";
  const actorId = session?.user?.id;

  const existingBooking = await Booking.findById(id).select("paymentStatus fare pickupOtp driver status");
  if (!existingBooking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  // 1. Idempotency Check: Driver retrying same acceptance request
  if (
    actorId &&
    existingBooking.driver &&
    existingBooking.driver.toString() === actorId.toString() &&
    ["driver_assigned", "awaiting_payment", "confirmed", "driver_arriving"].includes(existingBooking.status)
  ) {
    return NextResponse.json({
      success: true,
      message: "Booking already accepted by you.",
      booking: existingBooking,
      isDuplicate: true,
    });
  }

  // 2. Concurrency Safety: Ensure driver is not already committed to another active trip
  if (actorId && actorRole === "driver") {
    const activeRide = await Booking.findOne({
      driver: actorId,
      _id: { $ne: id },
      status: {
        $in: [
          "awaiting_payment",
          "confirmed",
          "driver_assigned",
          "driver_arriving",
          "driver_arrived",
          "started",
          "ride_started",
          "ride_in_progress",
        ],
      },
    });

    if (activeRide) {
      return NextResponse.json(
        {
          message:
            "You already have an active ride in progress. Complete or conclude your current trip before accepting another.",
          errorCode: "DRIVER_BUSY",
          activeRideId: activeRide._id,
        },
        { status: 409 }
      );
    }
  }

  const isPaidOrCash = existingBooking?.paymentStatus === "paid" || existingBooking?.paymentStatus === "cash";
  const targetStatus = isPaidOrCash ? "confirmed" : "awaiting_payment";

  const duration = 15;
  const now = new Date();

  const payload: any = {
    driver: actorId || undefined,
    acceptedAt: now,
    paymentDeadline: new Date(Date.now() + 5 * 60 * 1000),
    estimatedDropoffTime: new Date(Date.now() + duration * 60 * 1000),
  };

  if (isPaidOrCash && !existingBooking?.pickupOtp) {
    payload.pickupOtp = generateSecureOtp(4);
    payload.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
  }

  const transitionRes = await transitionBookingState({
    bookingId: id,
    targetStatus,
    actorId,
    actorRole,
    payload,
  });

  if (!transitionRes.success) {
    const status = transitionRes.errorCode === "RACE_CONDITION" ? 409 : transitionRes.errorCode === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json({ message: transitionRes.message || "Could not accept booking" }, { status });
  }

  const booking = transitionRes.booking!;

  try {
    if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
      const socketSecret = process.env.SOCKET_INTERNAL_SECRET;
      await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
        {
          userId: booking.user.toString(),
          event: "booking-updated",
          data: {
            bookingId: booking._id.toString(),
            status: targetStatus,
          },
        },
        {
          headers: socketSecret ? { "x-socket-secret": socketSecret } : {},
          timeout: 3500,
        }
      );
    }
  } catch (socketErr) {
    console.warn("Socket notification in accept route failed:", socketErr);
  }

  try {
    const { sendPushToUser } = await import("@/lib/webPush");
    await sendPushToUser(booking.user.toString(), {
      title: "Driver Accepted Your Ride! 🚗",
      body: "Your driver is heading to the pickup location.",
      url: `/ride/${booking._id}`,
    });
  } catch (pushErr) {
    console.warn("Push notification error on accept:", pushErr);
  }

  const sanitizedBooking = booking.toObject ? booking.toObject() : { ...booking };
  delete sanitizedBooking.pickupOtp;
  delete sanitizedBooking.dropOtp;

  return NextResponse.json({ success: true, booking: sanitizedBooking, isDuplicate: transitionRes.isDuplicateCall });
}