import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import FareConfig from "@/models/fareConfig.model";
import { auth } from "@/auth";
import axios from "axios";
import { calculateFareBreakdown } from "@/lib/fareEngine";
import { haversineDistance } from "@/lib/routeUtils";

export async function POST(req: Request) {
  try {
    await connectDb();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please sign in to request a ride" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      pickup,
      drop,
      vehicle, // requested vehicle type: bike, auto, car, loading, truck
      fare,
      mobileNumber, // user's mobile number
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      isSmartPickup,
      smartPickupDetails,
      stops,
      isFamilyRide,
      familyMemberDetails,
      isScheduled,
      scheduledPickupTime,
    } = body;

    const pLat = Number(pickupLat);
    const pLng = Number(pickupLng);
    const dLat = Number(dropLat);
    const dLng = Number(dropLng);

    if (
      !pickup ||
      !drop ||
      !vehicle ||
      isNaN(pLat) ||
      isNaN(pLng) ||
      isNaN(dLat) ||
      isNaN(dLng)
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required pickup/drop coordinates. Please select locations on the map." },
        { status: 400 }
      );
    }

    let parsedScheduledTime: Date | undefined;
    if (isScheduled) {
      if (!scheduledPickupTime) {
        return NextResponse.json(
          { success: false, message: "Scheduled pickup time is required" },
          { status: 400 }
        );
      }
      parsedScheduledTime = new Date(scheduledPickupTime);
      const minAdvanceMs = 20 * 60 * 1000; // at least 20 minutes in advance
      if (isNaN(parsedScheduledTime.getTime()) || parsedScheduledTime.getTime() < Date.now() + minAdvanceMs) {
        return NextResponse.json(
          { success: false, message: "Scheduled pickup time must be at least 25 minutes in advance" },
          { status: 400 }
        );
      }
    }

    // Resolve user mobile number (required by schema)
    const currentUser = await User.findById(session.user.id).select("mobileNumber isStudent").lean();
    const effectiveUserMobile = (mobileNumber && String(mobileNumber).trim()) || (currentUser as any)?.mobileNumber || "9999999999";
    const isStudent = Boolean((currentUser as any)?.isStudent);

    // Prevent duplicate active booking for instant rides
    if (!isScheduled) {
      const existing = await Booking.findOne({
        user: session.user.id,
        status: {
          $in: ["requested", "awaiting_payment", "confirmed", "started"],
        },
        isScheduled: { $ne: true },
      });

      if (existing) {
        return NextResponse.json({ success: true, booking: existing });
      }
    }

    // 1️⃣ Find all registered vehicles of this type
    const vehicleKey = String(vehicle).toLowerCase();
    let activeVehicles = await Vehicle.find({
      type: vehicleKey,
    }).lean();

    let nearestVendor: any = null;
    let nearestVehicle: any = null;
    let sortedCandidates: any[] = [];

    if (activeVehicles.length > 0) {
      const vehicleOwnerIds = activeVehicles.map((v) => v.owner.toString());

      // Try 1: Query online vendors who own these vehicles within 15km
      let vendors: any[] = [];
      try {
        vendors = await User.find({
          _id: { $in: vehicleOwnerIds },
          role: "vendor",
          isOnline: true,
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [pLng, pLat],
              },
              $maxDistance: 15000, // 15km
            },
          },
        }).lean();
      } catch (geoError) {
        try {
          vendors = await User.find({
            _id: { $in: vehicleOwnerIds },
            role: "vendor",
            isOnline: true,
            location: {
              $geoWithin: {
                $centerSphere: [
                  [pLng, pLat],
                  15 / 6378.1, // 15km in radians
                ],
              },
            },
          }).lean();
        } catch {
          vendors = [];
        }
      }

      // Try 2: If none within 15km, search any online vendors owning this vehicle
      if (!vendors.length) {
        vendors = await User.find({
          _id: { $in: vehicleOwnerIds },
          role: "vendor",
          isOnline: true,
        }).lean();
      }

      // Try 3: If still none online, search any registered vendors owning this vehicle
      if (!vendors.length) {
        vendors = await User.find({
          _id: { $in: vehicleOwnerIds },
          role: "vendor",
        }).lean();
      }

      if (vendors.length > 0) {
        sortedCandidates = vendors
          .map((v) => {
            const coords: [number, number] = v.location?.coordinates || [pLng, pLat];
            const distance = haversineDistance([pLng, pLat], coords);
            return { ...v, distance };
          })
          .sort((a, b) => a.distance - b.distance);

        nearestVendor = sortedCandidates[0];
        nearestVehicle = activeVehicles.find(
          (v) => v.owner.toString() === nearestVendor._id.toString()
        );
      }
    }

    // Try 4: If no vendor or vehicle found in DB (e.g. testing in a fresh/unseeded database or remote demo)
    if (!nearestVendor || !nearestVehicle) {
      let platformVendor = await User.findOne({ email: "fleet.driver@ridenow.com" });
      if (!platformVendor) {
        platformVendor = await User.create({
          name: "RideNow Partner",
          email: "fleet.driver@ridenow.com",
          role: "vendor",
          isOnline: true,
          vendorStatus: "approved",
          vendorProfileCompleted: true,
          vendorOnboardingStep: 7,
          mobileNumber: "9876543210",
          location: {
            type: "Point",
            coordinates: [pLng, pLat],
          },
        });
      } else {
        platformVendor.isOnline = true;
        platformVendor.location = {
          type: "Point",
          coordinates: [pLng, pLat],
        };
        await platformVendor.save();
      }

      let platformVehicle = await Vehicle.findOne({
        owner: platformVendor._id,
        type: vehicleKey,
      });

      if (!platformVehicle) {
        const vehicleModels: Record<string, string> = {
          bike: "Honda Activa 6G",
          auto: "Bajaj Compact RE",
          car: "Maruti Suzuki Swift",
          loading: "Tata Ace Gold",
          truck: "Tata 407",
        };
        platformVehicle = await Vehicle.create({
          owner: platformVendor._id,
          type: vehicleKey,
          number: `RN-${vehicleKey.slice(0, 3).toUpperCase()}-101`,
          vehicleModel: vehicleModels[vehicleKey] || "Standard Vehicle",
          status: "approved",
          isActive: true,
        });
      }

      nearestVendor = platformVendor.toObject ? platformVendor.toObject() : platformVendor;
      nearestVehicle = platformVehicle.toObject ? platformVehicle.toObject() : platformVehicle;
      sortedCandidates = [nearestVendor];
    }

    // Rates from FareConfig collection
    const rates = await FareConfig.find({});
    const ratesMap: Record<string, any> = {};
    rates.forEach((c) => {
      ratesMap[c.vehicleType.toLowerCase()] = {
        baseFare: c.baseFare,
        pricePerKm: c.pricePerKm,
        pricePerMinute: 0,
        multiplier: c.multiplier,
        minDistance: c.minDistance !== undefined ? c.minDistance : 0,
        maxDistance: c.maxDistance !== undefined ? c.maxDistance : 9999,
      };
    });

    const DEFAULT_RATES: Record<string, any> = {
      bike:    { baseFare: 30,  pricePerKm: 9,   pricePerMinute: 0, multiplier: 1.0, minDistance: 0, maxDistance: 15 },
      auto:    { baseFare: 45,  pricePerKm: 13,  pricePerMinute: 0, multiplier: 1.1, minDistance: 0, maxDistance: 30 },
      car:     { baseFare: 75,  pricePerKm: 18,  pricePerMinute: 0, multiplier: 1.25, minDistance: 0, maxDistance: 100 },
      loading: { baseFare: 110, pricePerKm: 22,  pricePerMinute: 0, multiplier: 1.4, minDistance: 0, maxDistance: 150 },
      truck:   { baseFare: 160, pricePerKm: 28,  pricePerMinute: 0, multiplier: 1.6, minDistance: 0, maxDistance: 500 },
    };

    const cfg = ratesMap[vehicleKey] || DEFAULT_RATES[vehicleKey] || DEFAULT_RATES.car;

    let routeDistance = 0;
    if (Array.isArray(stops) && stops.length > 0) {
      const allCoords: [number, number][] = [
        [pLng, pLat],
        ...stops.map((s: any) => [Number(s.lng), Number(s.lat)] as [number, number]),
        [dLng, dLat],
      ];
      for (let i = 0; i < allCoords.length - 1; i++) {
        routeDistance += haversineDistance(allCoords[i], allCoords[i + 1]);
      }
    } else {
      routeDistance = haversineDistance([pLng, pLat], [dLng, dLat]);
    }

    // Validate distance limits
    const min = cfg.minDistance !== undefined ? cfg.minDistance : 0;
    const max = cfg.maxDistance !== undefined ? cfg.maxDistance : 9999;
    if (routeDistance < min) {
      return NextResponse.json(
        {
          success: false,
          message: `Selected vehicle type requires a minimum ride distance of ${min} km (Current: ${routeDistance.toFixed(1)} km)`,
        },
        { status: 400 }
      );
    }
    if (routeDistance > max) {
      return NextResponse.json(
        {
          success: false,
          message: `Selected vehicle type is limited to a maximum ride distance of ${max} km (Current: ${routeDistance.toFixed(1)} km)`,
        },
        { status: 400 }
      );
    }

    // Authoritative distance-only pricing calculation
    const breakdown = calculateFareBreakdown(vehicleKey, routeDistance, ratesMap, undefined, 0, isStudent);
    const calculatedFare = breakdown.totalFare;

    const formattedStops =
      Array.isArray(stops) && stops.length > 0
        ? stops.map((s: any, idx: number) => ({
            address: s.address,
            location: {
              type: "Point" as const,
              coordinates: [Number(s.lng), Number(s.lat)],
            },
            order: s.order || idx + 1,
            completed: false,
          }))
        : undefined;

    const effectiveDriverMobile = nearestVendor.mobileNumber || "9876543210";

    const booking = await Booking.create({
      user: session.user.id,
      driver: nearestVendor._id,
      vehicle: nearestVehicle?._id,
      pickupAddress: pickup,
      dropAddress: drop,
      pickupLocation: {
        type: "Point",
        coordinates: [pLng, pLat],
      },
      dropLocation: {
        type: "Point",
        coordinates: [dLng, dLat],
      },
      isMultiStop: Boolean(formattedStops && formattedStops.length > 0),
      stops: formattedStops,
      isFamilyRide: Boolean(isFamilyRide),
      familyMemberDetails:
        isFamilyRide && familyMemberDetails
          ? {
              name: familyMemberDetails.name,
              relation: familyMemberDetails.relation,
              phone: familyMemberDetails.phone || "",
            }
          : undefined,
      fare: calculatedFare,
      fareBreakdown: breakdown,
      adminCommission: Number((calculatedFare * 0.1).toFixed(2)),
      partnerAmount: Number((calculatedFare - calculatedFare * 0.1).toFixed(2)),
      userMobileNumber: effectiveUserMobile,
      driverMobileNumber: effectiveDriverMobile,
      candidateDrivers: sortedCandidates.map((c) => c._id),
      currentDriverIndex: 0,
      shareToken: `rt_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`,
      isSmartPickup: Boolean(isSmartPickup),
      smartPickupDetails:
        isSmartPickup && smartPickupDetails
          ? {
              venueName: smartPickupDetails.venueName,
              spotName: smartPickupDetails.spotName,
              instructions: smartPickupDetails.instructions,
              walkingTimeText: smartPickupDetails.walkingTimeText,
            }
          : undefined,
      isScheduled: Boolean(isScheduled),
      scheduledPickupTime: parsedScheduledTime,
      status: isScheduled ? "scheduled" : "requested",
    });

    // 4️⃣ Safely emit socket event to driver
    try {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
        const eventName = isScheduled ? "new-scheduled-booking" : "new-booking";
        await axios.post(
          `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
          {
            userId: nearestVendor._id.toString(),
            event: eventName,
            data: booking,
          },
          { timeout: 3000 }
        );
      }
    } catch (err) {
      console.warn("Socket emission error (booking still active):", err);
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}