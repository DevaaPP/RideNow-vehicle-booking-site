import { auth } from "@/auth";
import connectDb from "@/lib/db";
import razorpay from "@/lib/razorpay";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    const parsedAmount = Math.round(Number(amount));

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount < 10) {
      return NextResponse.json(
        { error: "Minimum top-up amount is ₹10" },
        { status: 400 }
      );
    }

    if (parsedAmount > 50000) {
      return NextResponse.json(
        { error: "Maximum single top-up limit is ₹50,000" },
        { status: 400 }
      );
    }

    const user = session.user.id
      ? await User.findById(session.user.id).select("_id email name mobileNumber")
      : await User.findOne({ email: session.user.email }).select("_id email name mobileNumber");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
      "";

    if (!process.env.RAZORPAY_KEY_SECRET || !effectiveKeyId) {
      console.error("[WalletTopup] RAZORPAY_KEY_SECRET or RAZORPAY_KEY_ID is missing in environment variables");
      return NextResponse.json(
        {
          error: "Razorpay payment gateway credentials are not configured on the server. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        },
        { status: 500 }
      );
    }

    // Razorpay receipt max 40 chars
    const receipt = `topup_${user._id.toString().slice(-12)}_${Date.now().toString().slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: parsedAmount * 100, // in paise
      currency: "INR",
      receipt,
      notes: {
        userId: user._id.toString(),
        type: "wallet_topup",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount, // in paise
      keyId: effectiveKeyId,
    });
  } catch (error: any) {
    console.error("POST /api/wallet/topup/create error:", error);
    const rzpDescription =
      error?.error?.description ||
      error?.message ||
      "Failed to create payment order with Razorpay";
    return NextResponse.json(
      { error: rzpDescription, details: error?.error || null },
      { status: 500 }
    );
  }
}
