"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bike, FileCheck, Landmark, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    stepNum: "01",
    icon: Bike,
    title: "Vehicle Details",
    desc: "Register vehicle classification, registration number & model specs",
  },
  {
    stepNum: "02",
    icon: FileCheck,
    title: "Compliance & Profile Photo",
    desc: "Mandatory driver photo, driving license, RC & insurance verification",
  },
  {
    stepNum: "03",
    icon: Landmark,
    title: "Bank & Automated Settlement",
    desc: "Direct bank account & UPI setup for instant ride earnings payouts",
  },
];

export default function PartnerOnboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 sm:bg-zinc-100/60 flex flex-col justify-center px-3 sm:px-6 py-8 sm:py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="
          w-full max-w-xl mx-auto
          bg-white
          rounded-none
          border border-zinc-300
          p-6 sm:p-10
        "
      >
        {/* HEADER */}
        <div className="border-b border-zinc-200 pb-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-none bg-zinc-950 inline-block" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-zinc-500 font-medium">
              Driver Onboarding Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight font-sans">
            Become a Partner Driver
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
            Register your vehicle, complete mandatory identity verification, and start receiving passenger dispatch rides.
          </p>
        </div>

        {/* STEPS BENTO LIST */}
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ x: 2 }}
                className="
                  flex items-start sm:items-center gap-4
                  p-4 sm:p-5
                  rounded-none
                  border border-zinc-200
                  bg-zinc-50/60 hover:bg-zinc-50 hover:border-zinc-900
                  transition-colors
                "
              >
                <div className="
                  w-10 h-10 rounded-none
                  bg-zinc-950 text-white
                  flex items-center justify-center
                  shrink-0 font-mono text-xs font-bold
                ">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-zinc-950 text-xs sm:text-sm tracking-tight truncate">
                      {step.title}
                    </p>
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
                      Step {step.stepNum}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* COMPLIANCE NOTE */}
        <div className="mt-6 p-3 bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px] flex items-center gap-2">
          <UserCheck size={14} className="shrink-0 text-zinc-900" />
          <span>Profile photo & government-issued license required during registration.</span>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push("/partner/onboard/vehicle")}
          className="
            mt-6 w-full h-12 sm:h-13
            rounded-none
            bg-zinc-950 hover:bg-black text-white
            font-medium text-xs sm:text-sm tracking-wider uppercase
            flex items-center justify-center gap-2.5
            border border-zinc-950 transition-colors
          "
        >
          <span>Begin Registration</span>
          <ArrowRight size={16} />
        </motion.button>

        {/* FOOT NOTE */}
        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 text-center mt-4">
          Estimated completion: ~4 minutes · Verified 256-bit encryption
        </p>
      </motion.div>
    </div>
  );
}
