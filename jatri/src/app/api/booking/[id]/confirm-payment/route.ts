import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import { auth } from "@/auth";
import { generateSecureOtp } from "@/lib/cryptoOtp";
import { recoverCustomerOutstandingDues } from "@/lib/cancellationEngine";
import { emitSocketEvent } from "@/lib/socketServerEmit";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  await connectDb();
  const id = (await context.params).id;

  // ── Authorization ──────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any)?.id;
  const userEmail = session.user?.email;

  let sessionUser: any = null;
  if (userId) {
    sessionUser = await User.findById(userId).select("_id role email mobileNumber").lean();
  }
  if (!sessionUser && userEmail) {
    sessionUser = await User.findOne({ email: userEmail }).select("_id role email mobileNumber").lean();
  }
  if (!sessionUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { method } = body;

  if (method !== "cash") {
    return NextResponse.json(
      { message: "Invalid payment method for offline confirmation. Online payments must be verified through the payment gateway." },
      { status: 400 }
    );
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  // Only the booking owner or an admin may confirm payment
  const isOwner = booking.user?.toString() === (sessionUser as any)._id.toString();
  const isAdmin = (sessionUser as any).role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Idempotency: If already confirmed with valid payment status, return success cleanly without error loop
  if (booking.status === "confirmed" && (booking.paymentStatus === "paid" || booking.paymentStatus === "cash")) {
    return NextResponse.json({
      success: true,
      alreadyConfirmed: true,
      status: "confirmed",
      paymentStatus: booking.paymentStatus,
      pickupOtp: booking.pickupOtp,
    });
  }

  if (booking.status !== "awaiting_payment" && booking.status !== "confirmed") {
    return NextResponse.json({ message: "Invalid booking status for payment confirmation" }, { status: 400 });
  }

  booking.status = "confirmed";
  booking.paymentStatus = "cash";
  booking.paymentDeadline = undefined;

  if (!booking.pickupOtp) {
    booking.pickupOtp = generateSecureOtp(4);
    booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
  }

  await booking.save();

  if (booking.paymentStatus === "paid" && booking.user && booking.cancellationDuesIncluded && booking.cancellationDuesIncluded > 0) {
    try {
      await recoverCustomerOutstandingDues({
        userId: booking.user,
        paidAmount: booking.cancellationDuesIncluded,
        bookingId: booking._id,
      });
    } catch (err) {
      console.error("Failed to recover customer outstanding dues in confirm-payment:", err);
    }
  }

  try {
    // Notify driver: confirm payment without leaking pickup OTP
    await emitSocketEvent({
      userId: booking.driver ? booking.driver.toString() : undefined,
      event: "booking-updated",
      data: {
        bookingId: booking._id.toString(),
        status: "confirmed",
        paymentStatus: booking.paymentStatus,
      },
      directBookingId: booking._id.toString(),
    });

    // Also notify passenger so their screen immediately gets the OTP
    await emitSocketEvent({
      userId: booking.user.toString(),
      event: "booking-updated",
      data: {
        bookingId: booking._id.toString(),
        status: "confirmed",
        paymentStatus: booking.paymentStatus,
        pickupOtp: booking.pickupOtp,
      },
      directBookingId: booking._id.toString(),
    });
  } catch (err) {
    console.error("Socket confirmation payment emit failed:", err);
  }

  return NextResponse.json({
    success: true,
    status: "confirmed",
    paymentStatus: booking.paymentStatus,
    pickupOtp: booking.pickupOtp,
    booking,
  });
}