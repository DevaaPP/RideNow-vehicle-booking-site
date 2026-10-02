import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { Types } from "mongoose";

/**
 * Cleanest Ride Payment Settlement Architecture:
 *
 * CUSTOMER (pays ₹300)
 *    │
 *    ▼
 * RIDE PAYMENT (₹300)
 *    │
 *    ├── Platform Commission (15% = ₹45) ──► Recorded as COMMISSION
 *    │
 *    └── Driver Earnings (85% = ₹255)
 *             │
 *             ▼
 *       DRIVER WALLET (+₹255 Available Earnings)
 *             │
 *             ▼
 *        WITHDRAWAL (to verified Bank/UPI)
 *
 * For Cash rides: Passenger pays ₹300 directly in driver's hand.
 * Platform commission (₹45) is debited from Driver Wallet.
 */
export async function settleCompletedRidePayment(bookingId: string | Types.ObjectId) {
  try {
    await connectDb();

    const booking = await Booking.findById(bookingId);
    if (!booking || !booking.driver) return;

    const fare = Math.round(Number(booking.fare)) || 0;
    if (fare <= 0) return;

    // Platform commission is 15% standard (or booking.adminCommission if custom)
    const adminCommission =
      typeof booking.adminCommission === "number" && booking.adminCommission > 0
        ? Math.round(booking.adminCommission)
        : Math.round(fare * 0.15);

    const driverEarning =
      typeof booking.partnerAmount === "number" && booking.partnerAmount > 0
        ? Math.round(booking.partnerAmount)
        : Math.max(0, fare - adminCommission);

    const driver = await User.findById(booking.driver);
    if (!driver) return;

    // Ensure Driver Wallet exists
    let driverWallet = await Wallet.findOne({ userId: driver._id });
    if (!driverWallet) {
      driverWallet = await Wallet.create({
        userId: driver._id,
        balance: driver.walletBalance || 0,
        currency: "INR",
      });
    }

    if (booking.paymentStatus === "cash") {
      // 💵 CASH RIDE:
      // Passenger handed 100% fare in cash to driver.
      // Deduct platform commission (15%) from Driver's Wallet.
      const alreadyDeducted = await WalletTransaction.findOne({
        userId: driver._id,
        bookingId: booking._id,
        category: "commission_deduct",
      });

      if (!alreadyDeducted) {
        const balanceBefore = driverWallet.balance || 0;
        const balanceAfter = balanceBefore - adminCommission;

        // Update Driver Wallet
        driverWallet.balance = balanceAfter;
        driverWallet.totalCommission = (driverWallet.totalCommission || 0) + adminCommission;
        await driverWallet.save();

        // Sync legacy user walletBalance
        await User.findByIdAndUpdate(driver._id, {
          $inc: { walletBalance: -adminCommission },
        });

        // Record COMMISSION transaction
        await WalletTransaction.create({
          walletId: driverWallet._id,
          userId: driver._id,
          rideId: booking._id,
          bookingId: booking._id,
          type: "debit",
          transactionType: "COMMISSION",
          category: "commission_deduct",
          amount: adminCommission,
          balanceBefore,
          balanceAfter,
          description: `Platform commission (15%) for Cash ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });
      }
    } else {
      // 💳 ONLINE / UPI / CARD / WALLET RIDE:
      // Passenger paid online to RideNow; credit driver's share (85%) to Driver Wallet.
      const alreadyCredited = await WalletTransaction.findOne({
        userId: driver._id,
        bookingId: booking._id,
        category: "partner_earning",
      });

      if (!alreadyCredited) {
        const balanceBefore = driverWallet.balance || 0;
        const balanceAfter = balanceBefore + driverEarning;

        // Update Driver Wallet
        driverWallet.balance = balanceAfter;
        driverWallet.totalEarnings = (driverWallet.totalEarnings || 0) + driverEarning;
        driverWallet.totalCommission = (driverWallet.totalCommission || 0) + adminCommission;
        await driverWallet.save();

        // Sync legacy user walletBalance
        await User.findByIdAndUpdate(driver._id, {
          $inc: { walletBalance: driverEarning },
        });

        // Record EARNING transaction for Driver
        await WalletTransaction.create({
          walletId: driverWallet._id,
          userId: driver._id,
          rideId: booking._id,
          bookingId: booking._id,
          type: "credit",
          transactionType: "EARNING",
          category: "partner_earning",
          amount: driverEarning,
          balanceBefore,
          balanceAfter,
          description: `Driver earnings (85%) for ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });

        // Record COMMISSION transaction for platform audit
        await WalletTransaction.create({
          walletId: driverWallet._id,
          userId: driver._id,
          rideId: booking._id,
          bookingId: booking._id,
          type: "debit",
          transactionType: "COMMISSION",
          category: "commission_deduct",
          amount: adminCommission,
          balanceBefore: balanceAfter,
          balanceAfter,
          description: `Platform commission (15%) deducted for ride #${booking._id.toString().slice(-6)}`,
          status: "success",
        });
      }
    }
  } catch (err) {
    console.error("Error in settleCompletedRidePayment:", err);
  }
}
