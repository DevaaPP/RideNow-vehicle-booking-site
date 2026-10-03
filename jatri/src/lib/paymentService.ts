/**
 * RideNow Payment Service Architecture (Phase 7)
 * Strictly separates:
 * 1. Ride Fare (Gross customer payment)
 * 2. Platform Revenue (Platform booking fee + Commission)
 * 3. Driver Earnings (Net driver credit)
 * 4. Refunds (Partial & Full)
 * 5. Idempotent webhook verification & transaction reconciliation
 */
import crypto from "crypto";
import connectDb from "@/lib/db";
import razorpay from "@/lib/razorpay";
import Booking from "@/models/booking.model";
import Payment, { IPayment } from "@/models/payment.model";
import { transitionBookingState } from "@/lib/bookingStateMachine";
import { Types } from "mongoose";

export interface CreateOrderParams {
  bookingId: string;
  userId: string;
  idempotencyKey?: string;
}

export interface VerifyPaymentParams {
  bookingId: string;
  orderId: string;
  paymentId: string;
  signature: string;
  userId?: string;
}

export interface WebhookEventPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        receipt: string;
        status: string;
      };
    };
  };
}

/**
 * Creates or retrieves an existing payment order with idempotency.
 */
export async function createPaymentOrder(params: CreateOrderParams) {
  await connectDb();
  const { bookingId, userId, idempotencyKey } = params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.user.toString() !== userId.toString()) {
    throw new Error("Unauthorized to initiate payment for this booking");
  }

  if (["completed", "cancelled", "expired"].includes(booking.status)) {
    throw new Error(`Cannot pay for a booking in '${booking.status}' state`);
  }

  if (booking.paymentStatus === "paid") {
    throw new Error("Booking has already been paid for");
  }

  const effectiveIdempotencyKey = idempotencyKey || `order_${booking._id}_${booking.fare}`;

  // Check existing initiated/pending payment record
  let existingPayment = await Payment.findOne({
    booking: booking._id,
    idempotencyKey: effectiveIdempotencyKey,
    status: { $in: ["initiated", "pending"] },
  });

  if (existingPayment && existingPayment.orderId) {
    return {
      orderId: existingPayment.orderId,
      amount: booking.fare * 100,
      currency: "INR",
      paymentId: existingPayment._id,
    };
  }

  const amountPaise = Math.round(booking.fare * 100);

  // Generate order via Razorpay
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `rcpt_${booking._id.toString().slice(-8)}`,
    notes: {
      bookingId: booking._id.toString(),
      userId: userId.toString(),
    },
  });

  // Calculate revenue separation (Platform Revenue vs Driver Earnings)
  const platformFee = booking.fareBreakdown?.platformFee || 15;
  const adminCommission = Math.round(booking.fare * 0.15); // 15% standard commission
  const platformRevenue = adminCommission + platformFee;
  const driverEarnings = Math.max(0, booking.fare - platformRevenue);

  await Payment.create({
    booking: booking._id,
    user: booking.user,
    driver: booking.driver,
    orderId: order.id,
    method: "online",
    status: "initiated",
    rideFare: booking.fare,
    platformRevenue,
    driverEarnings,
    currency: "INR",
    idempotencyKey: effectiveIdempotencyKey,
  });

  booking.paymentStatus = "pending";
  await booking.save();

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Authoritatively verifies gateway signature and settles transaction.
 */
export async function verifyPayment(params: VerifyPaymentParams) {
  await connectDb();
  const { bookingId, orderId, paymentId, signature } = params;

  // 1. Verify HMAC Signature
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("Payment gateway configuration missing key secret");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new Error("Invalid payment signature verification failed");
  }

  // 2. Fetch Booking & Payment record
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Idempotency: If already confirmed and paid with this transaction, return success
  if (booking.paymentStatus === "paid") {
    const existingSuccess = await Payment.findOne({
      booking: booking._id,
      transactionId: paymentId,
      status: "success",
    });
    if (existingSuccess) {
      return { success: true, booking, isDuplicate: true };
    }
  }

  // 3. Update Payment record to SUCCESS
  const payment = await Payment.findOneAndUpdate(
    { orderId },
    {
      $set: {
        transactionId: paymentId,
        status: "success",
        reconciledAt: new Date(),
        gatewayResponse: { paymentId, orderId, verifiedAt: new Date() },
      },
    },
    { new: true, upsert: true }
  );

  // 4. Update Booking and generate pickup OTP if not set
  booking.paymentStatus = "paid";
  if (!booking.pickupOtp) {
    booking.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
  }

  booking.adminCommission = payment.platformRevenue;
  booking.partnerAmount = payment.driverEarnings;

  // Transition booking to confirmed via State Machine
  await transitionBookingState({
    bookingId: booking._id,
    targetStatus: "confirmed",
    actorRole: "system",
    payload: {
      paymentStatus: "paid",
      pickupOtp: booking.pickupOtp,
      pickupOtpExpires: booking.pickupOtpExpires,
      adminCommission: payment.platformRevenue,
      partnerAmount: payment.driverEarnings,
    },
  });

  return {
    success: true,
    booking,
    payment,
    isDuplicate: false,
  };
}

/**
 * Handles Webhook event with signature validation and replay protection.
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  webhookSignature: string
): Promise<{ success: boolean; event: string; message: string }> {
  await connectDb();

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      throw new Error("Invalid webhook signature");
    }
  }

  const data: WebhookEventPayload = JSON.parse(rawBody);
  const event = data.event;

  if (event === "order.paid" || event === "payment.captured") {
    const paymentEntity = data.payload.payment?.entity;
    const orderEntity = data.payload.order?.entity;
    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const paymentId = paymentEntity?.id;

    if (orderId) {
      const paymentDoc = await Payment.findOne({ orderId });
      if (paymentDoc && paymentDoc.status !== "success") {
        paymentDoc.status = "success";
        paymentDoc.transactionId = paymentId || paymentDoc.transactionId;
        paymentDoc.webhookProcessed = true;
        paymentDoc.reconciledAt = new Date();
        await paymentDoc.save();

        const booking = await Booking.findById(paymentDoc.booking);
        if (booking && booking.paymentStatus !== "paid") {
          booking.paymentStatus = "paid";
          if (!booking.pickupOtp) {
            booking.pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
            booking.pickupOtpExpires = new Date(Date.now() + 60 * 60 * 1000);
          }
          await booking.save();
        }
      }
    }
  }

  return { success: true, event, message: "Webhook processed successfully" };
}
