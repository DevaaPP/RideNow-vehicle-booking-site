export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export async function GET() {
  const startTime = Date.now();
  try {
    const conn = await connectDb();

    // Check if database connection is open and ready
    if (!conn || mongoose.connection.readyState !== 1) {
      return NextResponse.json({
        status: "degraded",
        service: "RideNow Web App",
        database: "disconnected",
        message: "Database connection not ready. Check MONGODB_URI in environment.",
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Fast ping query to verify database query execution
    await User.findOne().select("_id").lean();

    return NextResponse.json({
      status: "ok",
      service: "RideNow Web App",
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      database: "connected",
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "degraded",
      service: "RideNow Web App",
      message: error?.message || "Health check degraded",
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }
}
