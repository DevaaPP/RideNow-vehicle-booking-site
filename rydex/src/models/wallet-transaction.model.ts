import mongoose, { Schema, Document, Types } from "mongoose";

export type TransactionType = "credit" | "debit";

export type CleanWalletType =
  | "RIDE_PAYMENT"
  | "COMMISSION"
  | "EARNING"
  | "REFUND"
  | "WITHDRAWAL"
  | "ADJUSTMENT";

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
  walletId?: Types.ObjectId;
  userId: Types.ObjectId;
  rideId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  type: TransactionType;
  transactionType?: CleanWalletType;
  category: TransactionCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  description: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        "RIDE_PAYMENT",
        "COMMISSION",
        "EARNING",
        "REFUND",
        "WITHDRAWAL",
        "ADJUSTMENT",
      ],
      default: "EARNING",
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
WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });

const WalletTransaction =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);

export default WalletTransaction;
