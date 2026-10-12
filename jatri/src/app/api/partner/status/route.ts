export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import VehicleDocument from "@/models/vehicleDocument.model";
import { evaluateDocumentExpirations } from "@/lib/documentExpiryEngine";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { lastHeartbeat: new Date() },
      { new: true }
    ).select(
      "isOnline location vendorStatus isVendorBlocked lastLocationUpdate lastHeartbeat driverVerificationStatus dispatchBlockedUntil dailyCancellationCount"
    );
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const doc = await VehicleDocument.findOne({ owner: session.user.id }).lean();
    const expiryEvaluation = evaluateDocumentExpirations(doc);

    return NextResponse.json({
      success: true,
      isOnline: user.isOnline,
      location: user.location,
      vendorStatus: user.vendorStatus,
      isVendorBlocked: user.isVendorBlocked,
      lastLocationUpdate: user.lastLocationUpdate,
      lastHeartbeat: user.lastHeartbeat,
      driverVerificationStatus: user.driverVerificationStatus || null,
      dispatchBlockedUntil: user.dispatchBlockedUntil || null,
      dailyCancellationCount: user.dailyCancellationCount || 0,
      expiryAlerts: expiryEvaluation.alerts,
      hasCriticalExpiry: expiryEvaluation.hasCriticalExpiry,
      hasUrgentWarning: expiryEvaluation.hasUrgentWarning,
      hasAdvanceWarning: expiryEvaluation.hasAdvanceWarning,
    });
  } catch (error) {
    console.error("Partner status GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const driver = await User.findById(session.user.id);
    if (!driver || driver.role !== "vendor") {
      return NextResponse.json({ message: "Unauthorized driver account" }, { status: 403 });
    }

    const { isOnline, latitude, longitude } = await req.json();

    // Compliance & approval checks before going online
    if (isOnline === true) {
      if (driver.vendorStatus !== "approved") {
        return NextResponse.json(
          {
            error: "Your partner account is pending admin/vehicle verification. You can go online once approved.",
            vendorStatus: driver.vendorStatus,
          },
          { status: 403 }
        );
      }

      if (driver.isVendorBlocked) {
        return NextResponse.json(
          {
            error: "Your partner account is temporarily restricted. Please contact driver support.",
          },
          { status: 403 }
        );
      }

      if (driver.dispatchBlockedUntil && new Date(driver.dispatchBlockedUntil).getTime() > Date.now()) {
        const remainingMinutes = Math.ceil(
          (new Date(driver.dispatchBlockedUntil).getTime() - Date.now()) / (60 * 1000)
        );
        return NextResponse.json(
          {
            error: `Your dispatch is temporarily on cooldown for ${remainingMinutes} more minute(s) due to multiple cancelled rides today.`,
            dispatchBlockedUntil: driver.dispatchBlockedUntil,
          },
          { status: 403 }
        );
      }

      // Vehicle & Document Compliance Check
      const doc = await VehicleDocument.findOne({ owner: driver._id });
      if (!doc) {
        return NextResponse.json(
          {
            error: "Vehicle documents not found. Please complete document verification before going online.",
          },
          { status: 403 }
        );
      }

      const expiryEvaluation = evaluateDocumentExpirations(doc);
      if (expiryEvaluation.hasCriticalExpiry) {
        return NextResponse.json(
          {
            error: expiryEvaluation.blockingReasons[0] || "Critical vehicle compliance documents have expired.",
            expiredAlerts: expiryEvaluation.alerts.filter((a) => a.status === "expired"),
          },
          { status: 403 }
        );
      }
    }

    const updateData: any = {
      lastHeartbeat: new Date(),
    };

    if (typeof isOnline === "boolean") {
      updateData.isOnline = isOnline;
    }

    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      updateData.location = {
        type: "Point",
        coordinates: [longitude, latitude], // [lng, lat]
      };
      updateData.lastLocationUpdate = new Date();
    }

    const updatedUser = await User.findByIdAndUpdate(
      driver._id,
      updateData,
      { new: true }
    ).select("isOnline location vendorStatus lastLocationUpdate lastHeartbeat");

    return NextResponse.json({
      success: true,
      isOnline: updatedUser.isOnline,
      location: updatedUser.location,
      lastLocationUpdate: updatedUser.lastLocationUpdate,
      lastHeartbeat: updatedUser.lastHeartbeat,
    });
  } catch (error) {
    console.error("Partner status PATCH error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
