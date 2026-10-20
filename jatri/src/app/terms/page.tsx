"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  CheckCircle2,
  Scale,
  Shield,
  CreditCard,
  Ban,
} from "lucide-react";
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-[#F7F1E5] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] flex flex-col justify-between">
      <Nav />

      {/* Header */}
      <section className="bg-[#123D32] dark:bg-[#0D3027] text-white pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0D3027] dark:border-[#1E2B23]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F7F1E5] text-xs font-bold uppercase tracking-wider mb-4">
            <Scale size={14} className="text-[#E34222] dark:text-[#E06A50]" />
            <span>Consumer Protection (E-Commerce) Rules 2020 Compliant</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-[#F7F1E5]/80 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
            Contractual agreement governing ride booking, fares, payments, user conduct, and services provided by Jaatri (যাত্ৰী), by RideNow.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-[#F7F1E5]/70 border-t border-white/15 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Jurisdiction:</strong> Courts of Guwahati / Assam, India</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#10251C] dark:text-[#F3F1E8] text-sm leading-relaxed space-y-6 sm:space-y-8">

        {/* 1. Acceptance & Eligibility */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <CheckCircle2 size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 1. Acceptance & Eligibility
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            By accessing or using Jaatri (&ldquo;Platform&rdquo;), you confirm that you are at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872. If you book a ride on behalf of another individual or family contact, you confirm that you have obtained their authorization.
          </p>
        </section>

        {/* 2. Platform Role as an Aggregator */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <Shield size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 2. Aggregator Intermediary Role
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            Jaatri operates as an electronic marketplace and aggregator under the <strong>Motor Vehicle Aggregator Guidelines, 2025</strong> and an intermediary under Section 79 of the Information Technology Act, 2000. Jaatri connects passengers with independent third-party commercial vehicle operators. Drivers are independent contractors and not direct employees of Jaatri.
          </p>
        </section>

        {/* 3. Fare Structure & Transparency */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <CreditCard size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 3. Fare Calculation & Transparency
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            Under Section 13 of the Motor Vehicle Aggregator Guidelines 2025, Jaatri provides upfront fare disclosure before booking confirmation. Fares are calculated dynamically based on:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Base Fare:</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8]">Initial vehicle pickup and flag-down fee.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Distance Charge:</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8]">Road network distance computed via Valhalla/OSRM routing engines.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Waiting & Stoppage Fee:</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8]">Applicable if intermediate stops exceed complimentary time.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Platform Commission:</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8]">10% platform service fee deducted from driver settlement.</p>
            </div>
          </div>
          <p className="text-xs text-[#696B64] dark:text-[#B8C2B8]">
            Toll charges, parking fees, and statutory municipal entry taxes incurred during the trip are added directly to the receipt.
          </p>
        </section>

        {/* 4. Payment Modes */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <CreditCard size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 4. Payment Methods & Wallet
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8]">The Customer may settle ride fares through:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            <li><strong>Jaatri Wallet (Digital Cash):</strong> Instant 1-tap deduction from prepaid wallet balance.</li>
            <li><strong>Online Payment:</strong> UPI, Credit/Debit Cards, Net Banking processed via secure gateways.</li>
            <li><strong>Direct Cash:</strong> Cash handed directly to the driver partner at the conclusion of the ride.</li>
          </ul>
        </section>

        {/* 5. Conduct & Safety */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <Ban size={20} className="text-[#E34222] dark:text-[#E06A50]" /> 5. Prohibited Conduct & Safety
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8]">Customers and drivers must adhere to safety norms:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            <li>No smoking, alcohol consumption, or carrying illegal substances or firearms inside the vehicle.</li>
            <li>Mutual respect: verbal abuse, harassment, or physical altercation results in immediate account suspension and reporting to law enforcement authorities.</li>
            <li>Seatbelts (cars/trucks) and certified BIS helmets (bikes) are mandatory under the Motor Vehicles Act, 1988.</li>
          </ul>
        </section>

        {/* 6. Dispute Resolution */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <Scale size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 6. Dispute Resolution & Governing Law
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            These Terms are governed by the laws of the Republic of India. Any disputes arising out of or in connection with the Platform shall be subject to the exclusive jurisdiction of the competent courts in Guwahati, Assam.
          </p>
          <div className="pt-2 text-xs">
            For support and dispute filings, refer to our <Link href="/grievance" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">Grievance Redressal Portal</Link>.
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
