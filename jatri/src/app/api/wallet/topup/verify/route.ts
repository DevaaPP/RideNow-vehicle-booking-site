import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { getOrCreateWallet, generateTransactionId } from "@/lib/walletLedger";
import razorpay from "@/lib/razorpay";
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
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    // Retrieve user early to verify order ownership
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const sigBuf = Buffer.from(expectedSignature, "utf8");
    const recBuf = Buffer.from(razorpay_signature, "utf8");
    if (sigBuf.length !== recBuf.length || !crypto.timingSafeEqual(sigBuf, recBuf)) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // ── Authoritative amount: fetch from Razorpay, never trust the client ──
    // The order amount is the single source of truth. We look it up server-side
    // so a tampered client cannot credit an arbitrary balance.
    let orderAmountPaise: number;
    try {
      const order = await razorpay.orders.fetch(razorpay_order_id);
      if (order.notes?.userId && order.notes.userId !== user._id.toString()) {
        return NextResponse.json(
          { error: "Payment order does not belong to the authenticated user" },
          { status: 403 }
        );
      }
      orderAmountPaise = Number(order.amount);
    } catch (rzpErr: any) {
      console.error("Razorpay order fetch failed:", rzpErr);
      return NextResponse.json(
        { error: "Could not verify order amount with payment gateway" },
        { status: 502 }
      );
    }

    if (!orderAmountPaise || orderAmountPaise <= 0) {
      return NextResponse.json(
        { error: "Invalid order amount from gateway" },
        { status: 400 }
      );
    }

    // Convert paise → rupees (Razorpay stores in smallest currency unit)
    const creditAmount = Math.round(orderAmountPaise / 100);

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
