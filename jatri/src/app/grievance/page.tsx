"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  HelpCircle,
  Building,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  FileText,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-4">
            <ShieldCheck size={14} /> Statutory Regulatory Disclosures
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Grievance Redressal & Company Details
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            Published pursuant to the Consumer Protection (E-Commerce) Rules 2020, Digital Personal Data Protection Act 2023, and Motor Vehicle Aggregator Guidelines 2025.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-8">

        {/* 1. Legal Entity Identification */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Building size={18} className="text-zinc-900" /> 1. Legal Entity Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-zinc-400 block font-bold uppercase text-[10px]">Legal Entity Name</span>
              <strong className="text-zinc-900 text-sm">RideNow Mobility Technologies Private Limited</strong>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-zinc-400 block font-bold uppercase text-[10px]">Registered Office</span>
              <span className="text-zinc-800 font-semibold">G.S. Road, Christian Basti, Guwahati, Assam 781005, India</span>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-zinc-400 block font-bold uppercase text-[10px]">Customer Care Email</span>
              <a href="mailto:support@ridenow.in" className="text-zinc-900 font-bold underline">support@ridenow.in</a>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <span className="text-zinc-400 block font-bold uppercase text-[10px]">Operating Jurisdiction</span>
              <span className="text-zinc-800 font-semibold">Guwahati / Assam & Northeast Region, India</span>
            </div>
          </div>
        </section>

        {/* 2. Statutory Grievance Officer */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <HelpCircle size={18} className="text-zinc-900" /> 2. Statutory Grievance Officer
          </h2>
          <p className="text-xs text-zinc-600">
            In accordance with Rule 5(9) of the Consumer Protection (E-Commerce) Rules, 2020 and the DPDP Act, 2023, the contact details of the Grievance Officer are set out below:
          </p>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <p><strong>Designation:</strong> Head of Legal & Grievance Redressal</p>
            <p><strong>Officer Name:</strong> Grievance Officer, RideNow Technologies</p>
            <p><strong>Email Address:</strong> <a href="mailto:grievance@ridenow.in" className="text-emerald-700 font-bold underline">grievance@ridenow.in</a></p>
            <p><strong>Postal Address:</strong> RideNow Legal Grievance Cell, G.S. Road, Guwahati, Assam 781005</p>
            <p><strong>Working Hours:</strong> Monday to Friday, 09:30 AM to 06:30 PM IST</p>
          </div>
        </section>

        {/* 3. Three-Tier Escalation Matrix */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Clock size={18} className="text-zinc-900" /> 3. Complaint Escalation Matrix
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between font-bold text-zinc-900 mb-1">
                <span>Level 1: 24×7 In-App & Email Customer Support</span>
                <span className="text-[10px] font-black uppercase bg-zinc-200 px-2 py-0.5 rounded-full">TAT: 2–24 Hours</span>
              </div>
              <p className="text-zinc-500">
                Submit an inquiry via our <Link href="/contact" className="text-zinc-900 font-bold underline">Help Center</Link> or email <a href="mailto:support@ridenow.in" className="text-zinc-900 underline">support@ridenow.in</a>. Most booking, fare, and wallet queries are resolved within 24 hours.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between font-bold text-zinc-900 mb-1">
                <span>Level 2: Escalation to Grievance Officer</span>
                <span className="text-[10px] font-black uppercase bg-zinc-200 px-2 py-0.5 rounded-full">TAT: 48 Hours Ack / 15 Days Resolution</span>
              </div>
              <p className="text-zinc-500">
                If your issue remains unresolved after Level 1, quote your Ticket/Booking ID and email <a href="mailto:grievance@ridenow.in" className="text-zinc-900 underline">grievance@ridenow.in</a>. Acknowledged within 48 hours under statutory guidelines.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="flex items-center justify-between font-bold text-zinc-900 mb-1">
                <span>Level 3: Regulatory & Consumer Fora</span>
                <span className="text-[10px] font-black uppercase bg-zinc-200 px-2 py-0.5 rounded-full">Statutory Escalation</span>
              </div>
              <p className="text-zinc-500">
                Users may approach the National Consumer Helpline (NCH: 1915 / <a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer" className="text-zinc-900 underline">consumerhelpline.gov.in</a>) or the State Transport Department as provided under applicable law.
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
