import crypto from "crypto";

/**
 * Generates a cryptographically secure numeric OTP of the specified length.
 * Replaces insecure Math.random() with Node.js crypto.randomInt (CSPRNG).
 */
export function generateSecureOtp(length: number = 4): string {
  if (length === 4) {
    return crypto.randomInt(1000, 10000).toString();
  }
  if (length === 6) {
    return crypto.randomInt(100000, 1000000).toString();
  }
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  return crypto.randomInt(min, max).toString();
}
