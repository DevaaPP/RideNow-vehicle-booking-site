import mongoose, { Schema, Document, Types } from "mongoose";

export type TransactionType = "credit" | "debit";

export type TransactionCategory =
  | "topup"
  | "ride_payment"
  | "ride_refund"
  | "partner_earning"
  | "commission_deduct"
  | "withdrawal"
  | "promo_bonus";

export type TransactionStatus = "pending" | "success" | "failed";

export interface IWalletTransaction extends Document {
  userId: Types.ObjectId;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId?: Types.ObjectId;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  description: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "topup",
        "ride_payment",
        "ride_refund",
        "partner_earning",
        "commission_deduct",
        "withdrawal",
        "promo_bonus",
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "success",
      index: true,
    },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

const WalletTransaction =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);

export default WalletTransaction;
