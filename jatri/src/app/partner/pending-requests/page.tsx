"use client";



import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Loader2,
  IndianRupee,
  Clock,
  Zap,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useRouter } from "next/navigation";

type Booking = {
  _id: string;
  pickupAddress: string;
  dropAddress: string;
  fare: number;
  createdAt: string;
};

export default function VendorPendingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeDispatch, setActiveDispatch] = useState<Booking | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(45);

  const fetchPendingBookings = async () => {
    try {
      const res = await axios.get("/api/partner/bookings/pending");
      const list = res.data.bookings || [];
      setBookings(list);
      if (list.length > 0 && !activeDispatch) {
        setActiveDispatch(list[0]);
        setTimeLeft(45);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
    const interval = setInterval(fetchPendingBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    socket.on("new-booking", (booking: Booking) => {
      setBookings((prev) => [booking, ...prev]);
      setActiveDispatch(booking);
      setTimeLeft(45);
    });

    socket.on("booking-updated", (data: any) => {
      setBookings((prev) => prev.filter((b) => b._id !== data.bookingId));
      if (activeDispatch?._id === data.bookingId) {
        setActiveDispatch(null);
      }
    });

    return () => {
      socket.off("new-booking");
      socket.off("booking-updated");
    };
  }, [activeDispatch?._id]);

  const handleDeclineOrTimeout = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await axios.post("/api/partner/bookings/dispatch-next", { bookingId });
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setActiveDispatch(null);
    } catch (err) {
      console.error("Escalation error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (!activeDispatch) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleDeclineOrTimeout(activeDispatch._id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDispatch]);

  const handleAccept = async (bookingId: string) => {
    try {
      setProcessingId(bookingId);
      await axios.post(`/api/booking/${bookingId}/accept`);
      router.push("/partner/active-ride");
    } catch (err) {
      alert("Accept failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E5] dark:bg-[#101713]">

      {/* Top Section */}
      <div className="bg-[#FAF7F0] dark:bg-[#17211B] border-b border-[#DED7CA] dark:border-[#29372E]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#10251C] dark:text-[#F3F1E8]">
            Ride Requests
          </h1>
          <p className="mt-1.5 sm:mt-2 text-[#696B64] dark:text-[#929D93] text-sm sm:text-base font-sans">
            Manage incoming ride requests and respond in real time.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10">

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin w-8 h-8 text-[#123D32] dark:text-[#347858]" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] border border-[#DED7CA] dark:border-[#29372E] p-8 sm:p-16 text-center shadow-xs">
            <p className="text-[#696B64] dark:text-[#929D93] text-base sm:text-lg font-medium">
              No pending ride requests.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {bookings.map((booking) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25 }}
                className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] border border-[#DED7CA] dark:border-[#29372E] p-4 sm:p-8 shadow-xs hover:shadow-md transition cursor-pointer select-none"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-8">

                  {/* Left Info */}
                  <div className="flex-1 space-y-4 sm:space-y-6">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="bg-[#123D32]/10 dark:bg-[#28664D]/20 p-2.5 sm:p-3 rounded-[8px] flex items-center justify-center shrink-0 border border-[#123D32]/20 dark:border-[#28664D]/30">
                        <MapPin size={18} className="text-[#123D32] dark:text-[#347858]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs uppercase text-[#123D32] dark:text-[#347858] mb-0.5 sm:mb-1 font-bold tracking-wider">
                          Pickup Location
                        </p>
                        <p className="text-[#10251C] dark:text-[#F3F1E8] font-semibold text-xs sm:text-base leading-snug">
                          {booking.pickupAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <div className="bg-[#E34222]/10 dark:bg-[#E06A50]/20 p-2.5 sm:p-3 rounded-[8px] flex items-center justify-center shrink-0 border border-[#E34222]/20 dark:border-[#E06A50]/30">
                        <Navigation size={18} className="text-[#E34222] dark:text-[#E06A50]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs uppercase text-[#E34222] dark:text-[#E06A50] mb-0.5 sm:mb-1 font-bold tracking-wider">
                          Drop Location
                        </p>
                        <p className="text-[#10251C] dark:text-[#F3F1E8] font-semibold text-xs sm:text-base leading-snug">
                          {booking.dropAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#696B64] dark:text-[#929D93] mt-2 font-medium">
                      <Clock size={14} className="opacity-70 shrink-0 text-[#696B64] dark:text-[#929D93]" />
                      <span>
                        {new Date(booking.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex flex-col justify-between lg:items-end gap-4 sm:gap-6 w-full lg:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#DED7CA] dark:border-[#29372E]">
                    <div className="text-left lg:text-right">
                      <p className="text-[10px] sm:text-xs tracking-wider text-[#696B64] dark:text-[#929D93] uppercase mb-0.5 sm:mb-1 font-bold">
                        Estimated Fare
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-2xl sm:text-3xl font-bold text-[#10251C] dark:text-[#F3F1E8] lg:justify-end">
                        <IndianRupee size={20} className="text-[#123D32] dark:text-[#347858]" />
                        {booking.fare}
                      </div>
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                      <button
                        onClick={() => handleDeclineOrTimeout(booking._id)}
                        disabled={processingId === booking._id}
                        className="flex-1 lg:flex-none px-4 sm:px-6 py-2.5 rounded-[8px] border border-[#DED7CA] dark:border-[#29372E] bg-[#FAF7F0] dark:bg-[#1E2B23] text-[#10251C] dark:text-[#F3F1E8] text-xs sm:text-sm font-semibold hover:bg-[#F7F1E5] dark:hover:bg-[#202B24] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => handleAccept(booking._id)}
                        disabled={processingId === booking._id}
                        className="flex-1 lg:flex-none px-5 sm:px-8 py-2.5 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] hover:bg-[#0D3027] dark:hover:bg-[#347858] text-[#FAF7F0] text-xs sm:text-sm font-semibold shadow-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {processingId === booking._id ? (
                          <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        ) : (
                          "Accept Ride"
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* ⚡ HIGH-PRIORITY 45-SECOND DISPATCH OVERLAY */}
      <AnimatePresence>
        {activeDispatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#29372E] w-full max-w-md rounded-[16px] p-6 shadow-2xl text-[#10251C] dark:text-[#F3F1E8] relative overflow-hidden"
            >
              {/* Top Banner */}
              <div className="flex items-center justify-between mb-6 border-b border-[#DED7CA] dark:border-[#29372E] pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#123D32] dark:bg-[#347858] animate-ping" />
                  <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#123D32] dark:text-[#347858]">Incoming Ride Offer</span>
                </div>
                {/* 45s Circular Countdown Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" className="text-[#DED7CA] dark:text-[#29372E]" fill="transparent" />
                    <circle
                      cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4"
                      className="text-[#123D32] dark:text-[#347858] transition-all duration-1000"
                      fill="transparent"
                      strokeDasharray={125.6}
                      strokeDashoffset={125.6 * (1 - timeLeft / 45)}
                    />
                  </svg>
                  <span className="absolute font-bold text-sm text-[#10251C] dark:text-[#F3F1E8]">{timeLeft}s</span>
                </div>
              </div>

              {/* Fare Banner */}
              <div className="bg-[#F7F1E5] dark:bg-[#101713] border border-[#DED7CA] dark:border-[#29372E] rounded-[12px] p-5 text-center mb-5">
                <p className="text-[#696B64] dark:text-[#929D93] text-[10px] uppercase tracking-wider font-bold mb-1">Estimated Fare</p>
                <div className="text-4xl font-bold text-[#10251C] dark:text-[#F3F1E8] flex items-center justify-center gap-1 font-serif">
                  <IndianRupee size={28} className="text-[#123D32] dark:text-[#347858]" /> {activeDispatch.fare}
                </div>
              </div>

              {/* Pickup & Drop Details */}
              <div className="bg-[#F7F1E5] dark:bg-[#101713] border border-[#DED7CA] dark:border-[#29372E] rounded-[12px] p-4 space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[#123D32]/10 dark:bg-[#28664D]/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#123D32]/20 dark:border-[#28664D]/30">
                    <MapPin size={16} className="text-[#123D32] dark:text-[#347858]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#123D32] dark:text-[#347858] uppercase tracking-wider">Pickup</p>
                    <p className="text-sm font-semibold text-[#10251C] dark:text-[#F3F1E8] leading-snug">{activeDispatch.pickupAddress}</p>
                  </div>
                </div>
                <div className="h-px bg-[#DED7CA] dark:bg-[#29372E] ml-11" />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[#E34222]/10 dark:bg-[#E06A50]/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#E34222]/20 dark:border-[#E06A50]/30">
                    <Navigation size={16} className="text-[#E34222] dark:text-[#E06A50]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#E34222] dark:text-[#E06A50] uppercase tracking-wider">Drop</p>
                    <p className="text-sm font-semibold text-[#10251C] dark:text-[#F3F1E8] leading-snug">{activeDispatch.dropAddress}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeclineOrTimeout(activeDispatch._id)}
                  disabled={processingId === activeDispatch._id}
                  className="flex-1 py-3 bg-[#FAF7F0] dark:bg-[#1E2B23] hover:bg-[#F7F1E5] dark:hover:bg-[#202B24] border border-[#DED7CA] dark:border-[#29372E] text-[#10251C] dark:text-[#F3F1E8] rounded-[8px] text-sm font-bold transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleAccept(activeDispatch._id)}
                  disabled={processingId === activeDispatch._id}
                  className="flex-1 py-3 bg-[#123D32] dark:bg-[#28664D] hover:bg-[#0D3027] dark:hover:bg-[#347858] text-[#FAF7F0] rounded-[8px] text-sm font-bold transition active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {processingId === activeDispatch._id ? (
                    <Loader2 className="animate-spin w-5 h-5 text-white" />
                  ) : (
                    <>
                      <Zap size={16} /> Accept ({timeLeft}s)
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}