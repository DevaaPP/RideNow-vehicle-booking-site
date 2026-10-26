/**
 * RideNow In-App Chat Privacy & Compliance Engine
 * Enforces participant tenancy verification, PII redaction (phones, emails),
 * post-ride communication lockdown, and asynchronous 7-day retention expiry.
 */

export const CHAT_RETENTION_DAYS = 7;
export const CHAT_RETENTION_MS = CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

export const TERMINAL_RIDE_STATUSES = [
  "completed",
  "cancelled",
  "expired",
  "payment_failed",
  "no_drivers_available",
];

/**
 * Checks whether ride status prohibits new messages.
 * Once a ride is completed, cancelled, or expired, chat is permanently locked.
 */
export function isChatLocked(status?: string): boolean {
  if (!status) return false;
  return TERMINAL_RIDE_STATUSES.includes(status.toLowerCase());
}

export interface MaskPiiResult {
  maskedText: string;
  hadPii: boolean;
}

/**
 * Redacts direct contact information (phone numbers and emails) to prevent off-platform
 * solicitation, bypassing safety tracking, and unsolicited passenger contact.
 */
export function maskChatPii(text: string): MaskPiiResult {
  if (!text || typeof text !== "string") {
    return { maskedText: "", hadPii: false };
  }

  let sanitized = text;
  let hadPii = false;

  // 1. Phone numbers:
  // Catches 10-digit Indian mobiles ([6-9]xxxxxxxxx), optional +91/91/0 prefix,
  // and spaced/hyphenated/dotted evasion patterns (e.g. +91 98765-43210, 987 654 3210).
  const phonePattern =
    /(?:\+91[\s.-]?|\b91[\s.-]?|\b0)?[6-9](?:[\s.-]?\d){9}\b/g;

  sanitized = sanitized.replace(phonePattern, () => {
    hadPii = true;
    return "[phone hidden for safety]";
  });

  // 2. Email addresses
  const emailPattern =
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

  sanitized = sanitized.replace(emailPattern, () => {
    hadPii = true;
    return "[email hidden for safety]";
  });

  return {
    maskedText: sanitized,
    hadPii,
  };
}

/**
 * Calculates authoritative expiration timestamp for a chat message.
 * Documents automatically purge from MongoDB via TTL index after this date.
 */
export function calculateMessageExpiryDate(baseDate: Date = new Date()): Date {
  return new Date(baseDate.getTime() + CHAT_RETENTION_MS);
}
