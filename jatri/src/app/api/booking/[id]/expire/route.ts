import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { transitionBookingState } from "@/lib/bookingStateMachine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;

  const transitionRes = await transitionBookingState({
    bookingId: id,
    targetStatus: "expired",
    actorRole: "system",
  });

  if (!transitionRes.success) {
    return NextResponse.json({ message: transitionRes.message || "Could not expire booking" }, { status: 400 });
  }

  return NextResponse.json({ success: true, booking: transitionRes.booking });
}