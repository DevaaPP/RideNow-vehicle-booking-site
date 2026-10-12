import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  admin: mongoose.Types.ObjectId;
  adminEmail?: string;
  action: string;
  targetId: string;
  targetType: "VENDOR" | "VEHICLE" | "WALLET" | "WITHDRAWAL" | "PRICING" | "STUDENT_CONFIG" | "USER" | "SAFETY_INCIDENT" | string;
  reason?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    beforeState: {
      type: Schema.Types.Mixed,
    },
    afterState: {
      type: Schema.Types.Mixed,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying audit events on specific targets sorted by time
AuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
AuditLogSchema.index({ admin: 1, createdAt: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
