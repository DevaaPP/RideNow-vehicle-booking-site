/**
 * RideNow Pricing Engine (Phase 6 Architecture)
 * Authoritative distance-only upfront pricing, dynamic waiting charge calculations,
 * transparent itemized fare breakdown, and route recalculation.
 */

export interface IFareBreakdown {
  vehicleType: string;
  baseFare: number;
  baseDistanceKm?: number;
  billableDistanceKm?: number;
  distanceKm: number;
  pricePerKm: number;
  distanceFare: number;
  timeMinutes: number; // Informational ETA only, NEVER added to pricing
  pricePerMinute: number; // Always 0 (Distance-only authoritative pricing)
  timeFare: number; // Always 0
  waitingMinutes: number;
  waitingCharge: number;
  platformFee: number;
  surgeMultiplier: number;
  surgeAmount: number;
  taxes: number;
  taxRate: number;
  discount: number;
  promoDiscount?: number;
  isStudentDiscountApplied?: boolean;
  studentDiscount?: number;
  totalFare: number;
  cancellationFee: number;
}

export interface VehicleRateConfig {
  baseFare: number;
  baseDistanceKm?: number;
  pricePerKm: number;
  pricePerMinute: number;
  waitingChargePerMinute: number;
  freeWaitingMinutes: number;
  platformFee: number;
  taxRate: number;
  cancellationFee: number;
  multiplier: number;
  minDistance: number;
  maxDistance: number;
}

/**
 * Authoritative default fleet rates calibrated against real-world
 * Uber & Rapido empirical market data (Guwahati & Tier-2 India metro benchmarks).
 * Base fare includes initial baseDistanceKm (e.g. 1.5 - 2.0 km) to eliminate double-billing.
 */
export const DEFAULT_VEHICLE_RATES: Record<string, VehicleRateConfig> = {
  scooty: {
    baseFare: 18,
    baseDistanceKm: 1.5,
    pricePerKm: 6.0,
    pricePerMinute: 0,
    waitingChargePerMinute: 1.0,
    freeWaitingMinutes: 3,
    platformFee: 3,
    taxRate: 0.05,
    cancellationFee: 15,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 15,
  },
  bike: {
    baseFare: 20,
    baseDistanceKm: 1.5,
    pricePerKm: 7.0,
    pricePerMinute: 0,
    waitingChargePerMinute: 1.0,
    freeWaitingMinutes: 3,
    platformFee: 5,
    taxRate: 0.05,
    cancellationFee: 20,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 25,
  },
  auto: {
    baseFare: 30,
    baseDistanceKm: 1.5,
    pricePerKm: 10.5,
    pricePerMinute: 0,
    waitingChargePerMinute: 1.5,
    freeWaitingMinutes: 3,
    platformFee: 5,
    taxRate: 0.05,
    cancellationFee: 25,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 40,
  },
  mini: {
    baseFare: 50,
    baseDistanceKm: 2.0,
    pricePerKm: 12.5,
    pricePerMinute: 0,
    waitingChargePerMinute: 2.0,
    freeWaitingMinutes: 4,
    platformFee: 10,
    taxRate: 0.05,
    cancellationFee: 35,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 100,
  },
  car: {
    baseFare: 65,
    baseDistanceKm: 2.0,
    pricePerKm: 15.0,
    pricePerMinute: 0,
    waitingChargePerMinute: 2.5,
    freeWaitingMinutes: 4,
    platformFee: 12,
    taxRate: 0.05,
    cancellationFee: 45,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 150,
  },
  priority: {
    baseFare: 95,
    baseDistanceKm: 2.0,
    pricePerKm: 19.0,
    pricePerMinute: 0,
    waitingChargePerMinute: 3.0,
    freeWaitingMinutes: 5,
    platformFee: 15,
    taxRate: 0.05,
    cancellationFee: 60,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 200,
  },
  loading: {
    baseFare: 100,
    baseDistanceKm: 2.0,
    pricePerKm: 16.0,
    pricePerMinute: 0,
    waitingChargePerMinute: 3.0,
    freeWaitingMinutes: 10,
    platformFee: 15,
    taxRate: 0.05,
    cancellationFee: 50,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 250,
  },
  truck: {
    baseFare: 180,
    baseDistanceKm: 3.0,
    pricePerKm: 24.0,
    pricePerMinute: 0,
    waitingChargePerMinute: 4.0,
    freeWaitingMinutes: 15,
    platformFee: 25,
    taxRate: 0.05,
    cancellationFee: 80,
    multiplier: 1.0,
    minDistance: 0,
    maxDistance: 500,
  },
  intercity: {
    baseFare: 250,
    baseDistanceKm: 20.0,
    pricePerKm: 13.5,
    pricePerMinute: 0,
    waitingChargePerMinute: 2.5,
    freeWaitingMinutes: 15,
    platformFee: 25,
    taxRate: 0.05,
    cancellationFee: 100,
    multiplier: 1.0,
    minDistance: 20,
    maxDistance: 500,
  },
};

/**
 * Calculates waiting fee incurred when driver waits for passenger at pickup location.
 */
export function calculateWaitingFee(
  arrivedAt?: Date | string | null,
  startedAt?: Date | string | null,
  ratePerMinute: number = 2.5,
  freeMinutes: number = 3
): { waitingMinutes: number; billableMinutes: number; waitingCharge: number } {
  if (!arrivedAt || !startedAt) {
    return { waitingMinutes: 0, billableMinutes: 0, waitingCharge: 0 };
  }

  const arrivalMs = new Date(arrivedAt).getTime();
  const startMs = new Date(startedAt).getTime();

  if (isNaN(arrivalMs) || isNaN(startMs) || startMs <= arrivalMs) {
    return { waitingMinutes: 0, billableMinutes: 0, waitingCharge: 0 };
  }

  const totalWaitMinutes = Math.floor((startMs - arrivalMs) / (60 * 1000));
  const billableMinutes = Math.max(0, totalWaitMinutes - freeMinutes);
  const waitingCharge = Math.round(billableMinutes * ratePerMinute);

  return {
    waitingMinutes: totalWaitMinutes,
    billableMinutes,
    waitingCharge,
  };
}

export interface StudentProgramEconomics {
  discountPercentage?: number;
  maxDiscountCap?: number;
  minFare?: number;
  eligibleVehicleTypes?: string[];
  allowStackingWithPromo?: boolean;
}

export const DEFAULT_STUDENT_CONFIG: Required<StudentProgramEconomics> = {
  discountPercentage: 10,
  maxDiscountCap: 50,
  minFare: 100,
  eligibleVehicleTypes: ["bike", "auto", "car"],
  allowStackingWithPromo: false,
};

/**
 * Calculates authoritative upfront or final fare breakdown.
 */
export function calculateFareBreakdown(
  vehicleType: string,
  distanceKm: number,
  customRates?: any,
  overrideSurge?: number,
  discountAmount: number = 0,
  isStudent: boolean = false,
  waitingDetails?: { arrivedAt?: Date | string | null; startedAt?: Date | string | null },
  studentSettings?: StudentProgramEconomics
): IFareBreakdown {
  const vType = (vehicleType || "car").toLowerCase();
  const defaultRate = DEFAULT_VEHICLE_RATES[vType] || DEFAULT_VEHICLE_RATES.car;
  const customRate = customRates?.[vType];
  const cfg: VehicleRateConfig = {
    ...defaultRate,
    ...(customRate || {}),
  };

  const baseFare = cfg.baseFare;
  const baseDistanceKm = cfg.baseDistanceKm !== undefined ? cfg.baseDistanceKm : 0;
  const pricePerKm = cfg.pricePerKm;
  const platformFee = cfg.platformFee !== undefined ? cfg.platformFee : 15;
  const taxRate = cfg.taxRate !== undefined ? cfg.taxRate : 0.05;
  const cancellationFee = cfg.cancellationFee !== undefined ? cfg.cancellationFee : 50;

  const distKm = Math.max(0, Number(distanceKm.toFixed(1)));
  // Authoritative distance pricing: distance beyond baseDistanceKm is billable (prevents double-billing)
  const billableDistanceKm = Math.max(0, Number((distKm - baseDistanceKm).toFixed(2)));
  const distanceFare = Math.round(billableDistanceKm * pricePerKm);

  // Time estimate: Informational ETA only, NEVER factored into fare calculation
  const timeMinutes = Math.max(3, Math.round((distKm / 25) * 60));

  // Waiting charge calculation
  let waitingMinutes = 0;
  let waitingCharge = 0;
  if (waitingDetails?.arrivedAt && waitingDetails?.startedAt) {
    const waitResult = calculateWaitingFee(
      waitingDetails.arrivedAt,
      waitingDetails.startedAt,
      cfg.waitingChargePerMinute || 2.5,
      cfg.freeWaitingMinutes || 3
    );
    waitingMinutes = waitResult.waitingMinutes;
    waitingCharge = waitResult.waitingCharge;
  }

  const surgeMultiplier = overrideSurge || cfg.multiplier || 1.0;

  // Raw Subtotal = Base Fare + Distance Fare (strictly distance-based)
  const rawSubtotal = baseFare + distanceFare;
  const surgeAmount = Math.round(rawSubtotal * (surgeMultiplier - 1));

  const subtotalWithSurge = rawSubtotal + surgeAmount + waitingCharge;
  const taxes = Math.round((subtotalWithSurge + platformFee) * taxRate); // 5% GST

  // Student Program Economics (10% capped at ₹50, min fare ₹100, regular rides only)
  const stuCfg = { ...DEFAULT_STUDENT_CONFIG, ...studentSettings };
  const isVehicleEligible = stuCfg.eligibleVehicleTypes.map((t) => t.toLowerCase()).includes(vType);

  let calculatedStudentDiscount = 0;
  if (isStudent && isVehicleEligible && subtotalWithSurge >= stuCfg.minFare) {
    const rawDiscount = Math.round(subtotalWithSurge * (stuCfg.discountPercentage / 100));
    calculatedStudentDiscount = Math.min(rawDiscount, stuCfg.maxDiscountCap);
  }

  // Anti-Stacking Architecture: Student discount OR Promo discount (never stacked additively)
  let effectiveDiscount = 0;
  let promoDiscountApplied = 0;
  let studentDiscountApplied = 0;

  if (stuCfg.allowStackingWithPromo) {
    effectiveDiscount = discountAmount + calculatedStudentDiscount;
    promoDiscountApplied = discountAmount;
    studentDiscountApplied = calculatedStudentDiscount;
  } else {
    if (discountAmount > 0) {
      if (discountAmount >= calculatedStudentDiscount) {
        effectiveDiscount = discountAmount;
        promoDiscountApplied = discountAmount;
        studentDiscountApplied = 0;
      } else {
        effectiveDiscount = calculatedStudentDiscount;
        promoDiscountApplied = 0;
        studentDiscountApplied = calculatedStudentDiscount;
      }
    } else {
      effectiveDiscount = calculatedStudentDiscount;
      studentDiscountApplied = calculatedStudentDiscount;
      promoDiscountApplied = 0;
    }
  }

  const totalBeforeDiscount = subtotalWithSurge + platformFee + taxes;
  const totalFare = Math.max(0, Math.round(totalBeforeDiscount - effectiveDiscount));

  return {
    vehicleType: vType,
    baseFare,
    baseDistanceKm,
    billableDistanceKm,
    distanceKm: distKm,
    pricePerKm,
    distanceFare,
    timeMinutes,
    pricePerMinute: 0,
    timeFare: 0,
    waitingMinutes,
    waitingCharge,
    platformFee,
    surgeMultiplier,
    surgeAmount,
    taxes,
    taxRate,
    discount: effectiveDiscount,
    promoDiscount: promoDiscountApplied,
    isStudentDiscountApplied: studentDiscountApplied > 0,
    studentDiscount: studentDiscountApplied,
    totalFare,
    cancellationFee,
  };
}

/**
 * Recalculates final ride fare when route changes, stops are added, or waiting time is incurred.
 */
export function recalculateTripFare(
  initialBreakdown: IFareBreakdown,
  actualDistanceKm: number,
  waitingDetails?: { arrivedAt?: Date | string | null; startedAt?: Date | string | null }
): IFareBreakdown {
  return calculateFareBreakdown(
    initialBreakdown.vehicleType,
    actualDistanceKm,
    undefined,
    initialBreakdown.surgeMultiplier,
    initialBreakdown.promoDiscount || 0,
    Boolean(initialBreakdown.isStudentDiscountApplied),
    waitingDetails
  );
}
