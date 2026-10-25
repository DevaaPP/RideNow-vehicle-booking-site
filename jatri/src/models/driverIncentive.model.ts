import mongoose, { Schema, Document, Types } from "mongoose";

export type IncentiveStatus = "in_progress" | "earned" | "credited";

export interface IDriverIncentive extends Document {
  driverId: Types.ObjectId;
  weekKey: string;             // ISO-like week key in IST, e.g. "2026-W43"
  monthKey: string;            // IST month key e.g. "2026-10"
  completedRides: number;
  tierAchieved: number;        // 0 | 20 | 35 | 50
  bonusAmount: number;         // 0 | 75 | 150 | 250
  status: IncentiveStatus;
  creditedAt?: Date;
  walletTransactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DriverIncentiveSchema = new Schema<IDriverIncentive>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    weekKey: {
      type: String,
      required: true,
      index: true,
    },

    monthKey: {
      type: String,
      required: true,
      index: true,
    },

    completedRides: {
      type: Number,
      default: 0,
      min: 0,
    },

    tierAchieved: {
      type: Number,
      default: 0,
      enum: [0, 20, 35, 50],
    },

    bonusAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["in_progress", "earned", "credited"],
      default: "in_progress",
      index: true,
    },

    creditedAt: {
      type: Date,
      default: null,
    },

    walletTransactionId: {
      type: Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
    },
  },
  { timestamps: true }
);

// Idempotency: Exactly one weekly incentive tracker per driver per week
DriverIncentiveSchema.index({ driverId: 1, weekKey: 1 }, { unique: true });
DriverIncentiveSchema.index({ driverId: 1, monthKey: 1, status: 1 });

const DriverIncentive =
  mongoose.models.DriverIncentive ||
  mongoose.model<IDriverIncentive>("DriverIncentive", DriverIncentiveSchema);

export default DriverIncentive;
