export interface IFareBreakdown {
  vehicleType: string;
  baseFare: number;
  distanceKm: number;
  pricePerKm: number;
  distanceFare: number;
  timeMinutes: number; // Informational ETA only, NEVER added to pricing
  pricePerMinute: number; // Deprecated: Always 0
  timeFare: number; // Deprecated: Always 0
  platformFee: number;
  surgeMultiplier: number;
  surgeAmount: number;
  taxes: number;
  discount: number;
  isStudentDiscountApplied?: boolean;
  studentDiscount?: number;
  totalFare: number;
}

export const DEFAULT_VEHICLE_RATES: Record<
  string,
  {
    baseFare: number;
    pricePerKm: number;
    pricePerMinute: number;
    multiplier: number;
    minDistance: number;
    maxDistance: number;
  }
> = {
  bike:    { baseFare: 30,  pricePerKm: 9,   pricePerMinute: 0, multiplier: 1.0, minDistance: 0, maxDistance: 15 },
  auto:    { baseFare: 45,  pricePerKm: 13,  pricePerMinute: 0, multiplier: 1.1, minDistance: 0, maxDistance: 30 },
  car:     { baseFare: 75,  pricePerKm: 18,  pricePerMinute: 0, multiplier: 1.25, minDistance: 0, maxDistance: 100 },
  loading: { baseFare: 110, pricePerKm: 22,  pricePerMinute: 0, multiplier: 1.4, minDistance: 0, maxDistance: 150 },
  truck:   { baseFare: 160, pricePerKm: 28,  pricePerMinute: 0, multiplier: 1.6, minDistance: 0, maxDistance: 500 },
};

/**
 * RideNow Distance-Only Authoritative Pricing Model:
 * Base Fare + Distance Fare (distanceKm * pricePerKm) + Platform Fee + Taxes (5% GST) - Discounts
 *
 * NOTE: Duration / ETA is informational only. Duration-based charges are completely removed.
 */
export function calculateFareBreakdown(
  vehicleType: string,
  distanceKm: number,
  customRates?: any,
  overrideSurge?: number,
  discountAmount: number = 0,
  isStudent: boolean = false
): IFareBreakdown {
  const vType = (vehicleType || "car").toLowerCase();
  const source = customRates || DEFAULT_VEHICLE_RATES;
  const cfg = source[vType] || DEFAULT_VEHICLE_RATES.car;

  const baseFare = cfg.baseFare;
  const pricePerKm = cfg.pricePerKm;

  const distKm = Math.max(0, Number(distanceKm.toFixed(1)));
  const distanceFare = Math.round(distKm * pricePerKm);

  // Time estimate: Informational ETA only, NEVER factored into fare calculation
  const timeMinutes = Math.max(3, Math.round((distKm / 25) * 60));

  const platformFee = 15; // Standard platform service fee ₹15
  const surgeMultiplier = overrideSurge || cfg.multiplier || 1.0;

  // Raw Subtotal = Base Fare + Distance Fare (strictly distance-based)
  const rawSubtotal = baseFare + distanceFare;
  const surgeAmount = Math.round(rawSubtotal * (surgeMultiplier - 1));

  const subtotalWithSurge = rawSubtotal + surgeAmount;
  const taxes = Math.round((subtotalWithSurge + platformFee) * 0.05); // 5% GST

  // 🎓 Student Pass: 10% discount on raw subtotal + surge
  const studentDiscount = isStudent ? Math.round(subtotalWithSurge * 0.10) : 0;
  const effectiveDiscount = discountAmount + studentDiscount;

  const totalBeforeDiscount = subtotalWithSurge + platformFee + taxes;
  const totalFare = Math.max(0, Math.round(totalBeforeDiscount - effectiveDiscount));

  return {
    vehicleType: vType,
    baseFare,
    distanceKm: distKm,
    pricePerKm,
    distanceFare,
    timeMinutes,
    pricePerMinute: 0,
    timeFare: 0,
    platformFee,
    surgeMultiplier,
    surgeAmount,
    taxes,
    discount: effectiveDiscount,
    isStudentDiscountApplied: isStudent && studentDiscount > 0,
    studentDiscount,
    totalFare,
  };
}
