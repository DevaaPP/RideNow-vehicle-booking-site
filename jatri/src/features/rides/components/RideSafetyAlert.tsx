"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Siren, PhoneCall } from "lucide-react";

interface RideSafetyAlertProps {
  isDeviated: boolean;
  onConfirmSafe: () => void;
  onTriggerSos: () => void;
  isPanicActive?: boolean;
}

export default function RideSafetyAlert({
  isDeviated,
  onConfirmSafe,
  onTriggerSos,
  isPanicActive,
}: RideSafetyAlertProps) {
  return (
    <>
      {/* Route deviation banner */}
      <AnimatePresence>
        {isDeviated && !isPanicActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-4 right-4 z-40 max-w-lg mx-auto bg-amber-500/95 text-zinc-950 px-4 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md border border-amber-300 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-zinc-950" />
              </div>
              <div>
                <p className="text-xs font-black leading-tight">Route Deviation Detected</p>
                <p className="text-[10px] font-semibold opacity-90 leading-tight">
                  Your vehicle appears to have diverged from the planned route.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={onConfirmSafe}
                className="bg-zinc-950 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              >
                I am Safe
              </button>
              <button
                type="button"
                onClick={onTriggerSos}
                className="bg-red-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform shadow-md shadow-red-900/30"
              >
                <Siren size={12} />
                SOS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active SOS Banner */}
      <AnimatePresence>
        {isPanicActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-4 left-4 right-4 z-40 max-w-lg mx-auto bg-red-600 text-white px-4 py-3.5 rounded-2xl shadow-2xl border border-red-400 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Siren size={20} className="animate-bounce" />
              <div>
                <p className="text-xs font-black">Emergency SOS Active</p>
                <p className="text-[10px] opacity-90">Authorities and emergency contacts notified.</p>
              </div>
            </div>
            <a
              href="tel:112"
              className="bg-white text-red-600 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5"
            >
              <PhoneCall size={14} />
              Call 112
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
