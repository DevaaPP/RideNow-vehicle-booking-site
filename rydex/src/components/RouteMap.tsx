"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, Plus, Minus, RotateCcw } from "lucide-react";
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
  bottomPadding?: number;
};

/* ─── DOM MARKER GENERATORS (MODERN LIGHT RIDE-HAILING THEME) ─────── */

function createPickupEl(durationMin?: number | null): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none flex flex-col items-center pointer-events-auto";

  const etaText = durationMin ? `${durationMin} min` : "Pickup";

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.28));">
      <div style="
        background:#09090b;color:#ffffff;
        padding:4px 10px;border-radius:100px;
        font-size:11px;font-weight:800;letter-spacing:0.02em;
        white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        border:1.5px solid #ffffff;
        box-shadow:0 3px 10px rgba(0,0,0,0.2);
        margin-bottom:4px;
      ">
        ${etaText}
      </div>
      <div style="
        width:16px;height:16px;background:#09090b;border-radius:50%;
        border:3.5px solid #ffffff;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;
  return el;
}

function createDropEl(): HTMLElement {
  const el = document.createElement("div");
  el.className = "cursor-grab active:cursor-grabbing select-none flex flex-col items-center pointer-events-auto";
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.28));">
      <div style="
        background:#09090b;color:#ffffff;
        padding:3px 9px;border-radius:6px;
        font-size:10px;font-weight:800;
        white-space:nowrap;
        font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
        border:1.5px solid #ffffff;
        box-shadow:0 3px 10px rgba(0,0,0,0.2);
        margin-bottom:4px;
      ">
        Destination
      </div>
      <div style="
        width:14px;height:14px;background:#09090b;
        border:3px solid #ffffff;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        border-radius:3px;
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
        background:#2563eb;color:#ffffff;
        padding:3px 8px;border-radius:100px;
        font-size:9px;font-weight:900;
        white-space:nowrap;
        border:1.5px solid #ffffff;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      ">STOP ${index + 1}</div>
      <div style="width:2px;height:6px;background:#2563eb;"></div>
      <div style="
        width:10px;height:10px;background:#2563eb;border-radius:50%;
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
  if (!map || !map.isStyleLoaded()) return false;

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
  smartPickups,
  onSelectSmartPickup,
  stops,
  bottomPadding = 340,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const pickupMarkerRef = useRef<maplibregl.Marker | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const vehicleMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRouteCoordsRef = useRef<[number, number][]>([]);
  const lastRouteKeyRef = useRef<string>("");

  const [p1, setP1] = useState<[number, number] | null>(pickupCoords ?? null);
  const [p2, setP2] = useState<[number, number] | null>(dropCoords ?? null);
  const [km, setKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [pinMode, setPinMode] = useState<"pickup" | "drop" | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  // Sync coords from parent
  useEffect(() => {
    if (pickupCoords) setP1(pickupCoords);
    else if (!pickup) setP1(null);
  }, [pickupCoords, pickup]);

  useEffect(() => {
    if (dropCoords) setP2(dropCoords);
    else if (!drop) setP2(null);
  }, [dropCoords, drop]);

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
      geocodeAddress(drop, p1).then((coords) => {
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

    const onReady = () => {
      if (map.isStyleLoaded()) {
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
      }
    };

    map.on("load", onReady);
    map.on("styledata", onReady);

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

  /* ─── SAFE & CRASH-PROOF ROUTE RENDERING ─── */
  const applyRouteLine = useCallback(
    (coords: [number, number][], altCoords?: [number, number][]) => {
      lastRouteCoordsRef.current = coords;
      const map = mapRef.current;
      if (!map) return;

      const tryApply = () => {
        try {
          if (!map.isStyleLoaded()) return false;
          ensureRouteLayers(map);
          const source = map.getSource("route-source") as maplibregl.GeoJSONSource;
          const altSource = map.getSource("route-alt-source") as maplibregl.GeoJSONSource;

          if (altSource && altCoords && altCoords.length > 0) {
            altSource.setData({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: altCoords,
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

            // Fit map bounds smoothly around route with bottom sheet padding
            const bounds = new maplibregl.LngLatBounds();
            for (const c of coords) {
              bounds.extend(c as [number, number]);
            }
            map.fitBounds(bounds, {
              padding: { top: 90, bottom: bottomPadding, left: 60, right: 60 },
              duration: 800,
              maxZoom: 16,
            });
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
    [bottomPadding]
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
        applyRouteLine(lastRouteCoordsRef.current);
        return;
      }
      lastRouteKeyRef.current = currentKey;

      setIsRouting(true);

      let routeData: any = null;
      let altRouteData: any = null;

      // Tier 1: Fast direct Client-Side OSRM Road Router (<300ms)
      try {
        const coordStr = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(";");
        const osrmRes = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&alternatives=true`,
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
            if (osrmJson.routes.length > 1) {
              altRouteData = {
                geojsonCoords: osrmJson.routes[1].geometry.coordinates,
              };
            }
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
                if (json.alternatives && json.alternatives.length > 0) {
                  altRouteData = json.alternatives[0];
                }
              }
            }
          }
        } catch (e) {
          console.warn("Proxy route fetch failed:", e);
        }
      }

      if (routeData && routeData.geojsonCoords?.length > 0) {
        setKm(routeData.distanceKm);
        setDurationMin(routeData.durationMinutes);
        onDistance?.(routeData.distanceKm);
        applyRouteLine(routeData.geojsonCoords, altRouteData?.geojsonCoords);
      }

      setIsRouting(false);
    },
    [onDistance, applyRouteLine]
  );

  /* ─── MAP CLICK PIN PLACEMENT (IMMEDIATE & ZERO-LAG) ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const clickedPt: [number, number] = [lat, lng];

      if (pinMode === "pickup" || (!p1 && !pinMode)) {
        setP1(clickedPt);
        setPinMode("drop"); // Switch to drop immediately
        onCoordinatesChange?.(clickedPt, p2);
        reverseGeocode(lat, lng).then((addr) => {
          if (onChange) onChange(addr, drop, clickedPt, p2);
        });
      } else if (pinMode === "drop" || (p1 && !p2 && !pinMode)) {
        setP2(clickedPt);
        setPinMode(null); // Complete pin placement
        onCoordinatesChange?.(p1, clickedPt);
        reverseGeocode(lat, lng).then((addr) => {
          if (onChange) onChange(pickup, addr, p1, clickedPt);
        });
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [pinMode, p1, p2, pickup, drop, onChange, onCoordinatesChange]);

  /* ─── SYNC MARKERS AND ROUTE ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Pickup Marker
    if (p1) {
      if (!pickupMarkerRef.current) {
        const el = createPickupEl(durationMin);
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
        const el = createPickupEl(durationMin);
        pickupMarkerRef.current.getElement().innerHTML = el.innerHTML;
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
            .addTo(map);
          stopMarkersRef.current.push(marker);
        }
      });
    }

    // 4. Trigger route calculation whenever both p1 and p2 exist
    if (p1 && p2) {
      renderRoute(p1, p2, stops);
    }
  }, [p1, p2, stops, renderRoute, drop, onChange, onCoordinatesChange, pickup]);

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

    const activeList = (vehicles && vehicles.length > 0) ? vehicles : defaultNearby;

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
      map.fitBounds(bounds, {
        padding: { top: 90, bottom: bottomPadding, left: 60, right: 60 },
        duration: 800,
        maxZoom: 16,
      });
    } else if (p1) {
      map.easeTo({ center: [p1[1], p1[0]], zoom: 15, duration: 700 });
    }
  };

  const handleReset = () => {
    setP1(null);
    setP2(null);
    onCoordinatesChange?.(null, null);
    if (onChange) onChange("", "");
    setPinMode(null);
    setKm(null);
    setDurationMin(null);
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
        className={`w-full h-full ${pinMode ? "cursor-crosshair" : ""}`}
      />

      {/* ── TOP RIGHT MAP CONTROLS & ROUTE ETA PILL ── */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
        {/* Route ETA & Distance Pill */}
        <AnimatePresence>
          {(km !== null || isRouting) && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-md border border-zinc-200/90 px-4 py-2 rounded-2xl shadow-xl"
            >
              {isRouting ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                  <span className="text-zinc-800 text-xs font-bold">Finding fastest route...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-900 text-sm font-black">
                      {durationMin ?? Math.max(3, Math.round(((km || 5) / 25) * 60))} min
                    </span>
                    <span className="text-zinc-500 text-xs font-bold">({km} km)</span>
                  </div>
                  <span className="w-px h-3.5 bg-zinc-200" />
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Fastest Route
                  </span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pinpoint Selector Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-zinc-200/90 p-1.5 rounded-2xl shadow-xl">
          <button
            type="button"
            onClick={() => setPinMode((prev) => (prev === "pickup" ? null : "pickup"))}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              pinMode === "pickup"
                ? "bg-zinc-900 text-white shadow-md ring-2 ring-emerald-500"
                : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span>Pin Pickup</span>
          </button>

          <button
            type="button"
            onClick={() => setPinMode((prev) => (prev === "drop" ? null : "drop"))}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              pinMode === "drop"
                ? "bg-zinc-900 text-white shadow-md ring-2 ring-rose-500"
                : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span>Pin Drop</span>
          </button>

          {(p1 || p2) && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset pins"
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {pinMode && (
          <span className="pointer-events-auto text-[11px] font-bold text-amber-800 px-3 py-1 rounded-xl bg-amber-50/95 border border-amber-300 shadow-md animate-pulse">
            Click map to set {pinMode === "pickup" ? "Pickup 🟢" : "Drop 🔴"}
          </span>
        )}
      </div>

      {/* ── BOTTOM RIGHT CONTROLS (RE-CENTER CROSSHAIR & ZOOM) ── */}
      <div
        className="absolute bottom-6 right-4 z-20 flex flex-col gap-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Re-center / Locate Crosshair Button */}
        <button
          onClick={handleRecenter}
          aria-label="Re-center on route"
          title="Re-center view"
          className="w-11 h-11 bg-white border border-zinc-200/90 rounded-full flex items-center justify-center text-zinc-900 shadow-xl hover:bg-zinc-50 active:scale-95 transition-all"
        >
          <Crosshair size={20} className="text-zinc-900" />
        </button>

        {/* Zoom In & Out */}
        <div className="flex flex-col bg-white border border-zinc-200/90 rounded-2xl overflow-hidden shadow-xl">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition"
          >
            <Plus size={16} />
          </button>
          <div className="h-px bg-zinc-200" />
          <button
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-10 h-10 flex items-center justify-center text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 transition"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}