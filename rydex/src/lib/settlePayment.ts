import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { Types } from "mongoose";

/**
 * Settles ride payment according to the clean mobility architecture:
 * Customer pays -> Ride Payment splits into Platform Commission (10%) and Driver Earnings (90%).
 *
 * Case A (Online / Wallet): RideNow holds the funds; 90% is credited to Driver Wallet.
 * Case B (Cash): Driver received 100% in hand; 10% platform commission is debited from Driver Wallet.
 */
export async function settleCompletedRidePayment(bookingId: string | Types.ObjectId) {
  try {
    await connectDb();

    const booking = await Booking.findById(bookingId);
    if (!booking || !booking.driver) return;

    const fare = Math.round(Number(booking.fare)) || 0;
    if (fare <= 0) return;

    const adminCommission = booking.adminCommission || Math.round(fare * 0.10);
    const driverEarning = booking.partnerAmount || (fare - adminCommission);

    const driver = await User.findById(booking.driver);
    if (!driver) return;

    if (booking.paymentStatus === "cash") {
      // CASH RIDE:
      // Passenger paid full fare directly in cash to the driver.
      // Deduct the 10% platform commission from Driver's wallet.
      const alreadyDeducted = await WalletTransaction.findOne({
        userId: driver._id,
        bookingId: booking._id,
        category: "commission_deduct",
      });

      if (!alreadyDeducted) {
        const balanceBefore = driver.walletBalance || 0;
        const balanceAfter = balanceBefore - adminCommission;

        await User.findByIdAndUpdate(driver._id, {
          $inc: { walletBalance: -adminCommission },
        });

        await WalletTransaction.create({
          userId: driver._id,
          type: "debit",
          category: "commission_deduct",
          amount: adminCommission,
          balanceBefore,
          balanceAfter,
          bookingId: booking._id,
          description: `Platform commission (10%) for Cash ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });
      }
    } else {
      // ONLINE / PREPAID / WALLET RIDE:
      // Passenger paid online to RideNow; credit 90% driver earning to Driver's wallet.
      const alreadyCredited = await WalletTransaction.findOne({
        userId: driver._id,
        bookingId: booking._id,
        category: "partner_earning",
      });

      if (!alreadyCredited) {
        const balanceBefore = driver.walletBalance || 0;
        const balanceAfter = balanceBefore + driverEarning;

        await User.findByIdAndUpdate(driver._id, {
          $inc: { walletBalance: driverEarning },
        });

        await WalletTransaction.create({
          userId: driver._id,
          type: "credit",
          category: "partner_earning",
          amount: driverEarning,
          balanceBefore,
          balanceAfter,
          bookingId: booking._id,
          description: `Driver earnings (90%) for ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });
      }
    }
  } catch (err) {
    console.error("Error in settleCompletedRidePayment:", err);
  }
}
