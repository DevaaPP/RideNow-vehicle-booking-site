import mongoose from "mongoose";
import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Otp from "../models/otp.model.js";
import User from "../models/user.models.js";
import { getWhatsAppService, baileysService } from "../services/whatsapp/index.js";
import {
  otpRateLimitMiddleware,
  validateAndNormalizePhone,
} from "../middleware/otpRateLimiter.js";

const router = express.Router();

/**
 * 📱 POST /api/otp/send
 * Generates and sends a 6-digit OTP via WhatsApp
 * Stores only bcrypt-hashed OTP in MongoDB with a 5-minute expiry
 */
router.post("/send", otpRateLimitMiddleware, async (req, res) => {
  const { phone, formattedJidPhone } = req.validatedPhone;

  try {
    // 1. Generate 6-digit cryptographically secure numeric OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // 2. Hash OTP using bcrypt (10 rounds) before DB persistence
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    // 3. Persist hashed OTP to dedicated Otp collection & sync User if DB connected
    if (mongoose.connection.readyState === 1) {
      await Otp.deleteMany({ phone, verified: false }); // Invalidate previous active unverified OTPs
      await Otp.create({
        phone,
        otpHash: hashedOtp,
        expiresAt,
        attempts: 0,
        verified: false,
      });

      try {
        let user = await User.findOne({ mobileNumber: phone });
        if (!user) {
          user = await User.create({
            name: `User ${phone.slice(-4)}`,
            mobileNumber: phone,
            email: `${phone}@ridenow.in`,
            role: "user",
            isMobileVerified: false,
            otp: hashedOtp,
            otpExpiresAt: expiresAt,
            otpFailedAttempts: 0,
            otpLockedUntil: null,
          });
        } else {
          await User.findByIdAndUpdate(user._id, {
            otp: hashedOtp,
            otpExpiresAt: expiresAt,
            otpFailedAttempts: 0,
            otpLockedUntil: null,
          });
        }
      } catch (userDbErr) {
        console.warn("[OTP Router] User sync note:", userDbErr?.message);
      }
    } else {
      console.warn("[OTP Router] Database offline, bypassing DB write for testing mode.");
    }

    // 5. Dispatch OTP via WhatsApp service (Baileys or Meta Cloud API)
    const whatsapp = getWhatsAppService();
    const sendResult = await whatsapp.sendOtp(formattedJidPhone, otp);

    if (!sendResult.success) {
      return res.status(502).json({
        success: false,
        error: sendResult.error || "Failed to deliver WhatsApp verification code.",
        channel: "whatsapp",
      });
    }

    // 6. Return secure success response (NEVER return raw OTP in production)
    const responsePayload = {
      success: true,
      message: "Verification code sent successfully via WhatsApp.",
      phone: phone.slice(-4).padStart(phone.length, "*"), // Masked for privacy
      channel: "whatsapp",
      expiresInSeconds: 300,
    };

    if (sendResult.warning) {
      responsePayload.warning = sendResult.warning;
    }

    // Include dev OTP hint only in non-production local development
    if (process.env.NODE_ENV !== "production" && sendResult.simulated) {
      responsePayload.devOtpHint = otp;
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("[OTP Router] Send exception:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while processing your verification request.",
    });
  }
});

/**
 * 🔒 POST /api/otp/verify
 * Verifies candidate OTP against stored bcrypt hash in MongoDB
 */
router.post("/verify", async (req, res) => {
  const rawPhone = req.body?.mobileNumber || req.body?.phone;
  const candidateOtp = req.body?.otp;

  const phoneValidation = validateAndNormalizePhone(rawPhone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      error: phoneValidation.error,
    });
  }

  if (!candidateOtp || typeof candidateOtp !== "string" || candidateOtp.trim().length !== 6) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid 6-digit verification code.",
    });
  }

  const { phone } = phoneValidation;
  const now = new Date();

  try {
    // 1. Find the latest active OTP record
    const otpRecord = await Otp.findOne({
      phone,
      verified: false,
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: "No active verification code found for this mobile number. Please request a new OTP.",
      });
    }

    // 2. Check Expiry (5 minutes)
    if (otpRecord.expiresAt < now) {
      await Otp.findByIdAndDelete(otpRecord._id);
      return res.status(400).json({
        success: false,
        error: "Verification code has expired. Please request a new OTP.",
      });
    }

    // 3. Check Attempt Limits (Max 5 attempts)
    if (otpRecord.attempts >= 5) {
      await Otp.findByIdAndDelete(otpRecord._id);
      return res.status(429).json({
        success: false,
        error: "Too many incorrect attempts. For security, please request a new verification code.",
      });
    }

    // 4. Verify candidate OTP with stored bcrypt hash
    const isMatch = await bcrypt.compare(candidateOtp.trim(), otpRecord.otpHash);

    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remainingAttempts = Math.max(0, 5 - otpRecord.attempts);
      return res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`,
        remainingAttempts,
      });
    }

    // 5. Verification Successful
    otpRecord.verified = true;
    await otpRecord.save();

    // Mark user verified in database
    await User.findOneAndUpdate(
      { mobileNumber: phone },
      {
        isMobileVerified: true,
        otp: undefined,
        otpExpiresAt: undefined,
        otpFailedAttempts: 0,
        otpLockedUntil: null,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Mobile number verified successfully.",
      phone,
    });
  } catch (err) {
    console.error("[OTP Router] Verify exception:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Failed to verify code due to an internal server error.",
    });
  }
});

/**
 * 📊 GET /api/otp/status
 * Returns current WhatsApp transport engine health
 */
router.get("/status", (req, res) => {
  const whatsapp = getWhatsAppService();
  const statusInfo = whatsapp.getStatus();
  return res.status(200).json({
    success: true,
    engine: "RideNow WhatsApp OTP Microservice",
    ...statusInfo,
  });
});

/**
 * 📷 GET /api/otp/qr
 * Returns the current QR pairing code if Baileys is in qr_ready state.
 * Requires internal secret or administrative authorization in production.
 * Hardened with constant-time secret comparison and strict no-store cache headers.
 */
router.get("/qr", (req, res) => {
  // Prevent any proxy or browser caching of sensitive pairing secrets
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const authHeader = req.headers["authorization"] || "";
  const secretHeader = req.headers["x-internal-secret"] || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";
  const candidateSecret = secretHeader || bearerToken;

  const internalSecret =
    process.env.SOCKET_INTERNAL_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.INTERNAL_API_SECRET;

  const timingSafeEqual = (a, b) => {
    if (!a || !b) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  };

  const isAuthorized =
    Boolean(internalSecret) && timingSafeEqual(candidateSecret, internalSecret);

  if (process.env.NODE_ENV === "production") {
    if (!internalSecret) {
      return res.status(503).json({
        success: false,
        error: "Pairing service unavailable: internal secret not configured.",
      });
    }
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Administrative pairing authorization required.",
      });
    }
  }

  const qrData = baileysService.getQrData();
  return res.status(200).json({
    success: true,
    ...qrData,
  });
});

export default router;
