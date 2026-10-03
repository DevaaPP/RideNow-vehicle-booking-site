import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { auth } from "@/auth";
import axios from "axios";
import { sendPushToUser } from "@/lib/webPush";

async function notifySocket(userId: string, event: string, data: any) {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
      { userId, event, data }
    );
  } catch (err) {
    console.error("Socket emit error in partner cancel route:", err);
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

  const driverId = session.user.id;

  const booking = await Booking.findById(id).populate("vehicle");
  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  if (booking.driver.toString() !== driverId) {
    return NextResponse.json({ message: "You are not assigned to this booking" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const reason = (body.reason as string) || "Driver cancelled ride";

  // Record this driver in cancelledDriverIds & record reason
  booking.cancelledBy = "driver";
  booking.cancellationReason = reason;

  const cancelledIds = booking.cancelledDriverIds ? [...booking.cancelledDriverIds.map((d: any) => d.toString())] : [];
  if (!cancelledIds.includes(driverId)) {
    cancelledIds.push(driverId);
  }
  booking.cancelledDriverIds = cancelledIds as any;
  booking.isAutoRematching = true;
  booking.reMatchCount = (booking.reMatchCount || 0) + 1;

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

  // 1️⃣ Check candidateDrivers list for an unvisited driver within 10km
  let replacementDriver: any = null;
  if (booking.candidateDrivers && booking.candidateDrivers.length > 0) {
    for (const candId of booking.candidateDrivers) {
      const cStr = candId.toString();
      if (!cancelledIds.includes(cStr)) {
        const candidateUser = await User.findOne({ _id: cStr, role: "vendor", isOnline: true });
        if (candidateUser) {
          if (booking.pickupLocation?.coordinates && candidateUser.location?.coordinates) {
            const [pLng, pLat] = booking.pickupLocation.coordinates;
            const [cLng, cLat] = candidateUser.location.coordinates;
            const dist = haversineDistance(pLat, pLng, cLat, cLng);
            if (dist > 10) continue;
          }
          replacementDriver = candidateUser;
          break;
        }
      }
    }
  }

  // 2️⃣ Spatial $near fallback search if candidateDrivers list exhausted (strictly 10km)
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
            $maxDistance: 10000, // strictly 10km radius
          },
        },
      }).limit(5);

      if (nearbyVendors.length > 0) {
        replacementDriver = nearbyVendors[0];
      }
    } catch (e) {
      console.warn("Spatial search failed in auto re-match:", e);
    }
  }

  // Notify old cancelling driver that cancellation was logged
  await notifySocket(driverId, "booking-updated", {
    bookingId: booking._id,
    status: "cancelled",
    role: "driver"
  });

  if (replacementDriver) {
    // Re-assign driver
    booking.driver = replacementDriver._id;
    booking.driverMobileNumber = replacementDriver.mobileNumber || "";
    booking.status = "requested";
    await booking.save();

    // Emit new booking request to replacement driver
    await notifySocket(replacementDriver._id.toString(), "new-booking", booking);

    // Notify passenger that re-match succeeded
    await notifySocket(booking.user.toString(), "auto-rematch-success", {
      bookingId: booking._id,
      status: "requested",
      newDriverName: replacementDriver.name,
      newDriverMobile: replacementDriver.mobileNumber,
      message: "Driver cancelled. Auto re-matched a new nearby driver!",
    });

    return NextResponse.json({
      success: true,
      rematched: true,
      newDriverId: replacementDriver._id,
      message: "Driver cancelled ride. Auto re-matched replacement driver successfully.",
    });
  } else {
    // No online driver available immediately
    booking.status = "auto_rematching";
    await booking.save();

    // Notify passenger socket of re-matching search
    await notifySocket(booking.user.toString(), "auto-rematch-searching", {
      bookingId: booking._id,
      status: "auto_rematching",
      message: `Driver cancelled (${reason}). Searching for a new nearby driver...`,
    });

    // Send Web Push notification to passenger
    try {
      await sendPushToUser(booking.user.toString(), {
        title: "Driver Cancelled Ride ⚠️",
        body: `Your driver cancelled (${reason}). We're automatically searching for a new nearby driver for you.`,
        url: `/ride/${booking._id.toString()}`,
        tag: `booking-driver-cancel-${booking._id.toString()}`,
      });
    } catch (pushErr) {
      console.warn("Web Push on driver cancellation failed:", pushErr);
    }

    return NextResponse.json({
      success: true,
      rematched: false,
      isAutoRematching: true,
      message: "Driver cancelled. Searching for nearby drivers...",
    });
  }
}
