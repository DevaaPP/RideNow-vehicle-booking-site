import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { evaluateRideSafetyTelemetry } from "@/lib/safetyEngine";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      bookingId,
      currentCoordinates,
      lastUpdateTimestamp,
      isStationary,
      stationaryDurationMinutes,
    } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const result = await evaluateRideSafetyTelemetry({
      bookingId,
      currentCoordinates,
      lastUpdateTimestamp,
      isStationary,
      stationaryDurationMinutes,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/safety/telemetry error:", error);
    return NextResponse.json(
      { error: error?.message || "Telemetry evaluation error" },
      { status: 500 }
    );
  }
}
