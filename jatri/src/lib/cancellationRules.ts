/**
 * RideNow Centralized Cancellation Rules & Fee Calculation
 * Authoritative source of truth for both customer and driver cancellation policies.
 */

export const CUSTOMER_CANCELLATION_REASONS = [
  "Driver is taking too long to arrive",
  "Driver asked to cancel / refuse ride",
  "Driver going in the wrong direction",
  "Changed my mind / No longer need ride",
  "Entered incorrect pickup or drop location",
  "Booked by mistake",
  "Other reason",
] as const;

export const DRIVER_CANCELLATION_REASONS = [
  "Vehicle breakdown / Mechanical issue",
  "Heavy traffic / Impassable route",
  "Rider requested cancellation",
  "Rider did not answer phone / Unavailable",
  "Personal or medical emergency",
  "Other operational reason",
] as const;

export interface CancellationPenaltyEstimate {
  isFreeWindow: boolean;
  minutesElapsed: number;
  penaltyFee: number;
  policyExplanation: string;
  driverDistanceToPickupKm?: number;
}

/**
 * Calculates cancellation fee based on acceptance time and driver proximity.
 * - Under 3 minutes from driver acceptance: FREE cancellation.
 * - After 3 minutes: Tiered fee based on elapsed time and driver approach distance.
 */
export function calculateCancellationPenalty(
  acceptedAt?: string | Date | null,
  fare: number = 0,
  driverDistanceToPickupKm?: number
): CancellationPenaltyEstimate {
  if (!acceptedAt) {
    return {
      isFreeWindow: true,
      minutesElapsed: 0,
      penaltyFee: 0,
      policyExplanation: "Free cancellation: Ride has not yet been accepted by a driver.",
    };
  }

  const acceptTime = new Date(acceptedAt).getTime();
  if (isNaN(acceptTime)) {
    return {
      isFreeWindow: true,
      minutesElapsed: 0,
      penaltyFee: 0,
      policyExplanation: "Free cancellation within grace window.",
    };
  }

  const minutesElapsed = Math.max(0, Math.floor((Date.now() - acceptTime) / (60 * 1000)));

  // Free cancellation window: 3 minutes from driver acceptance
  if (minutesElapsed <= 3) {
    return {
      isFreeWindow: true,
      minutesElapsed,
      penaltyFee: 0,
      policyExplanation: `Free cancellation: Within the 3-minute grace period (${3 - minutesElapsed} min remaining).`,
      driverDistanceToPickupKm,
    };
  }

  // Tiered calculation: base penalty ₹30 or 25% of fare (capped at ₹75 max)
  let penalty = 30;
  if (fare > 0) {
    penalty = Math.min(75, Math.max(30, Math.round(fare * 0.20)));
  }

  // If driver has already travelled very close (under 500m / 0.5km), apply strict compensation tier
  if (typeof driverDistanceToPickupKm === "number" && driverDistanceToPickupKm < 0.5) {
    penalty = Math.min(100, penalty + 20);
  }

  return {
    isFreeWindow: false,
    minutesElapsed,
    penaltyFee: penalty,
    policyExplanation: `A cancellation fee of ₹${penalty} applies because ${minutesElapsed} minutes have passed and the driver has already been dispatched.`,
    driverDistanceToPickupKm,
  };
}
