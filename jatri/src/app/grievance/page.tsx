"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  HelpCircle,
  Building,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#10251C] flex flex-col justify-between">
      <Nav />

      {/* Header */}
      <section className="bg-[#123D32] text-white pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0D3027]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F7F1E5] text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={14} className="text-[#B83A24]" />
            <span>Statutory Regulatory Disclosures</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Grievance Redressal & Company Details
          </h1>
          <p className="text-[#F7F1E5]/80 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
            Published pursuant to the Consumer Protection (E-Commerce) Rules 2020, Digital Personal Data Protection Act 2023, and Motor Vehicle Aggregator Guidelines 2025.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#10251C] text-sm leading-relaxed space-y-6 sm:space-y-8">

        {/* 1. Legal Entity Identification */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <Building size={20} className="text-[#123D32]" /> 1. Legal Entity Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <span className="text-[#696B64] block font-bold uppercase text-[10px] tracking-wider mb-1">Legal Entity Name</span>
              <strong className="text-[#10251C] text-sm">Jaatri Mobility Technologies Private Limited</strong>
            </div>
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <span className="text-[#696B64] block font-bold uppercase text-[10px] tracking-wider mb-1">Registered Office</span>
              <span className="text-[#10251C] font-semibold">G.S. Road, Christian Basti, Guwahati, Assam 781005, India</span>
            </div>
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <span className="text-[#696B64] block font-bold uppercase text-[10px] tracking-wider mb-1">Customer Care Email</span>
              <a href="mailto:support@ridenow.in" className="text-[#123D32] font-bold underline">support@ridenow.in</a>
            </div>
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <span className="text-[#696B64] block font-bold uppercase text-[10px] tracking-wider mb-1">Operating Jurisdiction</span>
              <span className="text-[#10251C] font-semibold">Guwahati / Assam & Northeast Region, India</span>
            </div>
          </div>
        </section>

        {/* 2. Statutory Grievance Officer */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <HelpCircle size={20} className="text-[#123D32]" /> 2. Statutory Grievance Officer
          </h2>
          <p className="text-xs sm:text-sm text-[#696B64]">
            In accordance with Rule 5(9) of the Consumer Protection (E-Commerce) Rules, 2020 and the DPDP Act, 2023, the contact details of the Grievance Officer are set out below:
          </p>
          <div className="p-5 bg-[#E5EBDD] rounded-[10px] border border-[#cdd6c3] text-xs text-[#123D32] space-y-2">
            <p><strong className="text-[#10251C]">Designation:</strong> Head of Legal & Grievance Redressal</p>
            <p><strong className="text-[#10251C]">Officer Name:</strong> Grievance Officer, Jaatri Mobility Technologies</p>
            <p><strong className="text-[#10251C]">Email Address:</strong> <a href="mailto:grievance@ridenow.in" className="text-[#123D32] font-bold underline">grievance@ridenow.in</a></p>
            <p><strong className="text-[#10251C]">Postal Address:</strong> Jaatri Legal Grievance Cell, G.S. Road, Guwahati, Assam 781005</p>
            <p><strong className="text-[#10251C]">Working Hours:</strong> Monday to Friday, 09:30 AM to 06:30 PM IST</p>
          </div>
        </section>

        {/* 3. Three-Tier Escalation Matrix */}
        <section className="bg-[#FAF7F0] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] flex items-center gap-2">
            <Clock size={20} className="text-[#123D32]" /> 3. Complaint Escalation Matrix
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <div className="flex items-center justify-between font-bold text-[#10251C] mb-1">
                <span>Level 1: 24×7 In-App & Email Customer Support</span>
                <span className="text-[10px] font-black uppercase bg-[#E5EBDD] text-[#123D32] px-2 py-0.5 rounded-full">TAT: 2–24 Hours</span>
              </div>
              <p className="text-[#696B64] leading-relaxed">
                Submit an inquiry via our <Link href="/contact" className="text-[#123D32] font-bold underline">Help Center</Link> or email <a href="mailto:support@ridenow.in" className="text-[#123D32] underline">support@ridenow.in</a>. Most booking, fare, and wallet queries are resolved within 24 hours.
              </p>
            </div>

            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <div className="flex items-center justify-between font-bold text-[#10251C] mb-1">
                <span>Level 2: Escalation to Grievance Officer</span>
                <span className="text-[10px] font-black uppercase bg-[#E5EBDD] text-[#123D32] px-2 py-0.5 rounded-full">TAT: 48 Hours Ack / 15 Days Resolution</span>
              </div>
              <p className="text-[#696B64] leading-relaxed">
                If your issue remains unresolved after Level 1, quote your Ticket/Booking ID and email <a href="mailto:grievance@ridenow.in" className="text-[#123D32] underline">grievance@ridenow.in</a>. Acknowledged within 48 hours under statutory guidelines.
              </p>
            </div>

            <div className="p-4 bg-white rounded-[10px] border border-[#DED7CA]/70">
              <div className="flex items-center justify-between font-bold text-[#10251C] mb-1">
                <span>Level 3: Regulatory & Consumer Fora</span>
                <span className="text-[10px] font-black uppercase bg-[#faebe8] text-[#782313] px-2 py-0.5 rounded-full">Statutory Escalation</span>
              </div>
              <p className="text-[#696B64] leading-relaxed">
                Users may approach the National Consumer Helpline (NCH: 1915 / <a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer" className="text-[#123D32] underline">consumerhelpline.gov.in</a>) or the State Transport Department as provided under applicable law.
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
