import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { getOrCreateWallet, generateTransactionId } from "@/lib/walletLedger";
import { calculateCommissionSplit } from "@/lib/commission";
import { generateSecureOtp } from "@/lib/cryptoOtp";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const idempotencyKey =
      req.headers.get("x-idempotency-key") ||
      req.headers.get("idempotency-key") ||
      body.idempotencyKey ||
      `PAY_BOOKING_${bookingId}`;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // ── Ownership check ────────────────────────────────────────────────────
    if (booking.user?.toString() !== user._id.toString()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Idempotency: verify if this payment was already processed
    const existingTx = await WalletTransaction.findOne({
      idempotencyKey,
      status: "success",
    });

    if (existingTx || booking.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        isIdempotentReplay: true,
        message: "Booking is already paid",
        transactionId: existingTx?.transactionId || undefined,
        booking,
      });
    }

    const fare = Math.round(Number(booking.fare));
    if (fare <= 0) {
      return NextResponse.json({ error: "Invalid booking fare" }, { status: 400 });
    }

    const riderWallet = await getOrCreateWallet(user._id);

    const userDoc = await User.findById(user._id).select("outstandingAmount walletBalance").lean();
    const currentOutstanding = Math.max(0, Number((userDoc as any)?.outstandingAmount || 0));
    const includedDues = Math.max(0, Number(booking.cancellationDuesIncluded || 0));
    const extraOutstanding = Math.max(0, currentOutstanding - includedDues);
    const totalRequired = fare + extraOutstanding;
    const totalRecoveredDues = Math.min(currentOutstanding, includedDues + extraOutstanding);

    // Atomic deduction: ensure rider's wallet balance >= totalRequired (fare + any extra outstanding dues)
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: riderWallet._id,
        balance: { $gte: totalRequired },
      },
      {
        $inc: { balance: -totalRequired },
        outstandingAmount: Math.max(0, currentOutstanding - totalRecoveredDues),
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
          required: totalRequired,
          shortfall: totalRequired - currentBalance,
          rideFare: fare,
          outstandingDues: currentOutstanding,
        },
        { status: 400 }
      );
    }

    // Sync User balance & clear recovered outstanding amount
    await User.findByIdAndUpdate(user._id, {
      $inc: { walletBalance: -totalRequired },
      outstandingAmount: Math.max(0, currentOutstanding - totalRecoveredDues),
    });

    const balanceBefore = riderWallet.balance || 0;
    const pureRideFare = Math.max(0, fare - includedDues);
    const balanceAfterRide = balanceBefore - pureRideFare;
    const finalBalanceAfter = updatedWallet.balance || 0;
    const txnId = generateTransactionId("TXN_PAY");

    // Record rider debit transaction for ride fare
    await WalletTransaction.create({
      transactionId: txnId,
      idempotencyKey,
      walletId: updatedWallet._id,
      userId: user._id,
      type: "debit",
      transactionType: "RIDE_PAYMENT",
      category: "ride_payment",
      amount: pureRideFare,
      balanceBefore,
      balanceAfter: balanceAfterRide,
      bookingId: booking._id,
      description: `Ride fare for ${booking.vehicle?.toUpperCase() || "Ride"} to ${booking.dropAddress?.slice(0, 25) || booking.drop?.slice(0, 25) || "destination"}`,
      status: "success",
    });

    // Record outstanding recovery transaction if dues were recovered
    if (totalRecoveredDues > 0) {
      await WalletTransaction.create({
        transactionId: generateTransactionId("TXN_REC"),
        walletId: updatedWallet._id,
        userId: user._id,
        type: "debit",
        transactionType: "OUTSTANDING_RECOVERY",
        category: "outstanding_recovery",
        amount: totalRecoveredDues,
        balanceBefore: balanceAfterRide,
        balanceAfter: finalBalanceAfter,
        bookingId: booking._id,
        description: `Auto-recovered previous outstanding cancellation dues (₹${totalRecoveredDues})`,
        status: "success",
        metadata: {
          recoveredAmount: totalRecoveredDues,
          rideId: booking._id,
        },
      });
    }

    // Authoritative 15% platform commission split on pure ride fare
    const { adminCommission, partnerAmount } = calculateCommissionSplit(pureRideFare);

    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    if (!booking.pickupOtp) {
      booking.pickupOtp = generateSecureOtp(4);
      booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
    }

    booking.adminCommission = adminCommission + totalRecoveredDues;
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
      newBalance: finalBalanceAfter,
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
