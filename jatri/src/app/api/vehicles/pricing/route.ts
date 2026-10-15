export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import FareConfig from "@/models/fareConfig.model";
import { DEFAULT_VEHICLE_RATES } from "@/lib/fareEngine";

export async function GET() {
  try {
    // 1. Initialize with authoritative calibrated vehicle rates
    const ratesMap: Record<string, any> = { ...DEFAULT_VEHICLE_RATES };

    try {
      await connectDb();
      const configs = await FareConfig.find({});
      if (configs && configs.length > 0) {
        configs.forEach((c) => {
          const key = c.vehicleType.toLowerCase();
          ratesMap[key] = {
            ...(ratesMap[key] || DEFAULT_VEHICLE_RATES.car),
            baseFare: c.baseFare,
            pricePerKm: c.pricePerKm,
            pricePerMinute: c.pricePerMinute || 0,
            waitingChargePerMinute: c.waitingChargePerMinute || 2.5,
            freeWaitingMinutes: c.freeWaitingMinutes || 3,
            platformFee: c.platformFee !== undefined ? c.platformFee : 15,
            taxRate: c.taxRate !== undefined ? c.taxRate : 0.05,
            cancellationFee: c.cancellationFee !== undefined ? c.cancellationFee : 50,
            multiplier: c.multiplier || 1.0,
            minDistance: c.minDistance !== undefined ? c.minDistance : 0,
            maxDistance: c.maxDistance !== undefined ? c.maxDistance : 9999,
          };
        });
      }
    } catch (dbErr) {
      console.warn("Pricing DB connection fallback to defaults:", dbErr);
    }

    return NextResponse.json({ success: true, rates: ratesMap });
  } catch (error) {
    console.error("PUBLIC GET PRICING ERROR:", error);
    return NextResponse.json({ success: true, rates: DEFAULT_VEHICLE_RATES });
  }
}
