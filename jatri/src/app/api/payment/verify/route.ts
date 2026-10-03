import connectDb from "@/lib/db"
import Booking from "@/models/booking.model"
import crypto from "crypto"



export async function POST(req: Request) {

  await connectDb()

  const {
    bookingId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = await req.json()

  const body = razorpay_order_id + "|" + razorpay_payment_id

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    return Response.json({ success:false, message:"Invalid signature" })
  }

  const booking = await Booking.findById(bookingId)

  if (!booking) {
    return Response.json({ success:false })
  }

  /* SPLIT CALCULATION */

  const adminCommission = booking.fare * 0.10
  const partnerAmount = booking.fare - adminCommission

  booking.paymentStatus = "paid"
  booking.status = "confirmed"

  if (!booking.pickupOtp) {
    booking.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
  }

  booking.adminCommission = adminCommission
  booking.partnerAmount = partnerAmount

  await booking.save()

  try {
    // Notify driver
    await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: booking.driver ? booking.driver.toString() : undefined,
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
        userId: booking.user.toString(),
        event: "booking-updated",
        data: {
          bookingId: booking._id.toString(),
          status: "confirmed",
          paymentStatus: "paid",
          pickupOtp: booking.pickupOtp,
        },
      }),
    });
  } catch (err) {
    console.error("Socket digital payment verify emit failed:", err);
  }

  return Response.json({
    success:true,
    adminCommission,
    partnerAmount
  })
}