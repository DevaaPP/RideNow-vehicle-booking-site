"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation2, Layers, RotateCcw, MapPin, Check } from "lucide-react";
import { UBER_MINIMAL_MAP_STYLE } from "@/lib/mapConfig";

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
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.35));">
      <div style="
        background:#09090b;color:#ffffff;
        padding:5px 12px;border-radius:100px;
        font-size:10px;font-weight:900;letter-spacing:0.12em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        box-shadow:0 2px 10px rgba(0,0,0,0.25);
        display:flex;align-items:center;gap:5px;
      ">
        <span style="width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block;box-shadow:0 0 6px #22c55e;"></span>
        PICKUP
      </div>
      <div style="width:2px;height:9px;background:#09090b;opacity:0.8"></div>
      <div style="
        width:14px;height:14px;background:#09090b;border-radius:50%;
        border:3px solid #ffffff;
        box-shadow:0 0 0 2px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.35);
      "></div>
    </div>
  `;
  return el;
}

function createDropEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 16px rgba(0,0,0,0.28));">
      <div style="
        background:#ffffff;color:#09090b;
        padding:5px 12px;border-radius:100px;
        font-size:10px;font-weight:900;letter-spacing:0.12em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        border:1.5px solid #09090b;
        box-shadow:0 2px 10px rgba(0,0,0,0.18);
        display:flex;align-items:center;gap:5px;
      ">
        <span style="width:6px;height:6px;background:#ef4444;border-radius:50%;display:inline-block;box-shadow:0 0 6px #ef4444;"></span>
        DROP
      </div>
      <div style="width:2px;height:9px;background:#09090b;opacity:0.8"></div>
      <div style="
        width:14px;height:14px;background:#ffffff;border-radius:50%;
        border:3px solid #09090b;
        box-shadow:0 0 0 2px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.25);
      "></div>
    </div>
  `;
  return el;
}

function createStopEl(index: number): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 6px 14px rgba(37,99,235,0.3));">
      <div style="
        background:#2563eb;color:#ffffff;
        padding:4px 10px;border-radius:100px;
        font-size:9px;font-weight:900;letter-spacing:0.1em;
        text-transform:uppercase;white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        box-shadow:0 2px 8px rgba(37,99,235,0.35);
      ">STOP ${index + 1}</div>
      <div style="width:2px;height:8px;background:#2563eb;opacity:0.7"></div>
      <div style="
        width:11px;height:11px;background:#2563eb;border-radius:50%;
        border:2.5px solid #ffffff;
        box-shadow:0 0 0 2px rgba(37,99,235,0.25);
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
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
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
      background:#09090b;
      width:30px; height:30px;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 2px #fff, 0 4px 14px rgba(0,0,0,0.32);
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

/* ─── ROUTE LAYER HELPER (SAFE & CRASH-PROOF) ────────────────────────── */

function ensureRouteLayers(map: maplibregl.Map): boolean {
  if (!map.isStyleLoaded()) return false;

  if (!map.getSource("route-source")) {
    map.addSource("route-source", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] },
      },
    });

    // 1. Soft Shadow
    map.addLayer({
      id: "route-shadow",
      type: "line",
      source: "route-source",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#000000",
        "line-width": 16,
        "line-opacity": 0.12,
      },
    });

    // 2. High-contrast white casing (makes road route distinct on any surface)
    map.addLayer({
      id: "route-casing",
      type: "line",
      source: "route-source",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#ffffff",
        "line-width": 8.0,
        "line-opacity": 0.95,
      },
    });

    // 3. Core Bold Uber/Google Driving Line
    map.addLayer({
      id: "route-core",
      type: "line",
      source: "route-source",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#09090b",
        "line-width": 5.0,
        "line-opacity": 1.0,
      },
    });
  }
  return true;
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [km, setKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [routingEngine, setRoutingEngine] = useState<string>("osrm");
  const [pinMode, setPinMode] = useState<"pickup" | "drop" | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Sync coords from parent
  useEffect(() => {
    if (pickupCoords) {
      setP1(pickupCoords);
    } else if (!pickup) {
      setP1(null);
    }
  }, [pickupCoords, pickup]);

  useEffect(() => {
    if (dropCoords) {
      setP2(dropCoords);
    } else if (!drop) {
      setP2(null);
    }
  }, [dropCoords, drop]);

  /* ─── GEOCODE ADDRESS FALLBACK ─── */
  const geocodeAddress = async (q: string): Promise<[number, number] | null> => {
    if (!q || q.trim().length < 3) return null;
    try {
      const res = await fetch(`/api/places?action=geocode&address=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data?.results?.length) {
        const loc = data.results[0].geometry?.location;
        if (loc?.lat && loc?.lng) {
          return [loc.lat, loc.lng];
        }
      }
    } catch (err) {
      console.error("Geocoding failed for", q, err);
    }
    return null;
  };

  /* ─── REVERSE GEOCODE ─── */
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
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  };

  // If text is set but coordinates are missing, resolve them automatically
  useEffect(() => {
    if (!p1 && pickup && pickup.trim().length >= 3) {
      geocodeAddress(pickup).then((coords) => {
        if (coords) {
          setP1(coords);
          onCoordinatesChange?.(coords, p2);
        }
      });
    }
  }, [pickup, p1, p2, onCoordinatesChange]);

  useEffect(() => {
    if (!p2 && drop && drop.trim().length >= 3) {
      geocodeAddress(drop).then((coords) => {
        if (coords) {
          setP2(coords);
          onCoordinatesChange?.(p1, coords);
        }
      });
    }
  }, [drop, p1, p2, onCoordinatesChange]);

  /* ─── INITIALIZE MAPLIBRE ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = p1 ? [p1[1], p1[0]] : [78.9629, 20.5937]; // [lng, lat]
    const initialZoom = p1 ? 14 : 4.8;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: UBER_MINIMAL_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 12,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    const onStyleReady = () => {
      ensureRouteLayers(map);
      setMapLoaded(true);
    };

    map.on("load", onStyleReady);
    map.on("styledata", () => {
      if (map.isStyleLoaded()) {
        ensureRouteLayers(map);
        setMapLoaded(true);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── SAFE ROUTE APPLICATION ─── */
  const applyRouteToMap = useCallback(
    (coords: [number, number][]) => {
      const map = mapRef.current;
      if (!map) return;

      const setRouteData = () => {
        ensureRouteLayers(map);
        const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coords,
            },
          });
        }

        // Fit map bounds to encompass the entire route
        if (coords.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          for (const c of coords) {
            bounds.extend(c as [number, number]);
          }
          map.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 60, right: 60 },
            duration: 900,
            maxZoom: 16.5,
          });
        }
      };

      if (map.isStyleLoaded()) {
        setRouteData();
      } else {
        map.once("styledata", setRouteData);
      }
    },
    []
  );

  /* ─── ROUTE FETCHING VIA SERVER-SIDE API ─── */
  const renderRoute = useCallback(
    async (
      pickupPt: [number, number],
      dropPt: [number, number],
      interStops?: Array<{ address: string; lat: number; lng: number }>
    ) => {
      const validStops = (interStops || []).filter(
        (s) => s && typeof s.lat === "number" && typeof s.lng === "number"
      );
      const waypoints: [number, number][] = [
        pickupPt,
        ...validStops.map((s) => [s.lat, s.lng] as [number, number]),
        dropPt,
      ];

      const pointsParam = waypoints.map(([lat, lng]) => `${lat},${lng}`).join(";");
      setIsRouting(true);

      try {
        const res = await fetch(`/api/route?points=${encodeURIComponent(pointsParam)}`);
        const data = await res.json();

        if (data.success && data.primary) {
          const active = data.primary;
          setKm(active.distanceKm);
          setDurationMin(active.durationMinutes);
          setRoutingEngine(active.engine || "osrm");
          onDistance?.(active.distanceKm);

          applyRouteToMap(active.geojsonCoords);
        } else {
          console.warn("Route API returned failure:", data.error);
        }
      } catch (err) {
        console.error("Route fetching error:", err);
      } finally {
        setIsRouting(false);
      }
    },
    [onDistance, applyRouteToMap]
  );

  /* ─── CLICK ON MAP TO SET PIN ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const clickedPt: [number, number] = [lat, lng];

      if (pinMode === "pickup" || (!p1 && !pinMode)) {
        setP1(clickedPt);
        onCoordinatesChange?.(clickedPt, p2);
        const addr = await reverseGeocode(lat, lng);
        if (onChange) onChange(addr, drop, clickedPt, p2);
        // Seamlessly prompt for drop if not set
        if (!p2) setPinMode("drop");
        else setPinMode(null);
      } else if (pinMode === "drop" || (p1 && !p2 && !pinMode)) {
        setP2(clickedPt);
        onCoordinatesChange?.(p1, clickedPt);
        const addr = await reverseGeocode(lat, lng);
        if (onChange) onChange(pickup, addr, p1, clickedPt);
        setPinMode(null);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [pinMode, p1, p2, pickup, drop, onChange, onCoordinatesChange]);

  /* ─── SYNC MARKERS & TRIGGER ROUTE ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

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
          if (onChange) onChange(addr, drop, newPt, p2);
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
          if (onChange) onChange(pickup, addr, p1, newPt);
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
                `<div style="font-family:sans-serif;padding:3px 6px;"><strong style="color:#2563eb;font-size:11px;">STOP ${
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

    // 4. Trigger route calculation if both p1 and p2 are active
    if (p1 && p2) {
      renderRoute(p1, p2, stops);
    } else {
      if (map.isStyleLoaded()) {
        const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: [] },
          });
        }
      }
      setKm(null);
      setDurationMin(null);
    }
  }, [p1, p2, stops, mapLoaded, renderRoute, drop, onChange, onCoordinatesChange, pickup]);

  // 5. Smart Pickups Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

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
  }, [smartPickups, mapLoaded, onSelectSmartPickup]);

  // 6. Nearby Vehicle Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

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
  }, [vehicles, mapLoaded]);

  const handleReset = () => {
    setP1(null);
    setP2(null);
    onCoordinatesChange?.(null, null);
    if (onChange) onChange("", "");
    setPinMode(null);
    setKm(null);
    setDurationMin(null);
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-zinc-100">
      {/* MapLibre WebGL DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ── PINPOINT INTERACTIVE SELECTOR (TOP BAR) ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-zinc-200/90 p-1.5 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => setPinMode((prev) => (prev === "pickup" ? null : "pickup"))}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            pinMode === "pickup"
              ? "bg-zinc-900 text-white shadow-sm ring-2 ring-emerald-500/50"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          <span>Pin Pickup</span>
        </button>

        <button
          type="button"
          onClick={() => setPinMode((prev) => (prev === "drop" ? null : "drop"))}
          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            pinMode === "drop"
              ? "bg-zinc-900 text-white shadow-sm ring-2 ring-rose-500/50"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#ef4444]" />
          <span>Pin Drop</span>
        </button>

        {(p1 || p2) && (
          <button
            type="button"
            onClick={handleReset}
            title="Reset pins"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-all"
          >
            <RotateCcw size={14} />
          </button>
        )}

        {pinMode && (
          <span className="text-[11px] font-bold text-zinc-800 px-2 animate-pulse bg-amber-100 rounded-lg py-0.5">
            Click map to set {pinMode === "pickup" ? "Pickup 🟢" : "Drop 🔴"}
          </span>
        )}
      </div>

      {/* ── ZOOM & 3D TILT CONTROLS ── */}
      <div
        className="absolute bottom-6 right-4 z-20 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-900 font-bold shadow-md hover:bg-zinc-50 active:scale-95 transition-all"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-900 font-bold shadow-md hover:bg-zinc-50 active:scale-95 transition-all"
        >
          −
        </button>
        <button
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            const currentPitch = map.getPitch();
            map.easeTo({ pitch: currentPitch > 15 ? 0 : 35, duration: 400 });
          }}
          aria-label="Toggle 3D View"
          className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-700 shadow-md hover:bg-zinc-50 active:scale-95 transition-all"
        >
          <Layers size={16} />
        </button>
      </div>

      {/* ── ROUTE DISTANCE & ETA BADGE (BOTTOM LEFT) ── */}
      <AnimatePresence>
        {(km !== null || isRouting) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-zinc-200/90 px-4 py-2.5 rounded-2xl shadow-xl"
          >
            {isRouting ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                <span className="text-zinc-800 text-xs font-bold">Calculating best road route...</span>
              </div>
            ) : (
              <>
                <Navigation2 size={14} className="text-zinc-900" />
                <span className="text-zinc-900 text-xs font-black">{km} km</span>
                <span className="w-px h-3.5 bg-zinc-200" />
                <span className="text-zinc-600 text-xs font-semibold">
                  ~{durationMin ?? Math.max(3, Math.round(((km || 5) / 25) * 60))} min
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                  {routingEngine}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}