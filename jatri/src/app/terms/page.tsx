"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Shield,
  CreditCard,
  Ban,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-4">
            <Scale size={14} /> Consumer Protection (E-Commerce) Rules 2020 Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            Contractual agreement governing ride booking, fares, payments, user conduct, and services provided by RideNow.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Jurisdiction:</strong> Courts of Guwahati / Assam, India</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-8">

        {/* 1. Acceptance & Eligibility */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-zinc-900" /> 1. Acceptance & Eligibility
          </h2>
          <p>
            By accessing or using RideNow (&ldquo;Platform&rdquo;), you confirm that you are at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872. If you book a ride on behalf of another individual or family contact, you confirm that you have obtained their authorization.
          </p>
        </section>

        {/* 2. Platform Role as an Aggregator */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Shield size={18} className="text-zinc-900" /> 2. Aggregator Intermediary Role
          </h2>
          <p>
            RideNow operates as an electronic marketplace and aggregator under the <strong>Motor Vehicle Aggregator Guidelines, 2025</strong> and an intermediary under Section 79 of the Information Technology Act, 2000. RideNow connects passengers with independent third-party commercial vehicle operators. Drivers are independent contractors and not direct employees of RideNow.
          </p>
        </section>

        {/* 3. Fare Structure & Transparency */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <CreditCard size={18} className="text-zinc-900" /> 3. Fare Calculation & Transparency
          </h2>
          <p>
            Under Section 13 of the Motor Vehicle Aggregator Guidelines 2025, RideNow provides upfront fare disclosure before booking confirmation. Fares are calculated dynamically based on:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <strong>Base Fare:</strong> Initial vehicle pickup and flag-down fee.
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <strong>Distance Charge:</strong> Road network distance computed via Valhalla/OSRM routing engines.
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <strong>Waiting & Stoppage Fee:</strong> Applicable if intermediate stops exceed complimentary time.
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
              <strong>Platform Commission:</strong> 10% platform service fee deducted from driver settlement.
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Toll charges, parking fees, and statutory municipal entry taxes incurred during the trip are added directly to the receipt.
          </p>
        </section>

        {/* 4. Payment Modes */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <CreditCard size={18} className="text-zinc-900" /> 4. Payment Methods & Wallet
          </h2>
          <p>The Customer may settle ride fares through:</p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
            <li><strong>RideNow Cash (Digital Wallet):</strong> Instant 1-tap deduction from prepaid wallet balance.</li>
            <li><strong>Online Payment:</strong> UPI, Credit/Debit Cards, Net Banking processed via Razorpay.</li>
            <li><strong>Direct Cash:</strong> Cash handed directly to the driver partner at the conclusion of the ride.</li>
          </ul>
        </section>

        {/* 5. Conduct & Safety */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Ban size={18} className="text-zinc-900" /> 5. Prohibited Conduct & Safety
          </h2>
          <p>Customers and drivers must adhere to safety norms:</p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
            <li>No smoking, alcohol consumption, or carrying illegal substances or firearms inside the vehicle.</li>
            <li>Mutual respect: verbal abuse, harassment, or physical altercation results in immediate account suspension and reporting to law enforcement authorities.</li>
            <li>Seatbelts (cars/trucks) and certified BIS helmets (bikes) are mandatory under the Motor Vehicles Act, 1988.</li>
          </ul>
        </section>

        {/* 6. Dispute Resolution */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Scale size={18} className="text-zinc-900" /> 6. Dispute Resolution & Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the Republic of India. Any disputes arising out of or in connection with the Platform shall be subject to the exclusive jurisdiction of the competent courts in Guwahati, Assam.
          </p>
          <div className="pt-2 text-xs">
            For support and dispute filings, refer to our <Link href="/grievance" className="text-zinc-900 font-bold underline">Grievance Redressal Portal</Link>.
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
