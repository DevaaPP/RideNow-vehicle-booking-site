"use client";

import React from "react";
import {
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  CreditCard,
  X,
  ArrowRight,
  ShieldCheck,
  User,
  Car,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FareCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    _id: string;
    fare: number;
    partnerAmount?: number;
    adminCommission?: number;
    paymentStatus: string;
    paymentMethod?: string;
    user?: any;
    driver?: any;
    pickupAddress?: string;
    dropAddress?: string;
  };
  perspective: "vendor" | "rider";
}

export default function FareCollectionModal({
  isOpen,
  onClose,
  booking,
  perspective,
}: FareCollectionModalProps) {
  if (!isOpen || !booking) return null;

  const grossFare = booking.fare || 0;
  const adminCommission = booking.adminCommission || Math.round(grossFare * 0.1);
  const netPartnerPayout = booking.partnerAmount || (grossFare - adminCommission);
  const isCash = booking.paymentStatus === "cash" || booking.paymentMethod === "cash";
  const customerName = booking.user?.name || "Customer";
  const driverName = booking.driver?.name || "Driver Partner";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md bg-white border-4 border-zinc-950 rounded-none shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden my-auto select-none"
        >
          {/* Top Header Strip */}
          <div className="bg-zinc-950 px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-none ${isCash ? "bg-amber-400" : "bg-emerald-400"}`} />
              <h2 className="text-sm font-black uppercase tracking-wider font-mono">
                {perspective === "vendor" ? "Drop-off Completed • Payment Due" : "Ride Completed • Fare Due"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Focal Big Fare Callout Box */}
            <div className="bg-zinc-50 border-2 border-zinc-950 p-5 text-center space-y-1 relative">
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600 block">
                {perspective === "vendor"
                  ? "Price Customer Has To Pay"
                  : "Total Amount To Pay"}
              </span>
              <div className="flex items-center justify-center text-4xl sm:text-5xl font-black text-zinc-950 font-mono tracking-tight">
                <IndianRupee size={36} className="stroke-[3] mr-0.5" />
                <span>{grossFare}</span>
              </div>
              <p className="text-xs text-zinc-500 font-semibold mt-1">
                Gross Trip Fare (Inclusive of GST & Platform fees)
              </p>
            </div>

            {/* Directive Cash / Online Alert Banner */}
            {isCash ? (
              <div className="bg-amber-50 border-2 border-amber-500 p-4 text-left space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase tracking-tight">
                  <Banknote size={18} className="text-amber-700 flex-shrink-0" />
                  <span>
                    {perspective === "vendor"
                      ? `Collect ₹${grossFare} in Cash from Rider`
                      : `Please Pay ₹${grossFare} in Cash to Driver`}
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 font-medium leading-snug">
                  {perspective === "vendor"
                    ? `Payment mode is CASH. Please collect ₹${grossFare} from ${customerName} before departure. Your commission will be reconciled in wallet.`
                    : `Please hand over ₹${grossFare} cash directly to ${driverName}. No additional tip or fees are compulsory.`}
                </p>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-500 p-4 text-left space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm uppercase tracking-tight">
                  <CheckCircle2 size={18} className="text-emerald-700 flex-shrink-0" />
                  <span>
                    {perspective === "vendor"
                      ? "Do Not Collect Cash — Paid Online"
                      : "Paid Online — No Cash Required"}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 font-medium leading-snug">
                  {perspective === "vendor"
                    ? `Customer paid ₹${grossFare} digitally. Guaranteed net payout of ₹${netPartnerPayout} is already credited to your RideNow wallet.`
                    : "Payment of ₹" + grossFare + " was processed digitally. You are all set to go!"}
                </p>
              </div>
            )}

            {/* Reconciliation Breakdown (Especially valuable for Vendor) */}
            {perspective === "vendor" ? (
              <div className="bg-zinc-100 border border-zinc-300 p-3.5 space-y-2 text-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Driver Earnings Breakdown
                </p>
                <div className="flex justify-between text-zinc-700 font-semibold">
                  <span>Customer Gross Fare:</span>
                  <span className="font-mono text-zinc-950">₹{grossFare}</span>
                </div>
                <div className="flex justify-between text-zinc-600 font-medium">
                  <span>Platform Commission (10%):</span>
                  <span className="font-mono text-rose-600">-₹{adminCommission}</span>
                </div>
                <div className="pt-2 border-t border-zinc-300 flex justify-between text-emerald-800 font-black text-sm">
                  <span>Your Net Guaranteed Earning:</span>
                  <span className="font-mono text-emerald-700">₹{netPartnerPayout}</span>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-100 border border-zinc-300 p-3.5 space-y-1.5 text-xs text-zinc-700">
                <div className="flex items-center justify-between font-bold">
                  <span>Driver Partner:</span>
                  <span className="text-zinc-950">{driverName}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Payment Status:</span>
                  <span className="font-mono font-bold uppercase text-zinc-900">{booking.paymentStatus || "confirmed"}</span>
                </div>
              </div>
            )}

            {/* Confirmation CTA Button */}
            <button
              onClick={onClose}
              className="w-full py-4 bg-zinc-950 hover:bg-black text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer shadow-md"
            >
              <span>{perspective === "vendor" ? "Confirm Payment & Continue" : "Acknowledge & Finish"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
