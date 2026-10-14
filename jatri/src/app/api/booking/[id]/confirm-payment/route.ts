import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { auth } from "@/auth";
import { generateSecureOtp } from "@/lib/cryptoOtp";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;

  // ── Authorization ──────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const sessionUser = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();
  if (!sessionUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { method } = await req.json();
  const booking = await Booking.findById(id);

  if (!booking || booking.status !== "awaiting_payment") {
    return NextResponse.json({ message: "Invalid" }, { status: 400 });
  }

  // Only the booking owner or an admin may confirm payment
  const isOwner = booking.user?.toString() === (sessionUser as any)._id.toString();
  const isAdmin = (sessionUser as any).role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  booking.status = "confirmed";
  booking.paymentStatus = method === "cash" ? "cash" : "paid";
  booking.paymentDeadline = undefined;

  if (!booking.pickupOtp) {
    booking.pickupOtp = generateSecureOtp(4);
    booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
  }

  await booking.save();

  try {
    // Notify driver: confirm payment without leaking pickup OTP
    await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: booking.driver ? booking.driver.toString() : undefined,
        event: "booking-updated",
        data: {
          bookingId: booking._id.toString(),
          status: "confirmed",
          paymentStatus: booking.paymentStatus,
        },
      }),
    });

    // Also notify passenger so their screen immediately gets the OTP
    await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: booking.user.toString(),
        event: "booking-updated",
        data: {
          bookingId: booking._id.toString(),
          status: "confirmed",
          paymentStatus: booking.paymentStatus,
          pickupOtp: booking.pickupOtp,
        },
      }),
    });
  } catch (err) {
    console.error("Socket confirmation payment emit failed:", err);
  }

  return NextResponse.json({ success: true });
}