"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { UBER_MINIMAL_MAP_STYLE } from "@/lib/mapConfig";

type Props = {
  driverLocation: [number, number] | null;
  pickupLocation: [number, number];
  dropLocation: [number, number];
  status: "arriving" | "ongoing" | "completed";
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

/* ─── MARKER GENERATORS ────────────────────────────────────────────── */
function createDriverMarkerEl(): { container: HTMLElement; carIcon: HTMLElement } {
  const container = document.createElement("div");
  container.style.width = "48px";
  container.style.height = "48px";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";

  const carIcon = document.createElement("div");
  carIcon.style.width = "40px";
  carIcon.style.height = "40px";
  carIcon.style.background = "#09090b";
  carIcon.style.borderRadius = "50%";
  carIcon.style.display = "flex";
  carIcon.style.alignItems = "center";
  carIcon.style.justifyContent = "center";
  carIcon.style.boxShadow =
    "0 0 0 3px #ffffff, 0 0 0 5px #09090b, 0 8px 24px rgba(0,0,0,0.45)";
  carIcon.style.transition = "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";

  carIcon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5H17.5L19 11" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="3" y="11" width="18" height="7" rx="2" stroke="white" stroke-width="1.8"/>
      <circle cx="7.5" cy="18.5" r="1.5" fill="white"/>
      <circle cx="16.5" cy="18.5" r="1.5" fill="white"/>
      <path d="M3 14H21" stroke="white" stroke-width="1" opacity="0.4"/>
    </svg>
  `;

  container.appendChild(carIcon);
  return { container, carIcon };
}

function createPinEl(text: string, isPickup: boolean): HTMLElement {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.alignItems = "center";
  el.style.filter = "drop-shadow(0 6px 14px rgba(0,0,0,0.25))";

  const dotColor = isPickup ? "#22c55e" : "#ef4444";
  const bgColor = isPickup ? "#09090b" : "#ffffff";
  const textColor = isPickup ? "#ffffff" : "#09090b";
  const border = isPickup ? "none" : "1.5px solid #09090b";

  el.innerHTML = `
    <div style="
      background:${bgColor};
      color:${textColor};
      padding:4px 11px;border-radius:100px;
      font-size:9.5px;font-weight:900;letter-spacing:0.12em;
      text-transform:uppercase;white-space:nowrap;
      border:${border};
      box-shadow:0 2px 8px rgba(0,0,0,0.18);
      font-family:system-ui,-apple-system,sans-serif;
      display:flex;align-items:center;gap:4px;
    ">
      <span style="width:6px;height:6px;background:${dotColor};border-radius:50%;display:inline-block;"></span>
      ${text}
    </div>
    <div style="width:2px;height:8px;background:#09090b;opacity:0.65"></div>
    <div style="
      width:12px;height:12px;
      background:${bgColor};
      border-radius:50%;
      border:2.5px solid ${isPickup ? "#ffffff" : "#09090b"};
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
    "></div>
  `;
  return el;
}

export default function LiveTrackingMap({
  driverLocation,
  pickupLocation,
  dropLocation,
  status,
  onStats,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const carIconRef = useRef<HTMLElement | null>(null);
  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);

  const lastPosRef = useRef<[number, number] | null>(null);
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
      pitch: 25, // 25-degree Uber-style road tracking view
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    const setupLayers = () => {
      // 1. Persistent Trip Route (Pickup -> Drop)
      if (!map.getSource("trip-route")) {
        map.addSource("trip-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });

        map.addLayer({
          id: "trip-casing",
          type: "line",
          source: "trip-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#000000",
            "line-width": 8.0,
            "line-opacity": 0.85,
          },
        });

        map.addLayer({
          id: "trip-core",
          type: "line",
          source: "trip-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#090d16", // Inverts to silver-white road line
            "line-width": 4.8,
            "line-opacity": 1.0,
          },
        });
      }

      // 2. Driver Approach Route (Driver -> Pickup)
      if (!map.getSource("driver-route")) {
        map.addSource("driver-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });

        map.addLayer({
          id: "driver-casing",
          type: "line",
          source: "driver-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#000000",
            "line-width": 7.0,
            "line-opacity": 0.85,
          },
        });

        map.addLayer({
          id: "driver-core",
          type: "line",
          source: "driver-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#ea580c", // Inverts to vivid cyan-blue on dark canvas
            "line-width": 4.2,
            "line-opacity": 0.95,
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
      const el = createPinEl("PICKUP", true);
      pickupMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([pickupLocation[1], pickupLocation[0]])
        .addTo(map);
    }

    if (!dropMarkerRef.current && dropLocation) {
      const el = createPinEl("DROP", false);
      dropMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([dropLocation[1], dropLocation[0]])
        .addTo(map);
    }
  }, [pickupLocation, dropLocation, ready]);

  /* ─── DYNAMIC DRIVER MOVEMENT & BEARING ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !driverLocation) return;

    // Calculate heading / bearing angle
    if (lastPosRef.current && carIconRef.current) {
      const dist = Math.hypot(
        driverLocation[0] - lastPosRef.current[0],
        driverLocation[1] - lastPosRef.current[1]
      );
      if (dist > 0.00005) {
        const bearing = calculateBearing(lastPosRef.current, driverLocation);
        carIconRef.current.style.transform = `rotate(${Math.round(bearing)}deg)`;
      }
    }
    lastPosRef.current = driverLocation;

    // Initialize or update driver marker
    if (!driverMarkerRef.current) {
      const { container, carIcon } = createDriverMarkerEl();
      carIconRef.current = carIcon;
      driverMarkerRef.current = new maplibregl.Marker({
        element: container,
        anchor: "center",
      })
        .setLngLat([driverLocation[1], driverLocation[0]])
        .addTo(map);
    } else {
      driverMarkerRef.current.setLngLat([driverLocation[1], driverLocation[0]]);
    }
  }, [driverLocation, ready]);

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
      padding: { top: 90, bottom: 90, left: 70, right: 70 },
      duration: 1000,
      maxZoom: 16.5,
    });
  }, [ready, pickupLocation, dropLocation, status]);

  return (
    <div className="uber-dark-map relative w-full h-full overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}