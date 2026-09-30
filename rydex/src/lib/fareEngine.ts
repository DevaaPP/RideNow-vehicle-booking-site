export interface IFareBreakdown {
  vehicleType: string;
  baseFare: number;
  distanceKm: number;
  pricePerKm: number;
  distanceFare: number;
  timeMinutes: number;
  pricePerMinute: number;
  timeFare: number;
  platformFee: number;
  surgeMultiplier: number;
  surgeAmount: number;
  taxes: number;
  discount: number;
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
  bike:    { baseFare: 30,  pricePerKm: 8,   pricePerMinute: 1.5, multiplier: 1.0, minDistance: 0, maxDistance: 15 },
  auto:    { baseFare: 50,  pricePerKm: 12,  pricePerMinute: 2.0, multiplier: 1.2, minDistance: 0, maxDistance: 30 },
  car:     { baseFare: 80,  pricePerKm: 18,  pricePerMinute: 3.0, multiplier: 1.5, minDistance: 0, maxDistance: 100 },
  loading: { baseFare: 120, pricePerKm: 24,  pricePerMinute: 4.0, multiplier: 1.8, minDistance: 0, maxDistance: 150 },
  truck:   { baseFare: 180, pricePerKm: 30,  pricePerMinute: 5.0, multiplier: 2.2, minDistance: 0, maxDistance: 500 },
};

export function calculateFareBreakdown(
  vehicleType: string,
  distanceKm: number,
  customRates?: any,
  overrideSurge?: number,
  discountAmount: number = 0
): IFareBreakdown {
  const vType = (vehicleType || "car").toLowerCase();
  const source = customRates || DEFAULT_VEHICLE_RATES;
  const cfg = source[vType] || DEFAULT_VEHICLE_RATES.car;

  const baseFare = cfg.baseFare;
  const pricePerKm = cfg.pricePerKm;
  const pricePerMinute = cfg.pricePerMinute;

  const distKm = Math.max(0, Number(distanceKm.toFixed(1)));
  const distanceFare = Math.round(distKm * pricePerKm);

  // Time estimate: average 25 km/h urban speed
  const timeMinutes = Math.max(3, Math.round((distKm / 25) * 60));
  const timeFare = Math.round(timeMinutes * pricePerMinute);

  const platformFee = 15; // Standard platform service fee ₹15
  const surgeMultiplier = overrideSurge || cfg.multiplier || 1.0;

  const rawSubtotal = baseFare + distanceFare + timeFare;
  const surgeAmount = Math.round(rawSubtotal * (surgeMultiplier - 1));

  const subtotalWithSurge = rawSubtotal + surgeAmount;
  const taxes = Math.round((subtotalWithSurge + platformFee) * 0.05); // 5% GST

  const totalBeforeDiscount = subtotalWithSurge + platformFee + taxes;
  const totalFare = Math.max(0, Math.round(totalBeforeDiscount - discountAmount));

  return {
    vehicleType: vType,
    baseFare,
    distanceKm: distKm,
    pricePerKm,
    distanceFare,
    timeMinutes,
    pricePerMinute,
    timeFare,
    platformFee,
    surgeMultiplier,
    surgeAmount,
    taxes,
    discount: discountAmount,
    totalFare,
  };
}
