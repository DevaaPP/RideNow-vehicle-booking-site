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
    label: "RideNow Moto",
    categoryTitle: "RideNow Moto",
    serviceMode: "passenger",
    tagline: "Quick solo commute · Helmet provided",
    description: "Quick commuting for solo riders to bypass traffic.",
    passengerCapacity: 1,
    etaText: "2–3 min",
    features: ["Helmet provided", "Traffic bypass", "Affordable"],
    recommendedFor: "Solo passengers with light or no luggage",
  },
  auto: {
    id: "auto",
    label: "RideNow Auto",
    categoryTitle: "RideNow Auto",
    serviceMode: "passenger",
    tagline: "Everyday doorstep auto rides",
    description: "Affordable travel for daily errands, station trips, and small groups.",
    passengerCapacity: 3,
    etaText: "3–4 min",
    features: ["Doorstep pickup", "Comfortable 3-seater", "Meter rates"],
    recommendedFor: "2 to 3 passengers traveling short-to-medium distances",
  },
  car: {
    id: "car",
    label: "RideNow Premier",
    categoryTitle: "RideNow Premier",
    serviceMode: "passenger",
    tagline: "Comfortable AC sedan",
    description: "4-wheel ride for daily commuting, families, airport drops, and luggage.",
    passengerCapacity: 4,
    etaText: "4–5 min",
    features: ["AC comfort", "Verified Drivers", "Spacious boot"],
    recommendedFor: "Comfort seekers, families, or riders with heavy bags",
  },
  loading: {
    id: "loading",
    label: "RideNow Express Mini",
    categoryTitle: "RideNow Express — Tata Ace & Dost",
    serviceMode: "logistics",
    tagline: "House shifting, furniture & merchant stock",
    description: "Dedicated transport for cargo, house moves, and merchant deliveries.",
    maxWeightKg: 500,
    etaText: "8–10 min",
    features: ["Payload up to 500 kg", "Tata Ace / Dost verified", "Live GPS cargo tracking"],
    recommendedFor: "Apartment shifting, furniture, electronics & merchant cartons",
  },
  truck: {
    id: "truck",
    label: "RideNow Freight",
    categoryTitle: "RideNow Freight — Commercial Logistics",
    serviceMode: "logistics",
    tagline: "Heavy cargo, wholesale stock & industrial freight",
    description: "Heavy logistics vehicle for industrial, agricultural, and wholesale cargo.",
    maxWeightKg: 2000,
    etaText: "12–15 min",
    features: ["Commercial 14ft payload", "Up to 2,000 kg capacity", "E-way bill & GST compliant"],
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
