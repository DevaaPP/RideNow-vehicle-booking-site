"use client";

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/shared/hooks/usePushNotifications";
import { useState } from "react";

export default function NotificationToggle({
  variant = "button",
  className = "",
}: {
  variant?: "button" | "banner";
  className?: string;
}) {
  const { isSupported, permission, isSubscribed, loading, subscribe, unsubscribe } =
    usePushNotifications();
  const [justEnabled, setJustEnabled] = useState(false);

  if (!isSupported) return null;

  const handleClick = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const ok = await subscribe();
      if (ok) {
        setJustEnabled(true);
        setTimeout(() => setJustEnabled(false), 3000);
      }
    }
  };

  if (variant === "banner") {
    if (isSubscribed || permission === "denied") return null;

    return (
      <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-amber-400">
            <BellRing size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-amber-400">Live Trip Alerts</p>
            <p className="text-xs text-zinc-300 font-medium truncate">
              Get notified when driver arrives or starts your trip
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="bg-white hover:bg-zinc-100 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0 flex items-center gap-1.5"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <Bell size={13} />
              <span>Enable</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`relative p-2 rounded-xl transition-all flex items-center justify-center active:scale-95 ${
        isSubscribed
          ? "text-amber-400 bg-white/10 hover:bg-white/20"
          : "text-zinc-400 hover:text-white hover:bg-white/10"
      } ${className}`}
      title={
        isSubscribed
          ? "Push Notifications Enabled (Click to disable)"
          : "Enable Push Notifications"
      }
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellRing size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </>
      ) : (
        <Bell size={16} />
      )}
    </button>
  );
}
