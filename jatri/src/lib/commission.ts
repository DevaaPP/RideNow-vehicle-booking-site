/**
 * RideNow Unified Commission Policy Engine
 *
 * Defines the single authoritative platform commission rate (15%) and
 * standardized calculation helper for driver earnings vs. platform commission.
 */

export const DEFAULT_PLATFORM_COMMISSION_RATE = 0.15; // 15% standard commission

export interface CommissionSplit {
  adminCommission: number;
  partnerAmount: number;
}

/**
 * Calculates authoritative commission split between platform revenue and driver earnings.
 * Ensures consistent rounding and non-negative amounts across all payment flows.
 */
export function calculateCommissionSplit(
  fare: number,
  rate: number = DEFAULT_PLATFORM_COMMISSION_RATE
): CommissionSplit {
  const normalizedFare = Math.max(0, Math.round(Number(fare) || 0));
  const adminCommission = Math.round(normalizedFare * rate);
  const partnerAmount = Math.max(0, normalizedFare - adminCommission);

  return {
    adminCommission,
    partnerAmount,
  };
}
