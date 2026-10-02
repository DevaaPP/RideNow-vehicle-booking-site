import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { auth } from "@/auth";
import axiosOriginal from "axios";

async function notifySocket(userId: string, event: string, data: any) {
  try {
    await axiosOriginal.post(
      `${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`,
      { userId, event, data }
    );
  } catch (err) {
    console.error("Socket emit failed in timeout route:", err);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const booking = await Booking.findOne({
    _id: id,
    user: session.user.id,
    status: "requested",
  });

  if (!booking) {
    return NextResponse.json(
      { message: "Booking already accepted, processed, or invalid" },
      { status: 400 }
    );
  }

  const nextIndex = (booking.currentDriverIndex || 0) + 1;

  if (booking.candidateDrivers && nextIndex < booking.candidateDrivers.length) {
    const nextDriverId = booking.candidateDrivers[nextIndex];
    const nextDriver = await User.findById(nextDriverId).select("mobileNumber");

    booking.driver = nextDriverId;
    booking.driverMobileNumber = nextDriver?.mobileNumber || "";
    booking.currentDriverIndex = nextIndex;
    booking.status = "requested";
    await booking.save();

    // 1️⃣ Notify new driver
    await notifySocket(nextDriverId.toString(), "new-booking", booking);

    // 2️⃣ Notify customer of status change / pointer update
    await notifySocket(booking.user.toString(), "booking-updated", {
      bookingId: booking._id,
      status: "requested",
      currentDriverIndex: nextIndex,
    });
  } else {
    // Candidates exhausted for current round - check total elapsed time
    const createdAtMs = booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now();
    const elapsedSeconds = (Date.now() - createdAtMs) / 1000;

    // If searching has been going on for less than 90 seconds, do not prematurely cancel
    if (elapsedSeconds < 90) {
      if (booking.pickupLocation?.coordinates) {
        const [pLng, pLat] = booking.pickupLocation.coordinates;
        try {
          const freshVendors = await User.find({
            role: "vendor",
            isOnline: true,
            _id: { $nin: booking.candidateDrivers || [] },
            location: {
              $near: {
                $geometry: { type: "Point", coordinates: [pLng, pLat] },
                $maxDistance: 10000,
              },
            },
          }).limit(3);

          if (freshVendors.length > 0) {
            const newCandidateIds = freshVendors.map((v) => v._id);
            if (!booking.candidateDrivers) booking.candidateDrivers = [];
            booking.candidateDrivers.push(...newCandidateIds);
            const newDriver = freshVendors[0];
            booking.driver = newDriver._id;
            booking.driverMobileNumber = newDriver.mobileNumber || "";
            booking.currentDriverIndex = booking.candidateDrivers.length - freshVendors.length;
            await booking.save();

            await notifySocket(newDriver._id.toString(), "new-booking", booking);
            await notifySocket(booking.user.toString(), "booking-updated", {
              bookingId: booking._id,
              status: "requested",
              currentDriverIndex: booking.currentDriverIndex,
            });
            return NextResponse.json({ success: true, retried: true });
          }
        } catch (e) {
          console.warn("Fresh vendor lookup in timeout failed:", e);
        }
      }

      // If still within 90s, keep status as requested so the customer booking is NOT terminated
      return NextResponse.json({ success: true, stillSearching: true });
    }

    // Only after 90+ seconds without driver acceptance, mark as rejected
    booking.status = "rejected";
    await booking.save();

    // Notify customer
    await notifySocket(booking.user.toString(), "booking-updated", {
      bookingId: booking._id,
      status: "rejected",
    });
  }

  return NextResponse.json({ success: true });
}
