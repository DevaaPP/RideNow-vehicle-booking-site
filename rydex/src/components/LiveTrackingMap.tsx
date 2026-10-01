"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { VOYAGER_MAP_STYLE } from "@/lib/mapConfig";
import { getValhallaRoute } from "@/lib/valhalla";

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
  carIcon.style.width = "42px";
  carIcon.style.height = "42px";
  carIcon.style.background = "#0a0a0a";
  carIcon.style.borderRadius = "50%";
  carIcon.style.display = "flex";
  carIcon.style.alignItems = "center";
  carIcon.style.justifyContent = "center";
  carIcon.style.boxShadow =
    "0 0 0 3px #ffffff, 0 0 0 5px #0a0a0a, 0 8px 24px rgba(0,0,0,0.4)";
  carIcon.style.transition = "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)";

  carIcon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5H17.5L19 11" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="3" y="11" width="18" height="7" rx="2" stroke="white" stroke-width="1.6"/>
      <circle cx="7.5" cy="18.5" r="1.5" fill="white"/>
      <circle cx="16.5" cy="18.5" r="1.5" fill="white"/>
      <path d="M3 14H21" stroke="white" stroke-width="1" opacity="0.35"/>
    </svg>
  `;

  container.appendChild(carIcon);
  return { container, carIcon };
}

function createPinEl(text: string, isBlack: boolean): HTMLElement {
  const el = document.createElement("div");
  el.style.display = "flex";
  el.style.flexDirection = "column";
  el.style.alignItems = "center";
  el.style.filter = "drop-shadow(0 4px 14px rgba(0,0,0,0.22))";

  el.innerHTML = `
    <div style="
      background:${isBlack ? "#0a0a0a" : "#ffffff"};
      color:${isBlack ? "#ffffff" : "#0a0a0a"};
      padding:4px 12px;border-radius:100px;
      font-size:9.5px;font-weight:800;letter-spacing:0.12em;
      text-transform:uppercase;white-space:nowrap;
      border:${isBlack ? "none" : "1.5px solid #0a0a0a"};
      box-shadow:0 2px 10px rgba(0,0,0,0.18);
      font-family:system-ui,-apple-system,sans-serif;
    ">${text}</div>
    <div style="width:2px;height:8px;background:#0a0a0a;opacity:0.6"></div>
    <div style="
      width:11px;height:11px;
      background:${isBlack ? "#0a0a0a" : "#ffffff"};
      border-radius:50%;
      border:2.5px solid ${isBlack ? "#ffffff" : "#0a0a0a"};
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
      style: VOYAGER_MAP_STYLE,
      center: initialCenter,
      zoom: 15.5,
      pitch: 30, // 30-degree Uber-style road tracking angle
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      // Add route source and styling layers
      if (!map.getSource("tracking-route")) {
        map.addSource("tracking-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });

        // 1. Soft Shadow
        map.addLayer({
          id: "tracking-shadow",
          type: "line",
          source: "tracking-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0a0a0a",
            "line-width": 12,
            "line-opacity": 0.08,
          },
        });

        // 2. Casing
        map.addLayer({
          id: "tracking-casing",
          type: "line",
          source: "tracking-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#18181b",
            "line-width": 5.5,
            "line-opacity": 0.3,
          },
        });

        // 3. Vibrant Core
        map.addLayer({
          id: "tracking-core",
          type: "line",
          source: "tracking-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0a0a0a",
            "line-width": 3.5,
            "line-opacity": 1,
          },
        });
      }

      setReady(true);
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

    // Smooth auto-follow camera tracking
    map.easeTo({
      center: [driverLocation[1], driverLocation[0]],
      zoom: Math.max(map.getZoom(), 15.5),
      duration: 800,
    });
  }, [driverLocation, ready]);

  /* ─── RE-ROUTE CALCULATION WITH VALHALLA ─── */
  const updateRoute = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const currentOrigin = driverLocation || pickupLocation;
    const currentDest = status === "arriving" ? pickupLocation : dropLocation;

    try {
      const routeData = await getValhallaRoute([currentOrigin, currentDest], {
        alternates: 0,
      });
      const active = routeData.primary;

      const source = map.getSource("tracking-route") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: active.geojsonCoords,
          },
        });
      }

      if (onStats) {
        if (status === "arriving") {
          onStats({
            distanceToPickup: active.distanceKm,
            durationToPickup: active.durationMinutes,
            distanceToDrop: 0,
            durationToDrop: 0,
          });
        } else {
          onStats({
            distanceToPickup: 0,
            durationToPickup: 0,
            distanceToDrop: active.distanceKm,
            durationToDrop: active.durationMinutes,
          });
        }
      }
    } catch (err) {
      console.error("Live route update error:", err);
    }
  }, [driverLocation, pickupLocation, dropLocation, status, ready, onStats]);

  useEffect(() => {
    updateRoute();
  }, [updateRoute]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-zinc-100">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}