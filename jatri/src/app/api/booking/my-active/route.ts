export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      $in: ["requested", "searching_driver", "awaiting_payment", "confirmed", "started", "auto_rematching"],
    },
  })
    .sort({ createdAt: -1 })
    .populate("vehicle", "number vehicleModel type")
    .populate("driver", "name phone profilePhoto rating totalRides");

  if (booking) {
    const ageMs = booking.createdAt ? Date.now() - new Date(booking.createdAt).getTime() : 0;
    const isStale = ageMs > 2 * 60 * 1000;
    const isSearchingWithoutDriver = ["requested", "searching_driver", "auto_rematching"].includes(booking.status);

    if (isStale && isSearchingWithoutDriver) {
      booking.status = "expired";
      await booking.save();
      return NextResponse.json({ success: true, booking: null });
    }
  }

  return NextResponse.json({ success: true, booking });
}