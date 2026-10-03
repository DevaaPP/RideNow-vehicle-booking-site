import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { sendWhatsAppOtp } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const { mobileNumber } = await req.json();

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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or initialize user
    let user = await User.findOne({ mobileNumber: tenDigits });

    if (!user) {
      // Create new user account with mobile number
      user = new User({
        name: `User ${tenDigits.slice(-4)}`,
        mobileNumber: tenDigits,
        email: `${tenDigits}@ridenow.in`,
        role: "user",
        isMobileVerified: false,
        otp,
        otpExpiresAt,
      });
      await user.save();
    } else {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    }

    // Send OTP via WhatsApp
    const sendResult = await sendWhatsAppOtp(tenDigits, otp);

    const devOtp =
      sendResult.devOtp ||
      (process.env.NODE_ENV !== "production" ? otp : undefined);

    return NextResponse.json({
      success: true,
      message: `Verification OTP sent via WhatsApp to +91 ${tenDigits}`,
      devOtp, // available for testing
      info: sendResult.error ? `WhatsApp API note: ${sendResult.error}` : undefined,
    });
  } catch (error: any) {
    console.error("POST /api/auth/phone/send-otp error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send WhatsApp OTP" },
      { status: 500 }
    );
  }
}
