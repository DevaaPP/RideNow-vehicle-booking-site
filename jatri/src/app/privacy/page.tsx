"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  ShieldCheck,
  Building,
  UserCheck,
  FileText,
  Clock,
  Eye,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F7F1E5] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] flex flex-col justify-between">
      <Nav />

      {/* Hero Header */}
      <section className="bg-[#123D32] dark:bg-[#0D3027] text-white pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0D3027] dark:border-[#1E2B23]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F7F1E5] text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} className="text-[#B83A24] dark:text-[#E06A50]" />
            <span>DPDP Act 2023 & MoRTH Guidelines 2025 Compliant</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-[#F7F1E5]/80 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
            How Jaatri collects, uses, protects, and retains customer and driver partner data under Indian digital personal data protection laws.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-[#F7F1E5]/70 border-t border-white/15 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Applicable Law:</strong> Digital Personal Data Protection Act, 2023</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#10251C] dark:text-[#F3F1E8] text-sm leading-relaxed space-y-6 sm:space-y-8">

        {/* 1. Who We Are */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] mb-3 flex items-center gap-2">
            <Building size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 1. Who We Are (Data Fiduciary)
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            Jaatri Mobility Technologies Private Limited (&ldquo;Jaatri&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates an on-demand mobility platform connecting passengers (&ldquo;Customers&rdquo;) with verified independent vehicle operators and fleet owners (&ldquo;Drivers&rdquo; or &ldquo;Driver Partners&rdquo;). Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, Jaatri acts as a <em>Data Fiduciary</em> determining the purposes and means of processing personal data.
          </p>
        </section>

        {/* 2. Customer vs Driver Data */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-6">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <UserCheck size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 2. Information We Collect
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-[10px] bg-white dark:bg-[#1E2B23] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <h3 className="font-bold text-[#10251C] dark:text-[#F3F1E8] text-sm mb-2.5">A. Customer (Rider) Data</h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
                <li><strong>Identity:</strong> Name, mobile number, email address.</li>
                <li><strong>Journey Data:</strong> Pickup coordinate, drop destination, road itinerary, stops.</li>
                <li><strong>Live Location:</strong> GPS coordinates during active ride search and transit.</li>
                <li><strong>Financial:</strong> Wallet balances, transaction reference IDs (no raw card CVVs).</li>
                <li><strong>Safety & Support:</strong> Trip OTPs, chat messages, SOS panic alerts, ratings.</li>
              </ul>
            </div>

            <div className="p-5 rounded-[10px] bg-white dark:bg-[#1E2B23] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <h3 className="font-bold text-[#10251C] dark:text-[#F3F1E8] text-sm mb-2.5">B. Driver Partner Data</h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
                <li><strong>Identity & KYC:</strong> Driving Licence, Aadhaar / PAN, Video KYC recordings.</li>
                <li><strong>Vehicle Records:</strong> RC, Commercial Permit, Insurance, Fitness, PUC certificate.</li>
                <li><strong>Telemetry:</strong> Live GPS tracking while toggled online and during active trips.</li>
                <li><strong>Settlement:</strong> Bank account number, IFSC code, UPI ID, earnings and commission ledger.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Purpose-Specific Processing */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] mb-3 flex items-center gap-2">
            <FileText size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 3. Purpose-Specific Processing
          </h2>
          <p className="mb-4 text-xs text-[#696B64] dark:text-[#B8C2B8]">
            We adhere strictly to purpose specification and data minimization:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#DED7CA] dark:border-[#34443A] text-[#10251C] dark:text-[#F3F1E8] uppercase font-bold tracking-wider">
                  <th className="py-2.5 pr-4">Data Element</th>
                  <th className="py-2.5 pr-4">Specific Purpose</th>
                  <th className="py-2.5">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED7CA]/60 dark:divide-[#34443A] text-xs">
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#10251C] dark:text-[#F3F1E8]">Live GPS Location</td>
                  <td className="py-2.5 pr-4 text-[#696B64] dark:text-[#B8C2B8]">Driver dispatch within 10km, route navigation, real-time safety tracking</td>
                  <td className="py-2.5 text-[#123D32] dark:text-[#A3E635] font-semibold">Performance of Contract / Safety</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#10251C] dark:text-[#F3F1E8]">Mobile Number</td>
                  <td className="py-2.5 pr-4 text-[#696B64] dark:text-[#B8C2B8]">Authentication OTP, driver-passenger calling, pickup/drop safety OTPs</td>
                  <td className="py-2.5 text-[#123D32] dark:text-[#A3E635] font-semibold">Consent & Legitimate Use</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#10251C] dark:text-[#F3F1E8]">Driver KYC & Vehicle Docs</td>
                  <td className="py-2.5 pr-4 text-[#696B64] dark:text-[#B8C2B8]">Compliance with Motor Vehicle Aggregator Guidelines 2025</td>
                  <td className="py-2.5 text-[#123D32] dark:text-[#A3E635] font-semibold">Statutory Legal Obligation</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-[#10251C] dark:text-[#F3F1E8]">Fare & Wallet Ledger</td>
                  <td className="py-2.5 pr-4 text-[#696B64] dark:text-[#B8C2B8]">1-tap checkout, 90% partner earnings payout, 10% commission accounting</td>
                  <td className="py-2.5 text-[#123D32] dark:text-[#A3E635] font-semibold">Contractual Performance / Tax Laws</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Location Privacy & Retention Schedule */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] mb-3 flex items-center gap-2">
            <Clock size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 4. Data Retention & Location Privacy Schedule
          </h2>
          <p className="mb-4 text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            Under the MoRTH Motor Vehicle Aggregator Guidelines 2025 and Indian tax statutes, certain journey records must be retained for passenger safety investigations and statutory audits:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <p className="font-bold text-[#10251C] dark:text-[#F3F1E8] mb-1">High-Resolution GPS Stream</p>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Retained only during active trip + 72 hours post-trip for incident/lost item investigation, then compressed/purged.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <p className="font-bold text-[#10251C] dark:text-[#F3F1E8] mb-1">Trip & Fare Summary Records</p>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Retained for statutory periods mandated under Motor Vehicle & GST regulations (up to 3 years).</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <p className="font-bold text-[#10251C] dark:text-[#F3F1E8] mb-1">Wallet & Bank Settlements</p>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Retained as financial transaction books under the Companies Act and PMLA guidelines.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <p className="font-bold text-[#10251C] dark:text-[#F3F1E8] mb-1">Account Erasure Requests</p>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Directly processed via <code className="bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#A3E635] px-1 py-0.5 rounded text-[11px]">/api/user/delete-account</code>; personal IDs permanently anonymized.</p>
            </div>
          </div>
        </section>

        {/* 5. User Rights Under DPDP Act 2023 */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <Eye size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 5. Data Principal Rights
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8]">As a Data Principal in India, you are entitled to:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            <li><strong>Right to Access:</strong> View a summary of your personal data and processing activities.</li>
            <li><strong>Right to Correction & Updating:</strong> Edit your name, phone number, or bank details via <Link href="/profile" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">Profile</Link>.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your account and personal identifiers under Section 12 of the DPDP Act.</li>
            <li><strong>Right of Grievance Redressal:</strong> Direct access to our appointed Grievance Officer.</li>
          </ul>
        </section>

        {/* 6. Grievance Officer */}
        <section className="bg-[#E5EBDD] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#cdd6c3] dark:border-[#34443A] text-[#123D32] dark:text-[#F3F1E8] shadow-2xs">
          <h2 className="font-serif text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2 text-[#123D32] dark:text-[#F3F1E8]">
            <HelpCircle size={20} className="text-[#B83A24] dark:text-[#E06A50]" /> 6. Grievance Officer & Statutory Disclosures
          </h2>
          <p className="text-xs mb-4 text-[#123D32]/85 dark:text-[#B8C2B8] leading-relaxed">
            In compliance with the Digital Personal Data Protection Act, 2023, Consumer Protection (E-Commerce) Rules, 2020, and the Motor Vehicle Aggregator Guidelines 2025:
          </p>
          <div className="bg-white/90 dark:bg-[#1E2B23] p-4 rounded-[10px] border border-[#cdd6c3] dark:border-[#34443A] text-xs text-[#10251C] dark:text-[#F3F1E8] space-y-1.5">
            <p><strong>Designated Grievance Officer:</strong> Legal & Compliance Officer</p>
            <p><strong>Entity Name:</strong> Jaatri Mobility Technologies Private Limited</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@ridenow.in" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">grievance@ridenow.in</a></p>
            <p><strong>Grievance Portal:</strong> <Link href="/grievance" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">ridenow.in/grievance</Link></p>
            <p><strong>Response Timeline:</strong> Acknowledgement within 48 hours; resolution within statutory timeline.</p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
