"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { LIVE_TRACKING_MAP_STYLE } from "@/lib/mapConfig";

type VehicleType = "auto" | "car" | "bike" | "suv" | string;

type Props = {
  driverLocation: [number, number] | null;
  pickupLocation: [number, number];
  dropLocation: [number, number];
  status: "arriving" | "ongoing" | "completed";
  vehicleType?: VehicleType;
  etaMinutes?: number;
  onStats?: (data: {
    distanceToPickup: number;
    durationToPickup: number;
    distanceToDrop: number;
    durationToDrop: number;
  }) => void;
};

/* ─── BEARING FORMULA ──────────────────────────────────────────────── */
function calculateBearing(start: [number, number], end: [number, number]): number {
  const startLat = (start[0] * Math.PI) / 180;
  const startLng = (start[1] * Math.PI) / 180;
  const endLat = (end[0] * Math.PI) / 180;
  const endLng = (end[1] * Math.PI) / 180;
  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/* ─── VEHICLE SVG ICONS ─────────────────────────────────────────────── */
function getVehicleStyle(type: VehicleType): { svg: string; bg: string; size: number } {
  switch (type) {
    case "auto":
      return {
        bg: "#f59e0b",
        size: 44,
        svg: `<svg width="22" height="22" viewBox="0 0 32 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="11" width="20" height="10" rx="3" fill="white" fill-opacity="0.95"/>
          <path d="M6 11 L10 5 L24 5 L24 11Z" fill="white" fill-opacity="0.85"/>
          <rect x="11" y="6" width="12" height="5" rx="1" fill="#f59e0b" fill-opacity="0.7"/>
          <rect x="10" y="11" width="1.5" height="10" fill="#d97706" fill-opacity="0.5"/>
          <circle cx="9" cy="22" r="2.5" fill="#1f2937"/>
          <circle cx="9" cy="22" r="1.2" fill="white"/>
          <circle cx="22" cy="22" r="2.5" fill="#1f2937"/>
          <circle cx="22" cy="22" r="1.2" fill="white"/>
        </svg>`,
      };
    case "bike":
      return {
        bg: "#10b981",
        size: 40,
        svg: `<svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="22" r="5" stroke="white" stroke-width="2.5" fill="none"/>
          <circle cx="22" cy="22" r="5" stroke="white" stroke-width="2.5" fill="none"/>
          <path d="M10 22 L16 10 L22 22" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M18 10 L24 10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M12 10 L16 10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="10" cy="22" r="1.5" fill="white"/>
          <circle cx="22" cy="22" r="1.5" fill="white"/>
        </svg>`,
      };
    case "suv":
      return {
        bg: "#6366f1",
        size: 48,
        svg: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="13" width="28" height="10" rx="2" fill="white" fill-opacity="0.95"/>
          <path d="M5 13 L7 6 L25 6 L27 13Z" fill="white" fill-opacity="0.9"/>
          <rect x="8" y="7.5" width="6" height="5" rx="1" fill="#6366f1" fill-opacity="0.5"/>
          <rect x="16" y="7.5" width="8" height="5" rx="1" fill="#6366f1" fill-opacity="0.5"/>
          <circle cx="8" cy="24.5" r="3.5" fill="#1f2937"/>
          <circle cx="8" cy="24.5" r="1.8" fill="white"/>
          <circle cx="24" cy="24.5" r="3.5" fill="#1f2937"/>
          <circle cx="24" cy="24.5" r="1.8" fill="white"/>
        </svg>`,
      };
    case "car":
    default:
      return {
        bg: "#3b82f6",
        size: 44,
        svg: `<svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="15" width="28" height="9" rx="2.5" fill="white" fill-opacity="0.95"/>
          <path d="M7 15 L10 9 L22 9 L25 15Z" fill="white" fill-opacity="0.9"/>
          <path d="M10.5 15 L12 10 L20 10 L21.5 15Z" fill="#3b82f6" fill-opacity="0.45"/>
          <rect x="27" y="15.5" width="2" height="3" rx="0.5" fill="#fde68a"/>
          <circle cx="9" cy="25" r="3.5" fill="#1f2937"/>
          <circle cx="9" cy="25" r="1.8" fill="white"/>
          <circle cx="23" cy="25" r="3.5" fill="#1f2937"/>
          <circle cx="23" cy="25" r="1.8" fill="white"/>
        </svg>`,
      };
  }
}

/* ─── DRIVER MARKER WITH ETA BADGE ─────────────────────────────────── */
function createDriverMarkerEl(vehicleType: VehicleType = "car", etaMinutes?: number): {
  container: HTMLElement;
  vehicleEl: HTMLElement;
  etaBadge: HTMLElement;
} {
  const { svg, bg, size } = getVehicleStyle(vehicleType);
  const container = document.createElement("div");
  container.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:4px;width:${size + 8}px;`;

  const etaBadge = document.createElement("div");
  const etaText = etaMinutes != null && etaMinutes > 0 ? `${Math.round(etaMinutes)} min` : "";
  etaBadge.style.cssText = `
    background:#09090b;color:#fff;padding:3px 9px;border-radius:100px;
    font-size:11px;font-weight:700;font-family:system-ui,-apple-system,sans-serif;
    letter-spacing:0.01em;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);
    display:flex;align-items:center;gap:3px;line-height:1;
    opacity:${etaText ? "1" : "0"};transition:opacity 0.3s ease;
  `;
  etaBadge.innerHTML = etaText ? `<span style="color:#fbbf24;font-size:9px">⏱</span> ${etaText}` : "";

  const vehicleEl = document.createElement("div");
  vehicleEl.style.cssText = `
    width:${size}px;height:${size}px;background:${bg};border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 0 3px #fff,0 0 0 5px ${bg}55,0 8px 24px rgba(0,0,0,0.35);
    transition:transform 0.45s cubic-bezier(0.34,1.56,0.64,1);
  `;
  vehicleEl.innerHTML = svg;

  container.appendChild(etaBadge);
  container.appendChild(vehicleEl);
  return { container, vehicleEl, etaBadge };
}

/* ─── PICKUP PIN ────────────────────────────────────────────────────── */
function createPickupPinEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.22));";
  el.innerHTML = `
    <div style="background:#16a34a;color:#fff;padding:3px 10px;border-radius:100px;
      font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;
      white-space:nowrap;font-family:system-ui,-apple-system,sans-serif;
      box-shadow:0 2px 6px rgba(22,163,74,0.35);margin-bottom:3px;">PICKUP</div>
    <div style="width:2px;height:6px;background:#16a34a;opacity:0.7;"></div>
    <div style="width:14px;height:14px;background:#16a34a;border-radius:50%;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(22,163,74,0.45);"></div>
  `;
  return el;
}

/* ─── DROP PIN ──────────────────────────────────────────────────────── */
function createDropPinEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = "display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.22));";
  el.innerHTML = `
    <div style="background:#dc2626;color:#fff;padding:3px 10px;border-radius:100px;
      font-size:9px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;
      white-space:nowrap;font-family:system-ui,-apple-system,sans-serif;
      box-shadow:0 2px 6px rgba(220,38,38,0.35);margin-bottom:3px;">DROP</div>
    <div style="width:2px;height:6px;background:#dc2626;opacity:0.7;"></div>
    <div style="width:14px;height:14px;background:#dc2626;border-radius:50%;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(220,38,38,0.45);"></div>
  `;
  return el;
}

/* ─── ROUTE LAYER SETUP ─────────────────────────────────────────────── */
function setupRouteLayers(map: maplibregl.Map): boolean {
  if (!map) return false;

  try {
    // 1. Trip route (active or preview road route)
    if (!map.getSource("trip-route")) {
      map.addSource("trip-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
    }
    if (!map.getLayer("trip-casing")) {
      map.addLayer({
        id: "trip-casing",
        type: "line",
        source: "trip-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 9.5, "line-opacity": 1.0 },
      });
    }
    if (!map.getLayer("trip-core")) {
      map.addLayer({
        id: "trip-core",
        type: "line",
        source: "trip-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#2563eb", "line-width": 5.5, "line-opacity": 1.0 },
      });
    }

    // 2. Driver approach route (Driver -> Pickup)
    if (!map.getSource("driver-route")) {
      map.addSource("driver-route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
      });
    }
    if (!map.getLayer("driver-casing")) {
      map.addLayer({
        id: "driver-casing",
        type: "line",
        source: "driver-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8.5, "line-opacity": 0.9 },
      });
    }
    if (!map.getLayer("driver-core")) {
      map.addLayer({
        id: "driver-core",
        type: "line",
        source: "driver-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#0284c7",
          "line-width": 4.5,
          "line-opacity": 0.9,
          "line-dasharray": [1, 2],
        },
      });
    }
    return true;
  } catch (e) {
    return false;
  }
}

/* ─── FETCH ROAD ROUTE VIA API ──────────────────────────────────────── */
async function fetchRoadRoute(
  from: [number, number],
  to: [number, number]
): Promise<[number, number][] | null> {
  // Try OSRM directly first (fast, client-side, <300ms)
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.routes?.[0]?.geometry?.coordinates?.length) {
        return data.routes[0].geometry.coordinates; // already [lng, lat][] for GeoJSON
      }
    }
  } catch (_) {}

  // Fallback to our API route
  try {
    const ptsParam = `${from[0]},${from[1]};${to[0]},${to[1]}`;
    const res = await fetch(`/api/route?points=${encodeURIComponent(ptsParam)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const data = await res.json();
        if (data.success && data.primary?.geojsonCoords?.length) {
          return data.primary.geojsonCoords; // [lng, lat][]
        }
      }
    }
  } catch (_) {}

  // Fail-safe direct fallback so the polyline is 100% NEVER blank
  return [
    [from[1], from[0]],
    [to[1], to[0]],
  ];
}

/* ─── MAIN COMPONENT ────────────────────────────────────────────────── */
export default function LiveTrackingMap({
  driverLocation,
  pickupLocation,
  dropLocation,
  status,
  vehicleType = "car",
  etaMinutes,
  onStats,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef(false);

  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleElRef = useRef<HTMLElement | null>(null);
  const etaBadgeRef = useRef<HTMLElement | null>(null);
  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);

  const lastPosRef = useRef<[number, number] | null>(null);
  const lastDriverRouteFetchRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const lastTripRouteFetchRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const tripRouteDrawnRef = useRef(false);
  const [ready, setReady] = useState(false);

  const tripCoordsRef = useRef<[number, number][]>([]);
  const driverCoordsRef = useRef<[number, number][]>([]);

  const svgTripCasingRef = useRef<SVGPathElement | null>(null);
  const svgTripCoreRef = useRef<SVGPathElement | null>(null);
  const svgDriverCasingRef = useRef<SVGPathElement | null>(null);
  const svgDriverCoreRef = useRef<SVGPathElement | null>(null);

  const updateSvgOverlay = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Trip Route (Pickup -> Drop or Driver -> Drop)
    const tripCoords = tripCoordsRef.current;
    if (tripCoords && tripCoords.length > 0) {
      let d = "";
      for (let i = 0; i < tripCoords.length; i++) {
        const pt = map.project(tripCoords[i]);
        d += (i === 0 ? "M " : " L ") + pt.x.toFixed(1) + " " + pt.y.toFixed(1);
      }
      if (svgTripCasingRef.current) svgTripCasingRef.current.setAttribute("d", d);
      if (svgTripCoreRef.current) svgTripCoreRef.current.setAttribute("d", d);
    } else {
      if (svgTripCasingRef.current) svgTripCasingRef.current.setAttribute("d", "");
      if (svgTripCoreRef.current) svgTripCoreRef.current.setAttribute("d", "");
    }

    // 2. Driver Approach Route (Driver -> Pickup)
    const driverCoords = driverCoordsRef.current;
    if (driverCoords && driverCoords.length > 0) {
      let d = "";
      for (let i = 0; i < driverCoords.length; i++) {
        const pt = map.project(driverCoords[i]);
        d += (i === 0 ? "M " : " L ") + pt.x.toFixed(1) + " " + pt.y.toFixed(1);
      }
      if (svgDriverCasingRef.current) svgDriverCasingRef.current.setAttribute("d", d);
      if (svgDriverCoreRef.current) svgDriverCoreRef.current.setAttribute("d", d);
    } else {
      if (svgDriverCasingRef.current) svgDriverCasingRef.current.setAttribute("d", "");
      if (svgDriverCoreRef.current) svgDriverCoreRef.current.setAttribute("d", "");
    }
  }, []);

  /* ─── INITIALIZE MAP ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = driverLocation
      ? [driverLocation[1], driverLocation[0]]
      : [pickupLocation[1], pickupLocation[0]];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: LIVE_TRACKING_MAP_STYLE,
      center: initialCenter,
      zoom: 14.5,
      pitch: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    const onStyleLoaded = () => {
      setupRouteLayers(map);
      mapReadyRef.current = true;
      setReady(true);
      updateSvgOverlay();
    };

    map.on("load", onStyleLoaded);
    map.on("styledata", () => {
      if (map.isStyleLoaded() && !mapReadyRef.current) {
        onStyleLoaded();
      }
    });

    map.on("render", updateSvgOverlay);
    map.on("move", updateSvgOverlay);
    map.on("zoom", updateSvgOverlay);
    map.on("resize", updateSvgOverlay);

    mapRef.current = map;

    return () => {
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── RESIZE OBSERVER ─── */
  useEffect(() => {
    const handleResize = () => mapRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── STATIC PINS (PICKUP & DROP) ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!pickupMarkerRef.current && pickupLocation) {
      pickupMarkerRef.current = new maplibregl.Marker({ element: createPickupPinEl(), anchor: "bottom" })
        .setLngLat([pickupLocation[1], pickupLocation[0]])
        .addTo(map);
    }
    if (!dropMarkerRef.current && dropLocation) {
      dropMarkerRef.current = new maplibregl.Marker({ element: createDropPinEl(), anchor: "bottom" })
        .setLngLat([dropLocation[1], dropLocation[0]])
        .addTo(map);
    }
  }, [pickupLocation, dropLocation, ready]);

  /* ─── UPDATE ETA BADGE REACTIVELY ─── */
  useEffect(() => {
    const badge = etaBadgeRef.current;
    if (!badge) return;
    const etaText = etaMinutes != null && etaMinutes > 0 ? `${Math.round(etaMinutes)} min` : "";
    badge.innerHTML = etaText ? `<span style="color:#fbbf24;font-size:9px">⏱</span> ${etaText}` : "";
    badge.style.opacity = etaText ? "1" : "0";
  }, [etaMinutes]);

  /* ─── DRIVER MARKER + BEARING ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !driverLocation) return;

    if (lastPosRef.current && vehicleElRef.current) {
      const dist = Math.hypot(
        driverLocation[0] - lastPosRef.current[0],
        driverLocation[1] - lastPosRef.current[1]
      );
      if (dist > 0.00005) {
        const bearing = calculateBearing(lastPosRef.current, driverLocation);
        vehicleElRef.current.style.transform = `rotate(${Math.round(bearing)}deg)`;
      }
    }
    lastPosRef.current = driverLocation;

    if (!driverMarkerRef.current) {
      const { container, vehicleEl, etaBadge } = createDriverMarkerEl(vehicleType, etaMinutes);
      vehicleElRef.current = vehicleEl;
      etaBadgeRef.current = etaBadge;
      driverMarkerRef.current = new maplibregl.Marker({ element: container, anchor: "bottom" })
        .setLngLat([driverLocation[1], driverLocation[0]])
        .addTo(map);
    } else {
      driverMarkerRef.current.setLngLat([driverLocation[1], driverLocation[0]]);
    }
  }, [driverLocation, ready, vehicleType, etaMinutes]);

  /* ─── DYNAMIC TRIP ROUTE (PICKUP → DROP OR DRIVER → DROP) ─── */
  const updateTripRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;

    if (status === "ongoing") {
      // Ride active: route is from driver's current position to drop location!
      const startPt = driverLocation || pickupLocation;
      const last = lastTripRouteFetchRef.current;
      if (last && driverLocation) {
        const dist = Math.hypot(driverLocation[0] - last.lat, driverLocation[1] - last.lng);
        const elapsed = Date.now() - last.time;
        if (dist < 0.001 && elapsed < 12000) return; // Throttle: <120m moved and <12s elapsed
      }
      if (driverLocation) {
        lastTripRouteFetchRef.current = { lat: driverLocation[0], lng: driverLocation[1], time: Date.now() };
      }

      setupRouteLayers(map);
      const coords = await fetchRoadRoute(startPt, dropLocation);
      if (!coords || !mapRef.current) return;

      tripCoordsRef.current = coords;
      updateSvgOverlay();
      map.triggerRepaint();

      const source = mapRef.current.getSource("trip-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
      }

      // Clear driver approach route once trip is ongoing
      driverCoordsRef.current = [];
      updateSvgOverlay();
      const driverSource = mapRef.current.getSource("driver-route") as maplibregl.GeoJSONSource;
      if (driverSource) {
        driverSource.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    } else if (status === "arriving") {
      // Driver heading to pickup: trip route is pickup -> drop (upcoming trip preview)
      if (tripRouteDrawnRef.current) return;
      setupRouteLayers(map);
      const coords = await fetchRoadRoute(pickupLocation, dropLocation);
      if (!coords || !mapRef.current) return;

      tripCoordsRef.current = coords;
      updateSvgOverlay();
      map.triggerRepaint();

      const source = mapRef.current.getSource("trip-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
        tripRouteDrawnRef.current = true;
      }
    } else {
      // Completed: clear route
      tripCoordsRef.current = [];
      driverCoordsRef.current = [];
      updateSvgOverlay();
      const source = map.getSource("trip-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
  }, [driverLocation, pickupLocation, dropLocation, status, updateSvgOverlay]);

  /* ─── DRIVER APPROACH ROUTE (DRIVER → PICKUP) ─── */
  const updateDriverRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current || !driverLocation || !pickupLocation) return;

    if (status === "arriving") {
      const last = lastDriverRouteFetchRef.current;
      if (last) {
        const dist = Math.hypot(driverLocation[0] - last.lat, driverLocation[1] - last.lng);
        const elapsed = Date.now() - last.time;
        if (dist < 0.001 && elapsed < 12000) return; // Throttle: <120m moved and <12s elapsed
      }
      lastDriverRouteFetchRef.current = { lat: driverLocation[0], lng: driverLocation[1], time: Date.now() };

      setupRouteLayers(map);
      const coords = await fetchRoadRoute(driverLocation, pickupLocation);
      if (!coords || !mapRef.current) return;

      driverCoordsRef.current = coords;
      updateSvgOverlay();
      map.triggerRepaint();

      const source = mapRef.current.getSource("driver-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    } else {
      // Clear driver approach line when ride is ongoing/completed
      driverCoordsRef.current = [];
      updateSvgOverlay();
      const source = mapRef.current?.getSource("driver-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
  }, [driverLocation, pickupLocation, status, updateSvgOverlay]);

  // Initial and reactive trip route
  useEffect(() => {
    if (ready) updateTripRoute();
  }, [ready, updateTripRoute]);

  // Reactive driver approach route
  useEffect(() => {
    if (ready) updateDriverRoute();
  }, [ready, updateDriverRoute]);

  // Reset trip route drawn flag when endpoints change
  useEffect(() => {
    tripRouteDrawnRef.current = false;
  }, [pickupLocation[0], pickupLocation[1], dropLocation[0], dropLocation[1]]);

  /* ─── CAMERA FRAMING ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([pickupLocation[1], pickupLocation[0]]);
    bounds.extend([dropLocation[1], dropLocation[0]]);
    if (driverLocation) bounds.extend([driverLocation[1], driverLocation[0]]);

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 180, left: 60, right: 60 },
      duration: 1000,
      maxZoom: 16.5,
    });
  }, [ready, pickupLocation, dropLocation, status]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* ── FAIL-SAFE SVG ROUTE POLYLINE OVERLAY ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10, pointerEvents: "none" }}
      >
        {/* Driver approach route (dashed cyan with white halo) */}
        <path
          ref={svgDriverCasingRef}
          d=""
          stroke="#ffffff"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />
        <path
          ref={svgDriverCoreRef}
          d=""
          stroke="#0284c7"
          strokeWidth="4.5"
          strokeDasharray="6, 8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />
        {/* Trip route (solid Google Maps blue with white halo) */}
        <path
          ref={svgTripCasingRef}
          d=""
          stroke="#ffffff"
          strokeWidth="9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="1.0"
        />
        <path
          ref={svgTripCoreRef}
          d=""
          stroke="#2563eb"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="1.0"
        />
      </svg>
    </div>
  );
}