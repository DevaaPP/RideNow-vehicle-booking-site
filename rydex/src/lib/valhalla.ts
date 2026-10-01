/**
 * Valhalla Routing Engine Client with OSRM & Geodesic Fallbacks
 * Free, open-source routing powered by OpenStreetMap data.
 */

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lng][]
  geojsonCoords: [number, number][]; // [lng, lat][] for MapLibre GeoJSON LineString
  engine: "valhalla" | "osrm" | "fallback";
  summary?: string;
}

export interface MultiRouteResult {
  primary: RouteResult;
  alternatives: RouteResult[];
}

/**
 * Decodes a polyline string into an array of [lat, lng] coordinates.
 * Valhalla uses 6 decimal precision by default (factor = 1e6).
 * Standard Google/OSRM uses 5 decimal precision (factor = 1e5).
 */
export function decodePolyline(encoded: string, precision = 6): [number, number][] {
  if (!encoded) return [];
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const factor = Math.pow(10, precision);

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / factor, lng / factor]);
  }
  return points;
}

/**
 * Generate a smooth curved Bezier path between two points as an emergency fallback.
 */
function generateFallbackCurve(
  a: [number, number],
  b: [number, number],
  segments = 36
): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (a[0] + b[0]) / 2;
  const midLng = (a[1] + b[1]) / 2;
  const offsetLat = (b[1] - a[1]) * 0.08;
  const offsetLng = (a[0] - b[0]) * 0.08;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat =
      (1 - t) * (1 - t) * a[0] +
      2 * (1 - t) * t * (midLat + offsetLat) +
      t * t * b[0];
    const lng =
      (1 - t) * (1 - t) * a[1] +
      2 * (1 - t) * t * (midLng + offsetLng) +
      t * t * b[1];
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Approximate direct distance in km using Haversine formula.
 */
function directHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fetch route via Valhalla routing engine with alternatives.
 */
export async function getValhallaRoute(
  waypoints: [number, number][], // [lat, lng][]
  options: { alternates?: number; timeoutMs?: number } = {}
): Promise<MultiRouteResult> {
  const { alternates = 2, timeoutMs = 5000 } = options;

  if (waypoints.length < 2) {
    throw new Error("At least 2 points (pickup and destination) required.");
  }

  const locations = waypoints.map(([lat, lon]) => ({
    lat,
    lon,
    type: "break",
  }));

  const payload = {
    locations,
    costing: "auto",
    costing_options: {
      auto: {
        country_crossing_penalty: 2000,
      },
    },
    alternates,
    directions_options: {
      units: "kilometers",
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://valhalla1.openstreetmap.de/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Valhalla status ${res.status}`);
    }

    const data = await res.json();
    if (!data.trip?.legs?.length) {
      throw new Error("No trip found in Valhalla response");
    }

    // Process primary route
    const primaryTrip = data.trip;
    const primaryCoords: [number, number][] = [];
    for (const leg of primaryTrip.legs) {
      if (leg.shape) {
        primaryCoords.push(...decodePolyline(leg.shape, 6));
      }
    }

    const primaryDistance = +(primaryTrip.summary.length.toFixed(2));
    const primaryDuration = Math.max(
      2,
      Math.round(primaryTrip.summary.time / 60)
    );

    const primary: RouteResult = {
      distanceKm: primaryDistance,
      durationMinutes: primaryDuration,
      coordinates: primaryCoords,
      geojsonCoords: primaryCoords.map(([lat, lng]) => [lng, lat]),
      engine: "valhalla",
      summary: "Fastest route via Valhalla",
    };

    // Process alternatives
    const alternatives: RouteResult[] = [];
    if (data.alternates && Array.isArray(data.alternates)) {
      for (const alt of data.alternates) {
        if (alt.trip?.legs) {
          const altCoords: [number, number][] = [];
          for (const leg of alt.trip.legs) {
            if (leg.shape) {
              altCoords.push(...decodePolyline(leg.shape, 6));
            }
          }
          if (altCoords.length > 0) {
            const altDist = +(alt.trip.summary.length.toFixed(2));
            const altDur = Math.max(2, Math.round(alt.trip.summary.time / 60));
            alternatives.push({
              distanceKm: altDist,
              durationMinutes: altDur,
              coordinates: altCoords,
              geojsonCoords: altCoords.map(([lat, lng]) => [lng, lat]),
              engine: "valhalla",
              summary: "Alternative route",
            });
          }
        }
      }
    }

    return { primary, alternatives };
  } catch (valhallaErr) {
    clearTimeout(timer);
    console.warn("Valhalla routing engine query failed, switching to OSRM fallback:", valhallaErr);
    return getOsrmFallbackRoute(waypoints, timeoutMs);
  }
}

/**
 * Secondary Fallback: OSRM Public Routing
 */
async function getOsrmFallbackRoute(
  waypoints: [number, number][],
  timeoutMs = 5000
): Promise<MultiRouteResult> {
  const coordString = waypoints
    .map(([lat, lon]) => `${lon},${lat}`)
    .join(";");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&alternatives=true`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) throw new Error(`OSRM status ${res.status}`);
    const data = await res.json();
    if (!data.routes?.length) throw new Error("No OSRM routes found");

    const primaryRoute = data.routes[0];
    const coords: [number, number][] = primaryRoute.geometry.coordinates.map(
      ([lon, lat]: number[]) => [lat, lon]
    );
    const distKm = +((primaryRoute.distance / 1000).toFixed(2));
    const durMin = Math.max(2, Math.round(primaryRoute.duration / 60));

    const primary: RouteResult = {
      distanceKm: distKm,
      durationMinutes: durMin,
      coordinates: coords,
      geojsonCoords: primaryRoute.geometry.coordinates,
      engine: "osrm",
      summary: "Route via OSRM",
    };

    const alternatives: RouteResult[] = [];
    if (data.routes.length > 1) {
      for (let i = 1; i < data.routes.length; i++) {
        const alt = data.routes[i];
        const altCoords: [number, number][] = alt.geometry.coordinates.map(
          ([lon, lat]: number[]) => [lat, lon]
        );
        alternatives.push({
          distanceKm: +((alt.distance / 1000).toFixed(2)),
          durationMinutes: Math.max(2, Math.round(alt.duration / 60)),
          coordinates: altCoords,
          geojsonCoords: alt.geometry.coordinates,
          engine: "osrm",
          summary: `Alt route ${i}`,
        });
      }
    }

    return { primary, alternatives };
  } catch (osrmErr) {
    clearTimeout(timer);
    console.warn("OSRM routing unavailable, generating synthetic curve fallback:", osrmErr);
    return getSyntheticFallbackRoute(waypoints);
  }
}

/**
 * Tertiary Fallback: Geodesic Bezier interpolation (guarantees a continuous valid line).
 */
function getSyntheticFallbackRoute(waypoints: [number, number][]): MultiRouteResult {
  let totalKm = 0;
  const allCoords: [number, number][] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segDist = directHaversineKm(a[0], a[1], b[0], b[1]) * 1.25; // 1.25 road tortuosity factor
    totalKm += segDist;
    const curve = generateFallbackCurve(a, b, 24);
    if (i > 0) curve.shift();
    allCoords.push(...curve);
  }

  const roundedKm = +(totalKm.toFixed(2));
  const roundedMin = Math.max(3, Math.round((roundedKm / 25) * 60));

  const primary: RouteResult = {
    distanceKm: roundedKm,
    durationMinutes: roundedMin,
    coordinates: allCoords,
    geojsonCoords: allCoords.map(([lat, lng]) => [lng, lat]),
    engine: "fallback",
    summary: "Direct estimated route",
  };

  return { primary, alternatives: [] };
}
