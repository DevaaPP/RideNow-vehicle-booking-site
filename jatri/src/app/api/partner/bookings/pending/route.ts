export const dynamic = "force-dynamic";
export const revalidate = 0;

import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { Types } from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDb();

    /* ===== AUTH CHECK ===== */
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized", bookings: [] },
        { status: 401 }
      );
    }

    const driverIds: any[] = [];
    if (session.user.id) {
      driverIds.push(session.user.id);
      try {
        driverIds.push(new Types.ObjectId(session.user.id));
      } catch (_) {}
    }

    let userDoc: any = null;
    if (session.user.id) {
      userDoc = await User.findById(session.user.id).select("_id role").lean();
    }
    if (!userDoc && session.user.email) {
      userDoc = await User.findOne({ email: session.user.email }).select("_id role").lean();
    }

    if (userDoc?._id) {
      const idStr = userDoc._id.toString();
      if (!driverIds.includes(idStr)) driverIds.push(idStr);
      try {
        driverIds.push(new Types.ObjectId(idStr));
      } catch (_) {}
    }

    if (userDoc && userDoc.role !== "vendor" && userDoc.role !== "driver" && session.user.role !== "vendor" && session.user.role !== "driver") {
      return NextResponse.json(
        { message: "Forbidden", bookings: [] },
        { status: 403 }
      );
    }

    /* ===== FETCH PENDING BOOKINGS DISPATCHED TO THIS DRIVER ===== */
    // Match recent unaccepted requests within active dispatch horizon (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const bookings = await Booking.find({
      driver: { $in: driverIds },
      status: { $in: ["requested", "searching_driver"] },
      createdAt: { $gte: fiveMinutesAgo },
    })
      .sort({ createdAt: -1 })
      .populate("vehicle", "number vehicleModel type")
      .populate("user", "name mobileNumber")
      .lean();

    return NextResponse.json({
      bookings: bookings || [],
    });
  } catch (error) {
    console.error("Pending Bookings Error:", error);

    return NextResponse.json(
      { message: "Server Error", bookings: [] },
      { status: 500 }
    );
  }
}