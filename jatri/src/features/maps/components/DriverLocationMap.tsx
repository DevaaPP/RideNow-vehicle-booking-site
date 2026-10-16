"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VOYAGER_MAP_STYLE } from "@/lib/mapConfig";

type Props = {
  coords: { latitude: number; longitude: number } | null;
  vehicleType?: string;
};

function createDriverMarkerEl(vehicleType?: string): HTMLElement {
  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = "46px";
  el.style.height = "46px";

  const vType = (vehicleType || "").toLowerCase();
  const isAuto = vType === "auto";
  const isBike = vType === "bike" || vType === "scooty";
  const isTruck = vType === "loading" || vType === "truck" || vType === "pickup_truck";

  let iconSvg = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5H17.5L19 11" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <rect x="3" y="11" width="18" height="7" rx="2" stroke="white" stroke-width="2"/>
      <circle cx="7.5" cy="18.5" r="1.5" fill="white"/>
      <circle cx="16.5" cy="18.5" r="1.5" fill="white"/>
    </svg>
  `;

  if (isAuto) {
    iconSvg = `
      <svg width="17" height="17" viewBox="0 0 28 26" fill="none">
        <rect x="4" y="3" width="20" height="15" rx="3" fill="#09090b" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="6" y="5" width="16" height="5" rx="1.5" fill="#fbbf24"/>
        <circle cx="7" cy="21" r="2.5" fill="#09090b" stroke="#ffffff" stroke-width="1"/>
        <circle cx="21" cy="21" r="2.5" fill="#09090b" stroke="#ffffff" stroke-width="1"/>
      </svg>
    `;
  } else if (isBike) {
    iconSvg = `
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round">
        <circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 18l4-7h4l4 7"/><path d="M12 11V7h3"/>
      </svg>
    `;
  } else if (isTruck) {
    iconSvg = `
      <svg width="17" height="17" viewBox="0 0 24 36" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="2" fill="#18181b" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="4" y="22" width="16" height="11" rx="3" fill="#09090b" stroke="#ffffff" stroke-width="1.5"/>
        <rect x="6" y="24" width="12" height="4" rx="1" fill="#f59e0b"/>
      </svg>
    `;
  }

  el.innerHTML = `
    <div style="
      position:absolute;
      width:42px;height:42px;
      border-radius:50%;
      background:rgba(16,185,129,0.18);
      border:1.5px solid rgba(16,185,129,0.45);
      animation:pulse 2s infinite ease-in-out;
    "></div>
    <div style="
      background:#09090b;
      width:32px; height:32px;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 2px #ffffff, 0 4px 14px rgba(0,0,0,0.4);
      position:relative;
      z-index:2;
    ">
      ${iconSvg}
    </div>
  `;
  return el;
}

export default function DriverLocationMap({ coords, vehicleType }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const defaultCenter: [number, number] = [78.9629, 20.5937]; // [lng, lat]
  const center: [number, number] | null = coords
    ? [coords.longitude, coords.latitude]
    : null;

  /* ─── INITIALIZE MAP ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: VOYAGER_MAP_STYLE,
      center: center ?? defaultCenter,
      zoom: center ? 15.5 : 5,
      pitch: 20,
      attributionControl: false,
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ─── RESIZE LISTENER ─── */
  useEffect(() => {
    const handleResize = () => mapRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── UPDATE DRIVER POSITION ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coords) return;

    const lngLat: [number, number] = [coords.longitude, coords.latitude];

    if (!markerRef.current) {
      const el = createDriverMarkerEl(vehicleType);
      markerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      markerRef.current.setLngLat(lngLat);
    }

    map.easeTo({
      center: lngLat,
      zoom: Math.max(map.getZoom(), 15),
      duration: 600,
    });
  }, [coords, vehicleType]);

  return (
    <div className="w-full h-full rounded-none overflow-hidden border border-zinc-300 shadow-none select-none relative bg-zinc-100">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
