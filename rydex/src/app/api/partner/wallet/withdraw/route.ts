import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import PartnerBank from "@/models/partnerBank.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    const withdrawAmount = Math.round(Number(amount));

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 100) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is ₹100" },
        { status: 400 }
      );
    }

    const driver = await User.findById(session.user.id);
    if (!driver || driver.role !== "vendor") {
      return NextResponse.json(
        { error: "Driver account not found" },
        { status: 403 }
      );
    }

    // Check linked bank account
    const bank = await PartnerBank.findOne({ owner: driver._id });
    if (!bank || !bank.accountNumber || !bank.ifsc) {
      return NextResponse.json(
        {
          error: "Please link your bank account in onboarding before requesting withdrawal",
          requiresBank: true,
        },
        { status: 400 }
      );
    }

    // Atomic deduction: ensure driver has sufficient available earnings
    const updatedDriver = await User.findOneAndUpdate(
      {
        _id: driver._id,
        walletBalance: { $gte: withdrawAmount },
      },
      {
        $inc: { walletBalance: -withdrawAmount },
      },
      { new: true }
    );

    if (!updatedDriver) {
      const currentBalance = driver.walletBalance || 0;
      return NextResponse.json(
        {
          error: `Insufficient balance. Available earnings: ₹${currentBalance}`,
          available: currentBalance,
          requested: withdrawAmount,
        },
        { status: 400 }
      );
    }

    const balanceBefore = driver.walletBalance || 0;
    const balanceAfter = updatedDriver.walletBalance || 0;
    const maskedAccount = `•••• ${bank.accountNumber.slice(-4)}`;

    // Create withdrawal transaction
    const transaction = await WalletTransaction.create({
      userId: driver._id,
      type: "debit",
      category: "withdrawal",
      amount: withdrawAmount,
      balanceBefore,
      balanceAfter,
      description: `Bank payout to ${bank.accountHolderName} (${maskedAccount}, IFSC: ${bank.ifsc})`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `₹${withdrawAmount.toLocaleString("en-IN")} payout processed to ${bank.accountHolderName} (${maskedAccount})`,
      newBalance: balanceAfter,
      transaction,
    });
  } catch (error: any) {
    console.error("POST /api/partner/wallet/withdraw error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process withdrawal" },
      { status: 500 }
    );
  }
}
