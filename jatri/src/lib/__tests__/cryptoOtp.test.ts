import { describe, it, expect } from "vitest";
import { generateSecureOtp, hashOtpCode, verifyOtpCode } from "@/lib/cryptoOtp";

describe("Cryptographic OTP Security and Verification", () => {
  describe("generateSecureOtp", () => {
    it("generates a 4-digit numeric string by default", () => {
      const otp = generateSecureOtp();
      expect(otp).toHaveLength(4);
      expect(/^\d{4}$/.test(otp)).toBe(true);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThan(10000);
    });

    it("generates a 6-digit numeric string when requested", () => {
      const otp = generateSecureOtp(6);
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    });

    it("exhibits non-deterministic entropy across consecutive calls", () => {
      const generated = new Set<string>();
      for (let i = 0; i < 50; i++) {
        generated.add(generateSecureOtp(6));
      }
      // In 50 random 6-digit numbers from CSPRNG, collisions are virtually impossible
      expect(generated.size).toBe(50);
    });
  });

  describe("hashOtpCode and verifyOtpCode", () => {
    it("hashes OTP with bcrypt and successfully verifies identical code", async () => {
      const otp = "8492";
      const hash = await hashOtpCode(otp);

      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
      const isValid = await verifyOtpCode(otp, hash);
      expect(isValid).toBe(true);
    });

    it("rejects invalid candidate OTP against bcrypt hash", async () => {
      const otp = "8492";
      const hash = await hashOtpCode(otp);

      const isValid = await verifyOtpCode("1234", hash);
      expect(isValid).toBe(false);
    });

    it("supports legacy plaintext OTP comparison for backward compatibility", async () => {
      const plaintext = "5555";
      const isValid = await verifyOtpCode("5555", plaintext);
      expect(isValid).toBe(true);

      const isInvalid = await verifyOtpCode("9999", plaintext);
      expect(isInvalid).toBe(false);
    });

    it("returns false for missing, empty, or undefined candidate OTPs", async () => {
      expect(await verifyOtpCode("", "1234")).toBe(false);
      expect(await verifyOtpCode("1234", "")).toBe(false);
      expect(await verifyOtpCode("1234", null)).toBe(false);
      expect(await verifyOtpCode("1234", undefined)).toBe(false);
    });

    it("trims whitespace before hashing and verification", async () => {
      const hash = await hashOtpCode("  7391  ");
      expect(await verifyOtpCode("7391", hash)).toBe(true);
      expect(await verifyOtpCode("  7391  ", hash)).toBe(true);
    });
  });
});
