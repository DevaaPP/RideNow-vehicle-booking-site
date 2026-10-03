"use client";

import { motion } from "framer-motion";
import { Loader2, Navigation, AlertCircle } from "lucide-react";

interface DriverSearchRadarProps {
  countdown: number;
  pickup: string;
  drop: string;
  vehicle: string;
  onCancel: () => void;
  cancelling?: boolean;
}

export default function DriverSearchRadar({
  countdown,
  pickup,
  drop,
  vehicle,
  onCancel,
  cancelling,
}: DriverSearchRadarProps) {
  const vehicleLabel = vehicle.charAt(0).toUpperCase() + vehicle.slice(1);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-8 shadow-sm text-center max-w-md mx-auto">
      {/* Animated radar rings */}
      <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 2], opacity: [0.6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-zinc-900"
        />
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-zinc-900"
        />
        <div className="w-16 h-16 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-xl relative z-10">
          <Navigation size={28} className="animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-black text-zinc-900 mb-1">Connecting to Nearby {vehicleLabel}...</h3>
      <p className="text-zinc-500 text-xs mb-4">
        Dispatching your request to the nearest verified drivers.
      </p>

      {/* Countdown timer pill */}
      <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-800 px-4 py-2 rounded-full text-xs font-bold mb-6">
        <Loader2 size={14} className="animate-spin text-zinc-900" />
        <span>Response expected in {countdown}s</span>
      </div>

      {/* Route summary box */}
      <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-3.5 mb-6 text-left space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="text-xs text-zinc-700 truncate">{pickup}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-red-500 flex-shrink-0" />
          <p className="text-xs text-zinc-700 truncate">{drop}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={cancelling}
        onClick={onCancel}
        className="w-full border border-zinc-300 hover:border-zinc-400 text-zinc-700 font-bold py-3 rounded-2xl text-xs transition-colors disabled:opacity-50"
      >
        {cancelling ? "Cancelling..." : "Cancel Search"}
      </button>
    </div>
  );
}
