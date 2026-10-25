import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { claimReferralCode } from "@/lib/referralEngine";
import { rateLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientIp = getClientIp(req);
    const limitKey = `referral:claim:${session.user.id}:${clientIp}`;
    const check = rateLimiter.check(limitKey, 5, 10 * 60 * 1000);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Too many attempts to claim referral codes. Please wait 10 minutes." },
        {
          status: 429,
          headers: getRateLimitHeaders(5, check.remaining, check.resetMs),
        }
      );
    }

    const body = await req.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { error: "Please enter a valid referral code." },
        { status: 400 }
      );
    }

    await connectDb();
    const result = await claimReferralCode({
      refereeId: session.user.id,
      referralCode: referralCode.trim(),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      discountAmount: result.discountAmount,
    });
  } catch (error: any) {
    console.error("[POST /api/user/referral/claim] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process referral code." },
      { status: 500 }
    );
  }
}
