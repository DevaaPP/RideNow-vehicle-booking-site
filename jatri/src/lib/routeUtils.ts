export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates distance in kilometers between two lat/lon coordinates.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return haversineMeters(lat1, lon1, lat2, lon2) / 1000;
}

/**
 * Calculates distance in kilometers between two [lon, lat] GeoJSON coordinates.
 */
export function haversineDistance(
  coords1: [number, number],
  coords2: [number, number]
): number {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  return haversineKm(lat1, lon1, lat2, lon2);
}

/**
 * Calculates perpendicular distance in meters from a point P to segment AB.
 */
export function getPerpendicularDistanceToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number {
  const [pLat, pLng] = p;
  const [aLat, aLng] = a;
  const [bLat, bLng] = b;

  const abDist = haversineMeters(aLat, aLng, bLat, bLng);
  if (abDist === 0) return haversineMeters(pLat, pLng, aLat, aLng);

  // Vector projection parameter t
  const dx = bLat - aLat;
  const dy = bLng - aLng;
  const t = Math.max(
    0,
    Math.min(1, ((pLat - aLat) * dx + (pLng - aLng) * dy) / (dx * dx + dy * dy))
  );

  const projLat = aLat + t * dx;
  const projLng = aLng + t * dy;

  return haversineMeters(pLat, pLng, projLat, projLng);
}

/**
 * Computes minimum distance from driver location to route polyline in meters.
 */
export function getMinDistanceToPolyline(
  point: [number, number],
  polyline: [number, number][]
): number {
  if (!point || !polyline || polyline.length === 0) return 0;
  if (polyline.length === 1) return haversineMeters(point[0], point[1], polyline[0][0], polyline[0][1]);

  let minDistance = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const dist = getPerpendicularDistanceToSegment(point, polyline[i], polyline[i + 1]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance === Infinity ? 0 : Math.round(minDistance);
}

/**
 * Calculates peak-hour traffic duration multiplier based on hour of day (0-23).
 * Peak morning (8-10 AM) and evening (5-8 PM) experience 1.3x slowdown.
 * Late night (11 PM - 5 AM) experiences 0.9x faster flow.
 */
export function calculateTrafficMultiplier(hour?: number): number {
  const h = hour !== undefined ? hour : new Date().getHours();
  if ((h >= 8 && h <= 10) || (h >= 17 && h <= 20)) {
    return 1.3; // Peak traffic congestion
  }
  if (h >= 23 || h <= 5) {
    return 0.9; // Smooth night traffic
  }
  return 1.05; // Standard daytime traffic
}

/**
 * Calculates estimated travel duration in minutes considering distance, base speed, and traffic multipliers.
 */
export function calculateTrafficAdjustedDuration(
  distanceKm: number,
  baseSpeedKmph = 30,
  hour?: number
): number {
  if (distanceKm <= 0) return 1;
  const baseMinutes = (distanceKm / baseSpeedKmph) * 60;
  const multiplier = calculateTrafficMultiplier(hour);
  return Math.max(1, Math.round(baseMinutes * multiplier));
}

