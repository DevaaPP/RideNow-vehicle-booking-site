"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  Car,
  FileCheck,
  Percent,
  ShieldCheck,
  AlertTriangle,
  Scale,
} from "lucide-react";
import Link from "next/link";

export default function DriverPartnerTermsPage() {
  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#10251C] flex flex-col justify-between">
      <Nav />

      {/* Header */}
      <section className="bg-[#123D32] text-white pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0D3027]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F7F1E5] text-xs font-bold uppercase tracking-wider mb-4">
            <Scale size={14} className="text-[#B83A24]" />
            <span>MoRTH Motor Vehicle Aggregator Guidelines 2025</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Driver Partner Agreement
          </h1>
          <p className="text-[#F7F1E5]/80 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
            Terms governing driver eligibility, document verification, vehicle roadworthiness, fare split, platform commission, and bank settlements.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-[#F7F1E5]/70 border-t border-white/15 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Regulatory Framework:</strong> MV Aggregator Guidelines 2025</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#10251C] text-sm leading-relaxed space-y-6 sm:space-y-8">

        {/* 1. Engagement & Nature of Relationship */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <Car size={20} className="text-[#123D32]" /> 1. Nature of Relationship
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] leading-relaxed">
            Under the <strong>Motor Vehicle Aggregator Guidelines 2025</strong>, the relationship between Jaatri and the Driver Partner is that of an independent commercial service provider and digital technology aggregator on a principal-to-principal basis. Nothing in this Agreement shall be construed to create an employment, partnership, or joint venture relationship.
          </p>
        </section>

        {/* 2. Mandatory Document Compliance */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <FileCheck size={20} className="text-[#123D32]" /> 2. Driver & Vehicle Onboarding Verification
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64]">
            Before accepting ride dispatches on the Platform, the Driver Partner must submit and maintain valid statutory documents:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <strong className="text-[#10251C] block mb-1">Driving Licence (Commercial / Transport):</strong>
              <p className="text-[#696B64] leading-relaxed">Valid unexpired driving licence for the corresponding category (Bike, Auto, Four-wheeler, Loading, Truck).</p>
            </div>
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <strong className="text-[#10251C] block mb-1">Vehicle Registration (RC) & Permit:</strong>
              <p className="text-[#696B64] leading-relaxed">Valid Certificate of Registration and statutory state transport permit.</p>
            </div>
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <strong className="text-[#10251C] block mb-1">Commercial Insurance & Fitness:</strong>
              <p className="text-[#696B64] leading-relaxed">Third-party/comprehensive passenger insurance and Certificate of Fitness.</p>
            </div>
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <strong className="text-[#10251C] block mb-1">Pollution Under Control (PUC) & Video KYC:</strong>
              <p className="text-[#696B64] leading-relaxed">Valid emission compliance and identity verification completed via admin Video KYC.</p>
            </div>
          </div>
          <p className="text-xs text-[#782313] bg-[#faebe8] p-3.5 rounded-[8px] border border-[#f0c8c1] font-medium leading-relaxed">
            The Platform reserves the right to automatically deactivate or place on hold any driver profile whose statutory vehicle documents have expired.
          </p>
        </section>

        {/* 3. Fare Split, Commission & Payouts */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <Percent size={20} className="text-[#123D32]" /> 3. Fare Split & Commission Ledger
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64]">
            In compliance with the 2025 aggregator economics standards:
          </p>
          <div className="p-5 bg-[#123D32] text-white rounded-[12px] space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-white/20 pb-2">
              <span className="text-[#F7F1E5]/80">Driver Partner Earnings Share</span>
              <strong className="text-emerald-300 text-sm font-bold">90% of Base Trip Fare</strong>
            </div>
            <div className="flex justify-between border-b border-white/20 pb-2">
              <span className="text-[#F7F1E5]/80">Platform Service Commission</span>
              <strong className="text-[#E5EBDD] text-sm font-bold">10% of Trip Fare</strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[#F7F1E5]/80">Settlement Mode</span>
              <span className="text-white font-medium">Jaatri Driver Wallet & Bank IMPS/UPI</span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-[#696B64] leading-relaxed">
            <p>
              <strong>Online & Wallet Rides:</strong> 90% of the trip fare is credited directly to your Driver Wallet upon passenger OTP verification at destination drop-off.
            </p>
            <p>
              <strong>Cash Rides:</strong> The passenger hands 100% of the fare directly to you in cash. Jaatri automatically debits the 10% platform commission from your Driver Wallet balance.
            </p>
            <p>
              <strong>Withdrawals:</strong> Drivers may withdraw their available wallet earnings to their linked bank account (<code className="bg-[#E5EBDD] px-1 py-0.5 rounded text-[#123D32] font-bold">PartnerBank</code>) at any time (minimum withdrawal: ₹100).
            </p>
          </div>
        </section>

        {/* 4. Safety & Standards */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#123D32]" /> 4. Safety & Operating Standards
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#696B64] leading-relaxed">
            <li><strong>Zero Tolerance on Intoxication:</strong> Operating a vehicle under the influence of alcohol or drugs results in immediate permanent ban and criminal referral.</li>
            <li><strong>Route Fidelity:</strong> Drivers must follow the designated digital route or passenger-requested itinerary. Unwarranted detours or route refusal are subject to penalties.</li>
            <li><strong>OTP Verification:</strong> Drivers must only start or complete a ride after verifying the passenger&rsquo;s 4-digit pickup and drop OTPs.</li>
          </ul>
        </section>

        {/* 5. Suspension & Deactivation */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <AlertTriangle size={20} className="text-[#B83A24]" /> 5. Suspension, Deactivation & Appeals
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64]">
            Driver accounts may be temporarily suspended or permanently deactivated for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#696B64] leading-relaxed">
            <li>Expiry of Driving Licence, Commercial Insurance, Fitness, or PUC certificate.</li>
            <li>Safety violations, customer harassment, or reckless driving incidents.</li>
            <li>Frequent refusal of accepted bookings or demanding off-platform cash surcharges.</li>
            <li>Unpaid platform commission resulting in negative wallet balance below allowed threshold.</li>
          </ul>
          <p className="text-xs text-[#696B64] pt-2">
            Deactivated driver partners may appeal decisions by contacting our Driver Grievance Cell at <a href="mailto:partners@ridenow.in" className="text-[#123D32] font-bold underline">partners@ridenow.in</a>.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
