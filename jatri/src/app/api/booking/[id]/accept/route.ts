import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import axios from "axios";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const session = await auth();
  const id = (await context.params).id;
  const booking = await Booking.findById(id);

  if (!booking || booking.status !== "requested")
    return NextResponse.json({ message: "Invalid" }, { status: 400 });

  if (session?.user?.id && session.user.role === "vendor") {
    booking.driver = session.user.id;
  }

  booking.status = "awaiting_payment";
  booking.acceptedAt = new Date();
  booking.paymentDeadline = new Date(Date.now() + 5 * 60 * 1000);
  const duration = booking.tripDurationMinutes || 15;
  booking.estimatedDropoffTime = new Date(Date.now() + duration * 60 * 1000);

  await booking.save();

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

  // Trigger web push to passenger
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

  return NextResponse.json({ success: true });
}