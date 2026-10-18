"use client";

import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import {
  ShieldAlert,
  PhoneCall,
  Share2,
  Lock,
  UserCheck,
  CheckCircle2,
  HeartHandshake,
  Search,
  FileCheck2,
} from "lucide-react";
import Link from "next/link";

export default function SafetyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F7F1E5] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] flex flex-col justify-between transition-colors duration-200">
      <Nav />

      {/* Header */}
      <section className="bg-[#123D32] dark:bg-[#101713] text-white pt-28 sm:pt-36 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#0D3027] dark:border-[#34443A]">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#F7F1E5] text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldAlert size={14} className="text-[#B83A24] dark:text-[#E06A50]" />
            <span>24×7 Passenger & Driver Safety Protocols</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            Safety & Emergency Standards
          </h1>
          <p className="text-[#F7F1E5]/80 text-sm sm:text-base mt-2.5 max-w-2xl leading-relaxed">
            Stringent driver verification, live GPS journey telemetry, in-ride emergency SOS, and statutory insurance under the Motor Vehicle Aggregator Guidelines 2025.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-[#10251C] dark:text-[#F3F1E8] text-sm leading-relaxed space-y-6 sm:space-y-8">

        {/* 1. In-App Emergency Assistance */}
        <section className="bg-[#faebe8] dark:bg-[#341814] rounded-[14px] p-6 sm:p-8 border border-[#f0c8c1] dark:border-[#E06A50]/40 text-[#782313] dark:text-[#E06A50] space-y-3 shadow-2xs">
          <h2 className="font-serif text-xl sm:text-2xl font-bold flex items-center gap-2 text-[#782313] dark:text-[#E06A50]">
            <PhoneCall size={20} className="text-[#B83A24] dark:text-[#E06A50]" /> In-Ride Emergency Assistance & SOS
          </h2>
          <p className="text-xs text-[#782313]/90 dark:text-[#E06A50]/90 leading-relaxed">
            Every active ride in Jaatri features an integrated emergency protocol. In an unexpected safety or medical event:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-white/90 dark:bg-[#1E2B23] p-4 rounded-[10px] border border-[#f0c8c1] dark:border-[#34443A]">
              <strong className="text-[#782313] dark:text-[#E06A50] block mb-1">State Police Emergency (112):</strong>
              <p className="text-[#782313]/90 dark:text-[#B8C2B8] leading-relaxed">Instant one-tap dialer connecting directly to the nearest State Police Control Room (112 Emergency Response Support System).</p>
            </div>
            <div className="bg-white/90 dark:bg-[#1E2B23] p-4 rounded-[10px] border border-[#f0c8c1] dark:border-[#34443A]">
              <strong className="text-[#782313] dark:text-[#E06A50] block mb-1">Jaatri 24×7 Safety Response Desk:</strong>
              <p className="text-[#782313]/90 dark:text-[#B8C2B8] leading-relaxed">Real-time emergency telemetry dispatch that notifies our dedicated incident response team with live vehicle coordinates.</p>
            </div>
          </div>
        </section>

        {/* 2. Before Every Trip: Verification */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <UserCheck size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 1. Driver & Vehicle Verification Standards
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <FileCheck2 size={18} className="text-[#123D32] dark:text-[#A3E635] mb-1.5" />
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Document Verification</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Verification of Driving Licence, Registration Certificate (RC), Commercial Insurance, and Pollution (PUC).</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <Lock size={18} className="text-[#123D32] dark:text-[#A3E635] mb-1.5" />
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Admin Video KYC</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Live video verification via WebRTC to confirm physical identity against government photo IDs.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <CheckCircle2 size={18} className="text-[#123D32] dark:text-[#A3E635] mb-1.5" />
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Vehicle Fitness</strong>
              <p className="text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">Mandatory statutory inspection verifying vehicle roadworthiness, tyre conditions, and safety harnesses.</p>
            </div>
          </div>
        </section>

        {/* 3. During the Trip: Live Tracking & Safety PIN */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <Share2 size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 2. Live Tracking & Start PIN Verification
          </h2>
          <div className="space-y-3 text-xs text-[#696B64] dark:text-[#B8C2B8]">
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Pickup OTP (Start Code):</strong>
              <p className="leading-relaxed">Never get into a vehicle without confirming the driver&rsquo;s name and vehicle registration plate matching your app screen. A trip can only begin once you provide your 4-digit pickup OTP to the verified driver partner.</p>
            </div>
            <div className="p-4 bg-white dark:bg-[#1E2B23] rounded-[10px] border border-[#DED7CA]/70 dark:border-[#34443A]">
              <strong className="text-[#10251C] dark:text-[#F3F1E8] block mb-1">Share Live Trip with Family & Friends:</strong>
              <p className="leading-relaxed">Our tracking URLs enable family members to view your real-time vehicle movement, driver details, and estimated arrival time on any browser without needing an app login.</p>
            </div>
          </div>
        </section>

        {/* 4. Passenger Insurance Coverage */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <HeartHandshake size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 3. Passenger Insurance Under MoRTH Guidelines 2025
          </h2>
          <p className="text-xs text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            In compliance with the <strong>Motor Vehicle Aggregator Guidelines 2025</strong>, every passenger on a confirmed Jaatri trip is covered under statutory transit insurance providing coverage for accidental medical expenses, hospitalization, and emergency evacuation during the trip.
          </p>
        </section>

        {/* 5. Lost & Found Protocol */}
        <section className="bg-[#FAF7F0] dark:bg-[#17211B] rounded-[14px] p-6 sm:p-8 border border-[#DED7CA] dark:border-[#34443A] shadow-2xs space-y-3">
          <h2 className="font-serif text-xl sm:text-2xl text-[#10251C] dark:text-[#F3F1E8] flex items-center gap-2">
            <Search size={20} className="text-[#123D32] dark:text-[#A3E635]" /> 4. Lost & Found Policy
          </h2>
          <p className="text-xs text-[#696B64] dark:text-[#B8C2B8] leading-relaxed">
            If you leave an item in a Jaatri vehicle, report it immediately through your <Link href="/bookings" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">Booking History</Link> or email our support desk at <a href="mailto:lostandfound@ridenow.in" className="text-[#123D32] dark:text-[#A3E635] font-bold underline">lostandfound@ridenow.in</a> with your Booking ID. We coordinate directly with the assigned driver partner for safe recovery.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
