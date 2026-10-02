import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;
  const booking = await Booking.findById(id);

  if (!booking || booking.status !== "requested")
    return NextResponse.json({ message: "Invalid" }, { status: 400 });

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

  return NextResponse.json({ success: true });
}