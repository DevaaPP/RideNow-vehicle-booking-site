export type VehicleType = "scooty" | "bike" | "auto" | "mini" | "car" | "priority" | "loading" | "truck";
export type ServiceMode = "passenger" | "logistics";

export interface VehicleOption {
  id: VehicleType;
  label: string;
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
 * Authoritative vehicle options catalog with distinctive Jatri naming.
 */
export const VEHICLE_OPTIONS: Record<VehicleType, VehicleOption> = {
  scooty: {
    id: "scooty",
    label: "Jatri Scooty",
    categoryTitle: "Jatri Scooty — Quick Light Commute",
    serviceMode: "passenger",
    tagline: "Solo commute · Quick & light",
    description: "Affordable solo scooty ride for quick nearby commutes.",
    passengerCapacity: 1,
    etaText: "2–3 min",
    features: ["Helmet provided", "Easy hop-on", "Economical"],
    recommendedFor: "Solo passengers with light luggage",
  },
  bike: {
    id: "bike",
    label: "Jatri Moto",
    categoryTitle: "Jatri Moto — Solo Ride",
    serviceMode: "passenger",
    tagline: "Quick solo ride · Helmet provided",
    description: "Fast motorcycle commuting for solo riders to bypass traffic.",
    passengerCapacity: 1,
    etaText: "2–3 min",
    features: ["Helmet provided", "Traffic bypass", "Affordable"],
    recommendedFor: "Solo commuters to beat traffic",
  },
  auto: {
    id: "auto",
    label: "Jatri Auto",
    categoryTitle: "Jatri Auto — 3-Wheeler",
    serviceMode: "passenger",
    tagline: "Everyday doorstep auto rides",
    description: "Iconic 3-wheeler ride for daily errands and small groups.",
    passengerCapacity: 3,
    etaText: "3–4 min",
    features: ["Doorstep pickup", "Comfortable 3-seater", "Meter rates"],
    recommendedFor: "2 to 3 passengers traveling short-to-medium distances",
  },
  mini: {
    id: "mini",
    label: "Jatri Mini",
    categoryTitle: "Jatri Mini — Economy Hatchback",
    serviceMode: "passenger",
    tagline: "Economy AC hatchback",
    description: "Pocket-friendly compact 4-wheeler (WagonR, Tiago) with AC.",
    passengerCapacity: 4,
    etaText: "3–5 min",
    features: ["AC comfort", "Compact & fast", "Affordable cab"],
    recommendedFor: "Up to 4 passengers looking for affordable AC rides",
  },
  car: {
    id: "car",
    label: "Jatri Premier",
    categoryTitle: "Jatri Premier — AC Sedan",
    serviceMode: "passenger",
    tagline: "Comfortable AC sedan",
    description: "Spacious executive sedan (Dzire, Amaze) with verified drivers.",
    passengerCapacity: 4,
    etaText: "4–5 min",
    features: ["Chilled AC", "Top verified drivers", "Spacious boot"],
    recommendedFor: "Comfort seekers, families, or airport drops",
  },
  priority: {
    id: "priority",
    label: "Jatri XL Priority",
    categoryTitle: "Jatri XL Priority — Spacious SUV",
    serviceMode: "passenger",
    tagline: "Spacious 6-seater SUV · Priority pickup",
    description: "Extra legroom & 6 passenger capacity (Ertiga, Innova) with priority dispatch.",
    passengerCapacity: 6,
    etaText: "3–5 min",
    features: ["6 seats + bags", "Priority dispatch", "Extra spacious"],
    recommendedFor: "Large families, group trips, and excessive luggage",
  },
  loading: {
    id: "loading",
    label: "Jatri Express Mini",
    categoryTitle: "Jatri Express — Tata Ace & Dost",
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
    label: "Jatri Freight",
    categoryTitle: "Jatri Freight — Commercial Logistics",
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
  VEHICLE_OPTIONS.scooty,
  VEHICLE_OPTIONS.bike,
  VEHICLE_OPTIONS.auto,
  VEHICLE_OPTIONS.mini,
  VEHICLE_OPTIONS.car,
  VEHICLE_OPTIONS.priority,
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
        matchScore: 96,
        reason: "Heavy commercial cargo (>500kg) requires Jatri Freight 14ft payload",
      };
    }
    return {
      vehicleId: "loading",
      matchScore: 94,
      reason: "Optimal for cartons, furniture & merchant stock under 500kg",
    };
  }

  // 1. Large group (5 or 6 passengers)
  if (passengers >= 5) {
    return {
      vehicleId: "priority",
      matchScore: 98,
      reason: `Jatri XL Priority comfortably seats ${passengers} passengers with 3 rows of seating & large bags`,
    };
  }

  // 2. 4 passengers
  if (passengers === 4) {
    if (preference === "comfort" || luggage === "large") {
      return {
        vehicleId: "car",
        matchScore: 96,
        reason: "Jatri Premier executive sedan offers spacious boot and top AC comfort for 4 passengers",
      };
    }
    return {
      vehicleId: "mini",
      matchScore: 94,
      reason: "Jatri Mini offers affordable 4-passenger AC hatchback travel",
    };
  }

  // 3. 2 to 3 passengers
  if (passengers >= 2) {
    if (luggage === "large") {
      if (preference === "comfort") {
        return {
          vehicleId: "car",
          matchScore: 93,
          reason: "Jatri Premier provides a full sedan boot for large bags with chilled AC",
        };
      }
      return {
        vehicleId: "mini",
        matchScore: 91,
        reason: "Jatri Mini hatchback fits bags with comfortable AC at lower fare",
      };
    }

    if (preference === "comfort") {
      return {
        vehicleId: "car",
        matchScore: 92,
        reason: "Jatri Premier executive sedan gives premium comfort & quiet cabin",
      };
    }

    return {
      vehicleId: "auto",
      matchScore: 96,
      reason: `Jatri Auto is the most budget-friendly doorstep ride for ${passengers} passengers`,
    };
  }

  // 4. Solo passenger (passengers === 1)
  if (luggage === "large") {
    return {
      vehicleId: "car",
      matchScore: 92,
      reason: "Large luggage requires Jatri Premier dedicated sedan boot space",
    };
  }

  if (preference === "comfort") {
    return {
      vehicleId: "mini",
      matchScore: 90,
      reason: "Jatri Mini gives you personal AC comfort at our lowest 4-wheeler cab fare",
    };
  }

  if (luggage === "small") {
    return {
      vehicleId: "auto",
      matchScore: 92,
      reason: "Jatri Auto has ample floor space for your bag at an economical fare",
    };
  }

  // Default solo + budget + no luggage:
  return {
    vehicleId: "bike",
    matchScore: 99,
    reason: "Jatri Moto is fastest and most economical for solo commuting to bypass traffic",
  };
}
