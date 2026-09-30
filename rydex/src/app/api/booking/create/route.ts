import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import FareConfig from "@/models/fareConfig.model";
import { auth } from "@/auth";
import axios from "axios";
import { calculateFareBreakdown } from "@/lib/fareEngine";

function haversineDistance(coords1: [number, number], coords2: [number, number]) {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function POST(req: Request) {
  await connectDb();

  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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

  let parsedScheduledTime: Date | undefined;
  if (isScheduled) {
    if (!scheduledPickupTime) {
      return NextResponse.json(
        { message: "Scheduled pickup time is required" },
        { status: 400 }
      );
    }
    parsedScheduledTime = new Date(scheduledPickupTime);
    const minAdvanceMs = 20 * 60 * 1000; // at least 20 minutes in advance
    if (isNaN(parsedScheduledTime.getTime()) || parsedScheduledTime.getTime() < Date.now() + minAdvanceMs) {
      return NextResponse.json(
        { message: "Scheduled pickup time must be at least 30 minutes in advance" },
        { status: 400 }
      );
    }
  }

  if (
    !pickup ||
    !drop ||
    !vehicle ||
    pickupLat === undefined ||
    pickupLng === undefined ||
    dropLat === undefined ||
    dropLng === undefined
  ) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

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

  // 1️⃣ Find all vehicles of this type
  const activeVehicles = await Vehicle.find({
    type: vehicle,
  }).lean();

  if (!activeVehicles.length) {
    return NextResponse.json(
      { message: "No vehicles of this category are registered" },
      { status: 404 }
    );
  }

  const vehicleOwnerIds = activeVehicles.map(v => v.owner.toString());

  // 2️⃣ Query online vendors who own these vehicles, within 15km (Try $near first, fallback to $geoWithin)
  let vendors = [];
  try {
    vendors = await User.find({
      _id: { $in: vehicleOwnerIds },
      role: "vendor",
      isOnline: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(pickupLng), Number(pickupLat)], // [lng, lat]
          },
          $maxDistance: 15000, // 15km
        },
      },
    }).lean();
  } catch (geoError) {
    console.warn("Geospatial index matching query failed in booking creation, falling back to $geoWithin:", geoError);
    vendors = await User.find({
      _id: { $in: vehicleOwnerIds },
      role: "vendor",
      isOnline: true,
      location: {
        $geoWithin: {
          $centerSphere: [
            [Number(pickupLng), Number(pickupLat)],
            15 / 6378.1 // 15km in radians
          ]
        }
      }
    }).lean();
  }

  if (!vendors.length) {
    return NextResponse.json(
      { message: "No drivers available nearby (15km limit)" },
      { status: 404 }
    );
  }

  // 3️⃣ Compute Haversine distance, and sort them explicitly
  const sortedCandidates = vendors.map(v => {
    const coords: [number, number] = v.location?.coordinates || [0, 0];
    const distance = haversineDistance([Number(pickupLng), Number(pickupLat)], coords);
    return { ...v, distance };
  }).sort((a, b) => a.distance - b.distance);

  const nearestVendor = sortedCandidates[0];
  const nearestVehicle = activeVehicles.find(v => v.owner.toString() === nearestVendor._id.toString());

  // 1️⃣ Find category rates from FareConfig collection
  const rates = await FareConfig.find({});
  const ratesMap: Record<string, { baseFare: number; pricePerKm: number; pricePerMinute: number; multiplier: number; minDistance: number; maxDistance: number }> = {};
  rates.forEach((c) => {
    ratesMap[c.vehicleType.toLowerCase()] = {
      baseFare: c.baseFare,
      pricePerKm: c.pricePerKm,
      pricePerMinute: c.pricePerMinute,
      multiplier: c.multiplier,
      minDistance: c.minDistance !== undefined ? c.minDistance : 0,
      maxDistance: c.maxDistance !== undefined ? c.maxDistance : 9999,
    };
  });

  const DEFAULT_RATES = {
    bike:    { baseFare: 30,  pricePerKm: 8,   pricePerMinute: 1.5, multiplier: 1.0, minDistance: 0, maxDistance: 15 },
    auto:    { baseFare: 50,  pricePerKm: 12,  pricePerMinute: 2.0, multiplier: 1.2, minDistance: 0, maxDistance: 30 },
    car:     { baseFare: 80,  pricePerKm: 18,  pricePerMinute: 3.0, multiplier: 1.5, minDistance: 0, maxDistance: 100 },
    loading: { baseFare: 120, pricePerKm: 24,  pricePerMinute: 4.0, multiplier: 1.8, minDistance: 0, maxDistance: 150 },
    truck:   { baseFare: 180, pricePerKm: 30,  pricePerMinute: 5.0, multiplier: 2.2, minDistance: 0, maxDistance: 500 },
  };

  const cfg = ratesMap[vehicle.toLowerCase()] || DEFAULT_RATES[vehicle.toLowerCase() as keyof typeof DEFAULT_RATES] || DEFAULT_RATES.car;
  
  let routeDistance = 0;
  if (Array.isArray(stops) && stops.length > 0) {
    const allCoords: [number, number][] = [
      [Number(pickupLng), Number(pickupLat)],
      ...stops.map((s: any) => [Number(s.lng), Number(s.lat)] as [number, number]),
      [Number(dropLng), Number(dropLat)],
    ];
    for (let i = 0; i < allCoords.length - 1; i++) {
      routeDistance += haversineDistance(allCoords[i], allCoords[i + 1]);
    }
  } else {
    routeDistance = haversineDistance([Number(pickupLng), Number(pickupLat)], [Number(dropLng), Number(dropLat)]);
  }

  // Validate distance limits
  const min = cfg.minDistance !== undefined ? cfg.minDistance : 0;
  const max = cfg.maxDistance !== undefined ? cfg.maxDistance : 9999;
  if (routeDistance < min) {
    return NextResponse.json(
      { message: `Selected vehicle type requires a minimum ride distance of ${min} km (Current: ${routeDistance.toFixed(1)} km)` },
      { status: 400 }
    );
  }
  if (routeDistance > max) {
    return NextResponse.json(
      { message: `Selected vehicle type is limited to a maximum ride distance of ${max} km (Current: ${routeDistance.toFixed(1)} km)` },
      { status: 400 }
    );
  }

  const currentUser = await User.findById(session.user.id).select("isStudent").lean();
  const isStudent = Boolean(currentUser?.isStudent);

  const breakdown = calculateFareBreakdown(vehicle, routeDistance, ratesMap, undefined, 0, isStudent);
  const calculatedFare = breakdown.totalFare;

  const formattedStops = (Array.isArray(stops) && stops.length > 0)
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

  const booking = await Booking.create({
    user: session.user.id,
    driver: nearestVendor._id,
    vehicle: nearestVehicle?._id,
    pickupAddress: pickup,
    dropAddress: drop,
    pickupLocation: {
      type: "Point",
      coordinates: [Number(pickupLng), Number(pickupLat)],
    },
    dropLocation: {
      type: "Point",
      coordinates: [Number(dropLng), Number(dropLat)],
    },
    isMultiStop: Boolean(formattedStops && formattedStops.length > 0),
    stops: formattedStops,
    isFamilyRide: Boolean(isFamilyRide),
    familyMemberDetails: isFamilyRide && familyMemberDetails ? {
      name: familyMemberDetails.name,
      relation: familyMemberDetails.relation,
      phone: familyMemberDetails.phone || "",
    } : undefined,
    fare: calculatedFare,
    fareBreakdown: breakdown,
    adminCommission: Number((calculatedFare * 0.10).toFixed(2)),
    partnerAmount: Number((calculatedFare - (calculatedFare * 0.10)).toFixed(2)),
    userMobileNumber: mobileNumber,
    driverMobileNumber: nearestVendor.mobileNumber || "",
    candidateDrivers: sortedCandidates.map(c => c._id),
    currentDriverIndex: 0,
    shareToken: `rt_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`,
    isSmartPickup: Boolean(isSmartPickup),
    smartPickupDetails: isSmartPickup && smartPickupDetails ? {
      venueName: smartPickupDetails.venueName,
      spotName: smartPickupDetails.spotName,
      instructions: smartPickupDetails.instructions,
      walkingTimeText: smartPickupDetails.walkingTimeText,
    } : undefined,
    isScheduled: Boolean(isScheduled),
    scheduledPickupTime: parsedScheduledTime,
    status: isScheduled ? "scheduled" : "requested",
  });

  // 4️⃣ Emit booking request to driver
  try {
    if (isScheduled) {
      // Advance scheduled ride alert
      await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
        {
          userId: nearestVendor._id.toString(),
          event: "new-scheduled-booking",
          data: booking,
        }
      );
    } else {
      // Instant on-demand dispatch
      await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
        {
          userId: nearestVendor._id.toString(),
          event: "new-booking",
          data: booking,
        }
      );
    }
  } catch (err) {
    console.error("Socket emission error:", err);
  }

  return NextResponse.json({ success: true, booking });
}