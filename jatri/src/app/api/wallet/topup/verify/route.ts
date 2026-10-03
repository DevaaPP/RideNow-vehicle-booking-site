import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { getOrCreateWallet, generateTransactionId } from "@/lib/walletLedger";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount, // in rupees
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    // Verify cryptographic signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Payment gateway secret not configured" },
        { status: 500 }
      );
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Check if this payment was already processed (prevent duplicate credits)
    const existingTx = await WalletTransaction.findOne({
      razorpayPaymentId: razorpay_payment_id,
      status: "success",
    });

    if (existingTx) {
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        newBalance: existingTx.balanceAfter,
      });
    }

    // Retrieve user and atomically credit balance
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const creditAmount = Math.round(Number(amount));
    const wallet = await getOrCreateWallet(user._id);
    const balanceBefore = wallet.balance || 0;
    const balanceAfter = balanceBefore + creditAmount;

    // Atomically increment Wallet balance
    await Wallet.findByIdAndUpdate(wallet._id, {
      $inc: { balance: creditAmount },
    });

    // Atomically increment user's walletBalance
    await User.findByIdAndUpdate(user._id, {
      $inc: { walletBalance: creditAmount },
    });

    const txnId = generateTransactionId("TXN_TOPUP");

    // Create immutable ledger transaction record
    const transaction = await WalletTransaction.create({
      transactionId: txnId,
      walletId: wallet._id,
      userId: user._id,
      type: "credit",
      transactionType: "TOPUP",
      category: "topup",
      amount: creditAmount,
      balanceBefore,
      balanceAfter,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      description: `Added ₹${creditAmount} via Online Payment`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `₹${creditAmount} added successfully to your RideNow Wallet`,
      newBalance: balanceAfter,
      transaction,
    });
  } catch (error: any) {
    console.error("POST /api/wallet/topup/verify error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify topup payment" },
      { status: 500 }
    );
  }
}
