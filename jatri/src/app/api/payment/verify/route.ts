import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { verifyPayment } from "@/lib/paymentService";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDb();

    // ── Authentication ─────────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const caller = await User.findOne({ email: session.user.email })
      .select("_id")
      .lean();
    if (!caller) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    // verifyPayment checks HMAC signature, booking ownership (userId param),
    // and idempotency before updating any records.
    const result = await verifyPayment({
      bookingId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      userId: (caller as any)._id.toString(),
    });

    const booking = result.booking;
    const payment = result.payment;

    try {
      if (process.env.NEXT_PUBLIC_SOCKET_SERVER) {
        // Notify driver
        await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: booking?.driver ? booking.driver.toString() : undefined,
            event: "booking-updated",
            data: {
              bookingId: booking._id.toString(),
              status: "confirmed",
              paymentStatus: "paid",
              pickupOtp: booking.pickupOtp,
            },
          }),
        });

        // Notify passenger
        await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: booking?.user ? booking.user.toString() : undefined,
            event: "booking-updated",
            data: {
              bookingId: booking._id.toString(),
              status: "confirmed",
              paymentStatus: "paid",
              pickupOtp: booking.pickupOtp,
            },
          }),
        });
      }
    } catch (err) {
      console.warn("Socket digital payment verify emit failed:", err);
    }

    return NextResponse.json({
      success: true,
      bookingId: booking._id,
      paymentStatus: "paid",
      status: "confirmed",
      adminCommission: payment?.platformRevenue || booking.adminCommission,
      partnerAmount: payment?.driverEarnings || booking.partnerAmount,
      isDuplicate: result.isDuplicate,
    });
  } catch (error: any) {
    console.error("POST /api/payment/verify error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Payment verification failed" },
      { status: 400 }
    );
  }
}