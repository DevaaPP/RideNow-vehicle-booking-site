"use client";

import { motion } from "framer-motion";
import { Wallet, Banknote, CreditCard, CheckCircle2 } from "lucide-react";

export type PaymentMethodType = "cash" | "wallet" | "online" | "razorpay";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType | null;
  onSelect: (method: any) => void;
  walletBalance: number | null;
  fare: number;
}

export default function PaymentMethodSelector({
  selectedMethod,
  onSelect,
  walletBalance,
  fare,
}: PaymentMethodSelectorProps) {
  const isWalletSufficient = walletBalance !== null && walletBalance >= fare;
  const isOnlineActive = selectedMethod === "online" || selectedMethod === "razorpay";

  return (
    <div className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[14px] p-5 sm:p-6 shadow-sm mb-6 transition-colors">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#696B64] dark:text-[#929D93] mb-4">
        Payment Method
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Wallet */}
        <button
          type="button"
          onClick={() => isWalletSufficient && onSelect("wallet")}
          disabled={!isWalletSufficient}
          className={`p-4 rounded-[10px] border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
            selectedMethod === "wallet"
              ? "border-[#123D32] dark:border-[#28664D] bg-[#123D32] dark:bg-[#28664D] text-white shadow-md"
              : isWalletSufficient
              ? "border-[#DED7CA] dark:border-[#34443A] hover:border-[#123D32] dark:hover:border-[#90C8A8] bg-white dark:bg-[#1E2B23] text-[#10251C] dark:text-[#F3F1E8]"
              : "border-[#DED7CA]/50 dark:border-[#34443A]/50 bg-white/50 dark:bg-[#1E2B23]/50 opacity-60 cursor-not-allowed text-[#696B64] dark:text-[#929D93]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-[8px] flex items-center justify-center ${
                selectedMethod === "wallet"
                  ? "bg-white/20 text-white"
                  : "bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#90C8A8]"
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
                selectedMethod === "wallet" ? "text-white/80" : "text-[#696B64] dark:text-[#929D93]"
              }`}
            >
              {walletBalance !== null ? `Balance: ₹${walletBalance}` : "Loading..."}
            </p>
            {!isWalletSufficient && walletBalance !== null && (
              <span className="text-[10px] text-[#E34222] dark:text-[#E06A50] font-semibold block mt-1">
                Insufficient (needs ₹{fare})
              </span>
            )}
          </div>
        </button>

        {/* Cash */}
        <button
          type="button"
          onClick={() => onSelect("cash")}
          className={`p-4 rounded-[10px] border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
            selectedMethod === "cash"
              ? "border-[#123D32] dark:border-[#28664D] bg-[#123D32] dark:bg-[#28664D] text-white shadow-md"
              : "border-[#DED7CA] dark:border-[#34443A] hover:border-[#123D32] dark:hover:border-[#90C8A8] bg-white dark:bg-[#1E2B23] text-[#10251C] dark:text-[#F3F1E8]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-[8px] flex items-center justify-center ${
                selectedMethod === "cash"
                  ? "bg-white/20 text-white"
                  : "bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#90C8A8]"
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
                selectedMethod === "cash" ? "text-white/80" : "text-[#696B64] dark:text-[#929D93]"
              }`}
            >
              Pay upon dropoff
            </p>
          </div>
        </button>

        {/* Online / Razorpay */}
        <button
          type="button"
          onClick={() => onSelect("online")}
          className={`p-4 rounded-[10px] border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
            isOnlineActive
              ? "border-[#123D32] dark:border-[#28664D] bg-[#123D32] dark:bg-[#28664D] text-white shadow-md"
              : "border-[#DED7CA] dark:border-[#34443A] hover:border-[#123D32] dark:hover:border-[#90C8A8] bg-white dark:bg-[#1E2B23] text-[#10251C] dark:text-[#F3F1E8]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={`w-9 h-9 rounded-[8px] flex items-center justify-center ${
                isOnlineActive
                  ? "bg-white/20 text-white"
                  : "bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#90C8A8]"
              }`}
            >
              <CreditCard size={18} />
            </div>
            {isOnlineActive && <CheckCircle2 size={16} className="text-white" />}
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">UPI / Card / NetBanking</p>
            <p
              className={`text-[11px] mt-0.5 ${
                isOnlineActive ? "text-white/80" : "text-[#696B64] dark:text-[#929D93]"
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
