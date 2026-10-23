import { describe, it, expect } from "vitest";
import {
  evaluateSafetyMatch,
  isDriverVerifiedWoman,
  SafetyMatchingInput,
} from "@/lib/safetyMatching";

describe("Women's Safety Matching Invariants", () => {
  describe("Rule 1: Passenger Requests a Woman Driver", () => {
    it("allows match when driver is an authoritative verified woman", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "woman",
        driverPassengerPolicy: "all_eligible",
        driverIsVerifiedWoman: true,
        passengerEligibleForWomenOnly: false, // Driver accepts all, passenger just wanted woman driver
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(true);
      expect(result.code).toBe("MATCH_ALLOWED");
    });

    it("rejects match when driver is unverified even if category is woman", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "woman",
        driverPassengerPolicy: "all_eligible",
        driverIsVerifiedWoman: false,
        passengerEligibleForWomenOnly: true,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("REQUIRES_VERIFIED_WOMAN_DRIVER");
    });

    it("rejects match when driver is male or other", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "woman",
        driverPassengerPolicy: "all_eligible",
        driverIsVerifiedWoman: false,
        passengerEligibleForWomenOnly: false,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("REQUIRES_VERIFIED_WOMAN_DRIVER");
    });
  });

  describe("Rule 2: Driver Accepts Women Passengers Only", () => {
    it("allows match when passenger is eligible for women-only matching", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "any",
        driverPassengerPolicy: "women_only",
        driverIsVerifiedWoman: true,
        passengerEligibleForWomenOnly: true,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(true);
      expect(result.code).toBe("MATCH_ALLOWED");
    });

    it("rejects match when passenger is not eligible for women-only matching", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "any",
        driverPassengerPolicy: "women_only",
        driverIsVerifiedWoman: true,
        passengerEligibleForWomenOnly: false,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("INELIGIBLE_FOR_WOMEN_ONLY_POLICY");
    });
  });

  describe("Both Preferences Combined (Intersection)", () => {
    it("allows match when passenger requests woman AND driver accepts women only, and all criteria are verified", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "woman",
        driverPassengerPolicy: "women_only",
        driverIsVerifiedWoman: true,
        passengerEligibleForWomenOnly: true,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(true);
    });

    it("rejects match if passenger wants woman driver and driver is verified woman, but driver is women_only and passenger is not eligible", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "woman",
        driverPassengerPolicy: "women_only",
        driverIsVerifiedWoman: true,
        passengerEligibleForWomenOnly: false,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(false);
      expect(result.code).toBe("INELIGIBLE_FOR_WOMEN_ONLY_POLICY");
    });

    it("allows standard open matching when passenger selects any and driver accepts all eligible", () => {
      const input: SafetyMatchingInput = {
        passengerDriverPreference: "any",
        driverPassengerPolicy: "all_eligible",
        driverIsVerifiedWoman: false,
        passengerEligibleForWomenOnly: false,
      };
      const result = evaluateSafetyMatch(input);
      expect(result.allowed).toBe(true);
      expect(result.code).toBe("MATCH_ALLOWED");
    });
  });

  describe("isDriverVerifiedWoman Helper", () => {
    it("returns true only when driverCategory is woman AND status is verified", () => {
      expect(
        isDriverVerifiedWoman({
          safetyMatching: {
            driverCategory: "woman",
            driverVerificationStatus: "verified",
          },
        })
      ).toBe(true);
    });

    it("returns false when status is pending, rejected, or expired", () => {
      expect(
        isDriverVerifiedWoman({
          safetyMatching: {
            driverCategory: "woman",
            driverVerificationStatus: "pending",
          },
        })
      ).toBe(false);

      expect(
        isDriverVerifiedWoman({
          safetyMatching: {
            driverCategory: "woman",
            driverVerificationStatus: "rejected",
          },
        })
      ).toBe(false);

      expect(
        isDriverVerifiedWoman({
          safetyMatching: {
            driverCategory: "woman",
            driverVerificationStatus: "expired",
          },
        })
      ).toBe(false);
    });

    it("returns false when category is other or undisclosed", () => {
      expect(
        isDriverVerifiedWoman({
          safetyMatching: {
            driverCategory: "other",
            driverVerificationStatus: "verified",
          },
        })
      ).toBe(false);

      expect(
        isDriverVerifiedWoman({
          safetyMatching: {
            driverCategory: "undisclosed",
            driverVerificationStatus: "verified",
          },
        })
      ).toBe(false);
    });

    it("returns false for missing or undefined safetyMatching records", () => {
      expect(isDriverVerifiedWoman({})).toBe(false);
      expect(isDriverVerifiedWoman({ safetyMatching: undefined })).toBe(false);
    });
  });
});
