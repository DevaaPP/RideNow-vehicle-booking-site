"use client";

import { motion } from "framer-motion";
import { Wallet, Banknote, CreditCard, CheckCircle2 } from "lucide-react";

export type PaymentMethodType = "cash" | "wallet" | "razorpay";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
  walletBalance: number;
  fare: number;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  walletBalance,
  fare,
}: PaymentMethodSelectorProps) {
  const isWalletSufficient = walletBalance >= fare;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm mb-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
        Payment Method
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Wallet */}
        <button
          type="button"
          onClick={() => isWalletSufficient && onSelect("wallet")}
          disabled={!isWalletSufficient}
          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            selectedMethod === "wallet"
              ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
              : isWalletSufficient
              ? "border-zinc-200 hover:border-zinc-400 text-zinc-800"
              : "border-zinc-100 bg-zinc-50 opacity-60 cursor-not-allowed text-zinc-400"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                selectedMethod === "wallet" ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-800"
              }`}
            >
              <Wallet size={18} />
            </div>
            {selectedMethod === "wallet" && <CheckCircle2 size={16} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">RideNow Wallet</p>
            <p
              className={`text-[11px] mt-0.5 ${
                selectedMethod === "wallet" ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              Balance: ₹{walletBalance}
            </p>
            {!isWalletSufficient && (
              <span className="text-[10px] text-amber-600 font-semibold block mt-1">
                Insufficient (needs ₹{fare})
              </span>
            )}
          </div>
        </button>

        {/* Cash */}
        <button
          type="button"
          onClick={() => onSelect("cash")}
          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            selectedMethod === "cash"
              ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
              : "border-zinc-200 hover:border-zinc-400 text-zinc-800"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                selectedMethod === "cash" ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-800"
              }`}
            >
              <Banknote size={18} />
            </div>
            {selectedMethod === "cash" && <CheckCircle2 size={16} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">Cash to Driver</p>
            <p
              className={`text-[11px] mt-0.5 ${
                selectedMethod === "cash" ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              Pay upon dropoff
            </p>
          </div>
        </button>

        {/* Online / Razorpay */}
        <button
          type="button"
          onClick={() => onSelect("razorpay")}
          className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
            selectedMethod === "razorpay"
              ? "border-zinc-900 bg-zinc-900 text-white shadow-md"
              : "border-zinc-200 hover:border-zinc-400 text-zinc-800"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                selectedMethod === "razorpay" ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-800"
              }`}
            >
              <CreditCard size={18} />
            </div>
            {selectedMethod === "razorpay" && <CheckCircle2 size={16} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">UPI / Card / NetBanking</p>
            <p
              className={`text-[11px] mt-0.5 ${
                selectedMethod === "razorpay" ? "text-zinc-300" : "text-zinc-500"
              }`}
            >
              Instant Razorpay checkout
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
