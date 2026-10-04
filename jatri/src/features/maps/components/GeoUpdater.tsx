"use client";

import { getSocket } from "@/lib/socket";
import React, { useEffect, useRef } from "react";

function GeoUpdater({ userId }: { userId: string | undefined }) {
  const socketRef = useRef<any>(null);
  const lastSocketSentRef = useRef<number>(0);
  const lastHttpSentRef = useRef<number>(0);

  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined" || !navigator.geolocation) return;

    socketRef.current = getSocket();

    // Emit identity once
    socketRef.current?.emit?.("identity", userId);

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // 1. Socket broadcast: throttle every 8-10 seconds
        if (now - lastSocketSentRef.current >= 8000) {
          lastSocketSentRef.current = now;
          socketRef.current?.emit?.("update-location", {
            userId,
            latitude: lat,
            longitude: lng,
          });
        }

        // 2. Database persistence: ping /api/partner/status every 30 seconds
        // Keeps Mongo lastLocationUpdate fresh for driver matching engine
        if (now - lastHttpSentRef.current >= 30000) {
          lastHttpSentRef.current = now;
          fetch("/api/partner/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
          }).catch((err) => {
            console.debug("Background geo sync note:", err?.message || err);
          });
        }
      },
      (err) => {
        console.debug("Geolocation watch error:", err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [userId]);

  return null;
}

export default GeoUpdater;