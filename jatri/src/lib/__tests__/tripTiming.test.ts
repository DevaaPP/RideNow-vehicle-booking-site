import { describe, it, expect } from "vitest";
import {
  calculateTripDurationMinutes,
  parsePickupBufferMinutes,
  formatTime12h,
  getEstimatedArrivalInfo,
} from "@/lib/tripTiming";

describe("RideNow Trip Timing & Arrival Estimation Engine", () => {
  describe("Duration Calculation by Vehicle Dynamics", () => {
    it("returns 0 minutes when distance is 0 or not selected", () => {
      expect(calculateTripDurationMinutes("car", 0)).toBe(0);
      expect(calculateTripDurationMinutes("bike", -5)).toBe(0);
    });

    it("calculates accurate duration reflecting realistic vehicle speeds", () => {
      const distance = 10; // 10 km
      // E-rickshaw (15 km/h) -> 40 min
      expect(calculateTripDurationMinutes("e-rickshaw", distance)).toBe(40);
      // Auto (22 km/h) -> ~27 min
      expect(calculateTripDurationMinutes("auto", distance)).toBe(27);
      // Bike (30 km/h) -> 20 min
      expect(calculateTripDurationMinutes("bike", distance)).toBe(20);
      // Car (25 km/h urban) -> 24 min
      expect(calculateTripDurationMinutes("car", distance)).toBe(24);
    });

    it("scales car speeds on longer intercity routes (>30 km)", () => {
      const longDistance = 60; // 60 km
      // Intercity speed is 42 km/h -> ~86 min
      expect(calculateTripDurationMinutes("car", longDistance)).toBe(86);
    });

    it("enforces minimum journey floor of 3 minutes for very short trips", () => {
      expect(calculateTripDurationMinutes("bike", 0.2)).toBe(3);
    });
  });

  describe("Pickup Buffer Parsing", () => {
    it("extracts average pickup arrival minutes from etaText ranges", () => {
      expect(parsePickupBufferMinutes("2–3 min")).toBe(3);
      expect(parsePickupBufferMinutes("3–4 min")).toBe(4);
      expect(parsePickupBufferMinutes("4–6 min")).toBe(5);
      expect(parsePickupBufferMinutes("12–15 min")).toBe(14);
    });

    it("handles single digit or missing string gracefully", () => {
      expect(parsePickupBufferMinutes("5 min")).toBe(5);
      expect(parsePickupBufferMinutes(undefined)).toBe(3);
      expect(parsePickupBufferMinutes("")).toBe(3);
    });
  });

  describe("12-Hour Time Formatting", () => {
    it("formats morning times accurately with AM", () => {
      const morning = new Date("2026-10-25T08:05:00");
      morning.setHours(8, 5, 0);
      expect(formatTime12h(morning)).toBe("8:05 AM");
    });

    it("formats evening times accurately with PM", () => {
      const evening = new Date("2026-10-25T22:30:00");
      evening.setHours(22, 30, 0);
      expect(formatTime12h(evening)).toBe("10:30 PM");
    });

    it("formats noon and midnight accurately", () => {
      const noon = new Date();
      noon.setHours(12, 0, 0);
      expect(formatTime12h(noon)).toBe("12:00 PM");

      const midnight = new Date();
      midnight.setHours(0, 15, 0);
      expect(formatTime12h(midnight)).toBe("12:15 AM");
    });
  });

  describe("Arrival Estimation Logic & Requirements", () => {
    it("shows location-selection prompt when locations/distance are not selected", () => {
      const result = getEstimatedArrivalInfo({
        vehicleType: "car",
        distanceKm: 0,
        etaText: "3–4 min",
      });

      expect(result.hasRoute).toBe(false);
      expect(result.arrivalTimeText).toBe("");
      expect(result.displayLine).toBe("Select destination for arrival time");
    });

    it("calculates instant arrival as (now + pickup buffer + journey duration) with 'Estimated arrival:' prefix", () => {
      const fixedBase = new Date();
      fixedBase.setHours(14, 0, 0, 0); // 2:00 PM

      // 10 km in Car (24 min) + 3 min pickup buffer = 27 min -> 2:27 PM
      const result = getEstimatedArrivalInfo({
        vehicleType: "car",
        distanceKm: 10,
        etaText: "2–3 min",
        isScheduled: false,
        baseDate: fixedBase,
      });

      expect(result.hasRoute).toBe(true);
      expect(result.isScheduled).toBe(false);
      expect(result.arrivalTimeText).toBe("2:27 PM");
      expect(result.displayLine).toBe("Estimated arrival: 2:27 PM");
    });

    it("distinguishes scheduled pickup from destination arrival using scheduled pickup time instead of now", () => {
      const scheduledPickup = new Date();
      scheduledPickup.setHours(20, 0, 0, 0); // 8:00 PM

      // 15 km on Bike (30 min) starting at 8:00 PM -> arrival 8:30 PM
      const result = getEstimatedArrivalInfo({
        vehicleType: "bike",
        distanceKm: 15,
        isScheduled: true,
        scheduledDateTime: scheduledPickup.toISOString(),
      });

      expect(result.hasRoute).toBe(true);
      expect(result.isScheduled).toBe(true);
      expect(result.pickupTimeText).toBe("8:00 PM");
      expect(result.arrivalTimeText).toBe("8:30 PM");
      expect(result.displayLine).toBe("Pickup: 8:00 PM · Estimated arrival: 8:30 PM");
    });
  });
});
