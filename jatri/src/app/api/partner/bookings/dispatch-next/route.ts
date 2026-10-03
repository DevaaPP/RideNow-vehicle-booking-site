import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { escalateToNextCandidate } from "@/lib/driverMatchingEngine";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID is required" }, { status: 400 });
    }

    const result = await escalateToNextCandidate(bookingId, "timeout");

    return NextResponse.json({
      success: result.success,
      status: result.status,
      currentDriverIndex: result.currentDriverIndex,
      message: result.message,
    });
  } catch (err: any) {
    console.error("Dispatch escalation error:", err);
    return NextResponse.json({ message: err?.message || "Internal Server Error" }, { status: 500 });
  }
}
