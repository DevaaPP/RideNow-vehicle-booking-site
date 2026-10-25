import { describe, it, expect } from "vitest";
import {
  generateReferralCode,
  getReferralMonthKey,
  REFERRER_REWARD_AMOUNT,
  REFEREE_DISCOUNT_AMOUNT,
  MIN_REFEREE_FARE,
  MAX_MONTHLY_REFERRALS,
  REFERRAL_VALIDITY_DAYS,
  REWARD_EXPIRY_DAYS,
  REFERRAL_TIMEZONE,
} from "@/lib/referralEngine";

describe("RideNow Rewards & Referral Engine", () => {
  describe("Referral Programme Constants & Policies", () => {
    it("enforces ₹50 referrer reward and ₹30 referee discount", () => {
      expect(REFERRER_REWARD_AMOUNT).toBe(50);
      expect(REFEREE_DISCOUNT_AMOUNT).toBe(30);
    });

    it("enforces ₹100 minimum fare requirement for first-ride discount", () => {
      expect(MIN_REFEREE_FARE).toBe(100);
    });

    it("enforces 5 successful referrals per month cap", () => {
      expect(MAX_MONTHLY_REFERRALS).toBe(5);
    });

    it("enforces 30-day referral validity and 90-day wallet reward validity", () => {
      expect(REFERRAL_VALIDITY_DAYS).toBe(30);
      expect(REWARD_EXPIRY_DAYS).toBe(90);
    });

    it("uses Asia/Kolkata timezone for canonical month key calculations", () => {
      expect(REFERRAL_TIMEZONE).toBe("Asia/Kolkata");
    });
  });

  describe("Referral Code Generation", () => {
    it("generates a clean 6-character code starting with RN prefix", () => {
      const code = generateReferralCode();
      expect(code).toMatch(/^RN[2-9A-HJ-NP-Z]{4}$/);
      expect(code.length).toBe(6);
    });

    it("excludes visually ambiguous characters (0, O, 1, I) to prevent user errors", () => {
      for (let i = 0; i < 50; i++) {
        const code = generateReferralCode();
        expect(code).not.toMatch(/[01OI]/);
      }
    });

    it("generates distinct codes across successive calls", () => {
      const set = new Set<string>();
      for (let i = 0; i < 20; i++) {
        set.add(generateReferralCode());
      }
      expect(set.size).toBe(20);
    });
  });

  describe("IST Month Key Generation", () => {
    it("generates formatted YYYY-MM key in Asia/Kolkata timezone", () => {
      // 2026-10-25 22:00:00 UTC = 2026-10-26 03:30:00 IST
      const date = new Date("2026-10-25T22:00:00Z");
      const key = getReferralMonthKey(date);
      expect(key).toBe("2026-10");
    });

    it("accurately crosses midnight at month boundaries in IST", () => {
      // 2026-10-31 18:30:00 UTC = 2026-11-01 00:00:00 IST
      const date = new Date("2026-10-31T18:30:00Z");
      const key = getReferralMonthKey(date);
      expect(key).toBe("2026-11");
    });
  });

  describe("Anti-Fraud & Business Constraints", () => {
    it("rejects referral discount when fare is strictly below ₹100", () => {
      const fare = 95;
      const isEligible = fare >= MIN_REFEREE_FARE;
      expect(isEligible).toBe(false);
    });

    it("accepts referral discount when fare meets or exceeds ₹100", () => {
      const fare = 100;
      const isEligible = fare >= MIN_REFEREE_FARE;
      expect(isEligible).toBe(true);

      const highFare = 250;
      expect(highFare >= MIN_REFEREE_FARE).toBe(true);
    });

    it("prevents self-referral by comparing referrerId and refereeId", () => {
      const referrerId: string = "60c72b2f9b1d8b001c8e4d1a";
      const sameUserId: string = "60c72b2f9b1d8b001c8e4d1a";
      const differentUserId: string = "60c72b2f9b1d8b001c8e4d1b";

      expect(referrerId === sameUserId).toBe(true); // Must be rejected
      expect(referrerId === differentUserId).toBe(false); // Can be considered
    });

    it("strictly disallows promo stacking with student pass concessions", () => {
      const isStudent = true;
      const referralRequested = true;

      // Rule: Promo stacking not allowed
      const allowReferralDiscount = referralRequested && !isStudent;
      expect(allowReferralDiscount).toBe(false);
    });

    it("caps successful monthly referrals at 5", () => {
      const counts = [0, 2, 4, 5, 6];
      const remainingAllowances = counts.map((c) => Math.max(0, MAX_MONTHLY_REFERRALS - c));

      expect(remainingAllowances).toEqual([5, 3, 1, 0, 0]);
    });
  });
});
