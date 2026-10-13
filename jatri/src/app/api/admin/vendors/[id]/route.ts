export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";

import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import VehicleDocument from "@/models/vehicleDocument.model";
import PartnerBank from "@/models/partnerBank.model";
import Booking from "@/models/booking.model";

/* ================================
   GET → Single Vendor Full Review
================================ */

export async function GET(
  req: NextRequest,
  context:{ params: Promise<{ id: string; }> }
) {
  try {
    const session = await auth();

    /* ---------- AUTH ---------- */
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDb();

    const vendorId = (await context.params).id;

    /* ---------- USER ---------- */
    const user = await User.findById(vendorId)
      .select(
        "name email mobileNumber role vendorStatus vendorOnboardingStep videoKycStatus videoKycRoomId videoKycRejectionReason vendorRejectionReason driverVerificationStatus isOnline dailyCancellationCount cancellationCount lastCancellationDate dispatchBlockedUntil"
      )
      .lean();

    if (!user || user.role !== "vendor") {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    /* ---------- VEHICLE ---------- */
    const vehicle = await Vehicle.findOne({
      owner: vendorId,
    })
      .select("type number vehicleModel")
      .lean();

    /* ---------- DOCUMENTS ---------- */
    const documents = await VehicleDocument.findOne({
      owner: vendorId,
    })
      .select(
        "aadhaarUrl aadhaarMaskedNumber licenseUrl licenseNumber licenseExpiry licenseClass rcUrl rcNumber rcExpiry insuranceUrl insurancePolicyNumber insuranceExpiry insuranceType pucUrl pucExpiry fitnessUrl fitnessExpiry permitUrl permitNumber permitExpiry panUrl panNumber policeVerificationUrl status rejectionReason vehiclePhotos"
      )
      .lean();

    /* ---------- BANK ---------- */
    const bank = await PartnerBank.findOne({
      owner: vendorId,
    })
      .select(
        "accountHolderName ifsc upi status"
      )
      .lean();

    /* ---------- SHIFT CANCELLATIONS & COOLDOWN (AUTHORITATIVE) ---------- */
    const now = new Date();
    const lastCancel = user.lastCancellationDate ? new Date(user.lastCancellationDate) : null;
    const isSameDay =
      lastCancel &&
      lastCancel.getFullYear() === now.getFullYear() &&
      lastCancel.getMonth() === now.getMonth() &&
      lastCancel.getDate() === now.getDate();

    const dailyCancellations = isSameDay ? (user.dailyCancellationCount || 0) : 0;
    const totalDriverCancellations = user.cancellationCount || 0;
    const dispatchBlockedUntil = user.dispatchBlockedUntil ? new Date(user.dispatchBlockedUntil) : null;
    const isCooldownActive = Boolean(
      dispatchBlockedUntil && dispatchBlockedUntil.getTime() > now.getTime()
    );
    const cooldownRemainingMinutes = isCooldownActive
      ? Math.max(0, Math.ceil((dispatchBlockedUntil!.getTime() - now.getTime()) / (60 * 1000)))
      : 0;

    // Fetch the driver's most recent cancelled booking (if any) to get the authoritative cancellation reason
    const latestCancelledTrip = await Booking.findOne({
      driver: vendorId,
      cancelledBy: "driver",
    })
      .sort({ updatedAt: -1 })
      .select("cancellationReason cancelledAt updatedAt")
      .lean();

    /* ---------- RESPONSE ---------- */
    return NextResponse.json({
      success: true,
      vendor: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber || null,
        vendorStatus: user.vendorStatus,
        vendorOnboardingStep: user.vendorOnboardingStep,
        videoKycStatus: user.videoKycStatus || "pending",
        videoKycRoomId: user.videoKycRoomId || null,
        videoKycRejectionReason: user.videoKycRejectionReason || null,
        vendorRejectionReason: user.vendorRejectionReason || null,
        driverVerificationStatus: user.driverVerificationStatus || null,
        isOnline: Boolean(user.isOnline),

        /* Shift & Cooldown Analytics */
        shiftAnalytics: {
          dailyCancellations,
          totalDriverCancellations,
          shiftDate: now.toISOString().split("T")[0],
          lastCancellationDate: user.lastCancellationDate || null,
          isCooldownActive,
          dispatchBlockedUntil: dispatchBlockedUntil ? dispatchBlockedUntil.toISOString() : null,
          cooldownRemainingMinutes,
          latestCancellationReason: latestCancelledTrip?.cancellationReason || (dailyCancellations >= 3 ? "Shift cancellation limit exceeded (3+)" : null),
        },

        vehicle: vehicle
          ? {
              type: vehicle.type,
              number: vehicle.number,
              model: vehicle.vehicleModel,
            }
          : null,

        documents: documents || null,
        bank: bank || null,
      },
    });
  } catch (error) {
    console.error("ADMIN VENDOR REVIEW ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
