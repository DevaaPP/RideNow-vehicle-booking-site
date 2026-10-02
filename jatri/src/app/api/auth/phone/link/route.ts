import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mobileNumber, otp } = await req.json();

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP are required" },
        { status: 400 }
      );
    }

    const cleaned = mobileNumber.replace(/\D/g, "");
    const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    if (tenDigits.length !== 10) {
      return NextResponse.json(
        { error: "Invalid 10-digit mobile number" },
        { status: 400 }
      );
    }

    // Verify OTP against the record where OTP was stored
    // The OTP was generated for this mobileNumber (either on existing phone user or temp record)
    const phoneRecord = await User.findOne({ mobileNumber: tenDigits });

    if (!phoneRecord || !phoneRecord.otp) {
      return NextResponse.json(
        { error: "No pending OTP found for this mobile number. Please request OTP first." },
        { status: 404 }
      );
    }

    if (phoneRecord.otp !== otp.trim()) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 400 }
      );
    }

    if (phoneRecord.otpExpiresAt && new Date() > phoneRecord.otpExpiresAt) {
      return NextResponse.json(
        { error: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Now find the Google logged-in user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "Authenticated user not found" }, { status: 404 });
    }

    // If phoneRecord was an empty/stub user created by send-otp, remove or merge
    if (phoneRecord._id.toString() !== currentUser._id.toString()) {
      // If phoneRecord has no real bookings, remove stub
      await User.findByIdAndDelete(phoneRecord._id);
    }

    currentUser.mobileNumber = tenDigits;
    currentUser.isMobileVerified = true;
    currentUser.otp = undefined;
    currentUser.otpExpiresAt = undefined;
    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: `Mobile number +91 ${tenDigits} linked and verified successfully!`,
      user: {
        id: currentUser._id.toString(),
        name: currentUser.name,
        email: currentUser.email,
        mobileNumber: currentUser.mobileNumber,
        isMobileVerified: currentUser.isMobileVerified,
      },
    });
  } catch (error: any) {
    console.error("POST /api/auth/phone/link error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to link mobile number" },
      { status: 500 }
    );
  }
}
