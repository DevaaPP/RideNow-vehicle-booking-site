"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Plus, Minus, RotateCcw, MapPin, Check, X, Loader2 } from "lucide-react";
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
    pickupCountry?: string | null,
    pickupDetails?: any,
    dropDetails?: any
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
  bottomPadding?: number;
  selectionMode?: "none" | "pickup" | "drop";
  onSelectionModeChange?: (mode: "none" | "pickup" | "drop") => void;
  onConfirmPinSelection?: (
    mode: "pickup" | "drop",
    coords: [number, number],
    address: string,
    details?: any
  ) => void;
};

/* ─── DOM MARKER GENERATORS (ELEVATED STEM ZERO-COLLISION CALLOUTS) ─────── */

function createPickupEl(durationMin?: number | null): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none flex flex-col items-center pointer-events-auto";

  const etaBadge = durationMin && durationMin > 0 ? ` • ${durationMin} min` : "";

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.3));transform:translateY(3px);">
      <!-- Elevated Callout Badge -->
      <div style="
        background: #09090b;
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 2px;
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        white-space: nowrap;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 1.5px solid #ffffff;
        display: flex;
        align-items: center;
        gap: 5px;
      ">
        <span style="width:5px;height:5px;border-radius:1px;background:#ffffff;display:inline-block;"></span>
        PICKUP${etaBadge}
      </div>

      <!-- Hairline Elevated Stem -->
      <div style="
        width: 2px;
        height: 18px;
        background: #09090b;
        box-shadow: -0.5px 0 0 0.5px #ffffff, 0.5px 0 0 0.5px #ffffff;
      "></div>

      <!-- Precision Road Contact Anchor Square -->
      <div style="
        width: 8px;
        height: 8px;
        background: #09090b;
        border-radius: 1px;
        border: 2px solid #ffffff;
        box-shadow: 0 0 0 1.5px #09090b;
      "></div>
    </div>
  `;
  return el;
}

function createDropEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none flex flex-col items-center pointer-events-auto";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.3));transform:translateY(3px);">
      <!-- Elevated Callout Badge -->
      <div style="
        background: #ffffff;
        color: #09090b;
        padding: 4px 8px;
        border-radius: 2px;
        font-size: 9.5px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        white-space: nowrap;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        border: 2px solid #09090b;
        display: flex;
        align-items: center;
        gap: 5px;
      ">
        <span style="width:5px;height:5px;border-radius:1px;border:1.5px solid #09090b;background:#ffffff;display:inline-block;"></span>
        DROP
      </div>

      <!-- Hairline Elevated Stem -->
      <div style="
        width: 2px;
        height: 18px;
        background: #09090b;
        box-shadow: -0.5px 0 0 0.5px #ffffff, 0.5px 0 0 0.5px #ffffff;
      "></div>

      <!-- Precision Road Contact Anchor Square -->
      <div style="
        width: 8px;
        height: 8px;
        background: #ffffff;
        border-radius: 1px;
        border: 2px solid #09090b;
        box-shadow: 0 0 0 1.5px #ffffff;
      "></div>
    </div>
  `;
  return el;
}

function createStopEl(index: number): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.3));">
      <div style="
        background:#09090b;color:#ffffff;
        padding:3px 8px;border-radius:2px;
        font-size:9px;font-weight:900;
        white-space:nowrap;
        border:1.5px solid #ffffff;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      ">STOP ${index + 1}</div>
      <div style="width:2px;height:6px;background:#09090b;"></div>
      <div style="
        width:8px;height:8px;background:#09090b;border-radius:1px;
        border:2px solid #ffffff;
      "></div>
    </div>
  `;
  return el;
}

function createAutoRickshawEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "select-none pointer-events-none";
  el.innerHTML = `
    <div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.35));display:flex;align-items:center;justify-content:center;">
      <svg width="34" height="28" viewBox="0 0 34 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="28" height="13" rx="6" fill="#fbbf24" stroke="#09090b" stroke-width="1.8"/>
        <rect x="3" y="14" width="28" height="9" rx="2" fill="#15803d" stroke="#09090b" stroke-width="1.8"/>
        <rect x="8" y="5" width="18" height="7" rx="1.5" fill="#1e293b"/>
        <circle cx="9" cy="23" r="2.8" fill="#09090b"/>
        <circle cx="25" cy="23" r="2.8" fill="#09090b"/>
      </svg>
    </div>
  `;
  return el;
}

function createCarEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "select-none pointer-events-none";
  el.innerHTML = `
    <div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,0.3));display:flex;align-items:center;justify-content:center;">
      <div style="
        background:#ffffff;
        width:28px;height:28px;border-radius:50%;
        border:2px solid #09090b;
        display:flex;align-items:center;justify-content:center;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#09090b" stroke-width="2.2" stroke-linecap="round">
          <path d="M5 11L6.5 6.5H17.5L19 11"/><rect x="3" y="11" width="18" height="7" rx="2"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="16.5" cy="18.5" r="1.5"/>
        </svg>
      </div>
    </div>
  `;
  return el;
}

function ensureRouteLayers(map: maplibregl.Map): boolean {
  if (!map) return false;

  try {
    // 1. Alternative Route Source & Layers
    if (!map.getSource("route-alt-source")) {
      map.addSource("route-alt-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });
    }

    if (!map.getLayer("route-alt-casing")) {
      map.addLayer({
        id: "route-alt-casing",
        type: "line",
        source: "route-alt-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 7.0,
          "line-opacity": 0.8,
        },
      });
    }

    if (!map.getLayer("route-alt-core")) {
      map.addLayer({
        id: "route-alt-core",
        type: "line",
        source: "route-alt-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#94a3b8",
          "line-width": 4.5,
          "line-opacity": 0.85,
        },
      });
    }

    // 2. Primary Route Source & Layers (Vivid, road-following Google Maps style)
    if (!map.getSource("route-source")) {
      map.addSource("route-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        },
      });
    }

    // White halo casing for maximum contrast over OSM roads
    if (!map.getLayer("route-casing")) {
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 9.5,
          "line-opacity": 1.0,
        },
      });
    }

    // Core road polyline — vivid blue route line
    if (!map.getLayer("route-core")) {
      map.addLayer({
        id: "route-core",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#2563eb",
          "line-width": 5.5,
          "line-opacity": 1.0,
        },
      });
    }
    return true;
  } catch (e) {
    return false;
  }
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
  disableFallbackGeocode = false,
  smartPickups,
  onSelectSmartPickup,
  stops,
  bottomPadding = 340,
  selectionMode,
  onSelectionModeChange,
  onConfirmPinSelection,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const vehicleMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRouteCoordsRef = useRef<[number, number][]>([]);
  const lastAltCoordsRef = useRef<[number, number][]>([]);
  const lastRouteKeyRef = useRef<string>("");
  const hasFittedRouteRef = useRef<string | null>(null);
  const prevActivePinModeRef = useRef<"pickup" | "drop" | null>(null);

  const svgCasingRef = useRef<SVGPathElement | null>(null);
  const svgCoreRef = useRef<SVGPathElement | null>(null);
  const svgAltCasingRef = useRef<SVGPathElement | null>(null);
  const svgAltCoreRef = useRef<SVGPathElement | null>(null);

  const [p1, setP1] = useState<[number, number] | null>(pickupCoords ?? null);
  const [p2, setP2] = useState<[number, number] | null>(dropCoords ?? null);
  const [km, setKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Centralized Fixed Pin Mode state machine
  const [activePinMode, setActivePinMode] = useState<"pickup" | "drop" | null>(
    selectionMode && selectionMode !== "none" ? selectionMode : null
  );
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [pinAddress, setPinAddress] = useState<string>("");
  const [pinDetails, setPinDetails] = useState<any>(null);
  const [isPinGeocoding, setIsPinGeocoding] = useState(false);
  const reverseGeocodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync coords strictly from explicit parent coordinates
  useEffect(() => {
    setP1(pickupCoords ?? null);
  }, [pickupCoords]);

  useEffect(() => {
    setP2(dropCoords ?? null);
  }, [dropCoords]);

  // Synchronize selectionMode from parent prop
  useEffect(() => {
    if (selectionMode !== undefined) {
      const target = selectionMode === "none" ? null : selectionMode;
      setActivePinMode(target);
    }
  }, [selectionMode]);

  /* ─── GEOCODE ADDRESS WITH PROXIMITY BIAS ─── */
  const geocodeAddress = async (
    q: string,
    biasPt?: [number, number] | null
  ): Promise<[number, number] | null> => {
    if (!q || q.trim().length < 2) return null;
    try {
      let url = `/api/places?action=geocode&address=${encodeURIComponent(q.trim())}`;
      if (biasPt) {
        url += `&lat=${biasPt[0]}&lng=${biasPt[1]}`;
      }
      const res = await fetch(url);
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

  /* ─── REVERSE GEOCODE WITH STRUCTURED DETAILS ─── */
  const reverseGeocodeFull = useCallback(
    async (lat: number, lon: number): Promise<{ address: string; details: any }> => {
      try {
        const r = await fetch(`/api/places?action=geocode&lat=${lat}&lng=${lon}`);
        const d = await r.json();
        if (d?.results?.length) {
          const first = d.results[0];
          const countryCode = first.address_components?.find((c: any) => c.types?.includes("country"))?.short_name || "in";
          const addr = first.formatted_address || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          return {
            address: addr,
            details: {
              name: first.name || addr.split(",")[0],
              formattedAddress: addr,
              locality: first.locality || "",
              city: first.city || "",
              state: first.state || "",
              postalCode: first.postalCode || "",
              countrycode: countryCode,
              coordinates: [lat, lon],
            },
          };
        }
      } catch (err) {
        console.error("Reverse geocode failed:", err);
      }
      const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      return {
        address: fallback,
        details: {
          name: "Pinned Location",
          formattedAddress: fallback,
          coordinates: [lat, lon],
        },
      };
    },
    []
  );

  // Route and coordinates are strictly established upon explicit location selection
  // (autocomplete selection, recent destinations, GPS, or map pin confirmation).
  // Keystrokes while typing do NOT trigger background geocoding or premature routing.

  /* ─── INITIALIZE MAPLIBRE ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = p1 ? [p1[1], p1[0]] : [91.7516, 26.1884]; // Guwahati default [lng, lat]
    const initialZoom = p1 ? 13.5 : 12;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: UBER_MINIMAL_MAP_STYLE,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 0,
      attributionControl: false,
    });

    const updateSvgOverlay = () => {
      const m = mapRef.current;
      if (!m) return;

      const coords = lastRouteCoordsRef.current;
      if (coords && coords.length > 0) {
        let d = "";
        for (let i = 0; i < coords.length; i++) {
          const pt = m.project(coords[i]);
          d += (i === 0 ? "M " : " L ") + pt.x.toFixed(1) + " " + pt.y.toFixed(1);
        }
        if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", d);
        if (svgCoreRef.current) svgCoreRef.current.setAttribute("d", d);
      } else {
        if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", "");
        if (svgCoreRef.current) svgCoreRef.current.setAttribute("d", "");
      }

      // Explicit purge of alternative line
      const altCoords = lastAltCoordsRef.current;
      if (altCoords && altCoords.length > 0) {
        let dAlt = "";
        for (let i = 0; i < altCoords.length; i++) {
          const pt = m.project(altCoords[i]);
          dAlt += (i === 0 ? "M " : " L ") + pt.x.toFixed(1) + " " + pt.y.toFixed(1);
        }
        if (svgAltCasingRef.current) svgAltCasingRef.current.setAttribute("d", dAlt);
        if (svgAltCoreRef.current) svgAltCoreRef.current.setAttribute("d", dAlt);
      } else {
        if (svgAltCasingRef.current) svgAltCasingRef.current.setAttribute("d", "");
        if (svgAltCoreRef.current) svgAltCoreRef.current.setAttribute("d", "");
      }
    };

    const onReady = () => {
      ensureRouteLayers(map);
      if (lastRouteCoordsRef.current && lastRouteCoordsRef.current.length > 0) {
        const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: lastRouteCoordsRef.current,
            },
          });
        }
      }
      updateSvgOverlay();
    };

    map.on("load", onReady);
    map.on("styledata", onReady);
    map.on("render", updateSvgOverlay);
    map.on("move", updateSvgOverlay);
    map.on("zoom", updateSvgOverlay);
    map.on("resize", updateSvgOverlay);

    mapRef.current = map;

    return () => {
      if (routeRetryTimerRef.current) {
        clearInterval(routeRetryTimerRef.current);
        routeRetryTimerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── MOVING MAP & CENTRAL PIN EVENT HANDLERS ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMoveStart = () => {
      if (!activePinMode) return;
      setIsMapMoving(true);
      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
        reverseGeocodeTimerRef.current = null;
      }
    };

    const handleMoveEnd = () => {
      if (!activePinMode) return;
      setIsMapMoving(false);
      setIsPinGeocoding(true);

      const center = map.getCenter();
      const lat = center.lat;
      const lng = center.lng;

      if (reverseGeocodeTimerRef.current) {
        clearTimeout(reverseGeocodeTimerRef.current);
      }

      reverseGeocodeTimerRef.current = setTimeout(async () => {
        const res = await reverseGeocodeFull(lat, lng);
        setPinAddress(res.address);
        setPinDetails(res.details);
        setIsPinGeocoding(false);
      }, 250);
    };

    map.on("movestart", handleMoveStart);
    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("movestart", handleMoveStart);
      map.off("moveend", handleMoveEnd);
    };
  }, [activePinMode, reverseGeocodeFull]);

  // Handle switching into / out of activePinMode (smooth camera ease ONCE on entry)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activePinMode && activePinMode !== prevActivePinModeRef.current) {
      if (activePinMode === "pickup") {
        const target: [number, number] = p1 ? [p1[1], p1[0]] : [91.7516, 26.1884];
        map.easeTo({ center: target, zoom: 16, duration: 600 });
        setPinAddress(pickup || "Moving map to pinpoint pickup...");
        setIsPinGeocoding(true);
        reverseGeocodeFull(target[1], target[0]).then((res) => {
          setPinAddress(res.address);
          setPinDetails(res.details);
          setIsPinGeocoding(false);
        });
      } else if (activePinMode === "drop") {
        const target: [number, number] = p2 ? [p2[1], p2[0]] : (p1 ? [p1[1], p1[0]] : [91.7516, 26.1884]);
        map.easeTo({ center: target, zoom: 16, duration: 600 });
        setPinAddress(drop || "Moving map to pinpoint drop...");
        setIsPinGeocoding(true);
        reverseGeocodeFull(target[1], target[0]).then((res) => {
          setPinAddress(res.address);
          setPinDetails(res.details);
          setIsPinGeocoding(false);
        });
      }
    }
    prevActivePinModeRef.current = activePinMode;
  }, [activePinMode, p1, p2, pickup, drop, reverseGeocodeFull]);

  /* ─── CONFIRM PIN SELECTION HANDLER ─── */
  const handleConfirmPin = async () => {
    const map = mapRef.current;
    if (!map || !activePinMode) return;

    const center = map.getCenter();
    const confirmedCoords: [number, number] = [center.lat, center.lng];
    let address = pinAddress;
    let details = pinDetails;

    if (!address || address.includes("Moving map")) {
      const res = await reverseGeocodeFull(center.lat, center.lng);
      address = res.address;
      details = res.details;
    }

    if (activePinMode === "pickup") {
      setP1(confirmedCoords);
      onCoordinatesChange?.(confirmedCoords, p2);
      onConfirmPinSelection?.("pickup", confirmedCoords, address, details);
      if (onChange) onChange(address, drop, confirmedCoords, p2, details?.countrycode || "in", details);
    } else if (activePinMode === "drop") {
      setP2(confirmedCoords);
      onCoordinatesChange?.(p1, confirmedCoords);
      onConfirmPinSelection?.("drop", confirmedCoords, address, details);
      if (onChange) onChange(pickup, address, p1, confirmedCoords, details?.countrycode || "in", undefined, details);
    }

    setActivePinMode(null);
    onSelectionModeChange?.("none");
  };

  const handleCancelPin = () => {
    setActivePinMode(null);
    onSelectionModeChange?.("none");
  };

  /* ─── SAFE & CRASH-PROOF ROUTE RENDERING ─── */
  const applyRouteLine = useCallback(
    (coords: [number, number][], altCoords?: [number, number][], routeKey?: string) => {
      lastRouteCoordsRef.current = coords || [];
      // STRICT FIX: Always clear alternative coords when none provided (prevents frozen grey line bug)
      lastAltCoordsRef.current = altCoords && altCoords.length > 0 ? altCoords : [];
      const map = mapRef.current;
      if (!map) return;

      // Update SVG overlay immediately (zero-lag 2D compositor)
      if (coords && coords.length > 0) {
        let d = "";
        for (let i = 0; i < coords.length; i++) {
          const pt = map.project(coords[i]);
          d += (i === 0 ? "M " : " L ") + pt.x.toFixed(1) + " " + pt.y.toFixed(1);
        }
        if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", d);
        if (svgCoreRef.current) svgCoreRef.current.setAttribute("d", d);
      } else {
        if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", "");
        if (svgCoreRef.current) svgCoreRef.current.setAttribute("d", "");
      }

      if (altCoords && altCoords.length > 0) {
        let dAlt = "";
        for (let i = 0; i < altCoords.length; i++) {
          const pt = map.project(altCoords[i]);
          dAlt += (i === 0 ? "M " : " L ") + pt.x.toFixed(1) + " " + pt.y.toFixed(1);
        }
        if (svgAltCasingRef.current) svgAltCasingRef.current.setAttribute("d", dAlt);
        if (svgAltCoreRef.current) svgAltCoreRef.current.setAttribute("d", dAlt);
      } else {
        // Clear immediately if no alternative
        if (svgAltCasingRef.current) svgAltCasingRef.current.setAttribute("d", "");
        if (svgAltCoreRef.current) svgAltCoreRef.current.setAttribute("d", "");
      }
      map.triggerRepaint();

      const tryApply = () => {
        try {
          ensureRouteLayers(map);
          const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
          const altSource = map.getSource("route-alt-source") as maplibregl.GeoJSONSource;

          if (altSource) {
            altSource.setData({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: altCoords && altCoords.length > 0 ? altCoords : [],
              },
            });
          }

          if (source && coords && coords.length > 0) {
            source.setData({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            });

            // STRICT FIX: Only fitBounds when NOT in active pin selection mode
            // AND only once per new route (routeKey) to prevent auto-zooming loops
            if (!activePinMode && (!routeKey || hasFittedRouteRef.current !== routeKey)) {
              if (routeKey) hasFittedRouteRef.current = routeKey;
              const bounds = new maplibregl.LngLatBounds();
              for (const c of coords) {
                bounds.extend(c as [number, number]);
              }
              const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
              const responsivePadding = isDesktop
                ? { top: 80, bottom: 80, left: 470, right: 80 }
                : { top: 70, bottom: Math.max(160, bottomPadding), left: 35, right: 35 };

              map.fitBounds(bounds, {
                padding: responsivePadding,
                duration: 700,
                maxZoom: 16,
              });
            }
            return true;
          }
        } catch (err) {
          return false;
        }
        return false;
      };

      if (tryApply()) return;

      if (routeRetryTimerRef.current) {
        clearInterval(routeRetryTimerRef.current);
        routeRetryTimerRef.current = null;
      }

      // Retry polling until layer is ready
      routeRetryTimerRef.current = setInterval(() => {
        if (tryApply()) {
          if (routeRetryTimerRef.current) {
            clearInterval(routeRetryTimerRef.current);
            routeRetryTimerRef.current = null;
          }
        }
      }, 100);
      setTimeout(() => {
        if (routeRetryTimerRef.current) {
          clearInterval(routeRetryTimerRef.current);
          routeRetryTimerRef.current = null;
        }
      }, 4000);
    },
    [bottomPadding, activePinMode]
  );

  /* ─── ROUTE FETCHING WITH AUTOMATIC FALLBACKS ─── */
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

      const currentKey = waypoints.map((w) => `${w[0].toFixed(5)},${w[1].toFixed(5)}`).join(";");
      if (currentKey === lastRouteKeyRef.current && lastRouteCoordsRef.current.length > 0) {
        applyRouteLine(lastRouteCoordsRef.current, [], currentKey);
        return;
      }
      lastRouteKeyRef.current = currentKey;

      setIsRouting(true);

      let routeData: any = null;

      // Tier 1: Fast direct Client-Side OSRM Road Router (<300ms)
      // Note: alternatives=false during pre-booking as requested (prevents frozen grey line)
      try {
        const coordStr = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(";");
        const osrmRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=false`,
          { signal: AbortSignal.timeout(4500) }
        );
        if (osrmRes.ok) {
          const osrmJson = await osrmRes.json();
          if (osrmJson.routes && osrmJson.routes.length > 0) {
            const r = osrmJson.routes[0];
            routeData = {
              distanceKm: +((r.distance / 1000).toFixed(2)),
              durationMinutes: Math.max(2, Math.round(r.duration / 60)),
              geojsonCoords: r.geometry.coordinates,
              engine: "osrm",
            };
          }
        }
      } catch (e) {
        console.warn("Client OSRM fallback failed, trying API route:", e);
      }

      // Tier 2: Next.js API Server Route Fallback (OSRM -> Valhalla -> synthetic)
      if (!routeData) {
        try {
          const pointsParam = waypoints.map(([lat, lng]) => `${lat},${lng}`).join(";");
          const res = await fetch(`/api/route?points=${encodeURIComponent(pointsParam)}`);
          if (res.ok) {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("json")) {
              const json = await res.json();
              if (json.success && json.primary?.geojsonCoords?.length > 0) {
                routeData = json.primary;
              }
            }
          }
        } catch (e) {
          console.warn("Proxy route fetch failed:", e);
        }
      }

      // Tier 3: Guaranteed fallback direct spline so line is 100% NEVER blank
      if (!routeData) {
        const coords: [number, number][] = waypoints.map(([lat, lon]) => [lon, lat]);
        const straightDistKm = Math.round(
          Math.hypot(dropPt[0] - pickupPt[0], dropPt[1] - pickupPt[1]) * 111 * 10
        ) / 10;
        routeData = {
          distanceKm: straightDistKm || 5,
          durationMinutes: Math.max(3, Math.round((straightDistKm || 5) * 2.5)),
          geojsonCoords: coords,
          engine: "direct",
        };
      }

      if (routeData && routeData.geojsonCoords?.length > 0) {
        // Snap connection: If the route end point snapped away from true drop point, extend directly to the drop coordinate
        const lastPt = routeData.geojsonCoords[routeData.geojsonCoords.length - 1];
        const dEndKm = Math.hypot(lastPt[1] - dropPt[0], lastPt[0] - dropPt[1]) * 111;
        if (dEndKm > 0.012 && dEndKm < 1.5) {
          routeData.geojsonCoords.push([dropPt[1], dropPt[0]]);
        }

        const firstPt = routeData.geojsonCoords[0];
        const dStartKm = Math.hypot(firstPt[1] - pickupPt[0], firstPt[0] - pickupPt[1]) * 111;
        if (dStartKm > 0.012 && dStartKm < 1.5) {
          routeData.geojsonCoords.unshift([pickupPt[1], pickupPt[0]]);
        }

        setKm(routeData.distanceKm);
        setDurationMin(routeData.durationMinutes);
        onDistance?.(routeData.distanceKm);
        applyRouteLine(routeData.geojsonCoords, [], currentKey);
      }

      setIsRouting(false);
    },
    [onDistance, applyRouteLine]
  );

  /* ─── CLEAR ROUTE WHEN COORDS ARE MISSING (PREVENTS PREMATURE ROUTING) ─── */
  const clearRoute = useCallback(() => {
    hasFittedRouteRef.current = null;
    lastRouteCoordsRef.current = [];
    lastAltCoordsRef.current = [];
    lastRouteKeyRef.current = "";
    setKm(null);
    setDurationMin(null);
    setIsRouting(false);
    onDistance?.(0);

    const map = mapRef.current;
    if (map) {
      ensureRouteLayers(map);
      const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
      const altSource = map.getSource("route-alt-source") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
      if (altSource) {
        altSource.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
    if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", "");
    if (svgCoreRef.current) svgCoreRef.current.setAttribute("d", "");
    if (svgAltCasingRef.current) svgAltCasingRef.current.setAttribute("d", "");
    if (svgAltCoreRef.current) svgAltCoreRef.current.setAttribute("d", "");
  }, [onDistance]);

  /* ─── SYNC MARKERS AND ROUTE (INDEPENDENT LOCK / UNLOCK) ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Pickup Marker (Hidden while actively setting pickup with center pin)
    if (p1 && activePinMode !== "pickup") {
      const attachPickupClickHandler = (el: HTMLElement) => {
        el.style.cursor = "pointer";
        el.title = "Click to adjust pickup location on map";
        el.onclick = (e) => {
          e.stopPropagation();
          setActivePinMode("pickup");
          onSelectionModeChange?.("pickup");
        };
      };

      if (!pickupMarkerRef.current) {
        const el = createPickupEl(durationMin);
        attachPickupClickHandler(el);
        const marker = new maplibregl.Marker({
          element: el,
          draggable: false, // Strictly locked to ground, NO direct dragging!
          anchor: "bottom",
        })
          .setLngLat([p1[1], p1[0]])
          .addTo(map);

        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLngLat([p1[1], p1[0]]);
        const el = createPickupEl(durationMin);
        attachPickupClickHandler(el);
        pickupMarkerRef.current.getElement().innerHTML = el.innerHTML;
        attachPickupClickHandler(pickupMarkerRef.current.getElement());
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }

    // 2. Drop Marker (Hidden while actively setting drop with center pin)
    if (p2 && activePinMode !== "drop") {
      const attachDropClickHandler = (el: HTMLElement) => {
        el.style.cursor = "pointer";
        el.title = "Click to adjust drop-off location on map";
        el.onclick = (e) => {
          e.stopPropagation();
          setActivePinMode("drop");
          onSelectionModeChange?.("drop");
        };
      };

      if (!dropMarkerRef.current) {
        const el = createDropEl();
        attachDropClickHandler(el);
        const marker = new maplibregl.Marker({
          element: el,
          draggable: false, // Strictly locked to ground, NO direct dragging!
          anchor: "bottom",
        })
          .setLngLat([p2[1], p2[0]])
          .addTo(map);

        dropMarkerRef.current = marker;
      } else {
        dropMarkerRef.current.setLngLat([p2[1], p2[0]]);
        attachDropClickHandler(dropMarkerRef.current.getElement());
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
            .addTo(map);
          stopMarkersRef.current.push(marker);
        }
      });
    }

    // 4. Trigger route calculation strictly when both p1 and p2 exist, otherwise purge line
    if (p1 && p2) {
      renderRoute(p1, p2, stops);
    } else {
      clearRoute();
    }
  }, [p1, p2, stops, renderRoute, clearRoute, drop, onChange, onCoordinatesChange, pickup, activePinMode, durationMin, reverseGeocodeFull]);

  // 5. Vehicles (Auto-rickshaws & Cars)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    vehicleMarkersRef.current.forEach((m) => m.remove());
    vehicleMarkersRef.current = [];

    const defaultNearby = p1
      ? [
          { lat: p1[0] + 0.003, lng: p1[1] + 0.002, type: "auto" },
          { lat: p1[0] - 0.002, lng: p1[1] + 0.004, type: "auto" },
          { lat: p1[0] + 0.004, lng: p1[1] - 0.003, type: "car" },
        ]
      : [];

    const activeList = vehicles && vehicles.length > 0 ? vehicles : defaultNearby;

    activeList.forEach((v: any) => {
      const loc = v.location?.coordinates || [v.lng, v.lat];
      if (!loc || loc.length < 2) return;
      const [lng, lat] = loc;
      const isAuto = v.type === "auto" || !v.type;
      const el = isAuto ? createAutoRickshawEl() : createCarEl();
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);
      vehicleMarkersRef.current.push(marker);
    });
  }, [vehicles, p1]);

  /* ── RE-CENTER ON ROUTE OR CURRENT LOCATION ── */
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;

    if (p1 && p2) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([p1[1], p1[0]]);
      bounds.extend([p2[1], p2[0]]);
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      const responsivePadding = isDesktop
        ? { top: 80, bottom: 80, left: 470, right: 80 }
        : { top: 70, bottom: Math.max(160, bottomPadding), left: 35, right: 35 };

      map.fitBounds(bounds, {
        padding: responsivePadding,
        duration: 700,
        maxZoom: 16,
      });
    } else if (p1) {
      map.easeTo({ center: [p1[1], p1[0]], zoom: 16, duration: 600 });
    } else if (p2) {
      map.easeTo({ center: [p2[1], p2[0]], zoom: 16, duration: 600 });
    }
  };

  const handleReset = () => {
    hasFittedRouteRef.current = null;
    setP1(null);
    setP2(null);
    onCoordinatesChange?.(null, null);
    if (onChange) onChange("", "");
    setActivePinMode(null);
    onSelectionModeChange?.("none");
    setKm(null);
    lastRouteCoordsRef.current = [];
    lastAltCoordsRef.current = [];
    if (svgCasingRef.current) svgCasingRef.current.setAttribute("d", "");
    if (svgCoreRef.current) svgCoreRef.current.setAttribute("d", "");
    if (svgAltCasingRef.current) svgAltCasingRef.current.setAttribute("d", "");
    if (svgAltCoreRef.current) svgAltCoreRef.current.setAttribute("d", "");

    const map = mapRef.current;
    if (map) {
      ensureRouteLayers(map);
      const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
      const altSource = map.getSource("route-alt-source") as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
      if (altSource) {
        altSource.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
  };

  return (
    <div className="maplibre-map-container relative w-full h-full overflow-hidden select-none bg-slate-100">
      {/* MapLibre WebGL DOM Container */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full ${activePinMode ? "cursor-grab active:cursor-grabbing" : ""}`}
      />

      {/* ── FAIL-SAFE SVG ROUTE POLYLINE OVERLAY ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 10, pointerEvents: "none" }}
      >
        {/* Alternative route (purged during pre-booking) */}
        <path
          ref={svgAltCasingRef}
          d=""
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
        />
        <path
          ref={svgAltCoreRef}
          d=""
          stroke="#94a3b8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.85"
        />
        {/* Primary route casing (crisp white halo) */}
        <path
          ref={svgCasingRef}
          d=""
          stroke="#ffffff"
          strokeWidth="9.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="1.0"
        />
        {/* Primary route core (vivid Google Maps blue) */}
        <path
          ref={svgCoreRef}
          d=""
          stroke="#2563eb"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="1.0"
        />
      </svg>

      {/* ── CENTRAL FIXED PIN WITH TACTILE SPRING PHYSICS ── */}
      <AnimatePresence>
        {activePinMode && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
            <div className="relative flex flex-col items-center">
              {/* Floating Pin Assembly */}
              <motion.div
                initial={{ scale: 0.8, y: -20, opacity: 0 }}
                animate={{
                  scale: isMapMoving ? 1.08 : 1.0,
                  y: isMapMoving ? -14 : 0,
                  opacity: 1,
                }}
                exit={{ scale: 0.8, y: -20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className="flex flex-col items-center pointer-events-none"
              >
                {/* Floating Callout Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-2xl flex items-center gap-1.5 border-2 border-white ${
                    activePinMode === "pickup"
                      ? "bg-emerald-600 shadow-emerald-950/40"
                      : "bg-rose-600 shadow-rose-950/40"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span>{activePinMode === "pickup" ? "Move Map to Set Pickup" : "Move Map to Set Drop"}</span>
                </div>

                {/* Pin Head */}
                <div className="mt-1 w-10 h-10 rounded-full bg-zinc-950 border-2 border-white flex items-center justify-center shadow-2xl">
                  <MapPin
                    size={20}
                    className={activePinMode === "pickup" ? "text-emerald-400" : "text-rose-400"}
                  />
                </div>

                {/* Needle Tip */}
                <div className="w-1.5 h-3.5 bg-zinc-950 rounded-b-full shadow-sm -mt-0.5" />
              </motion.div>

              {/* Dynamic Ground Shadow underneath the needle */}
              <div
                className={`w-3.5 h-1.5 bg-zinc-950/40 rounded-[100%] filter blur-[1px] transition-all duration-200 ${
                  isMapMoving ? "scale-75 opacity-25 translate-y-2" : "scale-100 opacity-60 translate-y-0"
                }`}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOP CONFIRMATION BANNER WHEN IN CENTRAL PIN MODE ── */}
      <AnimatePresence>
        {activePinMode && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    activePinMode === "pickup" ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-rose-500 ring-4 ring-rose-100"
                  }`}
                />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  {activePinMode === "pickup" ? "Confirm Pickup Point" : "Confirm Drop-off Point"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelPin}
                className="w-7 h-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-800 transition flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200/80 flex items-start gap-2">
              <MapPin size={16} className="text-zinc-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {isPinGeocoding ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <Loader2 size={13} className="animate-spin text-zinc-700" />
                    <span>Resolving address...</span>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-zinc-800 leading-snug line-clamp-2">
                    {pinAddress || "Move map to choose location"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmPin}
                disabled={isPinGeocoding}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-lg transition active:scale-95 flex items-center justify-center gap-1.5 ${
                  activePinMode === "pickup"
                    ? "bg-zinc-900 hover:bg-black"
                    : "bg-zinc-900 hover:bg-black"
                }`}
              >
                <Check size={14} className="text-emerald-400" />
                <span>Confirm Location</span>
              </button>
              <button
                type="button"
                onClick={handleCancelPin}
                className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP RIGHT MAP CONTROLS & ROUTE ETA PILL (WHEN NOT IN PIN MODE) ── */}
      {!activePinMode && (
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
          {/* Route ETA & Distance Pill */}
          <AnimatePresence>
            {(km !== null || isRouting) && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                className="pointer-events-auto flex items-center gap-3 bg-white border border-zinc-300 px-3.5 py-1.5 shadow-sm rounded-none"
              >
                {isRouting ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-zinc-950 animate-pulse rounded-none" />
                    <span className="text-zinc-900 text-xs font-bold">Finding fastest route...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-950 text-xs font-black">
                        {durationMin ?? Math.max(3, Math.round(((km || 5) / 25) * 60))} min
                      </span>
                      <span className="text-zinc-500 text-xs font-bold">({km} km)</span>
                    </div>
                    <span className="w-px h-3 bg-zinc-200" />
                    <span className="text-[10px] text-zinc-950 font-black uppercase tracking-wider bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded-none">
                      Fastest Route
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pinpoint Selector Pill */}
          <div className="pointer-events-auto flex items-center gap-1 bg-white border border-zinc-300 p-1 shadow-sm rounded-none">
            <button
              type="button"
              onClick={() => {
                setActivePinMode("pickup");
                onSelectionModeChange?.("pickup");
              }}
              className="px-2.5 py-1 text-xs font-black transition-all flex items-center gap-1.5 text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-none cursor-pointer"
            >
              <span className="w-2.5 h-2.5 bg-zinc-950 flex-shrink-0 rounded-none" />
              <span>Pin Pickup</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePinMode("drop");
                onSelectionModeChange?.("drop");
              }}
              className="px-2.5 py-1 text-xs font-black transition-all flex items-center gap-1.5 text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-none cursor-pointer"
            >
              <span className="w-2.5 h-2.5 border-2 border-zinc-950 bg-white flex-shrink-0 rounded-none" />
              <span>Pin Drop</span>
            </button>

            {(p1 || p2) && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset pins"
                className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all rounded-none cursor-pointer"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── BOTTOM RIGHT CONTROLS (RE-CENTER CROSSHAIR & ZOOM) ── */}
      <div
        className="absolute bottom-6 right-4 z-20 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Re-center / Locate Crosshair Button */}
        <button
          onClick={handleRecenter}
          aria-label="Re-center on route"
          title="Re-center view"
          className="w-9 h-9 bg-white border border-zinc-300 rounded-none flex items-center justify-center text-zinc-900 shadow-sm hover:bg-zinc-100 transition-all cursor-pointer"
        >
          <Crosshair size={18} className="text-zinc-900" />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col bg-white border border-zinc-300 rounded-none overflow-hidden shadow-sm">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-9 h-9 flex items-center justify-center text-zinc-800 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
          >
            <Plus size={15} />
          </button>
          <div className="h-px bg-zinc-200" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-9 h-9 flex items-center justify-center text-zinc-800 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
          >
            <Minus size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}