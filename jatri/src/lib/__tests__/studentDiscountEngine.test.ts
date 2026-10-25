import { describe, it, expect } from "vitest";
import {
  getIstMonthKey,
  STUDENT_MONTHLY_DISCOUNT_CAP,
  STUDENT_MAX_MONTHLY_RIDES,
} from "@/lib/studentDiscountEngine";
import { calculateFareBreakdown, DEFAULT_VEHICLE_RATES } from "@/lib/fareEngine";

describe("Student Discount Monthly Cap & Partial Allowance Invariants", () => {
  it("formats monthKey consistently using Asia/Kolkata timezone", () => {
    const key = getIstMonthKey(new Date("2026-10-31T20:00:00Z")); // 20:00 UTC Oct 31 is 01:30 IST Nov 1
    expect(key).toBe("2026-11");

    const key2 = getIstMonthKey(new Date("2026-10-01T00:00:00Z"));
    expect(key2).toBe("2026-10");
  });

  it("applies normal student discount (10% capped at ₹50) when within monthly budget", () => {
    // 10km car ride -> subtotal ~ 75 + 165 = 240
    // 10% discount = 24
    const breakdown = calculateFareBreakdown(
      "car",
      10,
      undefined,
      1.0,
      0,
      true, // isStudent
      undefined,
      {
        remainingMonthlyAllowance: 200,
        remainingMonthlyRides: 10,
      }
    );

    expect(breakdown.isStudentDiscountApplied).toBe(true);
    expect(breakdown.studentDiscount).toBeGreaterThan(0);
    expect(breakdown.studentDiscount).toBeLessThanOrEqual(50);
  });

  it("enforces partial cap: if only ₹10 remains in monthly allowance, caps discount to ₹10", () => {
    // 15km car ride would qualify for ₹30 discount
    const breakdown = calculateFareBreakdown(
      "car",
      15,
      undefined,
      1.0,
      0,
      true,
      undefined,
      {
        remainingMonthlyAllowance: 10, // only ₹10 remains!
        remainingMonthlyRides: 5,
      }
    );

    expect(breakdown.isStudentDiscountApplied).toBe(true);
    expect(breakdown.studentDiscount).toBe(10);
  });

  it("denies student discount when monthly discount allowance is exhausted (₹0)", () => {
    const breakdown = calculateFareBreakdown(
      "car",
      15,
      undefined,
      1.0,
      0,
      true,
      undefined,
      {
        remainingMonthlyAllowance: 0,
        remainingMonthlyRides: 5,
      }
    );

    expect(breakdown.isStudentDiscountApplied).toBe(false);
    expect(breakdown.studentDiscount).toBe(0);
  });

  it("denies student discount when maximum monthly rides (10 rides) are exhausted", () => {
    const breakdown = calculateFareBreakdown(
      "car",
      15,
      undefined,
      1.0,
      0,
      true,
      undefined,
      {
        remainingMonthlyAllowance: 150,
        remainingMonthlyRides: 0, // 0 rides remaining!
      }
    );

    expect(breakdown.isStudentDiscountApplied).toBe(false);
    expect(breakdown.studentDiscount).toBe(0);
  });

  it("does not apply student discount on non-eligible vehicle types (e.g. freight truck)", () => {
    const breakdown = calculateFareBreakdown(
      "truck",
      15,
      undefined,
      1.0,
      0,
      true,
      undefined,
      {
        remainingMonthlyAllowance: 200,
        remainingMonthlyRides: 10,
      }
    );

    expect(breakdown.isStudentDiscountApplied).toBe(false);
    expect(breakdown.studentDiscount).toBe(0);
  });

  it("applies student discount on e-rickshaw when eligible", () => {
    // e-rickshaw: base 20, 8/km. 12km => 20 + 96 = 116 (>= minFare 100)
    const breakdown = calculateFareBreakdown(
      "e-rickshaw",
      12,
      undefined,
      1.0,
      0,
      true,
      undefined,
      {
        remainingMonthlyAllowance: 200,
        remainingMonthlyRides: 10,
      }
    );

    expect(breakdown.isStudentDiscountApplied).toBe(true);
    expect(breakdown.studentDiscount).toBeGreaterThan(0);
  });
});
