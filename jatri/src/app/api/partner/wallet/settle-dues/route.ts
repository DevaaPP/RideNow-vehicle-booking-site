import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";
import razorpay from "@/lib/razorpay";
import { getOrCreateWallet, settleDriverPlatformDues } from "@/lib/walletLedger";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Driver Platform Dues Settlement API
 * Allows drivers to directly clear platform dues accrued from cash rides.
 * 
 * Supports:
 * - GET: Fetch current dues status & settlement summary
 * - POST { action: "create_order", amount?: number }: Generate Razorpay order for online UPI/card payment
 * - POST { action: "verify_payment", razorpay_order_id, razorpay_payment_id, razorpay_signature, amount }: Verify Razorpay payment and settle dues in wallet ledger
 * - POST { action: "admin_clear", amount, reason }: Admin clearance of platform dues
 */

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "vendor" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only drivers and admins can access platform dues settlement" },
        { status: 403 }
      );
    }

    const wallet = await getOrCreateWallet(user._id);
    const platformDues = wallet.platformDues || 0;
    const withdrawableBalance = Math.max(0, (wallet.balance || 0) - platformDues);

    return NextResponse.json({
      success: true,
      platformDues,
      withdrawableBalance,
      walletBalance: wallet.balance || 0,
      status: platformDues > 0 ? "dues_pending" : "all_cleared",
    });
  } catch (error: any) {
    console.error("GET /api/partner/wallet/settle-dues error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch platform dues" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action || "create_order";

    // ── 1. CREATE PAYMENT ORDER ───────────────────────────────────────
    if (action === "create_order") {
      const wallet = await getOrCreateWallet(user._id);
      const dues = wallet.platformDues || 0;

      if (dues <= 0) {
        return NextResponse.json(
          { error: "No outstanding platform dues to settle." },
          { status: 400 }
        );
      }

      const requestedAmount = body.amount ? Math.round(Number(body.amount)) : dues;
      const amountToPay = Math.min(dues, Math.max(1, requestedAmount));

      const receipt = `dues_${user._id.toString().slice(-10)}_${Date.now().toString().slice(-6)}`;

      const order = await razorpay.orders.create({
        amount: amountToPay * 100, // paise
        currency: "INR",
        receipt,
        notes: {
          driverId: user._id.toString(),
          type: "driver_platform_dues_settlement",
          duesTotal: dues.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount, // in paise
        duesBefore: dues,
        amountToPay,
        keyId:
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          process.env.RAZORPAY_KEY_ID ||
          "rzp_test_placeholder",
      });
    }

    // ── 2. VERIFY PAYMENT & RECONCILE LEDGER ──────────────────────────
    if (action === "verify_payment") {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount, // in rupees
      } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json(
          { error: "Missing required payment verification details." },
          { status: 400 }
        );
      }

      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: "Payment gateway secret not configured on server." },
          { status: 500 }
        );
      }

      // HMAC SHA256 Signature Verification (Constant-Time Safe)
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const sigBuf = Buffer.from(expectedSignature, "utf8");
      const recBuf = Buffer.from(razorpay_signature, "utf8");
      if (sigBuf.length !== recBuf.length || !crypto.timingSafeEqual(sigBuf, recBuf)) {
        return NextResponse.json(
          { error: "Invalid cryptographic payment signature." },
          { status: 400 }
        );
      }

      // Authoritative Order Verification: Verify driver ownership and gateway amount
      let verifiedAmount: number;
      try {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        if (order.notes?.driverId && order.notes.driverId !== user._id.toString()) {
          return NextResponse.json(
            { error: "Order does not belong to this driver." },
            { status: 403 }
          );
        }
        verifiedAmount = Math.round(Number(order.amount) / 100);
      } catch (fetchErr) {
        console.error("Failed to fetch Razorpay order for dues settlement:", fetchErr);
        return NextResponse.json(
          { error: "Failed to verify order details with payment gateway." },
          { status: 502 }
        );
      }

      if (!verifiedAmount || verifiedAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid payment order amount from gateway." },
          { status: 400 }
        );
      }

      const result = await settleDriverPlatformDues({
        driverId: user._id,
        amount: verifiedAmount,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully cleared ₹${result.paidAmount} in platform dues. Remaining dues: ₹${result.duesAfter}.`,
        result,
      });
    }

    // ── 3. ADMIN / CASH MANUAL CLEARANCE ─────────────────────────────
    if (action === "admin_clear") {
      if (user.role !== "admin") {
        return NextResponse.json(
          { error: "Only administrators can manually clear platform dues without gateway verification." },
          { status: 403 }
        );
      }

      const targetDriverId = body.driverId || user._id;
      const clearAmount = Math.round(Number(body.amount));
      const reason = body.reason || "Administrative adjustment / physical cash collection";

      if (!clearAmount || isNaN(clearAmount) || clearAmount <= 0) {
        return NextResponse.json({ error: "Invalid clearance amount" }, { status: 400 });
      }

      const result = await settleDriverPlatformDues({
        driverId: targetDriverId,
        amount: clearAmount,
        razorpayOrderId: `ADMIN_MANUAL_${Date.now()}`,
        razorpayPaymentId: reason,
      });

      return NextResponse.json({
        success: true,
        message: `Admin successfully cleared ₹${result.paidAmount} in platform dues.`,
        result,
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/partner/wallet/settle-dues error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process platform dues settlement" },
      { status: 500 }
    );
  }
}
