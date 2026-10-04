"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  Car,
  FileCheck,
  Percent,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function DriverPartnerTermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            <Scale size={14} /> MoRTH Motor Vehicle Aggregator Guidelines 2025
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Driver Partner Agreement
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            Terms governing driver eligibility, document verification, vehicle roadworthiness, fare split, platform commission, and bank settlements.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Regulatory Framework:</strong> MV Aggregator Guidelines 2025</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-8">

        {/* 1. Engagement & Nature of Relationship */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Car size={18} className="text-zinc-900" /> 1. Nature of Relationship
          </h2>
          <p>
            Under the <strong>Motor Vehicle Aggregator Guidelines 2025</strong>, the relationship between RideNow and the Driver Partner is that of an independent commercial service provider and digital technology aggregator on a principal-to-principal basis. Nothing in this Agreement shall be construed to create an employment, partnership, or joint venture relationship.
          </p>
        </section>

        {/* 2. Mandatory Document Compliance */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <FileCheck size={18} className="text-zinc-900" /> 2. Driver & Vehicle Onboarding Verification
          </h2>
          <p>
            Before accepting ride dispatches on the Platform, the Driver Partner must submit and maintain valid statutory documents:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <strong className="text-zinc-900">Driving Licence (Commercial / Transport):</strong>
              <p className="text-zinc-500 mt-0.5">Valid unexpired driving licence for the corresponding category (Bike, Auto, Four-wheeler, Loading, Truck).</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <strong className="text-zinc-900">Vehicle Registration (RC) & Permit:</strong>
              <p className="text-zinc-500 mt-0.5">Valid Certificate of Registration and statutory state transport permit.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <strong className="text-zinc-900">Commercial Insurance & Fitness:</strong>
              <p className="text-zinc-500 mt-0.5">Third-party/comprehensive passenger insurance and Certificate of Fitness.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <strong className="text-zinc-900">Pollution Under Control (PUC) & Video KYC:</strong>
              <p className="text-zinc-500 mt-0.5">Valid emission compliance and identity verification completed via admin Video KYC.</p>
            </div>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
            The Platform reserves the right to automatically deactivate or place on hold any driver profile whose statutory vehicle documents have expired.
          </p>
        </section>

        {/* 3. Fare Split, Commission & Payouts */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Percent size={18} className="text-zinc-900" /> 3. Fare Split & Commission Ledger
          </h2>
          <p>
            In compliance with the 2025 aggregator economics standards:
          </p>
          <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Driver Partner Earnings Share</span>
              <strong className="text-emerald-400 text-sm">90% of Base Trip Fare</strong>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Platform Service Commission</span>
              <strong className="text-zinc-300 text-sm">10% of Trip Fare</strong>
            </div>
            <div className="flex justify-between pt-1">
              <span>Settlement Mode</span>
              <span className="text-zinc-300">RideNow Driver Wallet & Bank IMPS/UPI</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-zinc-600">
            <p>
              <strong>Online & Wallet Rides:</strong> 90% of the trip fare is credited directly to your Driver Wallet upon passenger OTP verification at destination drop-off.
            </p>
            <p>
              <strong>Cash Rides:</strong> The passenger hands 100% of the fare directly to you in cash. RideNow automatically debits the 10% platform commission from your Driver Wallet balance.
            </p>
            <p>
              <strong>Withdrawals:</strong> Drivers may withdraw their available wallet earnings to their linked bank account (<code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-bold">PartnerBank</code>) at any time (minimum withdrawal: ₹100).
            </p>
          </div>
        </section>

        {/* 4. Safety & Standards */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-900" /> 4. Safety & Operating Standards
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600 text-xs">
            <li><strong>Zero Tolerance on Intoxication:</strong> Operating a vehicle under the influence of alcohol or drugs results in immediate permanent ban and criminal referral.</li>
            <li><strong>Route Fidelity:</strong> Drivers must follow the designated digital route or passenger-requested itinerary. Unwarranted detours or route refusal are subject to penalties.</li>
            <li><strong>OTP Verification:</strong> Drivers must only start or complete a ride after verifying the passenger&rsquo;s 4-digit pickup and drop OTPs.</li>
          </ul>
        </section>

        {/* 5. Suspension & Deactivation */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-zinc-900" /> 5. Suspension, Deactivation & Appeals
          </h2>
          <p>
            Driver accounts may be temporarily suspended or permanently deactivated for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-zinc-600">
            <li>Expiry of Driving Licence, Commercial Insurance, Fitness, or PUC certificate.</li>
            <li>Safety violations, customer harassment, or reckless driving incidents.</li>
            <li>Frequent refusal of accepted bookings or demanding off-platform cash surcharges.</li>
            <li>Unpaid platform commission resulting in negative wallet balance below allowed threshold.</li>
          </ul>
          <p className="text-xs text-zinc-500 pt-2">
            Deactivated driver partners may appeal decisions by contacting our Driver Grievance Cell at <a href="mailto:partners@ridenow.in" className="text-zinc-900 font-bold underline">partners@ridenow.in</a>.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
