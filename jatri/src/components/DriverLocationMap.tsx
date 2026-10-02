"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VOYAGER_MAP_STYLE } from "@/lib/mapConfig";

type Props = {
  coords: { latitude: number; longitude: number } | null;
};

function createDriverMarkerEl(): HTMLElement {
  const el = document.createElement("div");
  el.style.position = "relative";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = "44px";
  el.style.height = "44px";

  el.innerHTML = `
    <div style="
      position:absolute;
      width:40px;height:40px;
      border-radius:50%;
      background:rgba(10,10,10,0.12);
      border:1.5px solid rgba(10,10,10,0.25);
    "></div>
    <div style="
      background:#0a0a0a;
      width:32px; height:32px;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 2.5px #ffffff, 0 6px 18px rgba(0,0,0,0.3);
      position:relative;
      z-index:2;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 11L6.5 6.5H17.5L19 11" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <rect x="3" y="11" width="18" height="7" rx="2" stroke="white" stroke-width="2"/>
        <circle cx="7.5" cy="18.5" r="1.5" fill="white"/>
        <circle cx="16.5" cy="18.5" r="1.5" fill="white"/>
      </svg>
    </div>
  `;
  return el;
}

export default function DriverLocationMap({ coords }: Props) {
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
      zoom: center ? 15 : 5,
      pitch: 15,
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
      const el = createDriverMarkerEl();
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
      zoom: Math.max(map.getZoom(), 14.5),
      duration: 700,
    });
  }, [coords]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-zinc-200 shadow-inner select-none relative bg-zinc-100">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
