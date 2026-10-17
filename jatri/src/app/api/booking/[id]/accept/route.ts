import { Types } from "mongoose";
import connectDb from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { emitSocketEvent } from "@/lib/socketServerEmit";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import { transitionBookingState } from "@/lib/bookingStateMachine";
import { generateSecureOtp } from "@/lib/cryptoOtp";
import { MAX_ALLOWED_PLATFORM_DUES } from "@/lib/driverMatchingEngine";

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

  // 2. Concurrency Safety: Ensure driver is not already committed to another active trip within fresh window
  if (actorId && actorRole === "driver") {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const driverIdQuery: any[] = [actorId];
    try {
      driverIdQuery.push(new Types.ObjectId(actorId));
    } catch (_) {}

    const activeRide = await Booking.findOne({
      driver: { $in: driverIdQuery },
      _id: { $ne: id },
      $or: [
        {
          status: {
            $in: [
              "confirmed",
              "driver_assigned",
              "driver_arriving",
              "driver_arrived",
              "started",
              "ride_started",
              "ride_in_progress",
            ],
          },
          updatedAt: { $gte: twoHoursAgo },
        },
        {
          status: "awaiting_payment",
          updatedAt: { $gte: tenMinutesAgo },
        },
      ],
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

    // 3. Platform Dues Enforcement: Check if driver has excessive unpaid platform commission from cash rides
    const driverWallet = await Wallet.findOne({ userId: actorId }).select("platformDues");
    if (driverWallet && (driverWallet.platformDues || 0) > MAX_ALLOWED_PLATFORM_DUES) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "EXCESSIVE_PLATFORM_DUES",
          message: `Your account has ₹${driverWallet.platformDues} in unpaid platform commission. Please settle dues in your Driver Wallet to accept new rides.`,
          platformDues: driverWallet.platformDues,
          settleUrl: "/partner/wallet",
        },
        { status: 403 }
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

  if (!existingBooking?.pickupOtp) {
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
    await emitSocketEvent({
      userId: booking.user.toString(),
      event: "booking-updated",
      data: {
        bookingId: booking._id.toString(),
        status: targetStatus,
        paymentStatus: booking.paymentStatus,
        driver: booking.driver,
        driverMobileNumber: booking.driverMobileNumber,
        pickupOtp: booking.pickupOtp,
      },
      directBookingId: booking._id.toString(),
    });
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