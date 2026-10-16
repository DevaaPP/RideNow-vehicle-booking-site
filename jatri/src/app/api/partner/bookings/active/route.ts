export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { auth } from "@/auth";

export async function GET() {
  await connectDb();

  const session = await auth();
  const user = session?.user;
  if (!user || (!user.id && !user.email && !(user as any).mobileNumber)) {
    return NextResponse.json(null);
  }

  const driverIds: any[] = [];
  if (user.id) {
    driverIds.push(user.id);
    try {
      driverIds.push(new Types.ObjectId(user.id));
    } catch (_) {}
  }

  // Also query user document if email or phone exists to get canonical driver _id
  if (user.email || (user as any).mobileNumber) {
    try {
      const userDoc = await User.findOne({
        $or: [
          ...(user.email ? [{ email: user.email }] : []),
          ...((user as any).mobileNumber ? [{ mobileNumber: (user as any).mobileNumber }] : []),
        ],
      }).select("_id").lean();

      if (userDoc?._id) {
        const idStr = userDoc._id.toString();
        if (!driverIds.includes(idStr)) driverIds.push(idStr);
        try {
          driverIds.push(new Types.ObjectId(idStr));
        } catch (_) {}
      }
    } catch (_) {}
  }

  if (driverIds.length === 0) {
    return NextResponse.json(null);
  }

  const booking: any = await Booking.findOne({
    driver: { $in: driverIds },
    status: {
      $in: [
        "driver_assigned",
        "awaiting_payment",
        "confirmed",
        "driver_arriving",
        "driver_arrived",
        "started",
        "ride_started",
        "ride_in_progress",
      ],
    },
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate("user driver vehicle")
    .lean();

  if (!booking) return NextResponse.json(null);

  const bookingObj: any = { ...booking };
  if (bookingObj.userMobileNumber) {
    const raw = bookingObj.userMobileNumber;
    const suffix = raw.slice(-3);
    const prefix = raw.startsWith("+") ? raw.slice(0, 3) : "";
    bookingObj.userMobileNumber = `${prefix} ••••• ••${suffix}`;
  }

  return NextResponse.json(bookingObj);
}