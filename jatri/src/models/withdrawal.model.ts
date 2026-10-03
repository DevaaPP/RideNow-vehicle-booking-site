import mongoose, { Schema, Document, Types } from "mongoose";

export type WithdrawalStatus = "pending" | "processing" | "success" | "failed" | "reversed";

export interface IWithdrawal extends Document {
  withdrawalId: string;
  driver: Types.ObjectId;
  wallet: Types.ObjectId;
  amount: number;
  status: WithdrawalStatus;
  payoutDestination: string;
  bankDetails?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
    upi?: string;
  };
  transactionId?: string;
  refundTransactionId?: string;
  idempotencyKey?: string;
  failureReason?: string;
  processedBy?: Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema<IWithdrawal>(
  {
    withdrawalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "success", "failed", "reversed"],
      default: "pending",
      index: true,
    },
    payoutDestination: {
      type: String,
      required: true,
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifsc: String,
      upi: String,
    },
    transactionId: {
      type: String,
      index: true,
    },
    refundTransactionId: {
      type: String,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

WithdrawalSchema.index({ driver: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });

const Withdrawal =
  mongoose.models.Withdrawal ||
  mongoose.model<IWithdrawal>("Withdrawal", WithdrawalSchema);

export default Withdrawal;
