/**
 * RideNow Service Area & Recent Locations Manager
 * Enforces operational bounds, location accuracy, and recent destinations persistence.
 */

export interface ServiceAreaResult {
  isSupported: boolean;
  regionName: string;
  message?: string;
}

export interface RecentLocation {
  id: string;
  name: string;
  subtitle?: string;
  lat: number;
  lng: number;
  visitedAt: string;
}

/**
 * Validates if coordinates fall within RideNow supported operational service areas.
 * Operational bounds cover India (Lat: 6.0 to 37.5, Lng: 68.0 to 97.5).
 */
export function validateServiceArea(lat: number, lng: number): ServiceAreaResult {
  if (isNaN(lat) || isNaN(lng)) {
    return {
      isSupported: false,
      regionName: "Unknown",
      message: "Invalid coordinates provided.",
    };
  }

  // India Bounding Box
  const isIndia = lat >= 6.0 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5;

  if (!isIndia) {
    return {
      isSupported: false,
      regionName: "International",
      message: "RideNow currently operates within India only.",
    };
  }

  // Specific Hub Identification (e.g. Guwahati / Assam / Northeast, Delhi NCR, Mumbai, Bengaluru, etc.)
  if (lat >= 25.5 && lat <= 27.5 && lng >= 91.0 && lng <= 93.0) {
    return { isSupported: true, regionName: "Guwahati & Kamrup Metro" };
  }
  if (lat >= 28.3 && lat <= 28.9 && lng >= 76.8 && lng <= 77.5) {
    return { isSupported: true, regionName: "Delhi NCR" };
  }
  if (lat >= 18.8 && lat <= 19.3 && lng >= 72.7 && lng <= 73.1) {
    return { isSupported: true, regionName: "Mumbai Metropolitan" };
  }
  if (lat >= 12.8 && lat <= 13.2 && lng >= 77.4 && lng <= 77.8) {
    return { isSupported: true, regionName: "Bengaluru Metro" };
  }

  return {
    isSupported: true,
    regionName: "India Operational Zone",
  };
}

/**
 * Retrieves recent user destinations stored in localStorage.
 */
export function getRecentDestinations(): RecentLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ridenow_recent_destinations");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch (err) {
    console.warn("Failed to load recent destinations:", err);
    return [];
  }
}

/**
 * Saves a newly selected place to recent destinations in localStorage.
 */
export function saveRecentDestination(place: {
  name: string;
  subtitle?: string;
  lat: number;
  lng: number;
}): void {
  if (typeof window === "undefined") return;
  if (!place.name || typeof place.lat !== "number" || typeof place.lng !== "number") return;

  try {
    const list = getRecentDestinations();
    // Deduplicate by name or close coordinates
    const filtered = list.filter(
      (item) =>
        item.name.toLowerCase() !== place.name.toLowerCase() &&
        Math.hypot(item.lat - place.lat, item.lng - place.lng) > 0.001
    );

    const newItem: RecentLocation = {
      id: `recent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: place.name,
      subtitle: place.subtitle || "Recent destination",
      lat: place.lat,
      lng: place.lng,
      visitedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...filtered].slice(0, 5);
    localStorage.setItem("ridenow_recent_destinations", JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to save recent destination:", err);
  }
}
