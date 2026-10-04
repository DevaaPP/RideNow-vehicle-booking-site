"use client";

import { useState, useEffect } from "react";
import axios from "axios";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Check current registration and subscription
      navigator.serviceWorker.register("/sw.js").then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(Boolean(sub));
        });
      }).catch((err) => {
        console.warn("ServiceWorker registration notice:", err);
      });
    }
  }, []);

  const subscribe = async () => {
    if (!isSupported) return false;
    try {
      setLoading(true);

      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // 1. Get VAPID public key
      const keyRes = await axios.get("/api/notifications/vapid-key");
      const publicKey = keyRes.data.publicKey;

      if (!publicKey) {
        throw new Error("Missing VAPID public key from server");
      }

      // 2. Subscribe with pushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // 3. Send subscription to server
      await axios.post("/api/notifications/subscribe", {
        subscription: subscription.toJSON(),
      });

      setIsSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
      setLoading(false);
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;
    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await axios.post("/api/notifications/unsubscribe", {
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Failed to unsubscribe from push notifications:", err);
      setLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  };
}
