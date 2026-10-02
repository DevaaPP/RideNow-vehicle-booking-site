import mongoose, { Schema, Document, Types } from "mongoose";

export type LegalDocumentType =
  | "terms"
  | "privacy"
  | "driver_agreement"
  | "cancellation_policy"
  | "location_consent";

export interface ILegalConsent extends Document {
  userId?: Types.ObjectId;
  documentType: LegalDocumentType;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  acceptedAt: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const LegalConsentSchema = new Schema<ILegalConsent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    },
    documentType: {
      type: String,
      enum: [
        "terms",
        "privacy",
        "driver_agreement",
        "cancellation_policy",
        "location_consent",
      ],
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0",
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

LegalConsentSchema.index({ userId: 1, documentType: 1, version: 1 });

const LegalConsent =
  mongoose.models.LegalConsent ||
  mongoose.model<ILegalConsent>("LegalConsent", LegalConsentSchema);

export default LegalConsent;
