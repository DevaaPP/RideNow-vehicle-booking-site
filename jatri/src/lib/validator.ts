/**
 * RideNow Input Validation & Sanitization Framework (Phase 12)
 *
 * Provides standardized validation for:
 * - Latitude / Longitude coordinates within realistic geographical ranges
 * - Indian phone numbers (10 digits, +91 normalization)
 * - Emails (RFC standard format)
 * - MongoDB ObjectIds (24 hex characters)
 * - Safe numeric ranges (fares, amounts, multipliers)
 * - Text fields (anti-XSS and length truncation)
 */

import mongoose from "mongoose";

export interface ValidationResult<T = any> {
  valid: boolean;
  value?: T;
  error?: string;
}

/**
 * Validates geographical coordinates (Latitude: -90 to +90, Longitude: -180 to +180).
 */
export function validateCoordinates(lat: any, lng: any): ValidationResult<[number, number]> {
  const latitude = typeof lat === "number" ? lat : parseFloat(lat);
  const longitude = typeof lng === "number" ? lng : parseFloat(lng);

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, error: "Invalid latitude. Must be between -90 and 90." };
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, error: "Invalid longitude. Must be between -180 and 180." };
  }

  return { valid: true, value: [latitude, longitude] };
}

/**
 * Validates and normalizes 10-digit phone numbers.
 */
export function validatePhoneNumber(phone: any): ValidationResult<string> {
  if (!phone || typeof phone !== "string") {
    return { valid: false, error: "Phone number is required" };
  }

  const cleaned = phone.replace(/\D/g, "");
  const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

  if (tenDigits.length !== 10 || !/^[6-9]\d{9}$/.test(tenDigits)) {
    return { valid: false, error: "Invalid phone number. Must be a valid 10-digit mobile number." };
  }

  return { valid: true, value: tenDigits };
}

/**
 * Validates and sanitizes email addresses.
 */
export function validateEmail(email: any): ValidationResult<string> {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed) || trimmed.length > 254) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates MongoDB ObjectId.
 */
export function validateObjectId(id: any): ValidationResult<string> {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "Identifier is required" };
  }

  const trimmed = id.trim();
  if (!mongoose.Types.ObjectId.isValid(trimmed)) {
    return { valid: false, error: "Invalid resource identifier format" };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validates monetary amounts or positive integers.
 */
export function validateAmount(amount: any, min = 1, max = 1000000): ValidationResult<number> {
  const num = typeof amount === "number" ? amount : parseFloat(amount);

  if (isNaN(num) || num < min || num > max) {
    return { valid: false, error: `Amount must be a valid number between ₹${min} and ₹${max}.` };
  }

  return { valid: true, value: Math.round(num * 100) / 100 };
}

/**
 * Sanitizes plain string inputs against script tags and control characters.
 */
export function sanitizeString(str: any, maxLength = 500): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "") // strip html/script tag markers
    .replace(/[\x00-\x1F\x7F]/g, "") // strip non-printable ascii
    .trim()
    .slice(0, maxLength);
}
