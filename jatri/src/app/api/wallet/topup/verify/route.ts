import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import WalletTransaction from "@/models/wallet-transaction.model";
import { getOrCreateWallet, generateTransactionId, creditUserWalletTopup } from "@/lib/walletLedger";
import razorpay from "@/lib/razorpay";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id && !session?.user?.email) {
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
    const user = session.user.id
      ? await User.findById(session.user.id)
      : await User.findOne({ email: session.user.email });

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

    const result = await creditUserWalletTopup({
      userId: user._id,
      amount: creditAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      source: "Online Payment",
    });

    return NextResponse.json({
      success: true,
      message: result.isIdempotentReplay
        ? "Payment already verified"
        : `₹${creditAmount} added successfully to your RideNow Wallet`,
      newBalance: result.balanceAfter,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error("POST /api/wallet/topup/verify error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify topup payment" },
      { status: 500 }
    );
  }
}
