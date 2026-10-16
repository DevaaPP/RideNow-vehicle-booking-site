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

    socketRef.current = getSocket({ userId });

    // Emit identity once
    socketRef.current?.emit?.("identity", userId);

    const handleNewPosition = (lat: number, lng: number) => {
      const now = Date.now();

      // 1. Socket broadcast: throttle every 5-8 seconds
      if (now - lastSocketSentRef.current >= 5000) {
        lastSocketSentRef.current = now;
        socketRef.current?.emit?.("update-location", {
          userId,
          latitude: lat,
          longitude: lng,
        });
      }

      // 2. Database persistence: ping /api/partner/status every 15 seconds
      // Keeps Mongo 2dsphere location and lastLocationUpdate fresh for driver matching engine
      if (now - lastHttpSentRef.current >= 15000) {
        lastHttpSentRef.current = now;
        fetch("/api/partner/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        }).catch((err) => {
          console.debug("Background geo sync note:", err?.message || err);
        });
      }
    };

    // 1. Initial immediate location lookup
    navigator.geolocation.getCurrentPosition(
      (pos) => handleNewPosition(pos.coords.latitude, pos.coords.longitude),
      (err) => console.debug("Initial geo note:", err.message),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 }
    );

    // 2. Continuous watchPosition
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        handleNewPosition(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.debug("Geolocation watch note:", err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    // 3. Interval heartbeat timer: guarantees updates even when driver is stationary / parked
    const heartbeatInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => handleNewPosition(pos.coords.latitude, pos.coords.longitude),
        (err) => console.debug("Heartbeat geo note:", err.message),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    }, 15000);

    return () => {
      navigator.geolocation.clearWatch(watcher);
      clearInterval(heartbeatInterval);
    };
  }, [userId]);

  return null;
}

export default GeoUpdater;