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
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function CancellationRefundPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-4">
            <RotateCcw size={14} /> Direct Match with RideNow Ledger Engine
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Cancellation & Refund Policy
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            Clear guidelines on cancellation grace periods, driver cancellations, duplicate charge reversals, and instant wallet refunds.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-8">

        {/* 1. Cancellation Windows */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Clock size={18} className="text-zinc-900" /> 1. Customer Cancellation Rules
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Free Cancellation Window</span>
              </div>
              <p className="text-emerald-800">
                You can cancel your booking completely free of charge while the system is searching for a driver or within <strong>3 minutes</strong> of a driver accepting your request.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
              <div className="flex items-center gap-2 font-bold mb-1">
                <XCircle size={16} className="text-amber-700" />
                <span>Late Cancellation Fee</span>
              </div>
              <p className="text-amber-800">
                If cancelled after 3 minutes of acceptance, or after the driver has arrived at the pickup coordinate, a nominal compensation fee (₹25–₹50) is levied to compensate the driver partner for fuel and transit time.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Driver Cancellations & System Timeouts */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <RotateCcw size={18} className="text-zinc-900" /> 2. Driver Cancellations & Auto Re-matching
          </h2>
          <p>
            If an assigned driver partner cancels your ride or fails to arrive within reasonable time:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
            <li><strong>Zero Penalty to Customer:</strong> You will never be charged a cancellation fee.</li>
            <li><strong>Auto Re-dispatch:</strong> Our system immediately searches the nearest online driver within 10km.</li>
            <li><strong>Full Automatic Refund:</strong> If you prepaid online or via wallet and choose not to wait, the entire fare is instantly credited back to your account.</li>
          </ul>
        </section>

        {/* 3. Refund Timelines & Wallet Settlement */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Wallet size={18} className="text-zinc-900" /> 3. Refund Methods & Timelines
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-black tracking-wider">
                  <th className="py-2.5 pr-4">Original Payment Mode</th>
                  <th className="py-2.5 pr-4">Refund Destination</th>
                  <th className="py-2.5">Processing Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-3 pr-4 font-bold text-zinc-900">RideNow Cash (Wallet)</td>
                  <td className="py-3 pr-4 text-zinc-600">RideNow Wallet Balance</td>
                  <td className="py-3 font-bold text-emerald-600">Instant (0 Seconds)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-zinc-900">Online UPI / QR</td>
                  <td className="py-3 pr-4 text-zinc-600">RideNow Wallet (default) or Bank</td>
                  <td className="py-3 text-zinc-600">Instant (Wallet) / 1–3 Business Days (Bank)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-bold text-zinc-900">Credit / Debit Card</td>
                  <td className="py-3 pr-4 text-zinc-600">Issuing Bank Account</td>
                  <td className="py-3 text-zinc-600">3–7 Business Days (Bank Gateway TAT)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Disputed Fares & Duplicate Deductions */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <AlertCircle size={18} className="text-zinc-900" /> 4. Duplicate Charges & Overcharge Disputes
          </h2>
          <p>
            In the rare event of a network glitch, bank gateway timeout, or route detour:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
            <li><strong>Duplicate Deductions:</strong> If money was debited twice for a single ride, the duplicate transaction is automatically detected and reversed within 24 hours.</li>
            <li><strong>Fare Review:</strong> If you believe you were overcharged due to driver route inefficiency, submit a ticket via our <Link href="/contact" className="text-zinc-900 font-bold underline">Support Portal</Link> or email <a href="mailto:support@ridenow.in" className="text-zinc-900 font-bold underline">support@ridenow.in</a> with your Booking ID. Our fare dispute team investigates GPS telemetry and issues adjustments.</li>
          </ul>
        </section>

      </main>

      <Footer />
    </div>
  );
}
