import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  isAuthorizedForTransition,
  ALLOWED_TRANSITIONS,
  ROLE_TRANSITION_PERMISSIONS,
} from "@/lib/bookingStateMachine";
import { BookingStatus } from "@/models/booking.model";

describe("Booking State Machine Behavioral Invariants", () => {
  describe("Valid Lifecycle Forward Transitions", () => {
    it("allows standard scheduled ride lifecycle forward transitions", () => {
      expect(isValidTransition("scheduled", "requested")).toBe(true);
      expect(isValidTransition("requested", "driver_assigned")).toBe(true);
      expect(isValidTransition("driver_assigned", "driver_arriving")).toBe(true);
      expect(isValidTransition("driver_arriving", "driver_arrived")).toBe(true);
      expect(isValidTransition("driver_arrived", "started")).toBe(true);
      expect(isValidTransition("started", "completed")).toBe(true);
    });

    it("allows standard on-demand instant ride lifecycle", () => {
      expect(isValidTransition("requested", "searching_driver")).toBe(true);
      expect(isValidTransition("searching_driver", "driver_assigned")).toBe(true);
      expect(isValidTransition("requested", "driver_assigned")).toBe(true);
    });

    it("allows transitions to awaiting_payment when prepayment is required", () => {
      expect(isValidTransition("requested", "awaiting_payment")).toBe(true);
      expect(isValidTransition("awaiting_payment", "confirmed")).toBe(true);
    });
  });

  describe("Terminal State Protections", () => {
    const terminalStates: BookingStatus[] = [
      "completed",
      "cancelled",
      "expired",
      "no_drivers_available",
      "payment_failed",
      "disputed",
    ];

    terminalStates.forEach((state) => {
      it(`enforces ${state} as an immutable terminal state with 0 outbound transitions`, () => {
        const outbound = ALLOWED_TRANSITIONS[state] || [];
        expect(outbound).toHaveLength(0);
        // It cannot transition to any active state
        expect(isValidTransition(state, "requested")).toBe(false);
        expect(isValidTransition(state, "started")).toBe(false);
        expect(isValidTransition(state, "driver_assigned")).toBe(false);
      });
    });

    it("prevents completed rides from being cancelled", () => {
      expect(isValidTransition("completed", "cancelled")).toBe(false);
    });

    it("prevents cancelled rides from being started or completed", () => {
      expect(isValidTransition("cancelled", "started")).toBe(false);
      expect(isValidTransition("cancelled", "completed")).toBe(false);
    });
  });

  describe("Idempotency State Self-Transitions", () => {
    it("treats same-state transition as valid idempotent replay", () => {
      const allKnownStatuses: BookingStatus[] = [
        "scheduled",
        "requested",
        "searching_driver",
        "driver_assigned",
        "awaiting_payment",
        "confirmed",
        "driver_arriving",
        "driver_arrived",
        "started",
        "completed",
        "cancelled",
        "expired",
      ];

      allKnownStatuses.forEach((st) => {
        expect(isValidTransition(st, st)).toBe(true);
      });
    });
  });

  describe("Role-Based Transition Authorization", () => {
    it("allows driver to mark ride as started and completed", () => {
      expect(isAuthorizedForTransition("started", "driver")).toBe(true);
      expect(isAuthorizedForTransition("completed", "driver")).toBe(true);
      expect(isAuthorizedForTransition("driver_arrived", "driver")).toBe(true);
    });

    it("does not allow passenger (user) to mark ride as started or completed", () => {
      expect(isAuthorizedForTransition("started", "user")).toBe(false);
      expect(isAuthorizedForTransition("completed", "user")).toBe(false);
      expect(isAuthorizedForTransition("driver_arrived", "user")).toBe(false);
    });

    it("allows system and admin to expire or fail a booking", () => {
      expect(isAuthorizedForTransition("expired", "system")).toBe(true);
      expect(isAuthorizedForTransition("expired", "admin")).toBe(true);
      expect(isAuthorizedForTransition("expired", "user")).toBe(false);
      expect(isAuthorizedForTransition("expired", "driver")).toBe(false);
    });

    it("allows user to cancel", () => {
      expect(isAuthorizedForTransition("cancelled", "user")).toBe(true);
      expect(isAuthorizedForTransition("cancelled", "driver")).toBe(true);
      expect(isAuthorizedForTransition("cancelled", "admin")).toBe(true);
    });
  });

  describe("Disallowed Out-Of-Order Transitions", () => {
    it("disallows skipping directly from requested to completed", () => {
      expect(isValidTransition("requested", "completed")).toBe(false);
    });

    it("disallows skipping directly from scheduled to completed", () => {
      expect(isValidTransition("scheduled", "completed")).toBe(false);
    });

    it("disallows reversing from started back to requested", () => {
      expect(isValidTransition("started", "requested")).toBe(false);
    });
  });
});
