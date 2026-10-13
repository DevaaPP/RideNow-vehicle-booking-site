export type VehicleType = "bike" | "auto" | "car" | "loading" | "truck";
export type ServiceMode = "passenger" | "logistics";

export interface VehicleOption {
  id: VehicleType;
  label: string; // Customer-facing label (e.g., "RideNow Go" instead of generic "Car")
  categoryTitle: string;
  serviceMode: ServiceMode;
  tagline: string;
  description: string;
  passengerCapacity?: number;
  maxWeightKg?: number;
  etaText: string;
  features: string[];
  recommendedFor: string;
}

/**
 * Authoritative vehicle options catalog.
 * Decouples consumer-facing identity from underlying technical vehicle keys:
 * - "car" is presented to riders as "RideNow Go"
 * - Passenger rides ("bike", "auto", "car") are cleanly separated from Goods Transport ("loading", "truck")
 */
export const VEHICLE_OPTIONS: Record<VehicleType, VehicleOption> = {
  bike: {
    id: "bike",
    label: "Bike",
    categoryTitle: "Bike — Solo Travel",
    serviceMode: "passenger",
    tagline: "Solo travel · Budget-friendly",
    description: "Quick, affordable commuting for solo riders to beat traffic.",
    passengerCapacity: 1,
    etaText: "2–3 min",
    features: ["Helmet provided", "Traffic bypass", "Lowest fare"],
    recommendedFor: "Solo passengers with light or no luggage",
  },
  auto: {
    id: "auto",
    label: "Auto",
    categoryTitle: "Auto — Everyday Rides",
    serviceMode: "passenger",
    tagline: "Everyday rides · Affordable",
    description: "Affordable travel for daily errands and small groups.",
    passengerCapacity: 3,
    etaText: "3–4 min",
    features: ["Pocket-friendly", "Seats up to 3", "Open breeze ride"],
    recommendedFor: "2 to 3 passengers traveling short-to-medium distances",
  },
  car: {
    id: "car",
    label: "RideNow Go",
    categoryTitle: "RideNow Go — Standard Car",
    serviceMode: "passenger",
    tagline: "Everyday car rides · More comfort",
    description: "Default 4-wheel ride for daily commuting, families, and luggage.",
    passengerCapacity: 4,
    etaText: "4–5 min",
    features: ["AC comfort", "Spacious boot", "Family & weather protected"],
    recommendedFor: "Comfort seekers, families, or riders with heavy bags",
  },
  loading: {
    id: "loading",
    label: "Loading",
    categoryTitle: "Loading — Goods Transport",
    serviceMode: "logistics",
    tagline: "Boxes, furniture & small moves",
    description: "Dedicated transport for cargo, house moves, and merchant deliveries.",
    maxWeightKg: 500,
    etaText: "8–10 min",
    features: ["Open/covered cargo bed", "Payload up to 500 kg", "Direct pickup & drop"],
    recommendedFor: "Apartment shifting, furniture, electronics & merchant cartons",
  },
  truck: {
    id: "truck",
    label: "Truck",
    categoryTitle: "Truck — Heavy Transport",
    serviceMode: "logistics",
    tagline: "Bulk cargo & business logistics",
    description: "Heavy logistics vehicle for industrial, agricultural, and wholesale cargo.",
    maxWeightKg: 2000,
    etaText: "12–15 min",
    features: ["High payload capacity", "Up to 2,000 kg", "Long-haul capable"],
    recommendedFor: "Heavy machinery, bulk wholesale goods & business consignments",
  },
};

export const PASSENGER_VEHICLES: VehicleOption[] = [
  VEHICLE_OPTIONS.bike,
  VEHICLE_OPTIONS.auto,
  VEHICLE_OPTIONS.car,
];

export const LOGISTICS_VEHICLES: VehicleOption[] = [
  VEHICLE_OPTIONS.loading,
  VEHICLE_OPTIONS.truck,
];

export interface SmartRecommendationCriteria {
  passengers: number; // 1, 2, 3, 4+
  luggage: "none" | "small" | "large";
  preference: "budget" | "comfort";
  isGoods?: boolean;
  cargoWeightKg?: number;
}

export interface RecommendationResult {
  vehicleId: VehicleType;
  matchScore: number;
  reason: string;
}

/**
 * Deterministic Smart Vehicle Matching Engine.
 * Recommends the optimal vehicle option based on passenger count,
 * luggage volume, comfort preferences, or cargo weight.
 */
export function recommendVehicle(criteria: SmartRecommendationCriteria): RecommendationResult {
  const { passengers, luggage, preference, isGoods, cargoWeightKg = 0 } = criteria;

  if (isGoods) {
    if (cargoWeightKg > 500) {
      return {
        vehicleId: "truck",
        matchScore: 95,
        reason: "Heavy cargo (>500kg) requires a heavy transport Truck",
      };
    }
    return {
      vehicleId: "loading",
      matchScore: 92,
      reason: "Optimal for boxes, home shifting, and goods under 500kg",
    };
  }

  // 4 or more passengers: Must be RideNow Go (car)
  if (passengers >= 4) {
    return {
      vehicleId: "car",
      matchScore: 98,
      reason: `RideNow Go comfortably seats ${passengers} passengers with luggage space`,
    };
  }

  // Large or multiple bags: RideNow Go (car) has trunk space
  if (luggage === "large") {
    return {
      vehicleId: "car",
      matchScore: 95,
      reason: "Large luggage requires a dedicated car boot space",
    };
  }

  // 2 to 3 passengers:
  if (passengers >= 2) {
    if (preference === "comfort") {
      return {
        vehicleId: "car",
        matchScore: 90,
        reason: "RideNow Go offers AC comfort and smooth private travel",
      };
    }
    return {
      vehicleId: "auto",
      matchScore: 95,
      reason: `Auto is the most budget-friendly ride for ${passengers} passengers`,
    };
  }

  // Solo passenger (passengers === 1):
  if (preference === "comfort") {
    return {
      vehicleId: "car",
      matchScore: 88,
      reason: "RideNow Go provides top AC comfort for solo travel",
    };
  }

  if (luggage === "small") {
    return {
      vehicleId: "auto",
      matchScore: 90,
      reason: "Auto has ample space for your bag at an affordable fare",
    };
  }

  // Default solo + budget + no luggage:
  return {
    vehicleId: "bike",
    matchScore: 99,
    reason: "Bike is fastest and most economical for solo commuting",
  };
}
