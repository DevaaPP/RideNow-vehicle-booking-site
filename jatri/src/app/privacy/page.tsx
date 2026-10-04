"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  MapPin,
  Lock,
  UserCheck,
  FileText,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  HelpCircle,
  Building,
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Hero Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            <ShieldCheck size={14} /> DPDP Act 2023 & MoRTH Guidelines 2025 Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            How RideNow collects, uses, protects, and retains customer and driver partner data under Indian digital data protection laws.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <span><strong>Version:</strong> 1.2</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Applicable Law:</strong> Digital Personal Data Protection Act, 2023</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-10">

        {/* 1. Who We Are */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs">
          <h2 className="text-lg font-black text-zinc-900 mb-3 flex items-center gap-2">
            <Building size={18} className="text-zinc-900" /> 1. Who We Are (Data Fiduciary)
          </h2>
          <p>
            RideNow Technologies (&ldquo;RideNow&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates an on-demand mobility platform connecting passengers (&ldquo;Customers&rdquo;) with verified independent vehicle operators and fleet owners (&ldquo;Drivers&rdquo; or &ldquo;Driver Partners&rdquo;). Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, RideNow acts as a <em>Data Fiduciary</em> determining the purposes and means of processing personal data.
          </p>
        </section>

        {/* 2. Customer vs Driver Data */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <UserCheck size={18} className="text-zinc-900" /> 2. Information We Collect
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <h3 className="font-black text-zinc-900 text-sm mb-2">A. Customer (Rider) Data</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-600">
                <li><strong>Identity:</strong> Name, WhatsApp mobile number, email address.</li>
                <li><strong>Journey Data:</strong> Pickup coordinate, drop destination, road itinerary, stops.</li>
                <li><strong>Live Location:</strong> GPS coordinates during active ride search and transit.</li>
                <li><strong>Financial:</strong> Wallet balances, transaction reference IDs (no raw card CVVs).</li>
                <li><strong>Safety & Support:</strong> Trip OTPs, chat messages, SOS panic alerts, ratings.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
              <h3 className="font-black text-zinc-900 text-sm mb-2">B. Driver Partner Data</h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-600">
                <li><strong>Identity & KYC:</strong> Driving Licence, Aadhaar / PAN, Video KYC recordings.</li>
                <li><strong>Vehicle Records:</strong> RC, Commercial Permit, Insurance, Fitness, PUC certificate.</li>
                <li><strong>Telemetry:</strong> Live GPS tracking while toggled online and during active trips.</li>
                <li><strong>Settlement:</strong> Bank account number, IFSC code, UPI ID, earnings and commission ledger.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. Purpose-Specific Processing */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs">
          <h2 className="text-lg font-black text-zinc-900 mb-3 flex items-center gap-2">
            <FileText size={18} className="text-zinc-900" /> 3. Purpose-Specific Processing
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            We adhere strictly to purpose specification and data minimization:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 uppercase font-black tracking-wider">
                  <th className="py-2.5 pr-4">Data Element</th>
                  <th className="py-2.5 pr-4">Specific Purpose</th>
                  <th className="py-2.5">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-zinc-900">Live GPS Location</td>
                  <td className="py-2.5 pr-4 text-zinc-600">Driver dispatch within 10km, route navigation, real-time safety tracking</td>
                  <td className="py-2.5 text-zinc-500">Performance of Contract / Safety</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-zinc-900">WhatsApp Mobile Number</td>
                  <td className="py-2.5 pr-4 text-zinc-600">Authentication OTP, driver-passenger calling, pickup/drop safety OTPs</td>
                  <td className="py-2.5 text-zinc-500">Consent & Legitimate Use</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-zinc-900">Driver KYC & Vehicle Docs</td>
                  <td className="py-2.5 pr-4 text-zinc-600">Compliance with Motor Vehicle Aggregator Guidelines 2025</td>
                  <td className="py-2.5 text-zinc-500">Statutory Legal Obligation</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-bold text-zinc-900">Fare & Wallet Ledger</td>
                  <td className="py-2.5 pr-4 text-zinc-600">1-tap checkout, 90% partner earnings payout, 10% commission accounting</td>
                  <td className="py-2.5 text-zinc-500">Contractual Performance / Tax Laws</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Location Privacy & Retention Schedule */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs">
          <h2 className="text-lg font-black text-zinc-900 mb-3 flex items-center gap-2">
            <Clock size={18} className="text-zinc-900" /> 4. Data Retention & Location Privacy Schedule
          </h2>
          <p className="mb-4">
            Under the MoRTH Motor Vehicle Aggregator Guidelines 2025 and Indian tax statutes, certain journey records must be retained for passenger safety investigations and statutory audits:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="font-bold text-zinc-900">High-Resolution GPS Stream</p>
              <p className="text-zinc-500 mt-1">Retained only during active trip + 72 hours post-trip for incident/lost item investigation, then compressed/purged.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="font-bold text-zinc-900">Trip & Fare Summary Records</p>
              <p className="text-zinc-500 mt-1">Retained for statutory periods mandated under Motor Vehicle & GST regulations (up to 3 years).</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="font-bold text-zinc-900">Wallet & Bank Settlements</p>
              <p className="text-zinc-500 mt-1">Retained as financial transaction books under the Companies Act and PMLA guidelines.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <p className="font-bold text-zinc-900">Account Erasure Requests</p>
              <p className="text-zinc-500 mt-1">Directly processed via <code className="bg-zinc-200 px-1 py-0.5 rounded text-[11px]">/api/user/delete-account</code>; personal IDs permanently anonymized.</p>
            </div>
          </div>
        </section>

        {/* 5. User Rights Under DPDP Act 2023 */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Eye size={18} className="text-zinc-900" /> 5. Data Principal Rights
          </h2>
          <p>As a Data Principal in India, you are entitled to:</p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-600">
            <li><strong>Right to Access:</strong> View a summary of your personal data and processing activities.</li>
            <li><strong>Right to Correction & Updating:</strong> Edit your name, phone number, or bank details via <Link href="/profile" className="text-zinc-900 font-bold underline">Profile</Link>.</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your account and personal identifiers under Section 12 of the DPDP Act.</li>
            <li><strong>Right of Grievance Redressal:</strong> Direct access to our appointed Grievance Officer.</li>
          </ul>
        </section>

        {/* 6. Grievance Officer */}
        <section className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 text-emerald-950">
          <h2 className="text-lg font-black mb-2 flex items-center gap-2">
            <HelpCircle size={18} className="text-emerald-700" /> 6. Grievance Officer & Statutory Disclosures
          </h2>
          <p className="text-xs mb-4 text-emerald-800">
            In compliance with the Digital Personal Data Protection Act, 2023, Consumer Protection (E-Commerce) Rules, 2020, and the Motor Vehicle Aggregator Guidelines 2025:
          </p>
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-200 text-xs space-y-1">
            <p><strong>Designated Grievance Officer:</strong> Legal & Compliance Officer</p>
            <p><strong>Entity Name:</strong> RideNow Mobility Private Limited</p>
            <p><strong>Email:</strong> <a href="mailto:grievance@ridenow.in" className="text-emerald-700 font-bold underline">grievance@ridenow.in</a></p>
            <p><strong>Grievance Portal:</strong> <Link href="/grievance" className="text-emerald-700 font-bold underline">ridenow.in/grievance</Link></p>
            <p><strong>Response Timeline:</strong> Acknowledgement within 48 hours; resolution within statutory timeline.</p>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
