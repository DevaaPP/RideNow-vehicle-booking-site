"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { UBER_MINIMAL_MAP_STYLE } from "@/lib/mapConfig";

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
function calculateBearing(
  start: [number, number],
  end: [number, number]
): number {
  const startLat = (start[0] * Math.PI) / 180;
  const startLng = (start[1] * Math.PI) / 180;
  const endLat = (end[0] * Math.PI) / 180;
  const endLng = (end[1] * Math.PI) / 180;
  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/* ─── VEHICLE SVG ICONS ─────────────────────────────────────────────── */
function getVehicleSvg(type: VehicleType): { svg: string; bg: string; size: number } {
  switch (type) {
    case "auto":
      return {
        bg: "#f59e0b",  // amber for auto-rickshaw
        size: 44,
        svg: `<svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Auto-rickshaw body -->
          <rect x="4" y="11" width="20" height="12" rx="3" fill="white" fill-opacity="0.95"/>
          <!-- Roof canopy -->
          <path d="M6 11 L10 5 L24 5 L24 11Z" fill="white" fill-opacity="0.85"/>
          <!-- Windshield -->
          <rect x="11" y="6" width="12" height="5" rx="1" fill="#f59e0b" fill-opacity="0.7"/>
          <!-- Driver compartment divider -->
          <rect x="10" y="11" width="1.5" height="12" fill="#d97706" fill-opacity="0.5"/>
          <!-- Passenger door -->
          <rect x="5" y="13" width="4.5" height="8" rx="1" fill="#fbbf24" fill-opacity="0.35"/>
          <!-- Wheels -->
          <circle cx="9" cy="24" r="3" fill="#1f2937"/>
          <circle cx="9" cy="24" r="1.5" fill="white"/>
          <circle cx="22" cy="24" r="3" fill="#1f2937"/>
          <circle cx="22" cy="24" r="1.5" fill="white"/>
          <!-- Headlight -->
          <circle cx="24" cy="15" r="1.5" fill="#fde68a"/>
        </svg>`,
      };
    case "bike":
      return {
        bg: "#10b981",  // emerald for bike
        size: 40,
        svg: `<svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Bike frame -->
          <circle cx="10" cy="22" r="5" stroke="white" stroke-width="2.5" fill="none"/>
          <circle cx="22" cy="22" r="5" stroke="white" stroke-width="2.5" fill="none"/>
          <!-- Frame lines -->
          <path d="M10 22 L16 10 L22 22" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M16 10 L10 22" stroke="white" stroke-width="2" opacity="0.6"/>
          <!-- Handlebar -->
          <path d="M18 10 L24 10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Seat -->
          <path d="M12 10 L16 10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Wheel hubs -->
          <circle cx="10" cy="22" r="1.5" fill="white"/>
          <circle cx="22" cy="22" r="1.5" fill="white"/>
        </svg>`,
      };
    case "suv":
      return {
        bg: "#6366f1",  // indigo for SUV
        size: 48,
        svg: `<svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- SUV body - taller, boxy -->
          <rect x="2" y="13" width="28" height="10" rx="2" fill="white" fill-opacity="0.95"/>
          <!-- Roof line -->
          <path d="M5 13 L7 6 L25 6 L27 13Z" fill="white" fill-opacity="0.9"/>
          <!-- Windows -->
          <rect x="8" y="7.5" width="6" height="5" rx="1" fill="#6366f1" fill-opacity="0.5"/>
          <rect x="16" y="7.5" width="8" height="5" rx="1" fill="#6366f1" fill-opacity="0.5"/>
          <!-- Front grille -->
          <rect x="25" y="15" width="3" height="5" rx="1" fill="#4f46e5" fill-opacity="0.7"/>
          <!-- Headlights -->
          <rect x="25" y="13.5" width="3" height="2" rx="0.5" fill="#fde68a"/>
          <!-- Wheels -->
          <circle cx="8" cy="24.5" r="3.5" fill="#1f2937"/>
          <circle cx="8" cy="24.5" r="1.8" fill="white"/>
          <circle cx="24" cy="24.5" r="3.5" fill="#1f2937"/>
          <circle cx="24" cy="24.5" r="1.8" fill="white"/>
        </svg>`,
      };
    case "car":
    default:
      return {
        bg: "#3b82f6",  // blue for car
        size: 44,
        svg: `<svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Car body -->
          <rect x="2" y="15" width="28" height="9" rx="2.5" fill="white" fill-opacity="0.95"/>
          <!-- Cabin roof -->
          <path d="M7 15 L10 9 L22 9 L25 15Z" fill="white" fill-opacity="0.9"/>
          <!-- Windshield -->
          <path d="M10.5 15 L12 10 L20 10 L21.5 15Z" fill="#3b82f6" fill-opacity="0.45"/>
          <!-- Rear window -->
          <rect x="8" y="10" width="3" height="5" rx="0.5" fill="#3b82f6" fill-opacity="0.3"/>
          <!-- Headlights -->
          <rect x="27" y="15.5" width="2" height="3" rx="0.5" fill="#fde68a"/>
          <!-- Tail lights -->
          <rect x="3" y="15.5" width="2" height="3" rx="0.5" fill="#ef4444" fill-opacity="0.8"/>
          <!-- Wheels -->
          <circle cx="9" cy="25" r="3.5" fill="#1f2937"/>
          <circle cx="9" cy="25" r="1.8" fill="white"/>
          <circle cx="23" cy="25" r="3.5" fill="#1f2937"/>
          <circle cx="23" cy="25" r="1.8" fill="white"/>
          <!-- Door line -->
          <line x1="16" y1="15" x2="16" y2="24" stroke="#3b82f6" stroke-width="1" opacity="0.35"/>
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
  const { svg, bg, size } = getVehicleSvg(vehicleType);

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.alignItems = "center";
  container.style.gap = "4px";
  container.style.width = `${size + 8}px`;

  // ETA badge above the vehicle
  const etaBadge = document.createElement("div");
  etaBadge.style.background = "#09090b";
  etaBadge.style.color = "#ffffff";
  etaBadge.style.padding = "3px 9px";
  etaBadge.style.borderRadius = "100px";
  etaBadge.style.fontSize = "11px";
  etaBadge.style.fontWeight = "700";
  etaBadge.style.fontFamily = "system-ui,-apple-system,sans-serif";
  etaBadge.style.letterSpacing = "0.01em";
  etaBadge.style.whiteSpace = "nowrap";
  etaBadge.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
  etaBadge.style.display = "flex";
  etaBadge.style.alignItems = "center";
  etaBadge.style.gap = "3px";
  etaBadge.style.lineHeight = "1";
  etaBadge.style.transition = "opacity 0.3s ease";
  const etaText = etaMinutes != null && etaMinutes > 0 ? `${Math.round(etaMinutes)} min` : "";
  etaBadge.innerHTML = etaText
    ? `<span style="color:#fbbf24;font-size:9px">⏱</span> ${etaText}`
    : "";
  etaBadge.style.opacity = etaText ? "1" : "0";

  // Vehicle icon circle
  const vehicleEl = document.createElement("div");
  vehicleEl.style.width = `${size}px`;
  vehicleEl.style.height = `${size}px`;
  vehicleEl.style.background = bg;
  vehicleEl.style.borderRadius = "50%";
  vehicleEl.style.display = "flex";
  vehicleEl.style.alignItems = "center";
  vehicleEl.style.justifyContent = "center";
  vehicleEl.style.boxShadow = `0 0 0 3px #ffffff, 0 0 0 5px ${bg}55, 0 8px 24px rgba(0,0,0,0.35)`;
  vehicleEl.style.transition = "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";
  vehicleEl.innerHTML = svg;

  container.appendChild(etaBadge);
  container.appendChild(vehicleEl);
  return { container, vehicleEl, etaBadge };
}

/* ─── PICKUP PIN — Green dot with label ────────────────────────────── */
function createPickupPinEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.alignItems = "center";
  el.style.filter = "drop-shadow(0 4px 10px rgba(0,0,0,0.22))";

  el.innerHTML = `
    <div style="
      background:#16a34a;
      color:#ffffff;
      padding:3px 10px;
      border-radius:100px;
      font-size:9px;font-weight:800;letter-spacing:0.12em;
      text-transform:uppercase;white-space:nowrap;
      font-family:system-ui,-apple-system,sans-serif;
      box-shadow:0 2px 6px rgba(22,163,74,0.35);
      margin-bottom:3px;
    ">PICKUP</div>
    <div style="width:2px;height:6px;background:#16a34a;opacity:0.7;"></div>
    <div style="
      width:14px;height:14px;
      background:#16a34a;
      border-radius:50%;
      border:3px solid #ffffff;
      box-shadow:0 2px 8px rgba(22,163,74,0.45);
    "></div>
  `;
  return el;
}

/* ─── DROP PIN — Red square-bottom pin ─────────────────────────────── */
function createDropPinEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.alignItems = "center";
  el.style.filter = "drop-shadow(0 4px 10px rgba(0,0,0,0.22))";

  el.innerHTML = `
    <div style="
      background:#dc2626;
      color:#ffffff;
      padding:3px 10px;
      border-radius:100px;
      font-size:9px;font-weight:800;letter-spacing:0.12em;
      text-transform:uppercase;white-space:nowrap;
      font-family:system-ui,-apple-system,sans-serif;
      box-shadow:0 2px 6px rgba(220,38,38,0.35);
      margin-bottom:3px;
    ">DROP</div>
    <div style="width:2px;height:6px;background:#dc2626;opacity:0.7;"></div>
    <div style="
      width:14px;height:14px;
      background:#dc2626;
      border-radius:50%;
      border:3px solid #ffffff;
      box-shadow:0 2px 8px rgba(220,38,38,0.45);
    "></div>
  `;
  return el;
}

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

  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleElRef = useRef<HTMLElement | null>(null);
  const etaBadgeRef = useRef<HTMLElement | null>(null);
  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);

  const lastPosRef = useRef<[number, number] | null>(null);
  const lastRouteFetchRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const [ready, setReady] = useState(false);

  /* ─── INITIALIZE MAP ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = driverLocation
      ? [driverLocation[1], driverLocation[0]]
      : [pickupLocation[1], pickupLocation[0]];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: UBER_MINIMAL_MAP_STYLE,
      center: initialCenter,
      zoom: 15.0,
      pitch: 0,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    const setupLayers = () => {
      // ── 1. Persistent Trip Route (Pickup → Drop) ──
      if (!map.getSource("trip-route")) {
        map.addSource("trip-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });

        // White halo/casing for depth
        map.addLayer({
          id: "trip-casing",
          type: "line",
          source: "trip-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 10.0,
            "line-opacity": 1.0,
          },
        });

        // Main route — medium grey-blue, Ola/Rapido style
        map.addLayer({
          id: "trip-core",
          type: "line",
          source: "trip-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#475569",   // slate-600 — clean grey road line
            "line-width": 5.5,
            "line-opacity": 0.95,
          },
        });
      }

      // ── 2. Driver Approach Route (Driver → Pickup) ──
      if (!map.getSource("driver-route")) {
        map.addSource("driver-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });

        // Dashed soft blue approach line
        map.addLayer({
          id: "driver-casing",
          type: "line",
          source: "driver-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": 8.5,
            "line-opacity": 0.85,
          },
        });

        map.addLayer({
          id: "driver-core",
          type: "line",
          source: "driver-route",
          layout: { "line-join": "round", "line-cap": "butt" },
          paint: {
            "line-color": "#3b82f6",          // blue-500 — driver approach
            "line-width": 4.5,
            "line-opacity": 0.85,
            "line-dasharray": [0.5, 2.5],    // dashed to distinguish from trip route
          },
        });
      }

      setReady(true);
    };

    map.on("load", setupLayers);
    map.on("styledata", () => {
      if (map.isStyleLoaded()) {
        setupLayers();
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── RESIZE OBSERVER ─── */
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── STATIC PINS (PICKUP & DROP) ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (!pickupMarkerRef.current && pickupLocation) {
      const el = createPickupPinEl();
      pickupMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([pickupLocation[1], pickupLocation[0]])
        .addTo(map);
    }

    if (!dropMarkerRef.current && dropLocation) {
      const el = createDropPinEl();
      dropMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([dropLocation[1], dropLocation[0]])
        .addTo(map);
    }
  }, [pickupLocation, dropLocation, ready]);

  /* ─── UPDATE ETA BADGE TEXT REACTIVELY ─── */
  useEffect(() => {
    const badge = etaBadgeRef.current;
    if (!badge) return;
    const etaText = etaMinutes != null && etaMinutes > 0 ? `${Math.round(etaMinutes)} min` : "";
    badge.innerHTML = etaText
      ? `<span style="color:#fbbf24;font-size:9px">⏱</span> ${etaText}`
      : "";
    badge.style.opacity = etaText ? "1" : "0";
  }, [etaMinutes]);

  /* ─── DYNAMIC DRIVER MOVEMENT & BEARING ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !driverLocation) return;

    // Calculate heading / bearing angle
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

    // Initialize or update driver marker
    if (!driverMarkerRef.current) {
      const { container, vehicleEl, etaBadge } = createDriverMarkerEl(vehicleType, etaMinutes);
      vehicleElRef.current = vehicleEl;
      etaBadgeRef.current = etaBadge;
      driverMarkerRef.current = new maplibregl.Marker({
        element: container,
        anchor: "bottom",
      })
        .setLngLat([driverLocation[1], driverLocation[0]])
        .addTo(map);
    } else {
      driverMarkerRef.current.setLngLat([driverLocation[1], driverLocation[0]]);
    }
  }, [driverLocation, ready, vehicleType, etaMinutes]);

  /* ─── PERSISTENT MAIN TRIP ROUTE (PICKUP -> DROP) ─── */
  const updateTripRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !ready || !pickupLocation || !dropLocation) return;

    try {
      const ptsParam = `${pickupLocation[0]},${pickupLocation[1]};${dropLocation[0]},${dropLocation[1]}`;
      const res = await fetch(`/api/route?points=${encodeURIComponent(ptsParam)}`);
      const data = await res.json();

      if (data.success && data.primary) {
        const coords = data.primary.geojsonCoords;
        const source = map.getSource("trip-route") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          });
        }

        // Send stats
        if (onStats) {
          onStats({
            distanceToPickup: 0,
            durationToPickup: 0,
            distanceToDrop: data.primary.distanceKm,
            durationToDrop: data.primary.durationMinutes,
          });
        }
      }
    } catch (err) {
      console.warn("Trip route fetch error:", err);
    }
  }, [pickupLocation, dropLocation, ready, onStats]);

  /* ─── DRIVER APPROACH ROUTE (DRIVER -> PICKUP) ─── */
  const updateDriverRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !ready || !driverLocation || !pickupLocation) return;

    if (status === "arriving") {
      const last = lastRouteFetchRef.current;
      if (last) {
        const dist = Math.hypot(driverLocation[0] - last.lat, driverLocation[1] - last.lng);
        const elapsed = Date.now() - last.time;
        // Skip expensive polyline recalculation if driver moved < 120m and < 15s elapsed
        if (dist < 0.001 && elapsed < 15000) {
          return;
        }
      }
      lastRouteFetchRef.current = { lat: driverLocation[0], lng: driverLocation[1], time: Date.now() };

      try {
        const ptsParam = `${driverLocation[0]},${driverLocation[1]};${pickupLocation[0]},${pickupLocation[1]}`;
        const res = await fetch(`/api/route?points=${encodeURIComponent(ptsParam)}`);
        const data = await res.json();

        if (data.success && data.primary) {
          const coords = data.primary.geojsonCoords;
          const source = map.getSource("driver-route") as maplibregl.GeoJSONSource;
          if (source) {
            source.setData({
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            });
          }

          if (onStats) {
            onStats({
              distanceToPickup: data.primary.distanceKm,
              durationToPickup: data.primary.durationMinutes,
              distanceToDrop: 0,
              durationToDrop: 0,
            });
          }
        }
      } catch (err) {
        console.warn("Driver approach route error:", err);
      }
    } else {
      // Clear driver approach line once ride is ongoing or completed
      const source = map.getSource("driver-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
  }, [driverLocation, pickupLocation, status, ready, onStats]);

  // Initial and reactive route updates
  useEffect(() => {
    updateTripRoute();
  }, [updateTripRoute]);

  useEffect(() => {
    updateDriverRoute();
  }, [updateDriverRoute]);

  // Dynamic Camera Framing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !pickupLocation || !dropLocation) return;

    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([pickupLocation[1], pickupLocation[0]]);
    bounds.extend([dropLocation[1], dropLocation[0]]);
    if (driverLocation) {
      bounds.extend([driverLocation[1], driverLocation[0]]);
    }

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 160, left: 60, right: 60 },
      duration: 1000,
      maxZoom: 16.5,
    });
  }, [ready, pickupLocation, dropLocation, status]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}