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
