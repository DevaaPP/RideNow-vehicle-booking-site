import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { rateLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // IP-level rate limiting
    const ipCheck = rateLimiter.check(`ip:${clientIp}:verify-otp`, 10, 5 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts from this device. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(10, ipCheck.remaining, ipCheck.resetMs),
        }
      );
    }

    await connectDb();

    const { mobileNumber, otp } = await req.json();

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    const cleaned = mobileNumber.replace(/\D/g, "");
    const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    // Phone-level rate limiting & brute-force protection
    const phoneLimitKey = `phone:${tenDigits}:verify-otp`;
    const phoneCheck = rateLimiter.check(phoneLimitKey, 5, 5 * 60 * 1000);

    if (!phoneCheck.allowed) {
      // Lockout for 15 minutes if brute force detected
      rateLimiter.lockout(phoneLimitKey, 15 * 60 * 1000);
      return NextResponse.json(
        { error: "Too many failed attempts. Account temporarily locked for 15 minutes for your security." },
        {
          status: 429,
          headers: getRateLimitHeaders(5, 0, phoneCheck.resetMs || 15 * 60 * 1000),
        }
      );
    }

    const user = await User.findOne({ mobileNumber: tenDigits });

    if (!user) {
      return NextResponse.json(
        { error: "No user found with this mobile number. Please request a new OTP." },
        { status: 404 }
      );
    }

    if (!user.otp || user.otp !== otp.trim()) {
      const remainingAttempts = phoneCheck.remaining;
      return NextResponse.json(
        {
          error: remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : "Invalid OTP. Too many failed attempts. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Reset rate limiter on successful verification
    rateLimiter.reset(phoneLimitKey);
    rateLimiter.reset(`ip:${clientIp}:verify-otp`);

    // Mark verified
    await User.findByIdAndUpdate(user._id, {
      isMobileVerified: true,
      $unset: { otp: 1, otpExpiresAt: 1 },
    });

    return NextResponse.json({
      success: true,
      message: "Mobile number verified successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (error: any) {
    console.error("POST /api/auth/phone/verify-otp error:", error);
    return NextResponse.json(
      { error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
