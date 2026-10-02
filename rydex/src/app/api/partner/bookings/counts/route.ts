import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET() {
  try {
    await connectDb();

    /* ===== SESSION CHECK ===== */
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "vendor") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    const vendorId = session.user.id;

    /* ===== COUNTS ===== */
    const driver = await User.findById(vendorId).select("location").lean();
    const driverCoords = driver?.location?.coordinates;

    const rawPending = await Booking.find({
      driver: vendorId,
      status: "requested",
    }).select("pickupLocation").lean();

    const pending = rawPending.filter((b: any) => {
      if (
        driverCoords &&
        Array.isArray(driverCoords) &&
        driverCoords.length === 2 &&
        b.pickupLocation?.coordinates &&
        Array.isArray(b.pickupLocation.coordinates)
      ) {
        const [dLng, dLat] = driverCoords;
        const [pLng, pLat] = b.pickupLocation.coordinates;
        if (typeof dLat === "number" && typeof pLat === "number") {
          return haversineDistance(dLat, dLng, pLat, pLng) <= 10;
        }
      }
      return true;
    }).length;

    // Active = accepted or started rides
    const active = await Booking.countDocuments({
      driver: vendorId,
      status: { $in: ["accepted", "started"] },
    });

    return NextResponse.json({
      pending,
      active,
    });

  } catch (error) {
    console.error("Booking Count Error:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}