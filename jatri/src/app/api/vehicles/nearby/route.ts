import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Vehicle from "@/models/vehicle.model";
import { haversineKm as getDistance } from "@/lib/routeUtils";
import { redisGet, redisSet } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude, vehicleType } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Coordinates required" },
        { status: 400 }
      );
    }

    // High-speed Upstash Redis cache lookup (8s TTL for live driver positions)
    const cacheKey = `nearby_v2_${Number(latitude).toFixed(3)}_${Number(longitude).toFixed(3)}_${vehicleType || "all"}`;
    const cachedVehicles = await redisGet<any[]>(cacheKey);
    if (cachedVehicles) {
      return NextResponse.json({
        success: true,
        vehicles: cachedVehicles,
        cached: true,
      });
    }

    await connectDb();

    // 1️⃣ Find nearby vendors within strictly 10km limit
    let vendors: any[] = [];
    try {
      vendors = await User.find({
        role: "vendor",
        isOnline: true,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: 10000, // strictly 10km max
          },
        },
      })
        .select("_id location")
        .lean();
    } catch (geoError) {
      console.warn("2dsphere geospatial index query failed in nearby vehicles, falling back to $geoWithin:", geoError);
      vendors = await User.find({
        role: "vendor",
        isOnline: true,
        location: {
          $geoWithin: {
            $centerSphere: [
              [longitude, latitude],
              10 / 6378.1, // strictly 10km in radians
            ],
          },
        },
      })
        .select("_id location")
        .lean();
    }

    const vendorIds = vendors.map((v) => v._id);

    if (!vendorIds.length) {
      return NextResponse.json({ success: true, vehicles: [] });
    }

    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v.location]));

    // 2️⃣ Get vehicles of those vendors
    const vehicles = await Vehicle.find({
      owner: { $in: vendorIds },
      ...(vehicleType && { type: vehicleType }),
    }).lean();

    const vehiclesWithLocation = vehicles
      .map((v) => {
        const loc = vendorMap.get(v.owner.toString()) || null;
        let distanceKm = null;
        if (loc?.coordinates) {
          distanceKm = getDistance(latitude, longitude, loc.coordinates[1], loc.coordinates[0]);
        }
        return {
          ...v,
          location: loc,
          distance: distanceKm !== null ? Number(distanceKm.toFixed(3)) : null,
        };
      })
      .filter((v) => v.distance !== null && v.distance <= 10); // Strictly limit to <= 10km

    // Sort by distance ascending
    vehiclesWithLocation.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    // Cache in Upstash Redis for 8 seconds to alleviate DB load on repeated user queries
    await redisSet(cacheKey, vehiclesWithLocation, 8);

    return NextResponse.json({
      success: true,
      vehicles: vehiclesWithLocation,
    });
  } catch (error: any) {
    console.error("NEARBY API ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}