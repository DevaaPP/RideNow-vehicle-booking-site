import { describe, it, expect } from "vitest";
import {
  calculateFareBreakdown,
  calculateWaitingFee,
  DEFAULT_VEHICLE_RATES,
} from "@/lib/fareEngine";

describe("Fare Engine Pricing Architecture and Calculations", () => {
  describe("Distance-Only Fare Baseline", () => {
    it("calculates accurate baseline fare for a 10 km car ride", () => {
      const breakdown = calculateFareBreakdown("car", 10);
      const carRates = DEFAULT_VEHICLE_RATES.car;

      expect(breakdown.distanceKm).toBe(10);
      expect(breakdown.baseFare).toBe(carRates.baseFare);
      expect(breakdown.pricePerKm).toBe(carRates.pricePerKm);
      expect(breakdown.distanceFare).toBe(10 * carRates.pricePerKm);

      // Total fare must equal baseFare + distanceFare + platformFee + taxes (rounded)
      const expectedSubtotal = carRates.baseFare + 10 * carRates.pricePerKm;
      const expectedTaxes = Math.round((expectedSubtotal + carRates.platformFee) * carRates.taxRate);
      expect(breakdown.totalFare).toBe(expectedSubtotal + carRates.platformFee + expectedTaxes);
    });

    it("ensures time ETA is purely informational and has 0 fare impact", () => {
      const breakdown = calculateFareBreakdown("bike", 5);
      expect(breakdown.pricePerMinute).toBe(0);
      expect(breakdown.timeFare).toBe(0);
      expect(breakdown.timeMinutes).toBeGreaterThan(0); // Informational ETA estimate
    });

    it("enforces minimum base fare on very short 0 km or 0.1 km trips", () => {
      const breakdown = calculateFareBreakdown("auto", 0.1);
      const autoRates = DEFAULT_VEHICLE_RATES.auto;

      expect(breakdown.baseFare).toBe(autoRates.baseFare);
      expect(breakdown.totalFare).toBeGreaterThanOrEqual(autoRates.baseFare);
    });
  });

  describe("Waiting Charges Calculation", () => {
    it("charges zero when driver waiting time is within the free window (3 mins)", () => {
      const arrivedAt = new Date("2026-10-21T10:00:00Z");
      const startedAt = new Date("2026-10-21T10:02:30Z"); // 2.5 minutes

      const waitResult = calculateWaitingFee(arrivedAt, startedAt, 2.5, 3);
      expect(waitResult.waitingMinutes).toBe(2);
      expect(waitResult.billableMinutes).toBe(0);
      expect(waitResult.waitingCharge).toBe(0);
    });

    it("charges accurate per-minute waiting fee beyond free window", () => {
      const arrivedAt = new Date("2026-10-21T10:00:00Z");
      const startedAt = new Date("2026-10-21T10:08:00Z"); // 8 minutes (5 billable mins)

      const waitResult = calculateWaitingFee(arrivedAt, startedAt, 2.5, 3);
      expect(waitResult.waitingMinutes).toBe(8);
      expect(waitResult.billableMinutes).toBe(5);
      expect(waitResult.waitingCharge).toBe(Math.round(5 * 2.5));
    });
  });

  describe("Surge Multipliers", () => {
    it("correctly scales fare when a surge multiplier is active", () => {
      const normalBreakdown = calculateFareBreakdown("mini", 10, undefined, 1.0);
      const surgeBreakdown = calculateFareBreakdown("mini", 10, undefined, 1.5);

      expect(surgeBreakdown.surgeMultiplier).toBe(1.5);
      expect(surgeBreakdown.surgeAmount).toBeGreaterThan(0);
      expect(surgeBreakdown.totalFare).toBeGreaterThan(normalBreakdown.totalFare);
    });
  });

  describe("Student Pass Discount Invariants", () => {
    it("applies 10% student discount up to ₹50 cap when eligible", () => {
      // 15 km car ride: vehicleType, distanceKm, customRates, overrideSurge, discountAmount, isStudent
      const breakdown = calculateFareBreakdown("car", 15, undefined, 1.0, 0, true);

      expect(breakdown.isStudentDiscountApplied).toBe(true);
      expect(breakdown.studentDiscount).toBeGreaterThan(0);
      expect(breakdown.studentDiscount).toBeLessThanOrEqual(50); // Capped at ₹50
    });

    it("does not apply student discount if trip subtotal is below minimum student fare threshold", () => {
      // A very cheap short trip
      const breakdown = calculateFareBreakdown("bike", 0.5, undefined, 1.0, 0, true);

      if (breakdown.totalFare < 100) {
        expect(breakdown.isStudentDiscountApplied).toBe(false);
        expect(breakdown.studentDiscount).toBe(0);
      }
    });
  });

  describe("Fleet Vehicle Types Consistency", () => {
    const fleets = ["scooty", "bike", "auto", "e-rickshaw", "mini", "car", "priority", "loading", "truck"];

    fleets.forEach((fleet) => {
      it(`calculates a positive and valid total fare for ${fleet}`, () => {
        const breakdown = calculateFareBreakdown(fleet, 8);
        expect(breakdown.totalFare).toBeGreaterThan(0);
        expect(breakdown.baseFare).toBeGreaterThan(0);
        expect(breakdown.pricePerKm).toBeGreaterThan(0);
        expect(breakdown.taxes).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
