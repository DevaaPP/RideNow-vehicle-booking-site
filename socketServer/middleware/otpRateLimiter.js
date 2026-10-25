/**
 * OTP Rate Limiter & Validation Middleware
 *
 * Implements:
 * 1. Phone number validation (Indian 10-digit mobile & international E.164)
 * 2. Per-IP rate limiting (5 requests per 10 minutes)
 * 3. Per-Phone rate limiting (3 requests per 10 minutes)
 * 4. Resend cooldown (60 seconds minimum interval between requests for same phone)
 */

class MemoryRateLimiter {
  constructor() {
    this.storage = new Map();
    // Prune stale entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  check(key, limit, windowMs) {
    const now = Date.now();
    let record = this.storage.get(key);

    if (!record || record.resetTime <= now) {
      record = { count: 1, resetTime: now + windowMs, lastRequest: now };
      this.storage.set(key, record);
      return { allowed: true, remaining: limit - 1, resetMs: windowMs, lastRequest: now };
    }

    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, record.resetTime - now),
        lastRequest: record.lastRequest,
      };
    }

    record.count += 1;
    const prevRequest = record.lastRequest;
    record.lastRequest = now;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetMs: Math.max(0, record.resetTime - now),
      lastRequest: prevRequest,
    };
  }

  getRecord(key) {
    return this.storage.get(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.storage.entries()) {
      if (record.resetTime <= now) {
        this.storage.delete(key);
      }
    }
  }
}

export const otpLimiter = new MemoryRateLimiter();

/**
 * Extracts and sanitizes the client IP
 */
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",");
    return ips[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

/**
 * Normalizes and validates phone numbers
 * Returns { valid: boolean, phone: string, formattedJidPhone: string, error?: string }
 */
export function validateAndNormalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { valid: false, error: "Mobile number is required and must be a string." };
  }

  const cleaned = rawPhone.replace(/\D/g, "");

  if (!cleaned) {
    return { valid: false, error: "Please enter a valid mobile number." };
  }

  // 1. Standard Indian 10-digit mobile number
  if (cleaned.length === 10) {
    // Valid Indian mobile numbers start with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return { valid: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }
    return {
      valid: true,
      phone: cleaned,
      formattedJidPhone: `91${cleaned}`,
    };
  }

  // 2. Mobile number with 91 country code (12 digits)
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const tenDigits = cleaned.slice(2);
    if (!/^[6-9]\d{9}$/.test(tenDigits)) {
      return { valid: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }
    return {
      valid: true,
      phone: tenDigits,
      formattedJidPhone: cleaned,
    };
  }

  // 3. International E.164 (11-15 digits)
  if (cleaned.length >= 11 && cleaned.length <= 15) {
    return {
      valid: true,
      phone: cleaned,
      formattedJidPhone: cleaned,
    };
  }

  return {
    valid: false,
    error: "Invalid phone number length. Please provide a 10-digit mobile number.",
  };
}

/**
 * Express middleware for OTP rate limiting & resend cooldown
 */
export function otpRateLimitMiddleware(req, res, next) {
  const clientIp = getClientIp(req);
  const rawPhone = req.body?.mobileNumber || req.body?.phone;

  // 1. Validate Phone Number
  const phoneValidation = validateAndNormalizePhone(rawPhone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      error: phoneValidation.error,
    });
  }

  req.validatedPhone = phoneValidation;
  const { phone } = phoneValidation;

  // 2. Check Resend Cooldown (60 seconds)
  const cooldownKey = `cooldown:${phone}`;
  const cooldownRecord = otpLimiter.getRecord(cooldownKey);
  const now = Date.now();
  if (cooldownRecord && cooldownRecord.resetTime > now) {
    const remainingSeconds = Math.ceil((cooldownRecord.resetTime - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `Please wait ${remainingSeconds}s before requesting another OTP.`,
      cooldownSeconds: remainingSeconds,
    });
  }

  // 3. Check IP-Level Rate Limit (5 requests per 10 minutes)
  const ipKey = `ip:${clientIp}:otp`;
  const ipCheck = otpLimiter.check(ipKey, 5, 10 * 60 * 1000);
  res.setHeader("X-RateLimit-Limit-IP", 5);
  res.setHeader("X-RateLimit-Remaining-IP", ipCheck.remaining);

  if (!ipCheck.allowed) {
    const retryAfterSec = Math.ceil(ipCheck.resetMs / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    return res.status(429).json({
      success: false,
      error: "Too many OTP requests from this network. Please try again later.",
      retryAfterSeconds: retryAfterSec,
    });
  }

  // 4. Check Phone-Level Rate Limit (3 requests per 10 minutes)
  const phoneKey = `phone:${phone}:otp`;
  const phoneCheck = otpLimiter.check(phoneKey, 3, 10 * 60 * 1000);
  res.setHeader("X-RateLimit-Limit-Phone", 3);
  res.setHeader("X-RateLimit-Remaining-Phone", phoneCheck.remaining);

  if (!phoneCheck.allowed) {
    const retryAfterSec = Math.ceil(phoneCheck.resetMs / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    return res.status(429).json({
      success: false,
      error: "Too many OTP requests for this mobile number. Please try again later.",
      retryAfterSeconds: retryAfterSec,
    });
  }

  // Register 60-second cooldown
  otpLimiter.check(cooldownKey, 1, 60 * 1000);

  next();
}
