import connectDb from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import axios from "axios";
import { transitionBookingState } from "@/lib/bookingStateMachine";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const session = await auth();
  const id = (await context.params).id;

  const actorRole = session?.user?.role === "vendor" || session?.user?.role === "driver" ? "driver" : session?.user?.role === "admin" ? "admin" : "driver";
  const actorId = session?.user?.id;

  const duration = 15;
  const now = new Date();

  const transitionRes = await transitionBookingState({
    bookingId: id,
    targetStatus: "awaiting_payment",
    actorId,
    actorRole,
    payload: {
      driver: actorId || undefined,
      acceptedAt: now,
      paymentDeadline: new Date(Date.now() + 5 * 60 * 1000),
      estimatedDropoffTime: new Date(Date.now() + duration * 60 * 1000),
    },
  });

  if (!transitionRes.success) {
    const status = transitionRes.errorCode === "RACE_CONDITION" ? 409 : transitionRes.errorCode === "UNAUTHORIZED" ? 403 : 400;
    return NextResponse.json({ message: transitionRes.message || "Could not accept booking" }, { status });
  }

  const booking = transitionRes.booking!;

  try {
    if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
        {
          userId: booking.user.toString(),
          event: "booking-updated",
          data: {
            bookingId: booking._id.toString(),
            status: "awaiting_payment",
          },
        },
        { timeout: 3500 }
      );
    }
  } catch (socketErr) {
    console.warn("Socket notification in accept route failed:", socketErr);
  }

  try {
    const { sendPushToUser } = await import("@/lib/webPush");
    await sendPushToUser(booking.user.toString(), {
      title: "Driver Accepted Your Ride! 🚗",
      body: "Your driver is heading to the pickup location.",
      url: `/ride/${booking._id}`,
    });
  } catch (pushErr) {
    console.warn("Push notification error on accept:", pushErr);
  }

  return NextResponse.json({ success: true, booking, isDuplicate: transitionRes.isDuplicateCall });
}