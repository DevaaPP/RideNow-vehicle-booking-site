"use client";

import { motion } from "framer-motion";
import { AlertCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface RideFailedViewProps {
  booking: any;
  status: "cancelled" | "rejected" | "expired" | string;
  label: string;
  sublabel: string;
}

export default function RideFailedView({
  booking,
  status,
  label,
  sublabel,
}: RideFailedViewProps) {
  const router = useRouter();
  const isExpired = status === "expired";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center px-6 py-8"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6"
      >
        <div
          className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isExpired ? "bg-orange-500/10 border border-orange-500/20" : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isExpired ? "bg-orange-500/20" : "bg-red-500/20"
            }`}
          >
            {isExpired ? (
              <AlertCircle size={36} className="text-orange-400" />
            ) : (
              <XCircle size={36} className="text-red-400" />
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="text-white text-2xl font-black mb-1">{label}</h1>
        <p className="text-zinc-500 text-xs mb-6">{sublabel}</p>

        {status === "cancelled" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-semibold">Reason</span>
              <span className="text-zinc-200 font-bold max-w-[200px] truncate text-right">
                {booking.cancellationReason || "Cancelled by passenger"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800">
              <span className="text-zinc-400 font-semibold">Cancellation Fee</span>
              <span
                className={`font-bold ${
                  booking.cancellationFeeApplied ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {booking.cancellationFeeApplied && booking.cancellationFee
                  ? `₹${booking.cancellationFee} applied`
                  : "₹0 (Free Cancellation)"}
              </span>
            </div>
            {booking.paymentStatus === "refunded" && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800">
                <span className="text-zinc-400 font-semibold">Refund Status</span>
                <span className="text-emerald-400 font-bold">Processed to Wallet</span>
              </div>
            )}
          </div>
        )}

        {/* Route recap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-6 text-left">
          <div className="flex gap-3 p-4 border-b border-zinc-800">
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
              <div className="w-px bg-zinc-700 mt-1" style={{ height: 18 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Pickup</p>
              <p className="text-xs text-zinc-300 leading-snug line-clamp-1">{booking.pickupAddress || "—"}</p>
            </div>
          </div>

          <div className="flex gap-3 p-4">
            <div className="flex-shrink-0 pt-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-zinc-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Drop</p>
              <p className="text-xs text-zinc-300 leading-snug line-clamp-1">{booking.dropAddress || "—"}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full bg-white text-zinc-900 font-bold py-3.5 rounded-2xl text-xs hover:bg-zinc-100 transition-colors"
        >
          Book Another Ride
        </button>
      </motion.div>
    </motion.div>
  );
}
