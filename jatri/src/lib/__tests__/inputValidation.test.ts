import { describe, it, expect } from "vitest";
import {
  validateIfsc,
  validateBankAccount,
  validateUpiId,
  validateMobileNumber,
  sanitizeChatText,
  sanitizeFeedbackText,
} from "@/lib/validation";

describe("Input Validation and Sanitization Invariants", () => {
  describe("validateIfsc", () => {
    it("accepts valid Indian bank IFSC codes", () => {
      expect(validateIfsc("SBIN0001234").isValid).toBe(true);
      expect(validateIfsc("HDFC0000001").isValid).toBe(true);
      expect(validateIfsc("icic0001122").isValid).toBe(true); // lower-case normalized
      expect(validateIfsc("icic0001122").normalized).toBe("ICIC0001122");
      expect(validateIfsc("PUNB0123400").isValid).toBe(true);
    });

    it("rejects invalid or malformed IFSC codes", () => {
      expect(validateIfsc("").isValid).toBe(false);
      expect(validateIfsc("SBIN1234").isValid).toBe(false); // too short
      expect(validateIfsc("SBIN1001234").isValid).toBe(false); // 5th char not '0'
      expect(validateIfsc("12340001234").isValid).toBe(false); // first 4 not letters
      expect(validateIfsc("HDFC00012345").isValid).toBe(false); // too long
      expect(validateIfsc(null).isValid).toBe(false);
    });
  });

  describe("validateBankAccount", () => {
    it("accepts standard 9 to 18 digit account numbers", () => {
      expect(validateBankAccount("123456789").isValid).toBe(true);
      expect(validateBankAccount("123456789012345").isValid).toBe(true);
      expect(validateBankAccount("123456789012345678").isValid).toBe(true);
      expect(validateBankAccount(" 987654321012 ").normalized).toBe("987654321012");
      expect(validateBankAccount(123456789012).isValid).toBe(true);
    });

    it("rejects non-digit or out-of-range account numbers", () => {
      expect(validateBankAccount("12345678").isValid).toBe(false); // 8 digits (too short)
      expect(validateBankAccount("1234567890123456789").isValid).toBe(false); // 19 digits (too long)
      expect(validateBankAccount("12345-6789").isValid).toBe(false);
      expect(validateBankAccount("1234ABCD5678").isValid).toBe(false);
      expect(validateBankAccount("").isValid).toBe(false);
      expect(validateBankAccount(null).isValid).toBe(false);
    });
  });

  describe("validateUpiId", () => {
    it("accepts valid UPI VPA handles", () => {
      expect(validateUpiId("driver@oksbi").isValid).toBe(true);
      expect(validateUpiId("9876543210@paytm").isValid).toBe(true);
      expect(validateUpiId("john.doe@icici").isValid).toBe(true);
      expect(validateUpiId("").isValid).toBe(true); // Optional
    });

    it("rejects malformed UPI handles", () => {
      expect(validateUpiId("driver").isValid).toBe(false);
      expect(validateUpiId("driver@").isValid).toBe(false);
      expect(validateUpiId("@oksbi").isValid).toBe(false);
      expect(validateUpiId("driver@oksbi@icici").isValid).toBe(false);
    });
  });

  describe("validateMobileNumber", () => {
    it("accepts valid 10-digit Indian mobile numbers", () => {
      expect(validateMobileNumber("9876543210").isValid).toBe(true);
      expect(validateMobileNumber("6123456789").isValid).toBe(true);
      expect(validateMobileNumber("+91 9876543210").normalized).toBe("9876543210");
    });

    it("rejects numbers not conforming to Indian telecom rules", () => {
      expect(validateMobileNumber("1234567890").isValid).toBe(false); // Starts with 1
      expect(validateMobileNumber("5234567890").isValid).toBe(false); // Starts with 5
      expect(validateMobileNumber("987654321").isValid).toBe(false); // 9 digits
    });
  });

  describe("sanitizeChatText", () => {
    it("strips HTML tags and script injections", () => {
      const res = sanitizeChatText("<script>alert('xss')</script>Hello driver!");
      expect(res.isValid).toBe(true);
      expect(res.sanitized).toBe("alert('xss')Hello driver!");
      expect(res.sanitized).not.toContain("<script>");
    });

    it("rejects empty or whitespace-only messages", () => {
      expect(sanitizeChatText("").isValid).toBe(false);
      expect(sanitizeChatText("   \n\t  ").isValid).toBe(false);
      expect(sanitizeChatText("<b></b>").isValid).toBe(false);
    });

    it("enforces maximum message length bounds", () => {
      const longText = "a".repeat(501);
      const res = sanitizeChatText(longText, 500);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("500 characters");
    });
  });

  describe("sanitizeFeedbackText", () => {
    it("strips HTML tags and caps feedback length", () => {
      const dirty = "<p>Great trip! <b>Safe driving</b></p>";
      expect(sanitizeFeedbackText(dirty)).toBe("Great trip! Safe driving");
      expect(sanitizeFeedbackText("x".repeat(600), 500).length).toBe(500);
    });
  });
});
