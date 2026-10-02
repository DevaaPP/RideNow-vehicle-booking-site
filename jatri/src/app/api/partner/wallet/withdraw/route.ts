import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
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
        { error: "Driver account not found or unauthorized" },
        { status: 403 }
      );
    }

    // Check linked bank account or UPI
    const bank = await PartnerBank.findOne({ owner: driver._id });
    if (!bank || (!bank.accountNumber && !bank.upi)) {
      return NextResponse.json(
        {
          error: "Please link your bank account or UPI ID in Partner Onboarding before requesting a withdrawal.",
          requiresBank: true,
        },
        { status: 400 }
      );
    }

    // Ensure Wallet exists
    let wallet = await Wallet.findOne({ userId: driver._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: driver._id,
        balance: driver.walletBalance || 0,
        currency: "INR",
      });
    }

    // Atomic deduction on Wallet: ensure driver has sufficient available earnings
    const updatedWallet = await Wallet.findOneAndUpdate(
      {
        _id: wallet._id,
        balance: { $gte: withdrawAmount },
      },
      {
        $inc: {
          balance: -withdrawAmount,
          totalWithdrawn: withdrawAmount,
        },
      },
      { new: true }
    );

    if (!updatedWallet) {
      const currentBalance = wallet.balance || 0;
      return NextResponse.json(
        {
          error: `Insufficient balance. Available earnings: ₹${currentBalance.toLocaleString("en-IN")}`,
          available: currentBalance,
          requested: withdrawAmount,
        },
        { status: 400 }
      );
    }

    // Sync legacy user walletBalance
    await User.findByIdAndUpdate(driver._id, {
      $inc: { walletBalance: -withdrawAmount },
    });

    const balanceBefore = wallet.balance;
    const balanceAfter = updatedWallet.balance;
    const payoutDestination = bank.accountNumber
      ? `${bank.accountHolderName} (•••• ${bank.accountNumber.slice(-4)}, IFSC: ${bank.ifsc})`
      : `UPI: ${bank.upi}`;

    // Create withdrawal transaction
    const transaction = await WalletTransaction.create({
      walletId: updatedWallet._id,
      userId: driver._id,
      type: "debit",
      transactionType: "WITHDRAWAL",
      category: "withdrawal",
      amount: withdrawAmount,
      balanceBefore,
      balanceAfter,
      description: `Bank payout to ${payoutDestination}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `₹${withdrawAmount.toLocaleString("en-IN")} payout processed to ${payoutDestination}`,
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
