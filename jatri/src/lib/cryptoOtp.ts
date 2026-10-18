import crypto from "crypto";
import bcrypt from "bcryptjs";

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

/**
 * Hashes an OTP string with bcrypt (10 rounds) before persisting to DB.
 */
export async function hashOtpCode(otp: string): Promise<string> {
  return await bcrypt.hash(otp.trim(), 10);
}

/**
 * Verifies a candidate OTP against a stored hash or legacy plaintext string.
 * Supports backward compatibility for active sessions and testing codes.
 */
export async function verifyOtpCode(
  candidateOtp: string,
  storedOtpHashOrPlain?: string | null
): Promise<boolean> {
  if (!storedOtpHashOrPlain || !candidateOtp) return false;

  const candidate = candidateOtp.trim();
  const stored = storedOtpHashOrPlain.trim();

  // If stored value is a bcrypt hash ($2a$, $2b$, or $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(stored)) {
    return await bcrypt.compare(candidate, stored);
  }

  // Fallback for legacy plaintext OTPs or dev/simulation bypass
  return candidate === stored;
}
