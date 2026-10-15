export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import FareConfig from "@/models/fareConfig.model";
import { DEFAULT_VEHICLE_RATES } from "@/lib/fareEngine";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceSync = searchParams.get("sync") === "true";

    // 1. Initialize with authoritative calibrated vehicle rates
    const ratesMap: Record<string, any> = { ...DEFAULT_VEHICLE_RATES };

    try {
      await connectDb();

      if (forceSync) {
        // Upsert all canonical DEFAULT_VEHICLE_RATES into FareConfig collection
        for (const [vType, rate] of Object.entries(DEFAULT_VEHICLE_RATES)) {
          await FareConfig.findOneAndUpdate(
            { vehicleType: vType.toLowerCase() },
            { $set: { vehicleType: vType.toLowerCase(), ...rate } },
            { upsert: true, new: true }
          );
        }
      }

      const configs = await FareConfig.find({});
      if (configs && configs.length > 0) {
        configs.forEach((c) => {
          const key = c.vehicleType.toLowerCase();
          if (DEFAULT_VEHICLE_RATES[key]) {
            ratesMap[key] = {
              ...DEFAULT_VEHICLE_RATES[key],
              baseFare: typeof c.baseFare === "number" ? c.baseFare : DEFAULT_VEHICLE_RATES[key].baseFare,
              pricePerKm: typeof c.pricePerKm === "number" ? c.pricePerKm : DEFAULT_VEHICLE_RATES[key].pricePerKm,
              pricePerMinute: typeof c.pricePerMinute === "number" ? c.pricePerMinute : 0,
              waitingChargePerMinute: typeof c.waitingChargePerMinute === "number" ? c.waitingChargePerMinute : DEFAULT_VEHICLE_RATES[key].waitingChargePerMinute,
              freeWaitingMinutes: typeof c.freeWaitingMinutes === "number" ? c.freeWaitingMinutes : DEFAULT_VEHICLE_RATES[key].freeWaitingMinutes,
              platformFee: typeof c.platformFee === "number" ? c.platformFee : DEFAULT_VEHICLE_RATES[key].platformFee,
              taxRate: typeof c.taxRate === "number" ? c.taxRate : DEFAULT_VEHICLE_RATES[key].taxRate,
              cancellationFee: typeof c.cancellationFee === "number" ? c.cancellationFee : DEFAULT_VEHICLE_RATES[key].cancellationFee,
              multiplier: typeof c.multiplier === "number" ? c.multiplier : 1.0,
              minDistance: typeof c.minDistance === "number" ? c.minDistance : DEFAULT_VEHICLE_RATES[key].minDistance,
              maxDistance: typeof c.maxDistance === "number" ? c.maxDistance : DEFAULT_VEHICLE_RATES[key].maxDistance,
            };
          }
        });
      }
    } catch (dbErr) {
      console.warn("Pricing DB connection fallback to defaults:", dbErr);
    }

    return NextResponse.json(
      { success: true, rates: ratesMap },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("PUBLIC GET PRICING ERROR:", error);
    return NextResponse.json(
      { success: true, rates: DEFAULT_VEHICLE_RATES },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  }
}
