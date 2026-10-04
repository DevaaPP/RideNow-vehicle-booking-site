import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { otpService, OTPChannel } from "@/lib/otpService";
import { rateLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // 1. IP-level rate limiting: 5 requests per 10 minutes
    const ipCheck = rateLimiter.check(`ip:${clientIp}:send-otp`, 5, 10 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests from this device. Please wait before requesting another OTP." },
        {
          status: 429,
          headers: getRateLimitHeaders(5, ipCheck.remaining, ipCheck.resetMs),
        }
      );
    }

    await connectDb();

    const { mobileNumber, channel = "whatsapp" } = await req.json();

    if (!mobileNumber) {
      return NextResponse.json(
        { error: "Mobile number is required" },
        { status: 400 }
      );
    }

    const cleaned = mobileNumber.replace(/\D/g, "");
    const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    if (tenDigits.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    // 2. Phone-level rate limiting: 3 requests per 10 minutes
    const phoneCheck = rateLimiter.check(`phone:${tenDigits}:send-otp`, 3, 10 * 60 * 1000);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests for this phone number. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(3, phoneCheck.remaining, phoneCheck.resetMs),
        }
      );
    }

    const selectedChannel: OTPChannel = channel === "sms" ? "sms" : "whatsapp";

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or initialize user
    let user = await User.findOne({ mobileNumber: tenDigits });

    if (!user) {
      // Create new user account with mobile number
      user = await User.create({
        name: `User ${tenDigits.slice(-4)}`,
        mobileNumber: tenDigits,
        email: `${tenDigits}@ridenow.in`,
        role: "user",
        isMobileVerified: false,
        otp,
        otpExpiresAt,
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        otp,
        otpExpiresAt,
      });
    }

    // Dispatch OTP via OTPService (WhatsApp or SMS)
    const sendResult = await otpService.dispatch(tenDigits, otp, selectedChannel);

    const devOtp =
      sendResult.devOtp ||
      (process.env.NODE_ENV !== "production" ? otp : undefined);

    const channelName = selectedChannel === "sms" ? "SMS" : "WhatsApp";

    return NextResponse.json({
      success: true,
      channel: selectedChannel,
      message: `Verification OTP sent via ${channelName} to +91 ${tenDigits}`,
      devOtp, // available for testing
      info: sendResult.error ? `${channelName} API note: ${sendResult.error}` : undefined,
    });
  } catch (error: any) {
    console.error("POST /api/auth/phone/send-otp error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send OTP verification code" },
      { status: 500 }
    );
  }
}
