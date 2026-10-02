import { NextRequest, NextResponse } from "next/server";
import { getValhallaRoute, MultiRouteResult } from "@/lib/valhalla";

interface RouteCacheEntry {
  data: MultiRouteResult;
  expiresAt: number;
}
const routeCache = new Map<string, RouteCacheEntry>();
const ROUTE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ROUTE_CACHE_SIZE = 250;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pointsParam = searchParams.get("points") || "";

  if (!pointsParam) {
    return NextResponse.json(
      { success: false, error: "Missing 'points' query parameter." },
      { status: 400 }
    );
  }

  // Parse points: "lat1,lng1;lat2,lng2;lat3,lng3"
  const rawPairs = pointsParam.split(";").filter(Boolean);
  const waypoints: [number, number][] = [];

  for (const pair of rawPairs) {
    const [latStr, lngStr] = pair.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      waypoints.push([lat, lng]);
    }
  }

  if (waypoints.length < 2) {
    return NextResponse.json(
      { success: false, error: "At least two valid lat,lng coordinates required." },
      { status: 400 }
    );
  }

  // Round waypoints to 4 decimal places (~11m resolution) for instantaneous cache hits
  const cacheKey = waypoints.map((w) => `${w[0].toFixed(4)},${w[1].toFixed(4)}`).join(";");
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(
      {
        success: true,
        primary: cached.data.primary,
        alternatives: cached.data.alternatives,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "HIT",
        },
      }
    );
  }

  try {
    const routeData: MultiRouteResult = await getValhallaRoute(waypoints, {
      alternates: 1,
      timeoutMs: 5000,
    });

    if (routeCache.size >= MAX_ROUTE_CACHE_SIZE) {
      const firstKey = routeCache.keys().next().value;
      if (firstKey) routeCache.delete(firstKey);
    }
    routeCache.set(cacheKey, {
      data: routeData,
      expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
    });

    return NextResponse.json(
      {
        success: true,
        primary: routeData.primary,
        alternatives: routeData.alternatives,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Cache": "MISS",
        },
      }
    );
  } catch (err: any) {
    console.error("Routing API error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to calculate route." },
      { status: 500 }
    );
  }
}
