"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation2, Compass, Layers } from "lucide-react";
import { VOYAGER_MAP_STYLE } from "@/lib/mapConfig";
import { getValhallaRoute, MultiRouteResult, RouteResult } from "@/lib/valhalla";

type Props = {
  pickup: string;
  drop: string;
  pickupCoords?: [number, number] | null;
  dropCoords?: [number, number] | null;
  onDistance?: (km: number) => void;
  onChange?: (
    pickup: string,
    drop: string,
    p1?: [number, number] | null,
    p2?: [number, number] | null,
    pickupCountry?: string | null
  ) => void;
  onCoordinatesChange?: (
    p1: [number, number] | null,
    p2: [number, number] | null
  ) => void;
  vehicles?: any[];
  disableFallbackGeocode?: boolean;
  smartPickups?: any[];
  onSelectSmartPickup?: (spot: any) => void;
  stops?: Array<{ address: string; lat: number; lng: number }>;
};

/* ─── DOM MARKER GENERATORS ────────────────────────────────────────── */

function createPickupEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.28));">
      <div style="
        background:#0a0a0a;color:#fff;
        padding:5px 14px;border-radius:100px;
        font-size:10px;font-weight:800;letter-spacing:0.14em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,system-ui,sans-serif;
        box-shadow:0 2px 12px rgba(0,0,0,0.25);
      ">PICKUP</div>
      <div style="width:2px;height:10px;background:#0a0a0a;opacity:0.6"></div>
      <div style="
        width:13px;height:13px;background:#0a0a0a;border-radius:50%;
        border:3px solid #fff;
        box-shadow:0 0 0 2px rgba(0,0,0,0.18), 0 3px 8px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;
  return el;
}

function createDropEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.2));">
      <div style="
        background:#fff;color:#0a0a0a;
        padding:5px 14px;border-radius:100px;
        font-size:10px;font-weight:800;letter-spacing:0.14em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,system-ui,sans-serif;
        border:1.5px solid #0a0a0a;
        box-shadow:0 2px 12px rgba(0,0,0,0.15);
      ">DROP</div>
      <div style="width:2px;height:10px;background:#0a0a0a;opacity:0.6"></div>
      <div style="
        width:13px;height:13px;background:#fff;border-radius:50%;
        border:3px solid #0a0a0a;
        box-shadow:0 0 0 2px rgba(0,0,0,0.1), 0 3px 8px rgba(0,0,0,0.2);
      "></div>
    </div>
  `;
  return el;
}

function createStopEl(index: number): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 16px rgba(37,99,235,0.25));">
      <div style="
        background:#2563eb;color:#fff;
        padding:4px 10px;border-radius:100px;
        font-size:9px;font-weight:900;letter-spacing:0.12em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,system-ui,sans-serif;
        box-shadow:0 2px 10px rgba(37,99,235,0.35);
      ">STOP ${index + 1}</div>
      <div style="width:2px;height:8px;background:#2563eb;opacity:0.6"></div>
      <div style="
        width:12px;height:12px;background:#2563eb;border-radius:50%;
        border:2.5px solid #fff;
        box-shadow:0 0 0 2px rgba(37,99,235,0.2), 0 3px 8px rgba(0,0,0,0.25);
      "></div>
    </div>
  `;
  return el;
}

function createSmartPickupEl(spot: any): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-pointer transition-transform hover:scale-110";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 12px rgba(16,185,129,0.35));">
      <div style="
        background:#10b981;color:#fff;
        padding:4px 10px;border-radius:100px;
        font-size:9px;font-weight:800;letter-spacing:0.08em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,system-ui,sans-serif;
        box-shadow:0 2px 8px rgba(16,185,129,0.4);
      ">🚶 ${spot.spotName || "HOTSPOT"}</div>
      <div style="width:2px;height:6px;background:#10b981;opacity:0.6"></div>
      <div style="
        width:10px;height:10px;background:#10b981;border-radius:50%;
        border:2px solid #fff;
      "></div>
    </div>
  `;
  return el;
}

function createVehicleEl(type: string): HTMLElement {
  const isBike = type === "bike";
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="
      background:#0a0a0a;
      width:30px; height:30px;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 2px #fff, 0 4px 14px rgba(0,0,0,0.28);
    ">
      ${
        isBike
          ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`
          : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M5 11L6.5 6.5H17.5L19 11"/><rect x="3" y="11" width="18" height="7" rx="2"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/></svg>`
      }
    </div>
  `;
  return el;
}

export default function RouteMap({
  pickup,
  drop,
  pickupCoords,
  dropCoords,
  onDistance,
  onChange,
  onCoordinatesChange,
  vehicles,
  disableFallbackGeocode,
  smartPickups,
  onSelectSmartPickup,
  stops,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const smartPickupMarkersRef = useRef<maplibregl.Marker[]>([]);
  const vehicleMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [p1, setP1] = useState<[number, number] | null>(pickupCoords ?? null);
  const [p2, setP2] = useState<[number, number] | null>(dropCoords ?? null);
  const [ready, setReady] = useState(false);
  const [km, setKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [routingEngine, setRoutingEngine] = useState<string>("valhalla");

  // Keep state synced with incoming props
  useEffect(() => {
    if (pickupCoords) setP1(pickupCoords);
  }, [pickupCoords]);

  useEffect(() => {
    if (dropCoords) setP2(dropCoords);
  }, [dropCoords]);

  /* ─── GEOCODING UTILITIES ─── */
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const r = await fetch(`/api/places?action=geocode&lat=${lat}&lng=${lon}`);
      const d = await r.json();
      if (d?.results?.length) {
        return d.results[0].formatted_address;
      }
    } catch (err) {
      console.error("Reverse geocode failed:", err);
    }
    return "";
  };

  /* ─── INITIALIZE MAPLIBRE ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = p1 ? [p1[1], p1[0]] : [78.9629, 20.5937]; // [lng, lat]
    const initialZoom = p1 ? 13 : 4.5;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: VOYAGER_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 15, // Subtle 3D perspective like modern ride apps
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      // Add empty route sources & layers
      if (!map.getSource("route-source")) {
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          },
        });

        // 1. Soft Shadow Layer
        map.addLayer({
          id: "route-shadow",
          type: "line",
          source: "route-source",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0a0a0a",
            "line-width": 14,
            "line-opacity": 0.08,
          },
        });

        // 2. Route Casing Layer
        map.addLayer({
          id: "route-casing",
          type: "line",
          source: "route-source",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#18181b",
            "line-width": 6,
            "line-opacity": 0.35,
          },
        });

        // 3. Core Vibrant Route Layer
        map.addLayer({
          id: "route-core",
          type: "line",
          source: "route-source",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#0a0a0a",
            "line-width": 3.8,
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

  /* ─── UPDATE ROUTE & LAYERS ─── */
  const renderRoute = useCallback(
    async (
      pickupPt: [number, number],
      dropPt: [number, number],
      interStops?: Array<{ address: string; lat: number; lng: number }>
    ) => {
      const map = mapRef.current;
      if (!map || !map.isStyleLoaded()) return;

      const validStops = (interStops || []).filter(
        (s) => s && typeof s.lat === "number" && typeof s.lng === "number"
      );
      const waypoints: [number, number][] = [
        pickupPt,
        ...validStops.map((s) => [s.lat, s.lng] as [number, number]),
        dropPt,
      ];

      try {
        const routeData: MultiRouteResult = await getValhallaRoute(waypoints);
        const activeRoute = routeData.primary;

        setKm(activeRoute.distanceKm);
        setDurationMin(activeRoute.durationMinutes);
        setRoutingEngine(activeRoute.engine);
        onDistance?.(activeRoute.distanceKm);

        const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: activeRoute.geojsonCoords,
            },
          });
        }

        // Fit map bounds to accommodate entire route
        const bounds = new maplibregl.LngLatBounds();
        for (const coord of activeRoute.geojsonCoords) {
          bounds.extend(coord as [number, number]);
        }

        map.fitBounds(bounds, {
          padding: { top: 75, bottom: 85, left: 60, right: 60 },
          duration: 900,
          maxZoom: 16.5,
        });
      } catch (err) {
        console.error("Failed to render Valhalla route:", err);
      }
    },
    [onDistance]
  );

  /* ─── UPDATE MARKERS ON MAP ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // 1. Pickup Marker
    if (p1) {
      if (!pickupMarkerRef.current) {
        const el = createPickupEl();
        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([p1[1], p1[0]])
          .addTo(map);

        marker.on("dragend", async () => {
          const lngLat = marker.getLngLat();
          const newPt: [number, number] = [lngLat.lat, lngLat.lng];
          setP1(newPt);
          onCoordinatesChange?.(newPt, p2);
          const addr = await reverseGeocode(newPt[0], newPt[1]);
          if (addr && onChange) onChange(addr, drop, newPt, p2);
        });

        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLngLat([p1[1], p1[0]]);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    // 2. Drop Marker
    if (p2) {
      if (!dropMarkerRef.current) {
        const el = createDropEl();
        const marker = new maplibregl.Marker({
          element: el,
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([p2[1], p2[0]])
          .addTo(map);

        marker.on("dragend", async () => {
          const lngLat = marker.getLngLat();
          const newPt: [number, number] = [lngLat.lat, lngLat.lng];
          setP2(newPt);
          onCoordinatesChange?.(p1, newPt);
          const addr = await reverseGeocode(newPt[0], newPt[1]);
          if (addr && onChange) onChange(pickup, addr, p1, newPt);
        });

        dropMarkerRef.current = marker;
      } else {
        dropMarkerRef.current.setLngLat([p2[1], p2[0]]);
      }
    } else if (dropMarkerRef.current) {
      dropMarkerRef.current.remove();
      dropMarkerRef.current = null;
    }

    // 3. Multi-stop markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];
    if (stops && stops.length > 0) {
      stops.forEach((s, idx) => {
        if (typeof s.lat === "number" && typeof s.lng === "number") {
          const el = createStopEl(idx);
          const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat([s.lng, s.lat])
            .setPopup(
              new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(
                `<div style="font-family:sans-serif;padding:2px 4px;"><strong style="color:#2563eb;font-size:11px;">STOP ${
                  idx + 1
                }</strong><p style="font-size:10px;margin:2px 0 0 0;color:#333;">${
                  s.address
                }</p></div>`
              )
            )
            .addTo(map);
          stopMarkersRef.current.push(marker);
        }
      });
    }

    // 4. Render Route if both endpoints are set
    if (p1 && p2) {
      renderRoute(p1, p2, stops);
    } else {
      // Clear route
      const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
      setKm(null);
      setDurationMin(null);
    }
  }, [p1, p2, stops, ready, renderRoute]);

  // 5. Smart Pickups Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    smartPickupMarkersRef.current.forEach((m) => m.remove());
    smartPickupMarkersRef.current = [];

    if (smartPickups && smartPickups.length > 0) {
      smartPickups.forEach((spot) => {
        const el = createSmartPickupEl(spot);
        el.onclick = () => onSelectSmartPickup?.(spot);
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([spot.lng, spot.lat])
          .addTo(map);
        smartPickupMarkersRef.current.push(marker);
      });
    }
  }, [smartPickups, ready, onSelectSmartPickup]);

  // 6. Nearby Vehicle Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    vehicleMarkersRef.current.forEach((m) => m.remove());
    vehicleMarkersRef.current = [];

    if (vehicles && vehicles.length > 0) {
      vehicles.forEach((v) => {
        const loc = v.location?.coordinates || v.location;
        if (!loc || loc.length < 2) return;
        const [lng, lat] = loc;
        const el = createVehicleEl(v.type || "car");
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        vehicleMarkersRef.current.push(marker);
      });
    }
  }, [vehicles, ready]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-zinc-100">
      {/* MapLibre DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ── ZOOM & PITCH CONTROLS ── */}
      <div
        className="absolute bottom-6 right-4 z-20 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-900 font-semibold shadow-md hover:bg-zinc-50 active:scale-95 transition-all"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-900 font-semibold shadow-md hover:bg-zinc-50 active:scale-95 transition-all"
        >
          −
        </button>
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const currentPitch = map.getPitch();
            map.easeTo({ pitch: currentPitch > 25 ? 0 : 45, duration: 400 });
          }}
          aria-label="Toggle 3D View"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-700 shadow-md hover:bg-zinc-50 active:scale-95 transition-all"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* ── LOADING OVERLAY ── */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-30 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-4"
          >
            <div className="relative w-14 h-14 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900"
              />
              <MapPin size={16} className="text-zinc-900" />
            </div>
            <div className="text-center">
              <p className="text-zinc-900 text-xs font-black tracking-[0.2em] uppercase">
                MapLibre + Valhalla
              </p>
              <p className="text-zinc-500 text-[11px] font-medium mt-0.5">
                Rendering OpenStreetMap route…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ROUTE DISTANCE & ETA BADGE ── */}
      <AnimatePresence>
        {ready && km !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-zinc-200/90 px-3.5 py-2 rounded-2xl shadow-xl"
          >
            <Navigation2 size={14} className="text-zinc-900" />
            <span className="text-zinc-900 text-xs font-black">{km} km</span>
            <span className="w-px h-3.5 bg-zinc-200" />
            <span className="text-zinc-600 text-xs font-medium">
              ~{durationMin ?? Math.max(3, Math.round((km / 25) * 60))} min
            </span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
              {routingEngine}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}