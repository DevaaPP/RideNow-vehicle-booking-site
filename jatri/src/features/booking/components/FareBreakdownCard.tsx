"use client";

import { motion } from "framer-motion";
import { IndianRupee, ShieldCheck, GraduationCap, Info } from "lucide-react";

interface FareBreakdownCardProps {
  vehicle: string;
  fare: number;
  breakdown?: {
    baseFare: number;
    distanceKm: number;
    distanceFare: number;
    platformFee: number;
    surgeAmount?: number;
    taxes: number;
    discount?: number;
    isStudentDiscountApplied?: boolean;
    studentDiscount?: number;
    totalFare: number;
  } | null;
  isStudent?: boolean;
}

export default function FareBreakdownCard({
  vehicle,
  fare,
  breakdown,
  isStudent,
}: FareBreakdownCardProps) {
  const vehicleLabel = vehicle.charAt(0).toUpperCase() + vehicle.slice(1);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Selected Vehicle
          </span>
          <h3 className="text-xl font-black text-zinc-900">{vehicleLabel}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Estimated Fare
          </span>
          <p className="text-2xl font-black text-zinc-900 flex items-center justify-end">
            <IndianRupee size={20} className="stroke-[2.5]" />
            {breakdown?.totalFare || fare}
          </p>
        </div>
      </div>

      {/* Itemized charges */}
      <div className="py-4 space-y-2.5 text-xs border-b border-zinc-100">
        <div className="flex justify-between text-zinc-600">
          <span>Base Fare</span>
          <span className="font-semibold">₹{breakdown?.baseFare ?? 50}</span>
        </div>

        {breakdown?.distanceKm !== undefined && (
          <div className="flex justify-between text-zinc-600">
            <span>Distance Fare ({breakdown.distanceKm.toFixed(1)} km)</span>
            <span className="font-semibold">₹{breakdown.distanceFare}</span>
          </div>
        )}

        <div className="flex justify-between text-zinc-600">
          <span>Platform & Safety Fee</span>
          <span className="font-semibold">₹{breakdown?.platformFee ?? 15}</span>
        </div>

        {breakdown && breakdown.surgeAmount !== undefined && breakdown.surgeAmount > 0 && (
          <div className="flex justify-between text-amber-600 font-semibold">
            <span>High Demand Surge</span>
            <span>+₹{breakdown.surgeAmount}</span>
          </div>
        )}

        <div className="flex justify-between text-zinc-600">
          <span>Applicable GST (5%)</span>
          <span className="font-semibold">₹{breakdown?.taxes ?? Math.round(fare * 0.05)}</span>
        </div>

        {breakdown && breakdown.isStudentDiscountApplied && breakdown.studentDiscount !== undefined && breakdown.studentDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 font-semibold items-center">
            <span className="flex items-center gap-1">
              <GraduationCap size={14} /> Student Pass Discount (10%)
            </span>
            <span>-₹{breakdown.studentDiscount}</span>
          </div>
        )}
      </div>

      <div className="pt-3 flex items-center justify-between text-xs text-zinc-400 font-medium">
        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
          <ShieldCheck size={14} />
          <span>Upfront Distance-Based Guarantee</span>
        </div>
        <span>No hidden waiting charges</span>
      </div>
    </div>
  );
}
