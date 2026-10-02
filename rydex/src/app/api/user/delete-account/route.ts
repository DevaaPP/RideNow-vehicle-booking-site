import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import LegalConsent from "@/models/legal-consent.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * DPDP Act, 2023 - Section 12: Right to Erasure
 * Anonymizes personal identifiable information while preserving statutory trip records
 * required by the Motor Vehicle Aggregator Guidelines and tax regulations.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Record erasure request audit record
    await LegalConsent.create({
      userId: user._id,
      documentType: "privacy",
      version: "1.0",
      ipAddress,
      userAgent: req.headers.get("user-agent") || "unknown",
      acceptedAt: new Date(),
      metadata: {
        action: "DATA_PRINCIPAL_ERASURE_REQUEST",
        originalEmailDomain: user.email?.split("@")[1] || "unknown",
        requestedAt: new Date().toISOString(),
      },
    });

    // Anonymize personal details (Data Minimization & Erasure)
    user.name = "RideNow User (Account Deleted)";
    user.email = `deleted_${user._id.toString()}@anonymized.ridenow.in`;
    user.mobileNumber = undefined as any;
    user.password = undefined as any;
    user.isEmailVerified = false;
    user.isMobileVerified = false;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.walletBalance = 0;

    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Your account and personal identifiers have been erased pursuant to the Digital Personal Data Protection Act, 2023. Statutory journey and transaction records are preserved in anonymized form as required by law.",
    });
  } catch (error: any) {
    console.error("Account erasure error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process account deletion" },
      { status: 500 }
    );
  }
}
