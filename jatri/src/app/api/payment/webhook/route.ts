import { NextRequest, NextResponse } from "next/server";
import { handleRazorpayWebhook } from "@/lib/paymentService";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const result = await handleRazorpayWebhook(rawBody, signature);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process webhook" },
      { status: 400 }
    );
  }
}
