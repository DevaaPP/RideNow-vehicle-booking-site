import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export async function POST(req: NextRequest) {
  try {
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

    const user = await User.findOne({ mobileNumber: tenDigits });

    if (!user) {
      return NextResponse.json(
        { error: "No user found with this mobile number. Please request a new OTP." },
        { status: 404 }
      );
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return NextResponse.json(
        { error: "Invalid OTP. Please check your WhatsApp message." },
        { status: 400 }
      );
    }

    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark verified
    user.isMobileVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

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
