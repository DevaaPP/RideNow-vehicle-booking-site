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
  const booking = await Booking.findOneAndUpdate(
    { _id: id, status: { $in: ["requested", "awaiting_payment", "confirmed"] } },
    { status: "cancelled" },
    { new: true }
  );

  if (!booking)
    return NextResponse.json({ message: "Not found" }, { status: 404 });

  // Instant refund to rider wallet if ride was paid online or via wallet
  if (booking.paymentStatus === "paid" && booking.fare > 0) {
    try {
      const rider = await User.findById(booking.user);
      if (rider) {
        const balanceBefore = rider.walletBalance || 0;
        const balanceAfter = balanceBefore + booking.fare;

        await User.findByIdAndUpdate(rider._id, {
          $inc: { walletBalance: booking.fare },
        });

        await WalletTransaction.create({
          userId: rider._id,
          type: "credit",
          category: "ride_refund",
          amount: booking.fare,
          balanceBefore,
          balanceAfter,
          bookingId: booking._id,
          description: `Instant refund for cancelled ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });

        booking.paymentStatus = "refunded";
        await booking.save();
      }
    } catch (refundErr) {
      console.error("Wallet refund error on ride cancel:", refundErr);
    }
  }

  try {
    // Emit to driver socket
    if (booking.driver) {
      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: booking.driver.toString(),
          event: "booking-updated",
          data: {
            bookingId: booking._id.toString(),
            status: "cancelled"
          }
        })
      });
    }

    // Emit to passenger socket
    await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: booking.user.toString(),
        event: "booking-updated",
        data: {
          bookingId: booking._id.toString(),
          status: "cancelled"
        }
      })
    });
  } catch (err) {
    console.error("Socket cancel emit failed:", err);
  }

  return NextResponse.json({ success: true });
}