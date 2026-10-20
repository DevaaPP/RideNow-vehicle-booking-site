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
import FareCollectionModal from "@/features/rides/components/FareCollectionModal";

interface RideCompletedViewProps {
  booking: any;
}

export default function RideCompletedView({ booking }: RideCompletedViewProps) {
  const router = useRouter();
  const [showFarePopup, setShowFarePopup] = useState(true);
  const [selectedRating, setSelectedRating] = useState(booking.rating || 0);
  const [submitted, setSubmitted] = useState(Boolean(booking.rating));
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState(booking.feedback || "");
  const [ratingError, setRatingError] = useState<string | null>(null);

  const handleRatingSubmit = async () => {
    if (!selectedRating || submitted || submittingRating) return;
    try {
      setSubmittingRating(true);
      setRatingError(null);
      const res = await fetch(`/api/booking/${booking._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          feedback: ratingFeedback.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit rating");
      }
      setSubmitted(true);
    } catch (err: any) {
      setRatingError(err.message || "Could not submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

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
    <>
      <FareCollectionModal
        isOpen={showFarePopup}
        onClose={() => setShowFarePopup(false)}
        booking={booking}
        perspective="rider"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen w-full bg-[#F7F1E5] dark:bg-[#101713] flex flex-col items-center justify-center px-4 py-8 relative"
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
              <CheckCircle2 size={36} className="text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
        </motion.div>

        <h1 className="text-[#10251C] dark:text-[#F3F1E8] text-3xl font-black mb-1">Ride Completed!</h1>
        <p className="text-[#696B64] dark:text-[#929D93] text-xs mb-6">Hope you had a safe and comfortable trip</p>

        {/* Fare Receipt Card */}
        <div className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[16px] p-5 mb-5 text-left shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#DED7CA] dark:border-[#34443A]">
            <div>
              <span className="text-[10px] font-bold text-[#696B64] dark:text-[#929D93] uppercase tracking-widest block">
                Total Paid
              </span>
              <span className="text-2xl font-black text-[#10251C] dark:text-[#F3F1E8] flex items-center font-mono">
                <IndianRupee size={20} className="stroke-[2.5]" />
                {booking.fare}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                booking.paymentStatus === "paid"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30"
                  : booking.paymentStatus === "cash"
                  ? "bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/30"
                  : "bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#D7AC62]"
              }`}
            >
              {booking.paymentStatus === "cash" ? "Paid in Cash" : "Paid Online"}
            </span>
          </div>

          {/* Trip Summary Details */}
          <div className="py-3 grid grid-cols-2 gap-3 text-xs border-b border-[#DED7CA] dark:border-[#34443A]">
            {booking.tripDurationMinutes && (
              <div className="flex items-center gap-2 text-[#696B64] dark:text-[#929D93]">
                <Clock size={14} className="text-[#123D32] dark:text-[#D7AC62]" />
                <span>{booking.tripDurationMinutes} mins</span>
              </div>
            )}
            {booking.actualDropoffTime && (
              <div className="flex items-center gap-2 text-[#696B64] dark:text-[#929D93]">
                <Navigation size={14} className="text-[#123D32] dark:text-[#D7AC62]" />
                <span>
                  Drop: {new Date(booking.actualDropoffTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </div>

          {/* Route Summary */}
          <div className="pt-3 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#123D32] dark:bg-[#28664D] mt-1 flex-shrink-0" />
              <p className="text-xs text-[#10251C] dark:text-[#F3F1E8] leading-snug line-clamp-1">{booking.pickupAddress}</p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-sm bg-[#E34222] dark:bg-[#E06A50] mt-1 flex-shrink-0" />
              <p className="text-xs text-[#10251C] dark:text-[#F3F1E8] leading-snug line-clamp-1">{booking.dropAddress}</p>
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[16px] p-5 mb-5 shadow-sm">
          <p className="text-[#10251C] dark:text-[#F3F1E8] text-xs font-bold mb-3">Rate your Driver</p>

          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => !submitted && setSelectedRating(star)}
                className={`w-11 h-11 rounded-[8px] text-lg font-bold transition-all active:scale-90 cursor-pointer ${
                  selectedRating >= star
                    ? "bg-amber-400 text-[#10251C] shadow-md shadow-amber-400/20"
                    : "bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] text-[#929D93] hover:text-amber-500"
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedRating > 0 && !submitted && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2 mt-3"
              >
                <input
                  type="text"
                  placeholder="Leave brief feedback (optional)..."
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  maxLength={200}
                  className="w-full bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] rounded-[8px] px-3 py-2 text-xs text-[#10251C] dark:text-[#F3F1E8] placeholder-[#929D93] focus:outline-none focus:border-[#123D32] dark:focus:border-[#28664D]"
                />
                {ratingError && (
                  <p className="text-[#E34222] dark:text-[#E06A50] text-[11px] font-medium">{ratingError}</p>
                )}
                <button
                  type="button"
                  disabled={submittingRating}
                  onClick={handleRatingSubmit}
                  className="w-full bg-[#123D32] hover:bg-[#0D3027] dark:bg-[#28664D] dark:hover:bg-[#347858] text-white py-3 rounded-[8px] text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submittingRating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Submitting Rating...
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </button>
              </motion.div>
            )}

            {submitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 py-2"
              >
                <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400" />
                <p className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold">Thank you for rating your driver!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Book Another Ride */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full bg-[#123D32] hover:bg-[#0D3027] dark:bg-[#28664D] dark:hover:bg-[#347858] text-white font-bold py-3.5 rounded-[8px] text-xs transition-colors cursor-pointer"
        >
          Book Another Ride
        </button>

        {/* Safety & Incident Reporting Button */}
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="w-full mt-3 border border-[#DED7CA] dark:border-[#34443A] hover:border-[#123D32] dark:hover:border-[#28664D] bg-[#FAF7F0] dark:bg-[#17211B] text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8] font-semibold py-3 rounded-[8px] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldAlert size={14} className="text-[#696B64] dark:text-[#929D93]" />
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
              className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[16px] p-6 w-full max-w-md text-left shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="absolute top-4 right-4 text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2 text-[#E34222] dark:text-[#E06A50]">
                <ShieldAlert size={20} />
                <h3 className="text-base font-bold text-[#10251C] dark:text-[#F3F1E8]">Trust & Safety Report</h3>
              </div>
              <p className="text-xs text-[#696B64] dark:text-[#929D93] mb-4">
                Your report will be reviewed by our 24/7 Safety & Operations team.
              </p>

              {reportSubmitted ? (
                <div className="py-6 flex flex-col items-center text-center">
                  <CheckCircle2 size={36} className="text-emerald-700 dark:text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-[#10251C] dark:text-[#F3F1E8]">Incident Report Filed</p>
                  <p className="text-xs text-[#696B64] dark:text-[#929D93] mt-1">Our team is investigating and will follow up shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#696B64] dark:text-[#929D93] uppercase tracking-wider block mb-1.5">
                      Issue Category
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] text-[#10251C] dark:text-[#F3F1E8] text-xs rounded-[8px] p-3 outline-none focus:border-[#123D32] dark:focus:border-[#28664D]"
                    >
                      <option value="driver_misbehavior">Driver Behavior / Misconduct</option>
                      <option value="accident">Accident or Rash Driving</option>
                      <option value="overcharging">Fare or Cash Overcharging Dispute</option>
                      <option value="route_deviation">Significant Unauthorized Route Deviation</option>
                      <option value="other">Lost Item / Other Concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#696B64] dark:text-[#929D93] uppercase tracking-wider block mb-1.5">
                      Describe What Happened
                    </label>
                    <textarea
                      rows={3}
                      value={reportNotes}
                      onChange={(e) => setReportNotes(e.target.value)}
                      placeholder="Please share details to help us investigate..."
                      className="w-full bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] text-[#10251C] dark:text-[#F3F1E8] text-xs rounded-[8px] p-3 outline-none focus:border-[#123D32] dark:focus:border-[#28664D] resize-none placeholder-[#929D93]"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 border border-[#DED7CA] dark:border-[#34443A] bg-white dark:bg-[#1E2B23] hover:bg-[#FAF7F0] dark:hover:bg-[#25362C] text-[#10251C] dark:text-[#F3F1E8] font-bold py-3 rounded-[8px] text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport || !reportNotes.trim()}
                      className="flex-1 bg-[#E34222] hover:bg-[#a0321e] disabled:opacity-50 text-white font-bold py-3 rounded-[8px] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
    </>
  );
}
