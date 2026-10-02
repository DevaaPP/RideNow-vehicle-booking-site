"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-4">
            <ShieldAlert size={14} /> 24×7 Passenger & Driver Safety Protocols
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Safety & Emergency Standards
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            Stringent driver verification, live GPS journey telemetry, in-ride emergency SOS, and statutory insurance under the Motor Vehicle Aggregator Guidelines 2025.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-8">

        {/* 1. In-App Emergency Assistance */}
        <section className="bg-red-50 rounded-3xl p-6 sm:p-8 border border-red-200 text-red-950 space-y-3">
          <h2 className="text-lg font-black flex items-center gap-2 text-red-900">
            <PhoneCall size={20} className="text-red-600" /> In-Ride Emergency Assistance & SOS
          </h2>
          <p className="text-xs text-red-900/90 leading-relaxed">
            Every active ride in RideNow features an integrated emergency button. In an emergency:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-red-200">
              <strong className="text-red-900">Police Emergency (112):</strong>
              <p className="text-red-800 mt-0.5">Instant one-tap dialer connecting directly to the nearest State Police Control Room (112 Emergency Response Support System).</p>
            </div>
            <div className="bg-white/80 p-3.5 rounded-2xl border border-red-200">
              <strong className="text-red-900">RideNow 24×7 Safety Desk:</strong>
              <p className="text-red-800 mt-0.5">Real-time emergency telemetry dispatch that notifies our dedicated incident response team with live vehicle coordinates.</p>
            </div>
          </div>
        </section>

        {/* 2. Before Every Trip: Verification */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <UserCheck size={18} className="text-zinc-900" /> 1. Driver & Vehicle Verification Standards
          </h2>
          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <FileCheck2 size={16} className="text-zinc-900 mb-1" />
              <strong className="text-zinc-900">Document Verification</strong>
              <p className="text-zinc-500 mt-0.5">Verification of Driving Licence, Registration Certificate (RC), Commercial Insurance, and Pollution (PUC).</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <Lock size={16} className="text-zinc-900 mb-1" />
              <strong className="text-zinc-900">Admin Video KYC</strong>
              <p className="text-zinc-500 mt-0.5">Live video verification via WebRTC to confirm physical identity against government photo IDs.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <CheckCircle2 size={16} className="text-zinc-900 mb-1" />
              <strong className="text-zinc-900">Vehicle Fitness</strong>
              <p className="text-zinc-500 mt-0.5">Mandatory statutory inspection verifying vehicle roadworthiness, tyre conditions, and safety harnesses.</p>
            </div>
          </div>
        </section>

        {/* 3. During the Trip: Live Tracking & Safety PIN */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Share2 size={18} className="text-zinc-900" /> 2. Live Tracking & Start PIN Verification
          </h2>
          <div className="space-y-3 text-xs text-zinc-600">
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <strong className="text-zinc-900">Pickup OTP (Start Code):</strong>
              <p className="mt-0.5">Never get into a vehicle without confirming the driver&rsquo;s name and vehicle registration plate matching your app screen. A trip can only begin once you provide your 4-digit pickup OTP to the verified driver.</p>
            </div>
            <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
              <strong className="text-zinc-900">Share Live Trip with Family & Friends:</strong>
              <p className="mt-0.5">Our tracking URLs enable family members to view your real-time vehicle movement, driver details, and estimated arrival time on any browser without needing an app login.</p>
            </div>
          </div>
        </section>

        {/* 4. Passenger Insurance Coverage */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <HeartHandshake size={18} className="text-zinc-900" /> 3. Passenger Insurance Under MoRTH Guidelines 2025
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            In compliance with the <strong>Motor Vehicle Aggregator Guidelines 2025</strong>, every passenger on a confirmed RideNow trip is covered under statutory transit insurance providing coverage for accidental medical expenses, hospitalization, and emergency evacuation during the trip.
          </p>
        </section>

        {/* 5. Lost & Found Protocol */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Search size={18} className="text-zinc-900" /> 4. Lost & Found Policy
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            If you leave an item in a RideNow vehicle, report it immediately through your <Link href="/bookings" className="text-zinc-900 font-bold underline">Booking History</Link> or email our support desk at <a href="mailto:lostandfound@ridenow.in" className="text-zinc-900 font-bold underline">lostandfound@ridenow.in</a> with your Booking ID. We coordinate directly with the assigned driver partner for safe recovery.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
