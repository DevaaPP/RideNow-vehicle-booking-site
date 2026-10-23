"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function CancellationRefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#061A16] text-[#10251C] dark:text-[#F7F5ED] flex flex-col justify-between transition-colors duration-200">
      <Nav />

      {/* Header */}
      <section className="bg-[#123D32] dark:bg-[#061A16] text-white pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0D3027] dark:border-[#24483D]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F7F1E5] text-xs font-bold uppercase tracking-wider mb-4">
            <RotateCcw size={14} className="text-[#E34222] dark:text-[#E06A50]" />
            <span>Direct Match with Jaatri Ledger Engine</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-[#F7F1E5]/80 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
            Clear guidelines on cancellation grace periods, driver cancellations, duplicate charge reversals, and instant wallet refunds.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-[#F7F1E5]/70 border-t border-white/15 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#10251C] dark:text-[#F7F5ED] text-sm leading-relaxed space-y-6 sm:space-y-8">

        {/* 1. Cancellation Windows */}
        <section className="bg-[#FAF7F0] dark:bg-[#0B2822] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#24483D] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F7F5ED] flex items-center gap-2">
            <Clock size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 1. Customer Cancellation Rules
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-[10px] bg-[#E5EBDD] dark:bg-[#1D3428] border border-[#cdd6c3] dark:border-[#24483D] text-[#123D32] dark:text-[#A3E635]">
              <div className="flex items-center gap-2 font-bold mb-1 text-[#123D32] dark:text-[#A3E635]">
                <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400" />
                <span>Free Cancellation Window</span>
              </div>
              <p className="text-[#123D32]/90 dark:text-[#B9C8BF] leading-relaxed">
                You can cancel your booking completely free of charge while the system is searching for a driver or within <strong>3 minutes</strong> of a driver accepting your request.
              </p>
            </div>

            <div className="p-4 rounded-[10px] bg-[#faebe8] dark:bg-[#341814] border border-[#f0c8c1] dark:border-[#E06A50]/40 text-[#782313] dark:text-[#E06A50]">
              <div className="flex items-center gap-2 font-bold mb-1 text-[#782313] dark:text-[#E06A50]">
                <XCircle size={16} className="text-[#E34222] dark:text-[#E06A50]" />
                <span>Late Cancellation Fee</span>
              </div>
              <p className="text-[#782313]/90 dark:text-[#B9C8BF] leading-relaxed">
                If cancelled after 3 minutes of acceptance, or after the driver has arrived at the pickup coordinate, a nominal compensation fee (₹25–₹50) is levied to compensate the driver partner for fuel and transit time.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Driver Cancellations & System Timeouts */}
        <section className="bg-[#FAF7F0] dark:bg-[#0B2822] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#24483D] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F7F5ED] flex items-center gap-2">
            <RotateCcw size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 2. Driver Cancellations & Auto Re-matching
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B9C8BF]">
            If an assigned driver partner cancels your ride or fails to arrive within reasonable time:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#696B64] dark:text-[#B9C8BF] leading-relaxed">
            <li><strong>Zero Penalty to Customer:</strong> You will never be charged a cancellation fee.</li>
            <li><strong>Auto Re-dispatch:</strong> Our system immediately searches the nearest online driver within 10km.</li>
            <li><strong>Full Automatic Refund:</strong> If you prepaid online or via wallet and choose not to wait, the entire fare is instantly credited back to your account.</li>
          </ul>
        </section>

        {/* 3. Refund Timelines & Wallet Settlement */}
        <section className="bg-[#FAF7F0] dark:bg-[#0B2822] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#24483D] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F7F5ED] flex items-center gap-2">
            <Wallet size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 3. Refund Methods & Timelines
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DED7CA] dark:border-[#24483D] text-[#10251C] dark:text-[#F7F5ED] uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-4">Original Payment Mode</th>
                  <th className="py-2.5 pr-4">Refund Destination</th>
                  <th className="py-2.5">Processing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED7CA]/60 dark:divide-[#24483D] text-xs">
                <tr>
                  <td className="py-3 pr-4 font-bold text-[#10251C] dark:text-[#F7F5ED]">Jaatri Wallet Balance</td>
                  <td className="py-3 pr-4 text-[#696B64] dark:text-[#B9C8BF]">Jaatri Wallet Balance</td>
                  <td className="py-3 font-bold text-emerald-700 dark:text-emerald-400">Instant (0 Seconds)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-[#10251C] dark:text-[#F7F5ED]">Online UPI / QR</td>
                  <td className="py-3 pr-4 text-[#696B64] dark:text-[#B9C8BF]">Jaatri Wallet (default) or Bank</td>
                  <td className="py-3 text-[#696B64] dark:text-[#B9C8BF]">Instant (Wallet) / 1–3 Business Days (Bank)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-[#10251C] dark:text-[#F7F5ED]">Credit / Debit Card</td>
                  <td className="py-3 pr-4 text-[#696B64] dark:text-[#B9C8BF]">Issuing Bank Account</td>
                  <td className="py-3 text-[#696B64] dark:text-[#B9C8BF]">3–7 Business Days (Bank Gateway TAT)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Disputed Fares & Duplicate Deductions */}
        <section className="bg-[#FAF7F0] dark:bg-[#0B2822] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#24483D] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F7F5ED] flex items-center gap-2">
            <AlertCircle size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 4. Duplicate Charges & Overcharge Disputes
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B9C8BF]">
            In the rare event of a network glitch, bank gateway timeout, or route detour:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#696B64] dark:text-[#B9C8BF] leading-relaxed">
            <li><strong>Duplicate Deductions:</strong> If money was debited twice for a single ride, the duplicate transaction is automatically detected and reversed within 24 hours.</li>
            <li><strong>Fare Review:</strong> If you believe you were overcharged due to driver route inefficiency, submit a ticket via our <Link href="/contact" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">Support Portal</Link> or email <a href="mailto:support@ridenow.in" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">support@ridenow.in</a> with your Booking ID. Our fare dispute team investigates GPS telemetry and issues adjustments.</li>
          </ul>
        </section>

      </main>

      <Footer />
    </div>
  );
}
