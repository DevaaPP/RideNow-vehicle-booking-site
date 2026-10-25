/**
 * RideNow Trip Timing & Arrival Estimation Engine
 *
 * Implements:
 * 1. Location Selection Prompt: When no destination/distance is provided, prompts user to select a destination.
 * 2. Instant Rides: Arrival time = (current time + driver pickup buffer) + estimated journey duration.
 * 3. Scheduled Rides: Arrival time = (scheduled pickup time) + estimated journey duration.
 *    Clearly distinguishes scheduled pickup time from estimated arrival time.
 * 4. Realistic Vehicle Speeds: Dynamic duration based on vehicle type (Toto, Auto, Bike, Car, Truck).
 * 5. Format: Standard 12-hour "Estimated arrival: 10:30 PM" (never promises exact arrival to avoid passenger disappointment).
 */

export const VEHICLE_AVERAGE_SPEEDS_KMH: Record<string, number> = {
  scooty: 28,
  bike: 30,
  auto: 22,
  "e-rickshaw": 15,
  mini: 24,
  car: 25,
  priority: 26,
  intercity: 42,
  loading: 20,
  truck: 20,
};

/**
 * Calculates estimated travel duration in minutes based on distance and vehicle dynamics.
 */
export function calculateTripDurationMinutes(
  vehicleType: string,
  distanceKm: number
): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  const vType = (vehicleType || "car").toLowerCase();

  // Highway speed scaling for longer journeys
  let speed = VEHICLE_AVERAGE_SPEEDS_KMH[vType] || 25;
  if ((vType === "car" || vType === "priority" || vType === "intercity") && distanceKm > 30) {
    speed = 42;
  }

  const rawMinutes = Math.round((distanceKm / speed) * 60);
  return Math.max(3, rawMinutes);
}

/**
 * Extracts average pickup buffer minutes from an etaText string (e.g. "2–3 min" -> 3, "12–15 min" -> 14).
 */
export function parsePickupBufferMinutes(etaText?: string): number {
  if (!etaText) return 3;
  const digits = etaText.match(/\d+/g);
  if (!digits || digits.length === 0) return 3;
  if (digits.length === 1) return parseInt(digits[0], 10);
  const low = parseInt(digits[0], 10);
  const high = parseInt(digits[1], 10);
  return Math.max(1, Math.round((low + high) / 2));
}

/**
 * Formats a Date into standard 12-hour clock: "10:30 PM".
 */
export function formatTime12h(date: Date | number | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${mins} ${ampm}`;
}

export interface EstimatedArrivalDetails {
  hasRoute: boolean;
  distanceKm: number;
  tripMinutes: number;
  pickupTimeText: string;
  arrivalTimeText: string;
  isScheduled: boolean;
  displayLine: string;
  shortPickupText?: string;
}

/**
 * Computes authoritative arrival estimation details.
 */
export function getEstimatedArrivalInfo(params: {
  vehicleType: string;
  distanceKm?: number;
  etaText?: string;
  isScheduled?: boolean;
  scheduledDateTime?: string | Date | null;
  baseDate?: Date;
}): EstimatedArrivalDetails {
  const {
    vehicleType,
    distanceKm = 0,
    etaText,
    isScheduled = false,
    scheduledDateTime,
    baseDate = new Date(),
  } = params;

  if (!distanceKm || distanceKm <= 0) {
    return {
      hasRoute: false,
      distanceKm: 0,
      tripMinutes: 0,
      pickupTimeText: "",
      arrivalTimeText: "",
      isScheduled,
      displayLine: "Select destination for arrival time",
      shortPickupText: etaText || "3 min away",
    };
  }

  const tripMinutes = calculateTripDurationMinutes(vehicleType, distanceKm);

  if (isScheduled && scheduledDateTime) {
    const scheduledDate = new Date(scheduledDateTime);
    if (!isNaN(scheduledDate.getTime())) {
      const arrivalDate = new Date(scheduledDate.getTime() + tripMinutes * 60 * 1000);
      const pickupFormatted = formatTime12h(scheduledDate);
      const arrivalFormatted = formatTime12h(arrivalDate);
      return {
        hasRoute: true,
        distanceKm,
        tripMinutes,
        pickupTimeText: pickupFormatted,
        arrivalTimeText: arrivalFormatted,
        isScheduled: true,
        displayLine: `Pickup: ${pickupFormatted} · Estimated arrival: ${arrivalFormatted}`,
        shortPickupText: `Pickup at ${pickupFormatted}`,
      };
    }
  }

  // Instant booking: now + driver arrival buffer + journey duration
  const pickupBufferMin = parsePickupBufferMinutes(etaText);
  const nowMs = baseDate.getTime();
  const pickupDate = new Date(nowMs + pickupBufferMin * 60 * 1000);
  const arrivalDate = new Date(pickupDate.getTime() + tripMinutes * 60 * 1000);

  const arrivalFormatted = formatTime12h(arrivalDate);

  return {
    hasRoute: true,
    distanceKm,
    tripMinutes,
    pickupTimeText: `${pickupBufferMin} min away`,
    arrivalTimeText: arrivalFormatted,
    isScheduled: false,
    displayLine: `Estimated arrival: ${arrivalFormatted}`,
    shortPickupText: `${pickupBufferMin} min pickup`,
  };
}
