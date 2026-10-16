export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import VehicleDocument from "@/models/vehicleDocument.model";
import uploadOnCloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = (formData.get("profilePicture") || formData.get("file") || formData.get("image")) as Blob | null;

    if (!file) {
      return NextResponse.json({ message: "No photograph provided" }, { status: 400 });
    }

    const url = await uploadOnCloudinary(file);
    if (!url) {
      return NextResponse.json({ message: "Failed to upload photograph to media storage" }, { status: 500 });
    }

    // Update user profile picture
    user.profilePicture = url;
    if (!user.driverVerificationStatus) {
      user.driverVerificationStatus = {
        identity: "not_submitted",
        drivingLicense: "not_submitted",
        face: "pending",
        background: "not_submitted",
        address: "not_submitted",
        bank: "not_submitted",
        vehicle: "not_submitted",
      };
    } else {
      user.driverVerificationStatus.face = "pending";
    }
    user.markModified("driverVerificationStatus");
    await user.save();

    // Also update VehicleDocument
    await VehicleDocument.findOneAndUpdate(
      { owner: user._id },
      {
        $set: {
          profilePictureUrl: url,
          profilePictureStatus: "pending",
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Mandatory profile picture uploaded successfully",
      profilePicture: url,
      faceStatus: user.driverVerificationStatus.face,
    });
  } catch (error) {
    console.error("PROFILE PICTURE UPLOAD ERROR:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
