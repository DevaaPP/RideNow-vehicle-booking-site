export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export async function GET() {
  const startTime = Date.now();
  try {
    await connectDb();
    // Fast ping query to keep database connection pool warm
    await User.findOne().select("_id").lean();

    return NextResponse.json({
      status: "ok",
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
      status: "error",
      message: error?.message || "Health check failed",
      latencyMs: Date.now() - startTime,
    }, { status: 500 });
  }
}
