import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPaymentOrder } from "@/lib/paymentService";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingId, idempotencyKey } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    const orderData = await createPaymentOrder({
      bookingId,
      userId: session.user.id,
      idempotencyKey,
    });

    const effectiveKeyId = (
      orderData.keyId ||
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      ""
    ).trim();

    return NextResponse.json({
      success: true,
      orderId: orderData.orderId,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: effectiveKeyId,
    });
  } catch (error: any) {
    console.error("POST /api/payment/create error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create payment order" },
      { status: 400 }
    );
  }
}
