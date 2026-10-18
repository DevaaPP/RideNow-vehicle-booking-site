import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/user.model";
import connectDb from "@/lib/db";
import { verifyOtpCode } from "@/lib/cryptoOtp";
import { rateLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";

/* ---------------- POST: VERIFY OTP ---------------- */

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // IP rate check
    const ipCheck = rateLimiter.check(`ip:${clientIp}:verify-email-otp`, 10, 5 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { message: "Too many attempts from this device. Please wait." },
        {
          status: 429,
          headers: getRateLimitHeaders(10, ipCheck.remaining, ipCheck.resetMs),
        }
      );
    }

    await connectDb();

    const body = await req.json();
    const { email, otp } = body;

    /* ---------- VALIDATION ---------- */

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailLimitKey = `email:${cleanEmail}:verify-otp`;
    const emailCheck = rateLimiter.check(emailLimitKey, 5, 5 * 60 * 1000);

    if (!emailCheck.allowed) {
      rateLimiter.lockout(emailLimitKey, 15 * 60 * 1000);
      return NextResponse.json(
        { message: "Too many failed attempts. Verification locked for 15 minutes." },
        {
          status: 429,
          headers: getRateLimitHeaders(5, 0, emailCheck.resetMs || 15 * 60 * 1000),
        }
      );
    }

    /* ---------- FIND USER ---------- */

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    /* ---------- CHECK DB LOCKOUT ---------- */

    if (user.otpLockedUntil && new Date() < user.otpLockedUntil) {
      const minutesLeft = Math.ceil((user.otpLockedUntil.getTime() - Date.now()) / (60 * 1000));
      return NextResponse.json(
        { message: `Account locked due to multiple failed OTP attempts. Please wait ${minutesLeft} minute(s).` },
        { status: 429 }
      );
    }

    /* ---------- ALREADY VERIFIED ---------- */

    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email already verified. Please login." },
        { status: 400 }
      );
    }

    /* ---------- OTP MATCH ---------- */

    const isValidOtp = await verifyOtpCode(otp, user.otp);

    if (!isValidOtp) {
      const failedAttempts = (user.otpFailedAttempts || 0) + 1;
      const willLock = failedAttempts >= 5;

      await User.findByIdAndUpdate(user._id, {
        $inc: { otpFailedAttempts: 1 },
        ...(willLock ? { otpLockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
      });

      if (willLock) {
        rateLimiter.lockout(emailLimitKey, 15 * 60 * 1000);
        return NextResponse.json(
          { message: "Too many failed attempts. Verification locked for 15 minutes." },
          { status: 429 }
        );
      }

      const remainingAttempts = Math.max(0, 5 - failedAttempts);
      return NextResponse.json(
        {
          message: remainingAttempts > 0
            ? `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
            : "Invalid OTP. Too many failed attempts. Account locked for 15 minutes.",
        },
        { status: 401 }
      );
    }

    /* ---------- OTP EXPIRY ---------- */

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return NextResponse.json(
        { message: "OTP expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Success - reset rate limits
    rateLimiter.reset(emailLimitKey);
    rateLimiter.reset(`ip:${clientIp}:verify-email-otp`);

    /* ---------- VERIFY USER ---------- */

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.otpFailedAttempts = 0;
    user.otpLockedUntil = null;

    await user.save();

    /* ---------- SUCCESS ---------- */

    return NextResponse.json(
      {
        message: "Email verified successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
