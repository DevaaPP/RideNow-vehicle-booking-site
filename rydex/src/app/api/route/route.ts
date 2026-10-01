import { NextRequest, NextResponse } from "next/server";
import { getValhallaRoute, MultiRouteResult } from "@/lib/valhalla";

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

  try {
    const routeData: MultiRouteResult = await getValhallaRoute(waypoints, {
      alternates: 1,
      timeoutMs: 5000,
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
