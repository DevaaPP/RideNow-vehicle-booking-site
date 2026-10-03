"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, IndianRupee, Clock, Navigation, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

interface RideCompletedViewProps {
  booking: any;
}

export default function RideCompletedView({ booking }: RideCompletedViewProps) {
  const router = useRouter();
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center px-4 py-8"
    >
      <div className="w-full max-w-md text-center">
        {/* Animated Success Badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <h1 className="text-white text-3xl font-black mb-1">Ride Completed!</h1>
        <p className="text-zinc-500 text-xs mb-6">Hope you had a safe and comfortable trip</p>

        {/* Fare Receipt Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-5 text-left shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Total Paid
              </span>
              <span className="text-2xl font-black text-white flex items-center">
                <IndianRupee size={20} className="stroke-[2.5]" />
                {booking.fare}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                booking.paymentStatus === "paid"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : booking.paymentStatus === "cash"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {booking.paymentStatus === "cash" ? "Paid in Cash" : "Paid Online"}
            </span>
          </div>

          {/* Trip Summary Details */}
          <div className="py-3 grid grid-cols-2 gap-3 text-xs border-b border-zinc-800">
            {booking.tripDurationMinutes && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock size={14} className="text-zinc-500" />
                <span>{booking.tripDurationMinutes} mins</span>
              </div>
            )}
            {booking.actualDropoffTime && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Navigation size={14} className="text-zinc-500" />
                <span>
                  Drop: {new Date(booking.actualDropoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>

          {/* Route Summary */}
          <div className="pt-3 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
              <p className="text-xs text-zinc-300 leading-snug line-clamp-1">{booking.pickupAddress}</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-sm bg-red-500 mt-1 flex-shrink-0" />
              <p className="text-xs text-zinc-300 leading-snug line-clamp-1">{booking.dropAddress}</p>
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-5 shadow-xl">
          <p className="text-zinc-300 text-xs font-bold mb-3">Rate your Driver</p>
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => !submitted && setSelectedRating(star)}
                className={`w-11 h-11 rounded-xl text-lg font-bold transition-all active:scale-90 ${
                  selectedRating >= star
                    ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedRating > 0 && !submitted && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onClick={() => setSubmitted(true)}
                className="w-full bg-white text-zinc-900 py-3 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors"
              >
                Submit Rating
              </motion.button>
            )}

            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <CheckCircle2 size={16} className="text-emerald-400" />
                <p className="text-emerald-400 text-xs font-semibold">Thank you for your rating!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-colors"
        >
          Book Another Ride
        </button>
      </div>
    </motion.div>
  );
}
