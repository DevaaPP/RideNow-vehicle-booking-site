export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id).select(
      "isOnline location vendorStatus isVendorBlocked lastLocationUpdate"
    );
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      isOnline: user.isOnline,
      location: user.location,
      vendorStatus: user.vendorStatus,
      isVendorBlocked: user.isVendorBlocked,
      lastLocationUpdate: user.lastLocationUpdate,
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
    }

    const updateData: any = {};
    if (typeof isOnline === "boolean") {
      updateData.isOnline = isOnline;
    }

    if (typeof latitude === "number" && typeof longitude === "number") {
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
    ).select("isOnline location vendorStatus lastLocationUpdate");

    return NextResponse.json({
      success: true,
      isOnline: updatedUser.isOnline,
      location: updatedUser.location,
      lastLocationUpdate: updatedUser.lastLocationUpdate,
    });
  } catch (error) {
    console.error("Partner status PATCH error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
