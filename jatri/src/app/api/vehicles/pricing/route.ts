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

      // Always synchronize canonical rates into database if empty, mismatched or on forceSync
      const configs = await FareConfig.find({});
      if (!configs || configs.length < Object.keys(DEFAULT_VEHICLE_RATES).length || forceSync) {
        for (const [vType, rate] of Object.entries(DEFAULT_VEHICLE_RATES)) {
          await FareConfig.findOneAndUpdate(
            { vehicleType: vType.toLowerCase() },
            { $set: { vehicleType: vType.toLowerCase(), ...rate } },
            { upsert: true, new: true }
          );
        }
      }

      // Re-read or return authoritative ratesMap directly from DEFAULT_VEHICLE_RATES
      for (const [key, def] of Object.entries(DEFAULT_VEHICLE_RATES)) {
        ratesMap[key] = { ...def };
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
