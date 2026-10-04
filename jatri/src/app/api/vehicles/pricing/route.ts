export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import FareConfig from "@/models/fareConfig.model";
import { DEFAULT_VEHICLE_RATES } from "@/lib/fareEngine";

export async function GET() {
  try {
    await connectDb();

    let configs = await FareConfig.find({});
    
    // Auto-seed fallback if empty
    if (!configs.length) {
      const seedData = Object.entries(DEFAULT_VEHICLE_RATES).map(([vehicleType, rate]) => ({
        vehicleType,
        ...rate,
      }));
      await FareConfig.insertMany(seedData);
      configs = await FareConfig.find({});
    }

    // Convert into a structured key-value map for frontend lookup
    const ratesMap: Record<string, any> = {};
    configs.forEach((c) => {
      ratesMap[c.vehicleType.toLowerCase()] = {
        baseFare: c.baseFare,
        pricePerKm: c.pricePerKm,
        pricePerMinute: c.pricePerMinute || 0,
        waitingChargePerMinute: c.waitingChargePerMinute || 2.5,
        freeWaitingMinutes: c.freeWaitingMinutes || 3,
        platformFee: c.platformFee || 15,
        taxRate: c.taxRate || 0.05,
        cancellationFee: c.cancellationFee || 50,
        multiplier: c.multiplier || 1.0,
        minDistance: c.minDistance !== undefined ? c.minDistance : 0,
        maxDistance: c.maxDistance !== undefined ? c.maxDistance : 9999,
      };
    });

    return NextResponse.json({ success: true, rates: ratesMap });
  } catch (error) {
    console.error("PUBLIC GET PRICING ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
