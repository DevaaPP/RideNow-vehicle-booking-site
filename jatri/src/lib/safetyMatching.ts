/**
 * RideNow Women's Safety Matching Engine
 * Implements authoritative compatibility rules between passenger driver preferences
 * and driver passenger policies.
 *
 * Core Principles:
 * 1. Two independent, server-enforced preferences.
 * 2. Zero silent fallback to male/unverified drivers when a woman driver is requested.
 * 3. Revalidated at both dispatch/candidate-matching and driver booking-acceptance.
 */

export type DriverPreference = "any" | "woman";
export type DriverPassengerPolicy = "all_eligible" | "women_only";
export type DriverCategory = "woman" | "other" | "undisclosed";
export type DriverSafetyVerificationStatus =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

export interface SafetyMatchingInput {
  passengerDriverPreference: DriverPreference;
  driverPassengerPolicy: DriverPassengerPolicy;
  driverIsVerifiedWoman: boolean;
  passengerEligibleForWomenOnly: boolean;
}

export interface SafetyMatchResult {
  allowed: boolean;
  reason?: string;
  code?: "MATCH_ALLOWED" | "REQUIRES_VERIFIED_WOMAN_DRIVER" | "INELIGIBLE_FOR_WOMEN_ONLY_POLICY";
}

/**
 * Pure evaluation function for RideNow safety matching rules.
 * Must evaluate to true before a ride offer is dispatched or accepted.
 */
export function evaluateSafetyMatch(input: SafetyMatchingInput): SafetyMatchResult {
  const {
    passengerDriverPreference,
    driverPassengerPolicy,
    driverIsVerifiedWoman,
    passengerEligibleForWomenOnly,
  } = input;

  // Rule 1: Passenger explicitly requested a verified woman driver
  if (passengerDriverPreference === "woman" && !driverIsVerifiedWoman) {
    return {
      allowed: false,
      reason: "Passenger explicitly requested a verified woman driver. Unverified or non-woman drivers cannot be matched.",
      code: "REQUIRES_VERIFIED_WOMAN_DRIVER",
    };
  }

  // Rule 2: Driver has configured a policy accepting only eligible women passengers
  if (driverPassengerPolicy === "women_only" && !passengerEligibleForWomenOnly) {
    return {
      allowed: false,
      reason: "Driver accepts requests only from eligible women passengers.",
      code: "INELIGIBLE_FOR_WOMEN_ONLY_POLICY",
    };
  }

  return {
    allowed: true,
    code: "MATCH_ALLOWED",
  };
}

/**
 * Helper to determine if a driver model record qualifies as an authoritative verified woman driver.
 */
export function isDriverVerifiedWoman(driver: {
  safetyMatching?: {
    driverCategory?: string;
    driverVerificationStatus?: string;
  };
}): boolean {
  if (!driver || !driver.safetyMatching) return false;
  return (
    driver.safetyMatching.driverCategory === "woman" &&
    driver.safetyMatching.driverVerificationStatus === "verified"
  );
}
