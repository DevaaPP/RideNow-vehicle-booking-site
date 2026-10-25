import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB TTL Index: documents automatically purged after expiresAt
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup of active unverified OTP for a phone number
OtpSchema.index({ phone: 1, verified: 1, expiresAt: 1 });

const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);

export default Otp;
