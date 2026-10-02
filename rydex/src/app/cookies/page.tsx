"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  Cookie,
  ShieldCheck,
  Cpu,
  Database,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Nav />

      {/* Header */}
      <section className="bg-zinc-900 text-white pt-28 pb-16 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4">
            <Cookie size={14} /> DPDP Act 2023 & IT Act Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Cookie & Tracking Technologies Policy
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl font-medium">
            How RideNow utilizes cookies, web storage, and telemetry to maintain your authentication session, cache map routing, and safeguard platform operations.
          </p>
          <div className="flex flex-wrap gap-4 mt-6 text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
            <span><strong>Version:</strong> 1.0</span>
            <span><strong>Effective Date:</strong> 1 October 2026</span>
            <span><strong>Data Controller:</strong> RideNow Mobility Technologies Pvt. Ltd.</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-zinc-800 text-sm leading-relaxed space-y-8">

        {/* 1. What are Cookies */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Cookie size={18} className="text-zinc-900" /> 1. Overview of Tracking Technologies
          </h2>
          <p>
            Cookies and browser web storage (SessionStorage and LocalStorage) are compact text records saved on your smartphone, tablet, or computer when you visit or book a ride on RideNow.
          </p>
          <p className="text-zinc-600">
            RideNow follows a strict <strong>data minimization philosophy</strong> under the <strong>Digital Personal Data Protection Act, 2023</strong>. We do not sell your browsing behavior to third-party ad networks, and our tracking mechanisms are strictly purpose-bound to service delivery, account authentication, and transport safety.
          </p>
        </section>

        {/* 2. Categories of Storage */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-5">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Database size={18} className="text-zinc-900" /> 2. Types of Cookies We Use
          </h2>

          <div className="space-y-4">
            {/* Essential */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-zinc-900 text-sm">A. Strictly Necessary & Authentication Cookies</h3>
              </div>
              <p className="text-zinc-600 text-xs">
                Essential for the core platform functionality. Without these tokens, logging in, maintaining your active trip session, or authenticating WebSocket telematics is technically impossible.
              </p>
              <div className="bg-white p-3 rounded-xl border border-zinc-200 font-mono text-[11px] text-zinc-700 space-y-1">
                <div><strong>next-auth.session-token:</strong> Encrypted JWT validating your logged-in user profile (Session-based).</div>
                <div><strong>next-auth.csrf-token:</strong> Mitigates Cross-Site Request Forgery attacks during checkout and bookings.</div>
              </div>
            </div>

            {/* Functional */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-bold text-zinc-900 text-sm">B. Functional & Local Experience Storage</h3>
              </div>
              <p className="text-zinc-600 text-xs">
                Used to preserve your booking form selections across page reloads without burdening our cloud servers repeatedly.
              </p>
              <div className="bg-white p-3 rounded-xl border border-zinc-200 font-mono text-[11px] text-zinc-700 space-y-1">
                <div><strong>sessionStorage (bookingDraft):</strong> Temporarily holds selected pickup coordinates, destination, and vehicle type during the checkout journey. Cleared upon booking completion.</div>
                <div><strong>localStorage (savedContacts):</strong> Stores your family and emergency contact nicknames on your device for one-tap passenger selection.</div>
              </div>
            </div>

            {/* Map & Telematics */}
            <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-bold text-zinc-900 text-sm">C. Routing & Telematics Cache</h3>
              </div>
              <p className="text-zinc-600 text-xs">
                Caches OpenStreetMap and OSRM road geometry vectors locally in your browser memory to render 60fps driver tracking without depleting mobile cellular data.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Third-Party Integrations */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <Cpu size={18} className="text-zinc-900" /> 3. Third-Party Infrastructure Providers
          </h2>
          <p className="text-zinc-600">
            RideNow partners with specialized service providers who may set technical cookies required to complete their services:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 text-xs">
            <li><strong>Razorpay:</strong> PCI-DSS compliance and fraud risk assessment cookies during UPI and card checkout.</li>
            <li><strong>ZegoCloud:</strong> WebRTC connectivity cookies to facilitate real-time encrypted driver-rider audio calls and video KYC verification.</li>
            <li><strong>Google Identity Services:</strong> Required exclusively if you initiate authentication through Google OAuth.</li>
          </ul>
        </section>

        {/* 4. Cookie Management */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-zinc-900" /> 4. Controlling Your Cookie Preferences
          </h2>
          <p className="text-zinc-600">
            You maintain full sovereignty over your browser data:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-600 text-xs">
            <li><strong>Browser Settings:</strong> You can block or delete cookies through your browser preferences (Chrome, Safari, Firefox, Edge). Note that blocking essential cookies will prevent authentication and booking execution.</li>
            <li><strong>Right to Erasure:</strong> To delete all server-stored identifiers and anonymize your account records under DPDP Act 2023, you can use our <Link href="/privacy" className="text-zinc-900 font-bold underline">Account Erasure API</Link>.</li>
          </ul>
        </section>

        {/* 5. Contact */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-3">
          <h2 className="text-lg font-black text-zinc-900 flex items-center gap-2">
            <HelpCircle size={18} className="text-zinc-900" /> 5. Questions Regarding Cookies
          </h2>
          <p className="text-zinc-600 text-xs">
            For technical inquiries regarding RideNow data telemetry or session management, contact our Data Privacy Officer at <a href="mailto:privacy@ridenow.in" className="text-zinc-900 font-bold underline">privacy@ridenow.in</a> or visit our <Link href="/grievance" className="text-zinc-900 font-bold underline">Grievance Redressal Desk</Link>.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
