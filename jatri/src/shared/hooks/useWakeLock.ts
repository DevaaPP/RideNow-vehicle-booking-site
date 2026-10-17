"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useWakeLock Hook
 * Keeps device screen awake (prevents sleeping/locking) during active driving and navigation.
 * Automatically releases lock on unmount, or re-acquires lock when returning from other apps.
 */
export function useWakeLock(enabled = true) {
  const [isSupported] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && "wakeLock" in navigator;
  });
  const [isLocked, setIsLocked] = useState(false);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    if (!isSupported) return false;
    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        setIsLocked(true);
        return true;
      }
      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setIsLocked(true);

      sentinel.addEventListener("release", () => {
        setIsLocked(false);
        sentinelRef.current = null;
      });
      return true;
    } catch (err) {
      console.warn("[WakeLock] Failed to acquire screen wake lock:", err);
      setIsLocked(false);
      sentinelRef.current = null;
      return false;
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.warn("[WakeLock] Error releasing wake lock:", err);
      } finally {
        sentinelRef.current = null;
        setIsLocked(false);
      }
    }
  }, []);

  // Lifecycle control: Acquire when enabled, release when disabled or unmounted
  useEffect(() => {
    if (!enabled || !isSupported) {
      release();
      return;
    }

    request();

    // Re-acquire lock if page becomes visible again (e.g. driver switched back from Google Maps)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && enabled) {
        request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      release();
    };
  }, [enabled, isSupported, request, release]);

  return { isSupported, isLocked, request, release };
}
