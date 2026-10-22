/**
 * Core validation and sanitization helpers for RideNow / Jaatri
 * Compliant with OWASP input validation standards and Indian financial format rules.
 */

// RBI Standard IFSC: 4 uppercase alphabets, 5th character '0', followed by 6 alphanumeric characters
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Indian Bank Account Number: 9 to 18 numeric digits
const BANK_ACCOUNT_REGEX = /^\d{9,18}$/;

// UPI Virtual Payment Address (VPA): e.g. name@okaxis, driver@upi
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

// Indian 10-digit mobile number starting with 6, 7, 8, or 9
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function validateIfsc(ifsc: unknown): { isValid: boolean; normalized: string; error?: string } {
  if (!ifsc || typeof ifsc !== "string") {
    return { isValid: false, normalized: "", error: "IFSC code is required" };
  }
  const clean = ifsc.trim().toUpperCase();
  if (!IFSC_REGEX.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: "Invalid IFSC format. Must be 11 characters with 5th character as 0 (e.g. SBIN0001234)",
    };
  }
  return { isValid: true, normalized: clean };
}

export function validateBankAccount(account: unknown): { isValid: boolean; normalized: string; error?: string } {
  if (account === undefined || account === null || account === "") {
    return { isValid: false, normalized: "", error: "Account number is required" };
  }
  const clean = String(account).trim().replace(/\s+/g, "");
  if (!BANK_ACCOUNT_REGEX.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: "Account number must be between 9 and 18 numeric digits without spaces or special characters",
    };
  }
  return { isValid: true, normalized: clean };
}

export function validateUpiId(upi: unknown): { isValid: boolean; normalized: string; error?: string } {
  if (!upi || typeof upi !== "string" || !upi.trim()) {
    return { isValid: true, normalized: "" }; // Optional
  }
  const clean = upi.trim().toLowerCase();
  if (!UPI_REGEX.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: "Invalid UPI ID format. Must be in handle format (e.g. driver@oksbi)",
    };
  }
  return { isValid: true, normalized: clean };
}

export function validateMobileNumber(mobile: unknown): { isValid: boolean; normalized: string; error?: string } {
  if (!mobile || (typeof mobile !== "string" && typeof mobile !== "number")) {
    return { isValid: true, normalized: "" }; // Optional in partial updates
  }
  const clean = String(mobile).trim().replace(/[\s\-+]/g, "").slice(-10);
  if (!INDIAN_MOBILE_REGEX.test(clean)) {
    return {
      isValid: false,
      normalized: clean,
      error: "Please enter a valid 10-digit Indian mobile number",
    };
  }
  return { isValid: true, normalized: clean };
}

export function sanitizeChatText(text: unknown, maxLength = 500): { isValid: boolean; sanitized: string; error?: string } {
  if (!text || typeof text !== "string") {
    return { isValid: false, sanitized: "", error: "Message text is required" };
  }
  // Strip HTML tags and ASCII control characters (keep standard newlines/tabs)
  const stripped = text
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "")
    .trim();

  if (stripped.length === 0) {
    return { isValid: false, sanitized: "", error: "Message cannot be empty or contain only whitespace" };
  }
  if (stripped.length > maxLength) {
    return {
      isValid: false,
      sanitized: stripped.slice(0, maxLength),
      error: `Message exceeds maximum limit of ${maxLength} characters`,
    };
  }
  return { isValid: true, sanitized: stripped };
}

export function sanitizeFeedbackText(feedback: unknown, maxLength = 500): string {
  if (!feedback || typeof feedback !== "string") return "";
  return feedback
    .replace(/<[^>]*>?/gm, "")
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}
