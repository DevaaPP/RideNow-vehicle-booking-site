import mongoose, { Schema, Document, Types } from "mongoose";

export type PaymentMethod = "online" | "upi" | "card" | "wallet" | "cash";
export type PaymentStatus = "initiated" | "pending" | "success" | "failed" | "refunded" | "partially_refunded";

export interface IPayment extends Document {
  booking: Types.ObjectId;
  user: Types.ObjectId;
  driver?: Types.ObjectId;

  orderId: string;
  transactionId?: string;
  method: PaymentMethod;
  status: PaymentStatus;

  rideFare: number;
  platformRevenue: number;
  driverEarnings: number;
  refundAmount: number;
  currency: string;

  idempotencyKey?: string;
  gatewayResponse?: any;
  webhookProcessed?: boolean;
  reconciledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    method: {
      type: String,
      enum: ["online", "upi", "card", "wallet", "cash"],
      default: "online",
    },
    status: {
      type: String,
      enum: ["initiated", "pending", "success", "failed", "refunded", "partially_refunded"],
      default: "initiated",
      index: true,
    },
    rideFare: {
      type: Number,
      required: true,
    },
    platformRevenue: {
      type: Number,
      required: true,
      default: 0,
    },
    driverEarnings: {
      type: Number,
      required: true,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    webhookProcessed: {
      type: Boolean,
      default: false,
    },
    reconciledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

PaymentSchema.index({ booking: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
export default Payment;
