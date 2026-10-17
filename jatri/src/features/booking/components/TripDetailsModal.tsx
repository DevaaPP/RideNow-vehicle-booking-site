"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  X,
  Share2,
  Receipt,
  FileText,
  Star,
  ShieldCheck,
  HelpCircle,
  Car,
  Clock,
  MapPin,
  CheckCircle2,
  Heart,
  ChevronRight,
  IndianRupee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface BookingDetailsData {
  _id: string;
  createdAt?: string;
  startedAt?: string;
  actualPickupTime?: string;
  completedAt?: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLocation?: { coordinates: [number, number] };
  dropLocation?: { coordinates: [number, number] };
  routeCoordinates?: [number, number][];
  routeDistanceKm?: number;
  fare: number;
  status: string;
  paymentStatus?: string;
  tipAmount?: number;
  rating?: number;
  customerRating?: number;
  user?: {
    _id?: string;
    name?: string;
    phone?: string;
    mobileNumber?: string;
    image?: string;
    profilePicture?: string;
  };
  userMobileNumber?: string;
  driver?: {
    _id?: string;
    name?: string;
    mobileNumber?: string;
    phone?: string;
    image?: string;
    profilePicture?: string;
  };
  driverMobileNumber?: string;
  vehicle?: {
    vehicleModel?: string;
    number?: string;
    type?: string;
    imageUrl?: string;
  };
}

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetailsData | null;
  onOpenInvoice?: (booking: BookingDetailsData) => void;
  perspective?: "rider" | "vendor";
}

export default function TripDetailsModal({
  isOpen,
  onClose,
  booking,
  onOpenInvoice,
  perspective = "rider",
}: TripDetailsModalProps) {
  const isVendor = perspective === "vendor";
  const initialRating = isVendor ? (booking?.customerRating || 5) : (booking?.rating || 5);
  const initialRated = isVendor ? Boolean(booking?.customerRating) : Boolean(booking?.rating);
  const [userRating, setUserRating] = useState<number>(initialRating);
  const [rated, setRated] = useState(initialRated);
  const [showReceiptDetails, setShowReceiptDetails] = useState(false);

  // Sync state when booking changes
  React.useEffect(() => {
    if (booking) {
      const initial = isVendor ? (booking.customerRating || 5) : (booking.rating || 5);
      const hasRated = isVendor ? Boolean(booking.customerRating) : Boolean(booking.rating);
      setUserRating(initial);
      setRated(hasRated);
    }
  }, [booking?._id, isVendor, booking?.rating, booking?.customerRating]);

  if (!isOpen || !booking) return null;

  const counterpartName = isVendor
    ? (booking.user?.name || "Customer")
    : (booking.driver?.name || "RideNow Partner");
  const counterpartPhone = isVendor
    ? (booking.user?.phone || booking.user?.mobileNumber || booking.userMobileNumber)
    : (booking.driver?.phone || booking.driver?.mobileNumber || booking.driverMobileNumber);
  const counterpartImage = isVendor
    ? (booking.user?.image || booking.user?.profilePicture)
    : (booking.driver?.image || booking.driver?.profilePicture);

  const vehicleModel = booking.vehicle?.vehicleModel || "Economy Vehicle";
  const vehicleNumber = booking.vehicle?.number || "";
  const vehicleType = booking.vehicle?.type
    ? booking.vehicle.type.charAt(0).toUpperCase() + booking.vehicle.type.slice(1)
    : "Ride";

  // Format dates & times
  const createdDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
  const formattedDate = createdDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const pickupTimeStr = (booking.actualPickupTime || booking.startedAt || booking.createdAt)
    ? new Date(booking.actualPickupTime || booking.startedAt || booking.createdAt!).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  const dropoffTimeStr = booking.completedAt
    ? new Date(booking.completedAt).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : (booking.actualPickupTime || booking.startedAt)
    ? new Date(new Date(booking.actualPickupTime || booking.startedAt!).getTime() + 25 * 60000).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "—";

  // Coordinate projection for vector route map
  const rawCoords: [number, number][] =
    booking.routeCoordinates && booking.routeCoordinates.length > 1
      ? booking.routeCoordinates
      : [
          booking.pickupLocation?.coordinates || [91.7362, 26.1445],
          booking.dropLocation?.coordinates || [91.7500, 26.1800],
        ];

  // Calculate SVG bounds
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  rawCoords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  const padding = 20;
  const svgWidth = 360;
  const svgHeight = 170;

  const lngRange = maxLng - minLng || 0.001;
  const latRange = maxLat - minLat || 0.001;

  const projectPoint = ([lng, lat]: [number, number]) => {
    const x = padding + ((lng - minLng) / lngRange) * (svgWidth - 2 * padding);
    // Invert y since svg 0 is top
    const y = svgHeight - (padding + ((lat - minLat) / latRange) * (svgHeight - 2 * padding));
    return [x, y];
  };

  const projectedPoints = rawCoords.map(projectPoint);
  const pathD = projectedPoints.reduce((acc, [x, y], idx) => {
    return idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, "");

  const startPoint = projectedPoints[0] || [padding, svgHeight - padding];
  const endPoint = projectedPoints[projectedPoints.length - 1] || [svgWidth - padding, padding];

  const handleRate = async (stars: number) => {
    setUserRating(stars);
    setRated(true);
    try {
      await fetch(`/api/booking/${booking._id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars }),
      });
    } catch (e) {
      // Silent catch
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-none shadow-2xl border border-zinc-200 overflow-hidden flex flex-col my-auto max-h-[94vh]"
      >
        {/* ══ HEADER ══ */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-4 py-3.5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-none border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-800 transition-colors"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight">
              Trip details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-none border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ══ SCROLLABLE CONTENT ══ */}
        <div className="overflow-y-auto flex-1 divide-y divide-zinc-200">
          
          {/* 1. TOP HELP BANNER */}
          <div className="bg-zinc-50 px-4 py-3 flex items-center justify-between text-xs text-zinc-700">
            <span className="font-medium text-zinc-700">
              Having an issue with this trip?
            </span>
            <button
              onClick={() => window.location.href = `mailto:support@ridenow.in?subject=Help with Trip ${booking._id}`}
              className="bg-zinc-900 hover:bg-black text-white font-bold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-none transition"
            >
              Get help
            </button>
          </div>

          {/* 2. VECTOR ROUTE PREVIEW MAP */}
          <div className="relative bg-zinc-950 px-4 py-4 overflow-hidden">
            {/* Street Grid pattern background */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            <div className="relative z-10 flex flex-col items-center">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full max-h-[170px] drop-shadow-md"
              >
                {/* Route glow / halo */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                {/* Route core line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Pickup marker: white circle with black ring */}
                <circle
                  cx={startPoint[0]}
                  cy={startPoint[1]}
                  r="7"
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="3.5"
                />

                {/* Drop marker: solid black square with white border */}
                <rect
                  x={endPoint[0] - 6}
                  y={endPoint[1] - 6}
                  width="12"
                  height="12"
                  fill="#000000"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </svg>

              {/* Distance badge overlay */}
              <div className="absolute bottom-2 right-2 bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-300">
                {booking.routeDistanceKm ? `${booking.routeDistanceKm.toFixed(1)} KM` : "ROUTE TRACKED"}
              </div>
            </div>
          </div>

          {/* 3. PARTICIPANT & RIDE CARD */}
          <div className="p-4 bg-white flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <h3 className="text-base sm:text-lg font-black text-zinc-950 tracking-tight leading-snug">
                {isVendor ? `${vehicleType} trip with ${counterpartName}` : `${vehicleType} ride with ${counterpartName}`}
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {formattedDate}, {pickupTimeStr}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-sm font-black text-zinc-900">
                  ₹{booking.fare}
                </span>
                <span className="text-xs text-zinc-400">•</span>
                <span className="text-xs text-zinc-600 font-semibold truncate">
                  {vehicleModel} {vehicleNumber ? `(${vehicleNumber})` : ""}
                </span>
                {counterpartPhone && (
                  <>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500 font-mono font-medium">
                      {counterpartPhone}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-zinc-100 border-2 border-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {counterpartImage ? (
                <img
                  src={counterpartImage}
                  alt={counterpartName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base font-black text-zinc-800">
                  {counterpartName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* 4. ACTION BUTTONS: [Receipt] & [Invoice] */}
          <div className="px-4 py-3 bg-zinc-50 flex items-center gap-2.5">
            <button
              onClick={() => setShowReceiptDetails(!showReceiptDetails)}
              className="flex-1 py-2 px-3 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Receipt size={14} />
              <span>{showReceiptDetails ? "Hide Receipt" : "Receipt"}</span>
            </button>

            <button
              onClick={() => onOpenInvoice && onOpenInvoice(booking)}
              className="flex-1 py-2 px-3 bg-zinc-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FileText size={14} />
              <span>Tax Invoice</span>
            </button>
          </div>

          {/* Expandable Receipt Breakdown */}
          <AnimatePresence>
            {showReceiptDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-zinc-100 border-b border-zinc-200 px-4 py-3 space-y-2 text-xs"
              >
                <div className="flex justify-between text-zinc-600">
                  <span>Trip Fare</span>
                  <span>₹{(booking.fare * 0.952).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>5% GST (CGST 2.5% + SGST 2.5%)</span>
                  <span>₹{(booking.fare * 0.048).toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 flex justify-between font-black text-zinc-950 text-sm">
                  <span>Total Paid ({booking.paymentStatus || "cash"})</span>
                  <span>₹{booking.fare}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 5. TRIP TIMELINE & WAYPOINTS */}
          <div className="p-4 bg-white space-y-4">
            {/* Pickup Node */}
            <div className="flex items-start gap-3">
              <div className="w-16 flex-shrink-0 text-right pt-0.5">
                <span className="text-xs font-bold text-zinc-600 tabular-nums">
                  {pickupTimeStr}
                </span>
              </div>
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                {/* Hollow circle marker */}
                <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950 bg-white" />
                <div className="w-0.5 h-9 bg-zinc-300 my-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black text-zinc-950 leading-tight">
                  {booking.pickupAddress}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Pick-up spot</p>
              </div>
            </div>

            {/* Drop Node */}
            <div className="flex items-start gap-3">
              <div className="w-16 flex-shrink-0 text-right pt-0.5">
                <span className="text-xs font-bold text-zinc-600 tabular-nums">
                  {dropoffTimeStr}
                </span>
              </div>
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                {/* Solid square marker */}
                <div className="w-3.5 h-3.5 rounded-none bg-zinc-950 border border-zinc-950" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-black text-zinc-950 leading-tight">
                  {booking.dropAddress}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Drop-off destination</p>
              </div>
            </div>
          </div>

          {/* 6. RATE TRIP / PASSENGER SECTION */}
          <div className="p-4 bg-white flex items-center justify-between border-t border-zinc-200">
            <div>
              <p className="text-sm font-black text-zinc-950 uppercase tracking-tight">
                {isVendor ? "Rate your passenger" : "Rate your trip"}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium">
                {rated ? "Feedback submitted" : isVendor ? `How was ${counterpartName}?` : "How was your driver?"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(star)}
                  className="p-1 hover:scale-110 transition cursor-pointer"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    size={20}
                    className={`${
                      star <= userRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 7. PRIVACY NOTE */}
          <div className="p-4 bg-zinc-100 flex items-start gap-3 text-zinc-600 border-t border-zinc-200">
            <ShieldCheck size={18} className="text-zinc-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {isVendor
                ? "Trip record is archived in your partner dashboard. Rider personal details are protected under RideNow privacy safeguards."
                : "After your trip, the driver cannot see your exact pick-up or drop-off address details. Your personal location data is strictly protected under RideNow privacy safeguards."}
            </p>
          </div>

        </div>

        {/* ══ FOOTER ══ */}
        <div className="p-3 bg-white border-t border-zinc-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none transition"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
