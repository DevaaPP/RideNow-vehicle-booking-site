import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import PartnerBank from "@/models/partnerBank.model";
import WalletTransaction from "@/models/wallet-transaction.model";
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
        { message: "Driver profile not found" },
        { status: 403 }
      );
    }

    const availableEarnings = driver.walletBalance || 0;

    // Fetch driver transactions
    const transactions = await WalletTransaction.find({ userId: driver._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate({
        path: "bookingId",
        select: "pickup drop fare vehicle status paymentStatus",
      })
      .lean();

    let totalEarnings = 0;
    let totalCommission = 0;
    let totalWithdrawn = 0;

    for (const tx of transactions) {
      if (tx.status === "success") {
        if (tx.category === "partner_earning") {
          totalEarnings += tx.amount;
        } else if (tx.category === "commission_deduct") {
          totalCommission += tx.amount;
        } else if (tx.category === "withdrawal") {
          totalWithdrawn += tx.amount;
        }
      }
    }

    // Fetch linked bank details
    const bank = await PartnerBank.findOne({ owner: driver._id }).lean();

    return NextResponse.json({
      success: true,
      availableEarnings,
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
