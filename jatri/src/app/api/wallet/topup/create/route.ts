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

    const effectiveKeyId = (
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      ""
    ).trim();
    const effectiveSecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (
      !effectiveSecret ||
      !effectiveKeyId ||
      effectiveKeyId.toLowerCase().startsWith("add your") ||
      effectiveSecret.toLowerCase().startsWith("add your") ||
      effectiveKeyId.includes("placeholder")
    ) {
      console.error("[WalletTopup] RAZORPAY_KEY_SECRET or RAZORPAY_KEY_ID is missing or still set to placeholder values");
      return NextResponse.json(
        {
          error: "Razorpay payment gateway credentials are not configured. Please add valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Project Settings > Environment Variables.",
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
    const rawMsg = error?.error?.description || error?.message || "";
    let userMsg = "Failed to create payment order with Razorpay";

    if (rawMsg.toLowerCase().includes("authentication failed")) {
      userMsg = "Razorpay Gateway Authentication Failed. Your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel Environment Variables do not match or are invalid. Please copy the Key ID and Key Secret from your Razorpay Dashboard (Settings > API Keys) and update them in Vercel.";
    } else if (rawMsg) {
      userMsg = rawMsg;
    }

    return NextResponse.json(
      { error: userMsg, details: error?.error || null },
      { status: 500 }
    );
  }
}
