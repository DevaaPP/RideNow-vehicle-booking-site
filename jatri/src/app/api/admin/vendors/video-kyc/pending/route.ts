export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const vendors = await User.find({
    role: "vendor",
    $or: [
      { videoKycStatus: { $in: ["pending", "in_progress"] } },
      {
        vendorStatus: "approved",
        videoKycStatus: { $nin: ["approved", "not_required"] },
      },
    ],
  })
    .select(
      "name email mobileNumber videoKycStatus videoKycRoomId vendorOnboardingStep vendorStatus"
    )
    .lean();

  return NextResponse.json(vendors);
}
