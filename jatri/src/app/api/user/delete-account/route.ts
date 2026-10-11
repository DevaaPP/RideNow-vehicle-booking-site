import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import LegalConsent from "@/models/legal-consent.model";
import Booking from "@/models/booking.model";
import Wallet from "@/models/wallet.model";
import { NextRequest, NextResponse } from "next/server";

/**
 * DPDP Act, 2023 - Section 12: Right to Erasure
 * Anonymizes personal identifiable information while preserving statutory trip records
 * required by the Motor Vehicle Aggregator Guidelines and tax regulations.
 * 
 * Safety & Accounting Guards:
 * 1. Blocks erasure if the user or driver has active / scheduled in-flight rides.
 * 2. Blocks erasure if the user has unpaid cancellation dues (outstandingAmount > 0).
 * 3. Blocks erasure if the driver has unpaid platform commission dues (platformDues > 0).
 * 4. Blocks erasure if active wallet balance remains (> 0) to prevent stranded funds.
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

    // 1. Guard against active / scheduled rides
    const activeBooking = await Booking.findOne({
      $or: [{ user: user._id }, { driver: user._id }],
      status: {
        $in: [
          "requested",
          "searching_driver",
          "driver_assigned",
          "awaiting_payment",
          "confirmed",
          "driver_arriving",
          "driver_arrived",
          "arrived",
          "started",
          "ride_started",
          "ride_in_progress",
          "auto_rematching",
          "scheduled",
        ],
      },
    });

    if (activeBooking) {
      return NextResponse.json(
        {
          error:
            "Cannot delete account while you have active or scheduled rides in progress. Please complete or cancel all active bookings before requesting account erasure.",
        },
        { status: 400 }
      );
    }

    // 2. Guard against customer outstanding dues & driver platform dues
    const userWallet = await Wallet.findOne({ userId: user._id });

    const customerDues = Math.max(
      Number(user.outstandingAmount) || 0,
      Number(userWallet?.outstandingAmount) || 0
    );
    if (customerDues > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account while you have unpaid cancellation dues (₹${customerDues}). Please settle outstanding dues before closing your account.`,
          outstandingAmount: customerDues,
        },
        { status: 400 }
      );
    }

    const driverPlatformDues = Number(userWallet?.platformDues) || 0;
    if (driverPlatformDues > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete driver account while you have unpaid platform commission dues (₹${driverPlatformDues}). Please settle platform dues before closing your account.`,
          platformDues: driverPlatformDues,
        },
        { status: 400 }
      );
    }

    // 3. Guard against stranded positive wallet balance
    const activeBalance = Math.max(
      Number(user.walletBalance) || 0,
      Number(userWallet?.balance) || 0
    );
    if (activeBalance > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account with an active wallet balance (₹${activeBalance}). Please withdraw or utilize your remaining wallet balance before requesting account erasure.`,
          walletBalance: activeBalance,
        },
        { status: 400 }
      );
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
        role: user.role,
      },
    });

    // Freeze associated wallet
    if (userWallet) {
      userWallet.status = "frozen";
      userWallet.balance = 0;
      await userWallet.save();
    }

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
    user.outstandingAmount = 0;

    if (user.role === "vendor") {
      user.isVendorBlocked = true;
      user.vendorStatus = "rejected";
      user.vendorRejectionReason = "Account voluntarily closed by driver";
    }

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
