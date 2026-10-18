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
    <div className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[14px] p-5 sm:p-6 shadow-sm mb-6 transition-colors">
      <div className="flex items-center justify-between pb-4 border-b border-[#DED7CA] dark:border-[#34443A]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#696B64] dark:text-[#929D93]">
            Selected Vehicle
          </span>
          <h3 className="text-xl font-serif text-[#10251C] dark:text-[#F3F1E8]">{vehicleLabel}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#696B64] dark:text-[#929D93]">
            Estimated Fare
          </span>
          <p className="text-2xl font-bold text-[#10251C] dark:text-[#F3F1E8] flex items-center justify-end">
            <IndianRupee size={20} className="stroke-[2.5]" />
            {breakdown?.totalFare || fare}
          </p>
        </div>
      </div>

      {/* Itemized charges */}
      <div className="py-4 space-y-2.5 text-xs border-b border-[#DED7CA] dark:border-[#34443A]">
        <div className="flex justify-between text-[#696B64] dark:text-[#B8C2B8]">
          <span>Base Fare</span>
          <span className="font-semibold text-[#10251C] dark:text-[#F3F1E8]">₹{breakdown?.baseFare ?? 50}</span>
        </div>

        {breakdown?.distanceKm !== undefined && (
          <div className="flex justify-between text-[#696B64] dark:text-[#B8C2B8]">
            <span>Distance Fare ({breakdown.distanceKm.toFixed(1)} km)</span>
            <span className="font-semibold text-[#10251C] dark:text-[#F3F1E8]">₹{breakdown.distanceFare}</span>
          </div>
        )}

        <div className="flex justify-between text-[#696B64] dark:text-[#B8C2B8]">
          <span>Platform & Safety Fee</span>
          <span className="font-semibold text-[#10251C] dark:text-[#F3F1E8]">₹{breakdown?.platformFee ?? 15}</span>
        </div>

        {breakdown && breakdown.surgeAmount !== undefined && breakdown.surgeAmount > 0 && (
          <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
            <span>High Demand Surge</span>
            <span>+₹{breakdown.surgeAmount}</span>
          </div>
        )}

        <div className="flex justify-between text-[#696B64] dark:text-[#B8C2B8]">
          <span>Applicable GST (5%)</span>
          <span className="font-semibold text-[#10251C] dark:text-[#F3F1E8]">₹{breakdown?.taxes ?? Math.round(fare * 0.05)}</span>
        </div>

        {breakdown && breakdown.isStudentDiscountApplied && breakdown.studentDiscount !== undefined && breakdown.studentDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold items-center">
            <span className="flex items-center gap-1">
              <GraduationCap size={14} /> Student Pass Discount (10%)
            </span>
            <span>-₹{breakdown.studentDiscount}</span>
          </div>
        )}
      </div>

      <div className="pt-3 flex items-center justify-between text-xs text-[#696B64] dark:text-[#929D93] font-medium">
        <div className="flex items-center gap-1.5 text-[#123D32] dark:text-[#90C8A8] font-semibold">
          <ShieldCheck size={14} />
          <span>Upfront Distance-Based Guarantee</span>
        </div>
        <span>No hidden waiting charges</span>
      </div>
    </div>
  );
}
