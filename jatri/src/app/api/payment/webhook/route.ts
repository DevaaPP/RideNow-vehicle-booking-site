import { NextRequest, NextResponse } from "next/server";
import { handleRazorpayWebhook } from "@/lib/paymentService";
import logger from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const result = await handleRazorpayWebhook(rawBody, signature);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error("payment.webhook.processing_error", {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: error?.message || "Failed to process webhook" },
      { status: 400 }
    );
  }
}
