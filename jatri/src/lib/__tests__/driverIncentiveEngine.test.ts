import { describe, it, expect } from "vitest";
import {
  evaluateDriverIncentiveTier,
  getIstWeekBounds,
  INCENTIVE_TIERS,
  MONTHLY_DRIVER_INCENTIVE_CAP,
} from "@/lib/driverIncentiveEngine";

describe("RideNow Driver Weekly Incentives Engine", () => {
  describe("Tier Evaluation & Single-Highest-Tier Policy", () => {
    it("awards 0 bonus when completed rides are below the lowest tier (e.g. 15 rides)", () => {
      const result = evaluateDriverIncentiveTier(15);
      expect(result.tierAchieved).toBe(0);
      expect(result.bonusAmount).toBe(0);
      expect(result.nextTarget).toBe(20);
      expect(result.ridesToNextTarget).toBe(5);
    });

    it("awards Tier 1 (₹75) when exactly 20 rides are completed", () => {
      const result = evaluateDriverIncentiveTier(20);
      expect(result.tierAchieved).toBe(20);
      expect(result.bonusAmount).toBe(75);
      expect(result.nextTarget).toBe(35);
      expect(result.ridesToNextTarget).toBe(15);
    });

    it("awards Tier 2 (₹150) — and strictly NOT sum of both tiers (₹225) — when 40 rides are completed", () => {
      const result = evaluateDriverIncentiveTier(40);
      // User explicit requirement: "For example, a driver completing 40 rides earns ₹150, not ₹225."
      expect(result.tierAchieved).toBe(35);
      expect(result.bonusAmount).toBe(150);
      expect(result.bonusAmount).not.toBe(225);
      expect(result.nextTarget).toBe(50);
      expect(result.ridesToNextTarget).toBe(10);
    });

    it("awards Tier 3 (₹250) when 50 or more rides are completed", () => {
      const result = evaluateDriverIncentiveTier(50);
      expect(result.tierAchieved).toBe(50);
      expect(result.bonusAmount).toBe(250);
      expect(result.nextTarget).toBe(null);
      expect(result.ridesToNextTarget).toBe(0);

      const overachieved = evaluateDriverIncentiveTier(65);
      expect(overachieved.tierAchieved).toBe(50);
      expect(overachieved.bonusAmount).toBe(250);
      expect(overachieved.nextTarget).toBe(null);
    });
  });

  describe("IST Week Bounds & Cycle Calculations", () => {
    it("correctly identifies Monday to Sunday in Asia/Kolkata timezone", () => {
      const now = new Date();
      const bounds = getIstWeekBounds(now);

      expect(bounds.weekKey).toMatch(/^\d{4}-W\d{2}$/);
      expect(bounds.monthKey).toMatch(/^\d{4}-\d{2}$/);
      expect(bounds.startOfWeek.getTime()).toBeLessThan(bounds.endOfWeek.getTime());

      // Total difference between Monday 00:00:00 and Sunday 23:59:59 is ~7 days
      const durationHours = (bounds.endOfWeek.getTime() - bounds.startOfWeek.getTime()) / (1000 * 60 * 60);
      expect(Math.round(durationHours)).toBe(168); // 7 * 24 = 168 hours
    });
  });

  describe("Incentive Tier Parameters", () => {
    it("matches approved launch decision sheet constants", () => {
      expect(INCENTIVE_TIERS).toEqual([
        { targetRides: 20, bonusAmount: 75 },
        { targetRides: 35, bonusAmount: 150 },
        { targetRides: 50, bonusAmount: 250 },
      ]);
      expect(MONTHLY_DRIVER_INCENTIVE_CAP).toBe(1000);
    });
  });
});
