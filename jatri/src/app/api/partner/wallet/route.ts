import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import PartnerBank from "@/models/partnerBank.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import Booking from "@/models/booking.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const driver = await User.findById(session.user.id).select(
      "_id name email role walletBalance vendorStatus"
    );

    if (!driver || driver.role !== "vendor") {
      return NextResponse.json(
        { message: "Driver profile not found or unauthorized" },
        { status: 403 }
      );
    }

    // Find or initialize Driver Wallet
    let wallet = await Wallet.findOne({ userId: driver._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: driver._id,
        balance: driver.walletBalance || 0,
        currency: "INR",
      });
    }

    // Check active / in-flight rides for pending earnings calculation
    const inFlightRides = await Booking.find({
      driver: driver._id,
      status: { $in: ["confirmed", "started"] },
    }).select("fare adminCommission partnerAmount");

    let pendingEarnings = 0;
    for (const ride of inFlightRides) {
      const fare = Number(ride.fare) || 0;
      const commission =
        typeof ride.adminCommission === "number" && ride.adminCommission > 0
          ? ride.adminCommission
          : Math.round(fare * 0.15);
      const estEarning =
        typeof ride.partnerAmount === "number" && ride.partnerAmount > 0
          ? ride.partnerAmount
          : Math.max(0, fare - commission);
      pendingEarnings += estEarning;
    }

    // Fetch driver transactions
    const transactions = await WalletTransaction.find({ userId: driver._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: "bookingId",
        select: "pickupAddress dropAddress fare vehicle paymentStatus status",
      })
      .lean();

    // Compute metrics
    let totalEarnings = wallet.totalEarnings || 0;
    let totalCommission = wallet.totalCommission || 0;
    let totalWithdrawn = wallet.totalWithdrawn || 0;

    // If wallet counters haven't been backfilled, compute from successful transactions
    if (totalEarnings === 0 && totalCommission === 0 && totalWithdrawn === 0) {
      for (const tx of transactions) {
        if (tx.status === "success") {
          if (tx.transactionType === "EARNING" || tx.category === "partner_earning") {
            totalEarnings += tx.amount;
          } else if (tx.transactionType === "COMMISSION" || tx.category === "commission_deduct") {
            totalCommission += tx.amount;
          } else if (tx.transactionType === "WITHDRAWAL" || tx.category === "withdrawal") {
            totalWithdrawn += tx.amount;
          }
        }
      }
      wallet.totalEarnings = totalEarnings;
      wallet.totalCommission = totalCommission;
      wallet.totalWithdrawn = totalWithdrawn;
      await wallet.save();
    }

    // Fetch linked bank details
    const bank = await PartnerBank.findOne({ owner: driver._id }).lean();

    return NextResponse.json({
      success: true,
      wallet: {
        id: wallet._id.toString(),
        userId: driver._id.toString(),
        balance: wallet.balance,
        pendingEarnings,
        currency: wallet.currency || "INR",
        totalEarnings,
        totalCommission,
        totalWithdrawn,
        updatedAt: wallet.updatedAt,
      },
      availableEarnings: wallet.balance,
      pendingEarnings,
      metrics: {
        totalEarnings,
        totalCommission,
        totalWithdrawn,
        transactionCount: transactions.length,
      },
      bankDetails: bank
        ? {
            accountHolderName: bank.accountHolderName,
            maskedAccount: `•••• ${bank.accountNumber.slice(-4)}`,
            ifsc: bank.ifsc,
            upi: bank.upi,
            status: bank.status,
          }
        : null,
      transactions,
    });
  } catch (error: any) {
    console.error("GET /api/partner/wallet error:", error);
    return NextResponse.json(
      { message: `Failed to fetch driver wallet: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
