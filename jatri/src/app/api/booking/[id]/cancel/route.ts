import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import WalletTransaction from "@/models/wallet-transaction.model";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;

  const body = await req.json().catch(() => ({}));
  const reason = (body.reason as string) || "Ride cancelled by passenger";
  const cancelledBy = (body.cancelledBy as "user" | "driver" | "admin" | "system") || "user";

  const booking = await Booking.findById(id);

  if (!booking) {
    return NextResponse.json({ message: "Ride booking not found" }, { status: 404 });
  }

  if (["completed", "cancelled", "rejected", "expired"].includes(booking.status)) {
    return NextResponse.json(
      { message: `Booking is already ${booking.status}` },
      { status: 400 }
    );
  }

  // 1️⃣ Calculate elapsed time from driver acceptance
  const isDriverAssigned =
    booking.status === "confirmed" ||
    booking.status === "awaiting_payment" ||
    Boolean(booking.acceptedAt);

  const acceptedTime = booking.acceptedAt
    ? new Date(booking.acceptedAt).getTime()
    : booking.status === "confirmed"
    ? new Date(booking.updatedAt).getTime()
    : null;

  let cancellationFee = 0;
  let cancellationFeeApplied = false;
  let elapsedSeconds = 0;

  if (isDriverAssigned && acceptedTime) {
    elapsedSeconds = Math.max(0, Math.floor((Date.now() - acceptedTime) / 1000));
    // Policy: > 3 minutes (180 seconds) from driver acceptance = ₹50 penalty
    if (elapsedSeconds > 180 && cancelledBy === "user") {
      cancellationFee = Math.min(50, booking.fare);
      cancellationFeeApplied = true;
    }
  }

  // 2️⃣ Handle Refund & Driver Compensation if ride was paid online
  let refundAmount = 0;
  if (booking.paymentStatus === "paid" && booking.fare > 0) {
    refundAmount = Math.max(0, booking.fare - cancellationFee);

    try {
      // Refund to rider
      if (refundAmount > 0) {
        const rider = await User.findById(booking.user);
        if (rider) {
          const balanceBefore = rider.walletBalance || 0;
          const balanceAfter = balanceBefore + refundAmount;

          await User.findByIdAndUpdate(rider._id, {
            $inc: { walletBalance: refundAmount },
          });

          await WalletTransaction.create({
            userId: rider._id,
            type: "credit",
            category: "ride_refund",
            amount: refundAmount,
            balanceBefore,
            balanceAfter,
            bookingId: booking._id,
            description: cancellationFeeApplied
              ? `Refund for ride #${booking._id.toString().slice(-6)} (₹${cancellationFee} cancellation penalty applied after 3 min)`
              : `100% full refund for cancelled ride #${booking._id.toString().slice(-6)}`,
            status: "success",
          });
        }
      }

      // Compensate driver if penalty applied
      if (cancellationFeeApplied && cancellationFee > 0 && booking.driver) {
        const driver = await User.findById(booking.driver);
        if (driver) {
          const driverFee = Math.max(30, cancellationFee - 10); // ₹40 to driver, ₹10 platform fee
          const dBefore = driver.walletBalance || 0;
          const dAfter = dBefore + driverFee;

          await User.findByIdAndUpdate(driver._id, {
            $inc: { walletBalance: driverFee },
          });

          await WalletTransaction.create({
            userId: driver._id,
            type: "credit",
            category: "ride_commission",
            amount: driverFee,
            balanceBefore: dBefore,
            balanceAfter: dAfter,
            bookingId: booking._id,
            description: `Driver cancellation compensation for ride #${booking._id.toString().slice(-6)} (Passenger cancelled after 3 min)`,
            status: "success",
          });
        }
      }

      booking.paymentStatus = "refunded";
    } catch (refundErr) {
      console.error("Wallet refund error on ride cancel:", refundErr);
    }
  }

  // 3️⃣ Update booking status & cancellation metadata
  booking.status = "cancelled";
  booking.cancelledBy = cancelledBy;
  booking.cancellationReason = reason;
  booking.cancellationFee = cancellationFee;
  booking.cancellationFeeApplied = cancellationFeeApplied;
  booking.cancelledAt = new Date();

  await booking.save();

  // 4️⃣ Emit real-time Socket events
  try {
    const payload = {
      bookingId: booking._id.toString(),
      status: "cancelled",
      cancelledBy,
      cancellationReason: reason,
      cancellationFee,
      cancellationFeeApplied,
      refundAmount,
      elapsedSeconds,
    };

    // Emit to driver socket
    if (booking.driver) {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: booking.driver.toString(),
          event: "booking-updated",
          data: payload,
        }),
      });
    }

    // Emit to passenger socket
    await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: booking.user.toString(),
        event: "booking-updated",
        data: payload,
      }),
    });
  } catch (err) {
    console.error("Socket cancel emit failed:", err);
  }

  return NextResponse.json({
    success: true,
    cancellationFee,
    cancellationFeeApplied,
    refundAmount,
    elapsedSeconds,
    reason,
  });
}