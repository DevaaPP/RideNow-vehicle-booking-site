import mongoose, { Schema, Document, Types } from "mongoose";

export type ReferralStatus =
  | "pending"    // Referee registered/applied code, ride not yet completed
  | "qualified"  // First ride eligible, reward awaiting payout
  | "rewarded"   // Reward ₹50 credited to referrer wallet
  | "expired"    // Exceeded 30-day window without completing ride
  | "flagged";   // Fraud check or abuse triggered

export interface IReferral extends Document {
  referrerId: Types.ObjectId;
  refereeId: Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  refereeDiscountUsed: boolean;
  refereeDiscountAmount: number;
  referrerRewardAmount: number;
  qualifyingBookingId?: Types.ObjectId;
  rewardedAt?: Date;
  expiresAt: Date;
  walletTransactionId?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A referee can only be referred once in their lifetime
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "qualified", "rewarded", "expired", "flagged"],
      default: "pending",
      index: true,
    },
    refereeDiscountUsed: {
      type: Boolean,
      default: false,
    },
    refereeDiscountAmount: {
      type: Number,
      default: 30,
      min: 0,
    },
    referrerRewardAmount: {
      type: Number,
      default: 50,
      min: 0,
    },
    qualifyingBookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    rewardedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    walletTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Fast compound indexes for referrer tracking and status querying
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ referrerId: 1, createdAt: -1 });

const Referral =
  mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);

export default Referral;
