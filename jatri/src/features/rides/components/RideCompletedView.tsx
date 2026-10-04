"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  IndianRupee,
  Clock,
  Navigation,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  X,
  Send,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface RideCompletedViewProps {
  booking: any;
}

export default function RideCompletedView({ booking }: RideCompletedViewProps) {
  const router = useRouter();
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  /* Safety Incident Report Modal State */
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<string>("driver_misbehavior");
  const [reportNotes, setReportNotes] = useState<string>("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) return;

    try {
      setSubmittingReport(true);
      const res = await fetch("/api/safety/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          type: reportType,
          description: reportNotes.trim(),
        }),
      });

      if (res.ok) {
        setReportSubmitted(true);
        setTimeout(() => {
          setShowReportModal(false);
          setReportSubmitted(false);
          setReportNotes("");
        }, 2500);
      }
    } catch (err) {
      console.error("Safety report error:", err);
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center px-4 py-8 relative"
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

        {/* Book Another Ride */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 rounded-2xl text-xs transition-colors"
        >
          Book Another Ride
        </button>

        {/* Safety & Incident Reporting Button */}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full mt-3 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-semibold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <ShieldAlert size={14} className="text-zinc-400" />
          Report Safety Concern or Lost Item
        </button>
      </div>

      {/* SAFETY INCIDENT REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md text-left shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <ShieldAlert size={20} />
                <h3 className="text-base font-bold text-white">Trust & Safety Report</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Your report will be reviewed by our 24/7 Safety & Operations team.
              </p>

              {reportSubmitted ? (
                <div className="py-6 flex flex-col items-center text-center">
                  <CheckCircle2 size={36} className="text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-white">Incident Report Filed</p>
                  <p className="text-xs text-zinc-400 mt-1">Our team is investigating and will follow up shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Issue Category
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none focus:border-zinc-600"
                    >
                      <option value="driver_misbehavior">Driver Behavior / Misconduct</option>
                      <option value="accident">Accident or Rash Driving</option>
                      <option value="overcharging">Fare or Cash Overcharging Dispute</option>
                      <option value="route_deviation">Significant Unauthorized Route Deviation</option>
                      <option value="other">Lost Item / Other Concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Describe What Happened
                    </label>
                    <textarea
                      rows={3}
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Please share details to help us investigate..."
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl p-3 outline-none focus:border-zinc-600 resize-none"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport || !reportNotes.trim()}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {submittingReport ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
