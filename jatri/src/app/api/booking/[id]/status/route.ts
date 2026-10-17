export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { auth } from "@/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();
    const currentUserId = session?.user?.id;

    const id = (await context.params).id;
    if (!id) {
      return NextResponse.json({ error: "Booking ID required" }, { status: 400 });
    }

    const booking = await Booking.findById(id)
      .select(
        "status paymentStatus fare user driver vehicle pickupLocation dropLocation pickupOtp dropOtp isPanicActive safetyStatus updatedAt"
      )
      .lean();

    if (!booking) {
      return NextResponse.json({ status: "expired" }, { status: 404 });
    }

    const isRider = currentUserId && booking.user?.toString() === currentUserId;

    // Fetch driver details and live coordinates if assigned
    let driverData: any = null;
    let driverLocation: [number, number] | null = null;

    if (booking.driver) {
      const driver = await User.findById(booking.driver)
        .select("name mobileNumber rating location profilePicture")
        .lean();

      if (driver) {
        if (
          driver.location?.coordinates &&
          Array.isArray(driver.location.coordinates) &&
          driver.location.coordinates.length >= 2
        ) {
          // [lat, lng]
          driverLocation = [
            Number(driver.location.coordinates[1]),
            Number(driver.location.coordinates[0]),
          ];
        }

        driverData = {
          _id: driver._id,
          name: driver.name,
          mobileNumber: driver.mobileNumber,
          rating: driver.rating,
          profilePicture: driver.profilePicture,
          location: driverLocation,
        };
      }
    }

    let vehicleData: any = null;
    if (booking.vehicle) {
      const vehicle = await Vehicle.findById(booking.vehicle)
        .select("vehicleModel plateNumber type number")
        .lean();

      if (vehicle) {
        vehicleData = {
          vehicleModel: vehicle.vehicleModel,
          number: vehicle.number || vehicle.plateNumber,
          type: vehicle.type,
        };
      }
    }

    return NextResponse.json({
      success: true,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      fare: booking.fare,
      driver: driverData,
      vehicle: vehicleData,
      driverLocation,
      pickupOtp: isRider ? booking.pickupOtp : undefined,
      dropOtp: isRider ? booking.dropOtp : undefined,
      isPanicActive: Boolean(booking.isPanicActive),
      safetyStatus: (booking as any).safetyStatus || "normal",
      updatedAt: booking.updatedAt,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("GET /api/booking/[id]/status error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}