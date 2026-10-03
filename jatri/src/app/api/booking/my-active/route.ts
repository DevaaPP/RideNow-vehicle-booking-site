import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";

export async function GET() {
  await connectDb();

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: true, booking: null });
  }

  const booking = await Booking.findOne({
    user: session.user.id,
    status: {
      $in: ["requested", "awaiting_payment", "confirmed", "started", "auto_rematching"],
    },
  })
    .sort({ createdAt: -1 })
    .populate("vehicle", "number vehicleModel type")
    .populate("driver", "name phone profilePhoto rating totalRides");

  return NextResponse.json({ success: true, booking });
}