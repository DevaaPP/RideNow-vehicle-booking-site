import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import { transitionBookingState } from "@/lib/bookingStateMachine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDb();
  const session = await auth();

  const actorRole = session?.user?.role === "vendor" || session?.user?.role === "driver" ? "driver" : session?.user?.role === "admin" ? "admin" : "driver";
  const actorId = session?.user?.id;

  const transitionRes = await transitionBookingState({
    bookingId: id,
    targetStatus: "driver_arriving",
    actorId,
    actorRole,
  });

  if (!transitionRes.success) {
    const status = transitionRes.errorCode === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json({ message: transitionRes.message || "Could not update arriving status" }, { status });
  }

  return NextResponse.json({ success: true, booking: transitionRes.booking });
}