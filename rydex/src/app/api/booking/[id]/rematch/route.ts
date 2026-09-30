import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { auth } from "@/auth";
import axios from "axios";

async function notifySocket(userId: string, event: string, data: any) {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
      { userId, event, data }
    );
  } catch (err) {
    console.error("Socket emit error in passenger rematch route:", err);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const booking = await Booking.findById(id).populate("vehicle");
  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  if (booking.user.toString() !== session.user.id) {
    return NextResponse.json({ message: "Access denied" }, { status: 403 });
  }

  // Record current driver in cancelledDriverIds
  const cancelledIds = booking.cancelledDriverIds ? [...booking.cancelledDriverIds.map((d: any) => d.toString())] : [];
  if (booking.driver && !cancelledIds.includes(booking.driver.toString())) {
    cancelledIds.push(booking.driver.toString());
  }

  // Notify current driver that passenger requested re-match
  if (booking.driver) {
    await notifySocket(booking.driver.toString(), "booking-updated", {
      bookingId: booking._id,
      status: "cancelled",
      message: "Passenger requested a new driver"
    });
  }

  booking.cancelledDriverIds = cancelledIds as any;
  booking.isAutoRematching = true;
  booking.reMatchCount = (booking.reMatchCount || 0) + 1;

  let replacementDriver: any = null;

  // Search candidateDrivers first
  if (booking.candidateDrivers && booking.candidateDrivers.length > 0) {
    for (const candId of booking.candidateDrivers) {
      const cStr = candId.toString();
      if (!cancelledIds.includes(cStr)) {
        const candidateUser = await User.findOne({ _id: cStr, role: "vendor", isOnline: true });
        if (candidateUser) {
          replacementDriver = candidateUser;
          break;
        }
      }
    }
  }

  // Spatial search fallback
  if (!replacementDriver && booking.pickupLocation?.coordinates) {
    const [lng, lat] = booking.pickupLocation.coordinates;
    const vehicleType = (booking.vehicle as any)?.type || "car";

    const activeVehicles = await Vehicle.find({ type: vehicleType }).lean();
    const vehicleOwnerIds = activeVehicles.map(v => v.owner.toString());

    try {
      const nearbyVendors = await User.find({
        _id: { $in: vehicleOwnerIds, $nin: cancelledIds },
        role: "vendor",
        isOnline: true,
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
            $maxDistance: 15000,
          },
        },
      }).limit(5);

      if (nearbyVendors.length > 0) {
        replacementDriver = nearbyVendors[0];
      }
    } catch (e) {
      console.warn("Spatial search error in manual re-match:", e);
    }
  }

  if (replacementDriver) {
    booking.driver = replacementDriver._id;
    booking.driverMobileNumber = replacementDriver.mobileNumber || "";
    booking.status = "requested";
    await booking.save();

    await notifySocket(replacementDriver._id.toString(), "new-booking", booking);
    await notifySocket(booking.user.toString(), "auto-rematch-success", {
      bookingId: booking._id,
      status: "requested",
      newDriverName: replacementDriver.name,
      newDriverMobile: replacementDriver.mobileNumber,
      message: "Re-matched new nearby driver successfully!",
    });

    return NextResponse.json({
      success: true,
      rematched: true,
      newDriverId: replacementDriver._id,
      message: "Re-matched a new driver successfully.",
    });
  } else {
    booking.status = "auto_rematching";
    await booking.save();

    await notifySocket(booking.user.toString(), "auto-rematch-searching", {
      bookingId: booking._id,
      status: "auto_rematching",
      message: "Searching for alternative nearby drivers...",
    });

    return NextResponse.json({
      success: true,
      rematched: false,
      isAutoRematching: true,
      message: "Searching for alternative nearby drivers...",
    });
  }
}
