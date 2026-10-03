import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { getOrCreateWallet, generateTransactionId } from "@/lib/walletLedger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Booking is already paid",
        booking,
      });
    }

    const fare = Math.round(Number(booking.fare));
    if (fare <= 0) {
      return NextResponse.json({ error: "Invalid booking fare" }, { status: 400 });
    }

    const riderWallet = await getOrCreateWallet(user._id);

    // Atomic deduction: ensure rider's wallet balance >= fare
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: riderWallet._id,
        balance: { $gte: fare },
      },
      {
        $inc: { balance: -fare },
      },
      { new: true }
    );

    if (!updatedWallet) {
      const currentBalance = riderWallet.balance || 0;
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          insufficientBalance: true,
          balance: currentBalance,
          required: fare,
          shortfall: fare - currentBalance,
        },
        { status: 400 }
      );
    }

    // Sync User balance
    await User.findByIdAndUpdate(user._id, {
      $inc: { walletBalance: -fare },
    });

    const balanceBefore = riderWallet.balance || 0;
    const balanceAfter = updatedWallet.balance || 0;
    const txnId = generateTransactionId("TXN_PAY");

    // Record rider debit transaction
    await WalletTransaction.create({
      transactionId: txnId,
      walletId: updatedWallet._id,
      userId: user._id,
      type: "debit",
      transactionType: "RIDE_PAYMENT",
      category: "ride_payment",
      amount: fare,
      balanceBefore,
      balanceAfter,
      bookingId: booking._id,
      description: `Ride fare for ${booking.vehicle?.toUpperCase() || "Ride"} to ${booking.drop?.slice(0, 25) || "destination"}`,
      status: "success",
    });

    // Commission split: Standard 15% platform commission
    const adminCommission = Math.round(fare * 0.15);
    const partnerAmount = Math.max(0, fare - adminCommission);

    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    if (!booking.pickupOtp) {
      booking.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
    }

    booking.adminCommission = adminCommission;
    booking.partnerAmount = partnerAmount;
    await booking.save();

    // Emit live socket event to driver and passenger
    try {
      if (booking.driver) {
        await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: booking.driver.toString(),
            event: "booking-updated",
            data: {
              bookingId: booking._id.toString(),
              status: "confirmed",
              paymentStatus: "paid",
              pickupOtp: booking.pickupOtp,
            },
          }),
        });
      }

      await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: booking.user.toString(),
          event: "booking-updated",
          data: {
            bookingId: booking._id.toString(),
            status: "confirmed",
            paymentStatus: "paid",
            pickupOtp: booking.pickupOtp,
          },
        }),
      });
    } catch (err) {
      console.error("Socket emit failed on wallet payment:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Payment successful via RideNow Wallet",
      newBalance: balanceAfter,
      booking,
    });
  } catch (error: any) {
    console.error("POST /api/wallet/pay error:", error);
    return NextResponse.json(
      { error: error?.message || "Payment via wallet failed" },
      { status: 500 }
    );
  }
}
