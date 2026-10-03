"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { DRIVER_CANCELLATION_REASONS } from "@/lib/cancellationRules";

interface DriverCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error?: string | null;
  selectedReason: string;
  onSelectReason: (reason: string) => void;
  customReasonNote: string;
  onChangeCustomReason: (note: string) => void;
}

export default function DriverCancelModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  error,
  selectedReason,
  onSelectReason,
  customReasonNote,
  onChangeCustomReason,
}: DriverCancelModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="text-red-400" size={24} />
          </div>

          <h3 className="text-white text-xl font-black mb-1">Cancel accepted ride?</h3>
          <p className="text-zinc-400 text-xs mb-4">
            Frequent cancellations affect your driver acceptance rating and may incur penalties.
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4 pr-1">
            {DRIVER_CANCELLATION_REASONS.map((reason) => {
              const active = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => onSelectReason(reason)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    active
                      ? "bg-zinc-800 border-white text-white"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>

          {selectedReason === "Other operational reason" && (
            <textarea
              value={customReasonNote}
              onChange={(e) => onChangeCustomReason(e.target.value)}
              placeholder="State your reason..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 mb-4"
            />
          )}

          {error && <p className="text-red-400 text-xs mb-4 font-semibold">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
            >
              Continue Ride
            </button>
            <button
              type="button"
              disabled={loading || !selectedReason}
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              Confirm Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
