"use client";

import { motion } from "framer-motion";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I book a ride on Jaatri?",
      a: "Visit the Ride / Book page, enter your pickup and drop locations using our Assam-wide autocomplete, select your desired vehicle category (from Scooty to Car Premier or Cargo Freight), and confirm your booking. Upfront fares and driver distance are displayed transparently before confirmation.",
    },
    {
      q: "What payment methods are supported?",
      a: "Jaatri supports UPI (Google Pay, PhonePe, Paytm), credit/debit cards, net banking, Cash on Trip completion, and your integrated Jaatri digital wallet.",
    },
    {
      q: "How does Jaatri ensure passenger safety?",
      a: "All driver partners undergo strict background checks, vehicle commercial registration vetting, and valid licensing checks. Every live trip is monitored via real-time GPS telemetry with an in-app emergency SOS button linked directly to the State Police Control Room (112) and our 24×7 Safety Response Desk.",
    },
    {
      q: "What is Jaatri's cancellation policy?",
      a: "You may cancel free of charge before a driver partner has commenced moving towards your pickup point. If cancelled after driver arrival or significant en-route movement, a nominal compensation fee goes directly to the driver partner to cover fuel expenditure.",
    },
    {
      q: "How are trip fares calculated?",
      a: "Fares are calculated strictly based on upfront distance (in km), estimated duration, vehicle category base fare, and applicable statutory highway tolls. Jaatri eliminates opaque surge pricing algorithms to maintain honest fares for riders and drivers.",
    },
    {
      q: "How can vehicle owners and drivers partner with Jaatri?",
      a: "Navigate to 'Drive with Jaatri' or /partner/onboard. Submit your vehicle registration (RC), commercial permit, driving license, and bank account for direct daily payouts. Our verification team approves profiles within 24 to 48 hours.",
    },
    {
      q: "What should I do if I forget an item in a Jaatri vehicle?",
      a: "Go to your Bookings history in your account, open the specific ride receipt, and click 'Report Lost Item'. You can also contact our 24×7 Guwahati Care Desk at support@ridenow.com with your booking reference.",
    },
    {
      q: "Can I book cargo or logistics vehicles for freight?",
      a: "Yes! Jaatri includes dedicated logistics categories including Cargo Mini (Loading) for goods up to 500 kg and Heavy Freight (Truck) for commercial loads up to 2,000 kg across Assam.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E5] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] justify-between transition-colors duration-200">
      <Nav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Header */}
          <div className="mb-10 sm:mb-12 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#A3E635] border border-[#cdd6c3] dark:border-[#34443A] text-xs font-bold uppercase tracking-wider mb-3">
              <HelpCircle size={13} className="text-[#E34222] dark:text-[#E06A50]" />
              <span>Assistance & Knowledge Base</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#10251C] dark:text-[#F3F1E8] tracking-tight mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-[#696B64] dark:text-[#B8C2B8] text-base leading-relaxed">
              Find transparent answers regarding bookings, verified fleet operations, driver onboarding, and payment security across Jaatri.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[12px] overflow-hidden shadow-2xs transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-base sm:text-[17px] text-[#10251C] dark:text-[#F3F1E8] pr-4">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[#123D32] dark:text-[#A3E635] flex-shrink-0"
                    >
                      <ChevronDown size={20} />
                    </motion.div>
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 pt-1 text-sm text-[#696B64] dark:text-[#B8C2B8] leading-relaxed border-t border-[#DED7CA]/60 dark:border-[#34443A]"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Still need help callout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-14 p-7 sm:p-8 bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[14px] text-center shadow-xs"
          >
            <h3 className="font-serif text-2xl text-[#10251C] dark:text-[#F3F1E8] mb-2">Still need help?</h3>
            <p className="text-sm text-[#696B64] dark:text-[#B8C2B8] max-w-md mx-auto mb-6">
              Our Guwahati-based passenger and driver care specialists are available 24×7 to assist you.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/contact"
                className="px-6 py-2.5 bg-[#123D32] hover:bg-[#0D3027] dark:bg-[#28664D] dark:hover:bg-[#347858] text-white font-bold rounded-[8px] transition active:scale-95 text-sm shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Contact Support</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/safety"
                className="px-6 py-2.5 bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] hover:border-[#123D32] dark:hover:border-[#28664D] text-[#10251C] dark:text-[#F3F1E8] font-bold rounded-[8px] transition active:scale-95 text-sm"
              >
                Safety Standards
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
