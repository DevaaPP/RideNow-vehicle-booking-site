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
            className="p-4 rounded-none bg-zinc-950 text-white flex items-center justify-between border border-zinc-950"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} />
              <span className="text-xs font-mono font-bold">{withdrawSuccess}</span>
            </div>
            <button
              onClick={() => setWithdrawSuccess(null)}
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-white text-zinc-950 hover:bg-zinc-200"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRIVER WALLET HERO & METRICS */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Available Earnings Card */}
        <div className="lg:col-span-2 rounded-none bg-zinc-950 text-white p-6 sm:p-7 border border-zinc-950 flex flex-col justify-between min-h-[220px]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-none bg-emerald-400 inline-block" />
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                  {t("wallet.driverTitle", "Driver Earnings & Settlement")}
                </p>
              </div>
              <div className="flex items-baseline gap-1 mt-1 font-mono">
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
                  ₹{availableEarnings.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-zinc-400">INR</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 font-mono">
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-none bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
              >
                <Building2 size={14} /> {t("wallet.withdraw", "Withdraw to Bank")}
              </button>
              {availableEarnings < 100 && (
                <span className="text-[10px] font-mono text-zinc-500">Min payout threshold: ₹100</span>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-zinc-300" />
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
              className="text-xs font-mono font-bold text-white hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              Full Ledger Page <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div className="flex flex-col gap-3">
          {platformDues > 0 && (
            <div className="bg-zinc-50 rounded-none p-4 border border-zinc-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-none bg-zinc-950 text-white flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                    {t("wallet.platformDues", "Platform Dues")}
                  </p>
                  <p className="text-base font-bold text-zinc-950 font-mono tabular-nums mt-0.5">
                    ₹{platformDues.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-600 bg-zinc-200 px-1.5 py-0.5">
                  Auto-settling
                </span>
                <Link
                  href="/partner/wallet"
                  className="text-[10px] font-mono font-bold text-zinc-950 underline hover:text-black uppercase tracking-wider"
                >
                  Clear Online →
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white rounded-none p-4 border border-zinc-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                {t("wallet.lifetimeEarnings", "Lifetime Earnings")}
              </p>
              <p className="text-base font-bold text-zinc-950 font-mono tabular-nums mt-0.5">
                ₹{metrics.totalEarnings.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-none p-4 border border-zinc-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center flex-shrink-0">
              <Percent size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                {t("wallet.platformCommission", "Platform Commission")}
              </p>
              <p className="text-base font-bold text-zinc-950 font-mono tabular-nums mt-0.5">
                ₹{metrics.totalCommission.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-none p-4 border border-zinc-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-zinc-100 text-zinc-900 border border-zinc-200 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                Total Withdrawn
              </p>
              <p className="text-base font-bold text-zinc-950 font-mono tabular-nums mt-0.5">
                ₹{metrics.totalWithdrawn.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER PASSBOOK & LEDGER */}
      <div className="bg-white rounded-none border border-zinc-300 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-950 uppercase tracking-tight">Driver Ledger &amp; Payout History</h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              Transparent log of ride fare earnings, commission allocations, and bank payouts.
            </p>
          </div>

          <div className="flex items-center gap-1 border border-zinc-300 p-0.5 bg-zinc-50 self-start sm:self-auto">
            {[
              { id: "all", label: "All" },
              { id: "earning", label: "Earnings" },
              { id: "commission", label: "Commission" },
              { id: "withdrawal", label: "Payouts" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1 rounded-none text-xs font-mono uppercase tracking-wider font-semibold transition-colors ${
                  activeFilter === tab.id
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Rows */}
        <div className="divide-y divide-zinc-200">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500">Loading ledger data...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-400">
              No ledger records found for this category.
            </div>
          ) : (
            filteredTransactions.slice(0, 10).map((tx, idx) => {
              const isCredit = tx.type === "earning";
              return (
                <div key={tx._id || idx} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none border border-zinc-200 bg-zinc-100 text-zinc-900 flex items-center justify-center font-mono text-xs">
                      {isCredit ? "+" : "-"}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-zinc-950">
                        {tx.description || (isCredit ? "Ride Fare Credited" : "Commission/Payout Deducted")}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()} · {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${isCredit ? "text-zinc-950" : "text-zinc-600"}`}>
                      {isCredit ? "+" : "-"}₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-sm bg-white rounded-none p-6 border border-zinc-300 shadow-none"
            >
              <div className="flex items-center justify-between mb-4 border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-none bg-zinc-950 text-white flex items-center justify-center font-bold">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 uppercase tracking-tight">Withdraw Earnings</h3>
                    <p className="text-[10px] font-mono text-zinc-500">Automated Direct Bank Payout</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-6 h-6 rounded-none border border-zinc-300 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 font-mono text-xs"
                >
                  ✕
                </button>
              </div>

              {withdrawError && (
                <div className="p-3 mb-3 bg-zinc-50 border border-zinc-300 text-xs text-red-600 font-mono flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Linked Bank Info Card */}
              {bankDetails ? (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-none mb-4 text-xs font-mono">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                    Beneficiary Account
                  </p>
                  <p className="font-bold text-zinc-950">{bankDetails.accountHolderName}</p>
                  <p className="text-zinc-600 text-[11px] mt-0.5">
                    Account: {bankDetails.maskedAccount} · IFSC: {bankDetails.ifsc}
                  </p>
                  {bankDetails.upi && (
                    <p className="text-zinc-400 text-[10px] mt-0.5">UPI ID: {bankDetails.upi}</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-zinc-50 border border-zinc-300 rounded-none mb-4 text-xs font-mono">
                  <p className="font-bold mb-1 text-zinc-950">No Bank Account Linked</p>
                  <p className="text-[11px] mb-2 text-zinc-500">
                    Link bank details to receive automated disbursements.
                  </p>
                  <Link
                    href="/partner/onboard/bank"
                    className="inline-block px-3 py-1 bg-zinc-950 text-white rounded-none text-[10px] font-bold uppercase tracking-wider"
                  >
                    Add Bank Details
                  </Link>
                </div>
              )}

              <form onSubmit={handleWithdraw}>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5 font-mono">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                      Amount to Withdraw
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      Available: ₹{availableEarnings.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center rounded-none border border-zinc-300 focus-within:border-zinc-950 transition-colors px-3 py-2 bg-white font-mono">
                    <span className="text-base font-bold text-zinc-400 mr-1.5">₹</span>
                    <input
                      type="number"
                      min={100}
                      max={availableEarnings}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="1000"
                      className="w-full text-lg font-bold text-zinc-950 outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="mb-5">
                  <div className="grid grid-cols-4 gap-1.5 font-mono">
                    {[500, 1000, 2500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(amt.toString())}
                        disabled={amt > availableEarnings}
                        className="py-1.5 rounded-none text-xs font-bold border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        ₹{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(availableEarnings.toString())}
                      disabled={availableEarnings <= 0}
                      className="py-1.5 rounded-none text-xs font-bold border border-zinc-950 bg-zinc-950 text-white hover:bg-black disabled:opacity-40"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 py-2.5 rounded-none border border-zinc-300 text-xs font-mono uppercase font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingWithdraw || !withdrawAmount || Number(withdrawAmount) < 100 || !bankDetails}
                    className="flex-1 py-2.5 rounded-none bg-zinc-950 text-white text-xs font-mono uppercase tracking-wider font-bold hover:bg-black transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {processingWithdraw ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        <span>Confirm Payout</span>
                        <ArrowUpRight size={14} />
                      </>
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
