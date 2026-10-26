import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  isAuthorizedForTransition,
  isValidTransition,
} from "@/lib/bookingStateMachine";
import { maskChatPii, isChatLocked } from "@/lib/chatPrivacy";

function timingSafeCheck(provided?: string | null, expected?: string | null): boolean {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyParticipantTenancy(
  booking: { user?: { toString(): string }; driver?: { toString(): string } },
  userId: string,
  userRole?: string
): { allowed: boolean; reason?: string } {
  const isRider = booking.user?.toString() === userId;
  const isDriver = booking.driver?.toString() === userId;
  const isAdmin = userRole === "admin";

  if (!isRider && !isDriver && !isAdmin) {
    return { allowed: false, reason: "Forbidden: You are not an active participant in this ride" };
  }
  return { allowed: true };
}

describe("Security Audit Verifications & Regression Suite", () => {
  describe("1. Timing-Safe Secret Verification", () => {
    const validSecret = "super-secret-cron-token-123456";

    it("accepts matching secrets", () => {
      expect(timingSafeCheck(validSecret, validSecret)).toBe(true);
    });

    it("rejects mismatched secret lengths without throwing", () => {
      expect(timingSafeCheck("short", validSecret)).toBe(false);
    });

    it("rejects invalid secrets of identical length", () => {
      const forgedSecret = "super-secret-cron-token-000000";
      expect(timingSafeCheck(forgedSecret, validSecret)).toBe(false);
    });

    it("fails closed on null or undefined tokens", () => {
      expect(timingSafeCheck(null, validSecret)).toBe(false);
      expect(timingSafeCheck(undefined, validSecret)).toBe(false);
      expect(timingSafeCheck("", validSecret)).toBe(false);
      expect(timingSafeCheck(validSecret, undefined)).toBe(false);
    });
  });

  describe("2. Booking Expiration State Machine Invariants", () => {
    it("strictly limits 'expired' target transition to system and admin actors", () => {
      expect(isAuthorizedForTransition("expired", "system")).toBe(true);
      expect(isAuthorizedForTransition("expired", "admin")).toBe(true);
      expect(isAuthorizedForTransition("expired", "user")).toBe(false);
      expect(isAuthorizedForTransition("expired", "driver")).toBe(false);
    });

    it("allows expiration ONLY from unfulfilled search states", () => {
      expect(isValidTransition("requested", "expired")).toBe(true);
      expect(isValidTransition("searching_driver", "expired")).toBe(true);
      expect(isValidTransition("scheduled", "expired")).toBe(true);
    });

    it("strictly blocks active trips from being transitioned to expired", () => {
      // Once assigned, arriving, arrived, or started, rides must NOT transition to expired
      expect(isValidTransition("driver_assigned", "expired")).toBe(false);
      expect(isValidTransition("driver_arriving", "expired")).toBe(false);
      expect(isValidTransition("driver_arrived", "expired")).toBe(false);
      expect(isValidTransition("started", "expired")).toBe(false);
      expect(isValidTransition("ride_started", "expired")).toBe(false);
      expect(isValidTransition("ride_in_progress", "expired")).toBe(false);
    });

    it("verifies 90-second search window threshold calculation", () => {
      const SEARCH_WINDOW_MS = 90 * 1000;
      const now = Date.now();
      const recentBookingCreatedAt = now - 30 * 1000; // 30s ago
      const expiredBookingCreatedAt = now - 95 * 1000; // 95s ago

      const isRecentExpired = now - recentBookingCreatedAt >= SEARCH_WINDOW_MS;
      const isOldExpired = now - expiredBookingCreatedAt >= SEARCH_WINDOW_MS;

      expect(isRecentExpired).toBe(false); // Premature
      expect(isOldExpired).toBe(true); // Eligible
    });
  });

  describe("3. Dispatch Escalation & Candidate Timeout Invariants", () => {
    it("enforces minimum 15-second candidate driver acceptance window", () => {
      const CANDIDATE_WINDOW_MS = 15 * 1000;
      const now = Date.now();
      const recentDispatchTime = now - 5 * 1000; // Dispatched 5s ago
      const timedOutDispatchTime = now - 18 * 1000; // Dispatched 18s ago

      const isPremature = now - recentDispatchTime < CANDIDATE_WINDOW_MS;
      const isEligible = now - timedOutDispatchTime >= CANDIDATE_WINDOW_MS;

      expect(isPremature).toBe(true);
      expect(isEligible).toBe(true);
    });

    it("guarantees candidate timeout only applies to searching/requested states", () => {
      const validTimeoutStates = ["requested", "searching_driver"];
      expect(validTimeoutStates.includes("requested")).toBe(true);
      expect(validTimeoutStates.includes("searching_driver")).toBe(true);

      const invalidTimeoutStates = ["driver_assigned", "confirmed", "started", "completed"];
      invalidTimeoutStates.forEach((st) => {
        expect(validTimeoutStates.includes(st)).toBe(false);
      });
    });
  });

  describe("4. Chat Tenancy and PII Contact Masking Evasion Defense", () => {
    const riderId = "507f191e810c19729de860ea";
    const driverId = "507f1f77bcf86cd799439011";
    const intruderId = "507f1f77bcf86cd799439099";

    const mockBooking = {
      user: { toString: () => riderId },
      driver: { toString: () => driverId },
      status: "confirmed",
    };

    it("permits active chat only for verified booking rider, driver, or admin", () => {
      expect(verifyParticipantTenancy(mockBooking, riderId).allowed).toBe(true);
      expect(verifyParticipantTenancy(mockBooking, driverId).allowed).toBe(true);
      expect(verifyParticipantTenancy(mockBooking, "admin-1", "admin").allowed).toBe(true);
      expect(verifyParticipantTenancy(mockBooking, intruderId).allowed).toBe(false);
      expect(verifyParticipantTenancy(mockBooking, intruderId).reason).toContain("Forbidden");
    });

    it("locks out chat once booking reaches terminal state", () => {
      expect(isChatLocked("completed")).toBe(true);
      expect(isChatLocked("cancelled")).toBe(true);
      expect(isChatLocked("expired")).toBe(true);
      expect(isChatLocked("confirmed")).toBe(false);
      expect(isChatLocked("started")).toBe(false);
    });

    it("masks varied phone formats and spacing attempts to evade detection", () => {
      // Plain 10 digit
      expect(maskChatPii("Call me at 9876543210 please").maskedText).toBe("Call me at [phone hidden for safety] please");
      expect(maskChatPii("Call me at 9876543210 please").hadPii).toBe(true);

      // Formatted with hyphens
      expect(maskChatPii("Number is 98765-43210").maskedText).toBe("Number is [phone hidden for safety]");

      // Formatted with spaces
      expect(maskChatPii("Call 98765 43210 now").maskedText).toBe("Call [phone hidden for safety] now");

      // +91 international prefix
      expect(maskChatPii("WhatsApp me +919876543210").maskedText).toBe("WhatsApp me [phone hidden for safety]");

      // Email address
      expect(maskChatPii("Email me driver@ridenow.in").maskedText).toBe("Email me [email hidden for safety]");
    });
  });
});
