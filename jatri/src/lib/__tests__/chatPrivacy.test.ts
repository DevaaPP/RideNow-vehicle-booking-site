import { describe, it, expect } from "vitest";
import {
  maskChatPii,
  isChatLocked,
  calculateMessageExpiryDate,
  CHAT_RETENTION_DAYS,
  TERMINAL_RIDE_STATUSES,
} from "@/lib/chatPrivacy";

describe("RideNow In-App Chat Privacy Engine", () => {
  describe("PII Redaction (Phone Numbers & Emails)", () => {
    it("redacts standard 10-digit Indian mobile numbers", () => {
      const input = "Call me directly on 9876543210 please";
      const { maskedText, hadPii } = maskChatPii(input);

      expect(hadPii).toBe(true);
      expect(maskedText).toContain("[phone hidden for safety]");
      expect(maskedText).not.toContain("9876543210");
    });

    it("redacts phone numbers with +91 country prefix and hyphens/spaces", () => {
      const input = "My number is +91 98765-43210 or 919876543210";
      const { maskedText, hadPii } = maskChatPii(input);

      expect(hadPii).toBe(true);
      expect(maskedText).not.toContain("98765");
      expect(maskedText).toContain("[phone hidden for safety]");
    });

    it("redacts email addresses", () => {
      const input = "Reach me at passenger.help@gmail.com for details";
      const { maskedText, hadPii } = maskChatPii(input);

      expect(hadPii).toBe(true);
      expect(maskedText).toContain("[email hidden for safety]");
      expect(maskedText).not.toContain("passenger.help@gmail.com");
    });

    it("leaves safe navigation and coordination messages unaltered", () => {
      const input = "I am waiting near the North gate under the green canopy.";
      const { maskedText, hadPii } = maskChatPii(input);

      expect(hadPii).toBe(false);
      expect(maskedText).toBe(input);
    });
  });

  describe("Post-Ride Communication Lockout", () => {
    TERMINAL_RIDE_STATUSES.forEach((status) => {
      it(`locks chat when ride transitions to terminal status '${status}'`, () => {
        expect(isChatLocked(status)).toBe(true);
      });
    });

    it("keeps chat active during in-progress ride states", () => {
      expect(isChatLocked("confirmed")).toBe(false);
      expect(isChatLocked("driver_arriving")).toBe(false);
      expect(isChatLocked("driver_arrived")).toBe(false);
      expect(isChatLocked("started")).toBe(false);
      expect(isChatLocked("ride_in_progress")).toBe(false);
    });
  });

  describe("7-Day Retention Window Expiry", () => {
    it("calculates message expiry timestamp exactly 7 days in the future", () => {
      const now = new Date("2026-10-25T12:00:00Z");
      const expires = calculateMessageExpiryDate(now);

      const diffDays = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(CHAT_RETENTION_DAYS);
      expect(expires.toISOString()).toBe("2026-11-01T12:00:00.000Z");
    });
  });
});
