import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import { transitionBookingState } from "@/lib/bookingStateMachine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDb();
    const session = await auth();

    const actorRole = session?.user?.role === "vendor" || session?.user?.role === "driver" ? "driver" : session?.user?.role === "admin" ? "admin" : "driver";
    const actorId = session?.user?.id;

    const transitionRes = await transitionBookingState({
      bookingId: id,
      targetStatus: "started",
      actorId,
      actorRole,
      payload: {
        startedAt: new Date(),
      },
    });

    if (!transitionRes.success) {
      const status = transitionRes.errorCode === "UNAUTHORIZED" ? 403 : 400;
      return NextResponse.json({ success: false, message: transitionRes.message || "Could not start ride" }, { status });
    }

    return NextResponse.json({
      success: true,
      message: "Ride started successfully",
      booking: transitionRes.booking,
    });
  } catch (error) {
    console.error("Start booking error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}