import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import WalletTransaction from "@/models/wallet-transaction.model";
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

    // Atomic deduction: only deduct if user's walletBalance >= fare
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        walletBalance: { $gte: fare },
      },
      {
        $inc: { walletBalance: -fare },
      },
      { new: true }
    );

    if (!updatedUser) {
      const currentBalance = user.walletBalance || 0;
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

    const balanceBefore = user.walletBalance || 0;
    const balanceAfter = updatedUser.walletBalance || 0;

    // Record rider debit transaction
    await WalletTransaction.create({
      userId: user._id,
      type: "debit",
      category: "ride_payment",
      amount: fare,
      balanceBefore,
      balanceAfter,
      bookingId: booking._id,
      description: `Ride fare for ${booking.vehicle?.toUpperCase() || "Ride"} to ${booking.drop?.slice(0, 25) || "destination"}`,
      status: "success",
    });

    // Commission split
    const adminCommission = Math.round(fare * 0.10);
    const partnerAmount = fare - adminCommission;

    booking.paymentStatus = "paid";
    booking.status = "confirmed";

    if (!booking.pickupOtp) {
      booking.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
    }

    booking.adminCommission = adminCommission;
    booking.partnerAmount = partnerAmount;
    await booking.save();

    // If driver is already assigned, credit driver wallet directly
    if (booking.driver) {
      const driver = await User.findById(booking.driver);
      if (driver) {
        const driverBalanceBefore = driver.walletBalance || 0;
        const driverBalanceAfter = driverBalanceBefore + partnerAmount;

        await User.findByIdAndUpdate(driver._id, {
          $inc: { walletBalance: partnerAmount },
        });

        await WalletTransaction.create({
          userId: driver._id,
          type: "credit",
          category: "partner_earning",
          amount: partnerAmount,
          balanceBefore: driverBalanceBefore,
          balanceAfter: driverBalanceAfter,
          bookingId: booking._id,
          description: `Ride earnings (90%) for ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });
      }
    }

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
