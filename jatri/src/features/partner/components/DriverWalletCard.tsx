"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Percent,
  ChevronRight,
  ShieldCheck,
  IndianRupee,
  Clock,
  Car,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function DriverWalletCard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [availableEarnings, setAvailableEarnings] = useState(0);
  const [platformDues, setPlatformDues] = useState(0);
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    totalCommission: 0,
    totalWithdrawn: 0,
    transactionCount: 0,
  });
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "earning" | "commission" | "withdrawal">("all");

  /* Withdrawal Modal State */
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [processingWithdraw, setProcessingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const fetchDriverWallet = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/partner/wallet", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = await res.json();
      if (data.success) {
        setAvailableEarnings(data.availableEarnings || 0);
        setPlatformDues(data.platformDues || data.wallet?.platformDues || 0);
        setMetrics(data.metrics || {
          totalEarnings: 0,
          totalCommission: 0,
          totalWithdrawn: 0,
          transactionCount: 0,
        });
        setBankDetails(data.bankDetails);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load driver wallet:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDriverWallet();
  }, [fetchDriverWallet]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.round(Number(withdrawAmount));

    if (!amountNum || isNaN(amountNum) || amountNum < 100) {
      setWithdrawError("Minimum withdrawal amount is ₹100");
      return;
    }

    if (amountNum > availableEarnings) {
      setWithdrawError(`Requested amount exceeds available balance (₹${availableEarnings.toLocaleString("en-IN")})`);
      return;
    }

    try {
      setProcessingWithdraw(true);
      setWithdrawError(null);

      const res = await fetch("/api/partner/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();

      if (data.success) {
        setWithdrawSuccess(`Payout request for ₹${amountNum.toLocaleString("en-IN")} submitted successfully.`);
        setShowWithdrawModal(false);
        setWithdrawAmount("");
        fetchDriverWallet();
      } else {
        setWithdrawError(data.message || "Failed to process payout.");
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setWithdrawError("Connection error while requesting payout.");
    } finally {
      setProcessingWithdraw(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === "all") return true;
    return tx.type === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner for Success */}
      <AnimatePresence>
        {withdrawSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-[8px] bg-[#123D32] dark:bg-[#0D3027] text-[#FAF7F0] flex items-center justify-between border border-[#123D32] dark:border-[#29372E]"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-xs font-mono font-bold">{withdrawSuccess}</span>
            </div>
            <button
              onClick={() => setWithdrawSuccess(null)}
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-[#FAF7F0] text-[#10251C] dark:bg-[#1E2B23] dark:text-[#F3F1E8] hover:bg-[#F7F1E5] dark:hover:bg-[#202B24] rounded-[6px] cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRIVER WALLET HERO & METRICS */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Available Earnings Card */}
        <div className="lg:col-span-2 rounded-[16px] bg-[#0D3027] dark:bg-[#091D17] text-[#FAF7F0] p-6 sm:p-7 border border-[#123D32] dark:border-[#28664D]/40 flex flex-col justify-between min-h-[220px] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FAF7F0]/70">
                  {t("wallet.driverTitle", "Driver Earnings & Settlement")}
                </p>
              </div>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-3xl sm:text-4xl font-bold text-[#FAF7F0] tracking-tight tabular-nums">
                  ₹{availableEarnings.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-[#FAF7F0]/60">INR</span>
              </div>
              <p className="text-xs text-[#FAF7F0]/80 mt-2 font-sans">
                {t("wallet.driverEarningsDesc", "Net balance ready for instant automated bank disbursement.")}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <button
                onClick={() => {
                  setWithdrawAmount(availableEarnings > 0 ? Math.min(availableEarnings, 1000).toString() : "");
                  setShowWithdrawModal(true);
                }}
                disabled={availableEarnings < 100}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#FAF7F0] text-[#10251C] hover:bg-[#F7F1E5] disabled:opacity-40 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                <Building2 size={14} className="text-[#123D32]" /> {t("wallet.withdraw", "Withdraw to Bank")}
              </button>
              {availableEarnings < 100 && (
                <span className="text-[10px] font-mono text-[#FAF7F0]/60">Min payout threshold: ₹100</span>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#123D32] dark:border-[#28664D]/30 flex flex-wrap items-center justify-between gap-3 text-xs text-[#FAF7F0]/80 font-sans">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-[#FAF7F0]/70" />
              {bankDetails ? (
                <span>
                  Linked Account: <strong className="text-white">{bankDetails.maskedAccount}</strong> ({bankDetails.ifsc})
                </span>
              ) : (
                <Link
                  href="/partner/onboard/bank"
                  className="text-white font-bold underline flex items-center gap-1 uppercase tracking-wider text-[11px]"
                >
                  Link Bank Account for Payouts <ChevronRight size={13} />
                </Link>
              )}
            </div>
            <Link
              href="/partner/wallet"
              className="text-xs font-semibold text-[#FAF7F0] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              Full Ledger Page <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="flex flex-col gap-3">
          {platformDues > 0 && (
            <div className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[12px] p-4 border border-[#DED7CA] dark:border-[#29372E] flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-red-100 dark:bg-red-950/30 text-[#B83A24] dark:text-[#E06A50] flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93]">
                    {t("wallet.platformDues", "Platform Dues")}
                  </p>
                  <p className="text-base font-bold text-[#10251C] dark:text-[#F3F1E8] font-mono tabular-nums mt-0.5">
                    ₹{platformDues.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93] bg-[#F7F1E5] dark:bg-[#101713] px-1.5 py-0.5 rounded-[4px]">
                  Auto-settling
                </span>
                <Link
                  href="/partner/wallet"
                  className="text-[10px] font-bold text-[#B83A24] dark:text-[#E06A50] underline hover:text-[#10251C] dark:hover:text-[#F3F1E8] uppercase tracking-wider"
                >
                  Clear Online →
                </Link>
              </div>
            </div>
          )}

          <div className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[12px] p-4 border border-[#DED7CA] dark:border-[#29372E] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-[8px] bg-[#F7F1E5] dark:bg-[#101713] text-[#123D32] dark:text-[#347858] border border-[#DED7CA] dark:border-[#29372E] flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93]">
                {t("wallet.lifetimeEarnings", "Lifetime Earnings")}
              </p>
              <p className="text-base font-bold text-[#10251C] dark:text-[#F3F1E8] font-mono tabular-nums mt-0.5">
                ₹{metrics.totalEarnings.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[12px] p-4 border border-[#DED7CA] dark:border-[#29372E] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-[8px] bg-[#F7F1E5] dark:bg-[#101713] text-[#123D32] dark:text-[#347858] border border-[#DED7CA] dark:border-[#29372E] flex items-center justify-center flex-shrink-0">
              <Percent size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93]">
                {t("wallet.platformCommission", "Platform Commission")}
              </p>
              <p className="text-base font-bold text-[#10251C] dark:text-[#F3F1E8] font-mono tabular-nums mt-0.5">
                ₹{metrics.totalCommission.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[12px] p-4 border border-[#DED7CA] dark:border-[#29372E] flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-[8px] bg-[#F7F1E5] dark:bg-[#101713] text-[#123D32] dark:text-[#347858] border border-[#DED7CA] dark:border-[#29372E] flex items-center justify-center flex-shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93]">
                Total Withdrawn
              </p>
              <p className="text-base font-bold text-[#10251C] dark:text-[#F3F1E8] font-mono tabular-nums mt-0.5">
                ₹{metrics.totalWithdrawn.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER PASSBOOK & LEDGER */}
      <div className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[16px] border border-[#DED7CA] dark:border-[#29372E] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DED7CA] dark:border-[#29372E] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#10251C] dark:text-[#F3F1E8] tracking-tight">Driver Ledger &amp; Payout History</h3>
            <p className="text-xs text-[#696B64] dark:text-[#B8C2B8] mt-0.5 font-sans">
              Transparent log of ride fare earnings, commission allocations, and bank payouts.
            </p>
          </div>

          <div className="flex items-center gap-1 border border-[#DED7CA] dark:border-[#29372E] p-0.5 bg-[#F7F1E5] dark:bg-[#101713] rounded-[8px] self-start sm:self-auto">
            {[
              { id: "all", label: "All" },
              { id: "earning", label: "Earnings" },
              { id: "commission", label: "Commission" },
              { id: "withdrawal", label: "Payouts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1 rounded-[6px] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeFilter === tab.id
                    ? "bg-[#123D32] dark:bg-[#28664D] text-[#FAF7F0]"
                    : "text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Rows */}
        <div className="divide-y divide-[#DED7CA] dark:divide-[#29372E]">
          {loading ? (
            <div className="p-8 text-center text-xs font-sans text-[#696B64] dark:text-[#929D93]">Loading ledger data...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs font-sans text-[#696B64] dark:text-[#929D93]">
              No ledger records found for this category.
            </div>
          ) : (
            filteredTransactions.slice(0, 10).map((tx, idx) => {
              const isCredit = tx.type === "earning";
              return (
                <div key={tx._id || idx} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F7F1E5] dark:hover:bg-[#101713] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] border border-[#DED7CA] dark:border-[#29372E] bg-[#F7F1E5] dark:bg-[#101713] text-[#123D32] dark:text-[#347858] flex items-center justify-center font-mono text-xs font-bold">
                      {isCredit ? "+" : "-"}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#10251C] dark:text-[#F3F1E8]">
                        {tx.description || (isCredit ? "Ride Fare Credited" : "Commission/Payout Deducted")}
                      </p>
                      <p className="text-[10px] text-[#696B64] dark:text-[#929D93] mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${isCredit ? "text-[#123D32] dark:text-[#347858]" : "text-[#B83A24] dark:text-[#E06A50]"}`}>
                      {isCredit ? "+" : "-"}₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#696B64] dark:text-[#929D93]">
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-sm bg-[#FAF7F0] dark:bg-[#17211B] rounded-[16px] p-6 border border-[#DED7CA] dark:border-[#29372E] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-[#DED7CA] dark:border-[#29372E] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] text-[#FAF7F0] flex items-center justify-center font-bold">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#10251C] dark:text-[#F3F1E8] tracking-tight">Withdraw Earnings</h3>
                    <p className="text-[10px] text-[#696B64] dark:text-[#929D93]">Automated Direct Bank Payout</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-6 h-6 rounded-[6px] border border-[#DED7CA] dark:border-[#29372E] hover:bg-[#F7F1E5] dark:hover:bg-[#101713] flex items-center justify-center text-[#696B64] dark:text-[#929D93] text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {withdrawError && (
                <div className="p-3 mb-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[8px] text-xs text-[#B83A24] dark:text-[#E06A50] flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Linked Bank Info Card */}
              {bankDetails ? (
                <div className="p-3 bg-[#F7F1E5] dark:bg-[#101713] border border-[#DED7CA] dark:border-[#29372E] rounded-[8px] mb-4 text-xs font-sans">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93] mb-1">
                    Beneficiary Account
                  </p>
                  <p className="font-bold text-[#10251C] dark:text-[#F3F1E8]">{bankDetails.accountHolderName}</p>
                  <p className="text-[#696B64] dark:text-[#929D93] text-[11px] mt-0.5">
                    Account: {bankDetails.maskedAccount} · IFSC: {bankDetails.ifsc}
                  </p>
                  {bankDetails.upi && (
                    <p className="text-[#696B64] dark:text-[#929D93] text-[10px] mt-0.5">UPI ID: {bankDetails.upi}</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#F7F1E5] dark:bg-[#101713] border border-[#DED7CA] dark:border-[#29372E] rounded-[8px] mb-4 text-xs font-sans">
                  <p className="font-bold mb-1 text-[#10251C] dark:text-[#F3F1E8]">No Bank Account Linked</p>
                  <p className="text-[11px] mb-2 text-[#696B64] dark:text-[#929D93]">
                    Link bank details to receive automated disbursements.
                  </p>
                  <Link
                    href="/partner/onboard/bank"
                    className="inline-block px-3 py-1 bg-[#123D32] dark:bg-[#28664D] text-[#FAF7F0] rounded-[6px] text-[10px] font-semibold uppercase tracking-wider"
                  >
                    Add Bank Details
                  </Link>
                </div>
              )}

              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#696B64] dark:text-[#929D93]">
                      Amount to Withdraw
                    </label>
                    <span className="text-[10px] text-[#696B64] dark:text-[#929D93]">
                      Available: ₹{availableEarnings.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center rounded-[8px] border border-[#DED7CA] dark:border-[#29372E] focus-within:border-[#123D32] dark:focus-within:border-[#28664D] transition-colors px-3 py-2 bg-white dark:bg-[#101713]">
                    <span className="text-base font-bold text-[#696B64] dark:text-[#929D93] mr-1.5 font-mono">₹</span>
                    <input
                      type="number"
                      min={100}
                      max={availableEarnings}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full text-lg font-bold text-[#10251C] dark:text-[#F3F1E8] outline-none bg-transparent font-mono"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mb-5">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[500, 1000, 2500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(amt.toString())}
                        disabled={amt > availableEarnings}
                        className="py-1.5 rounded-[6px] text-xs font-semibold border border-[#DED7CA] dark:border-[#29372E] bg-[#F7F1E5] dark:bg-[#101713] hover:bg-[#FAF7F0] dark:hover:bg-[#17211B] disabled:opacity-40 cursor-pointer text-[#10251C] dark:text-[#F3F1E8]"
                      >
                        ₹{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(availableEarnings.toString())}
                      disabled={availableEarnings <= 0}
                      className="py-1.5 rounded-[6px] text-xs font-semibold border border-[#123D32] dark:border-[#28664D] bg-[#123D32] dark:bg-[#28664D] text-[#FAF7F0] hover:bg-[#0D3027] dark:hover:bg-[#347858] disabled:opacity-40 cursor-pointer"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-[8px] border border-[#DED7CA] dark:border-[#29372E] text-xs uppercase font-semibold text-[#10251C] dark:text-[#F3F1E8] bg-[#FAF7F0] dark:bg-[#1E2B23] hover:bg-[#F7F1E5] dark:hover:bg-[#202B24] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingWithdraw || !withdrawAmount || Number(withdrawAmount) < 100 || !bankDetails}
                    className="flex-1 py-2.5 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] text-[#FAF7F0] text-xs uppercase tracking-wider font-semibold hover:bg-[#0D3027] dark:hover:bg-[#347858] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {processingWithdraw ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Confirm Payout"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
