import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import { escalateToNextCandidate } from "@/lib/driverMatchingEngine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const id = (await context.params).id;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const booking = await Booking.findById(id).select("user driver status candidateDrivers");
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    const currentUserId = session.user.id.toString();
    const isRider = booking.user?.toString() === currentUserId;
    const isDriver = booking.driver?.toString() === currentUserId;
    const isAdmin = session.user.role === "admin";

    if (!isRider && !isDriver && !isAdmin) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to timeout this booking." },
        { status: 403 }
      );
    }

    const result = await escalateToNextCandidate(id, "timeout");

    return NextResponse.json({
      success: result.success,
      status: result.status,
      currentDriverIndex: result.currentDriverIndex,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
