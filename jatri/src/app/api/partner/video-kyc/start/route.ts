import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/db";
import User from "@/models/user.model";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const vendor = await User.findById(session.user.id);

    if (!vendor || vendor.role !== "vendor") {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    if (vendor.vendorStatus !== "approved" && vendor.vendorOnboardingStep < 3) {
      return NextResponse.json(
        { message: "Your documents must be approved before starting Video KYC." },
        { status: 400 }
      );
    }

    if (vendor.videoKycStatus === "approved") {
      return NextResponse.json(
        { message: "Video KYC is already approved." },
        { status: 400 }
      );
    }

    // Reuse existing active room if present, otherwise generate a unique room ID
    const roomId =
      vendor.videoKycStatus === "in_progress" && vendor.videoKycRoomId
        ? vendor.videoKycRoomId
        : `kyc-${vendor._id}-${Date.now()}`;

    vendor.videoKycStatus = "in_progress";
    vendor.videoKycRoomId = roomId;
    vendor.videoKycRejectionReason = undefined;
    vendor.vendorOnboardingStep = Math.max(vendor.vendorOnboardingStep || 0, 4);

    await vendor.save();

    return NextResponse.json({
      success: true,
      roomId,
    });
  } catch (error: any) {
    console.error("DRIVER START VIDEO KYC ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
