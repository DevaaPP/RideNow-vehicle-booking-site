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
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#061A16] flex flex-col justify-center px-3 sm:px-6 py-8 sm:py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="
          w-full max-w-xl mx-auto
          bg-[#FAF7F0] dark:bg-[#0B2822]
          rounded-[16px]
          border border-[#DED7CA] dark:border-[#1E3E34]
          p-6 sm:p-10
          shadow-sm
        "
      >
        {/* HEADER */}
        <div className="border-b border-[#DED7CA]/70 dark:border-[#1E3E34] pb-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#123D32] dark:bg-[#347858] inline-block" />
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#696B64] dark:text-[#B9C8BF] font-medium">
              Driver Onboarding Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#10251C] dark:text-[#F7F5ED] tracking-tight">
            Become a Partner Driver
          </h1>
          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B9C8BF] mt-1.5 leading-relaxed">
            Register your vehicle, complete mandatory identity verification, and start receiving passenger dispatch rides across Assam.
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
                  rounded-[12px]
                  border border-[#DED7CA] dark:border-[#1E3E34]
                  bg-white dark:bg-[#061A16] hover:bg-[#FAF7F0] dark:hover:bg-[#10352C] hover:border-[#123D32]/40 dark:hover:border-[#28664D]/50
                  transition-colors shadow-xs
                "
              >
                <div className="
                  w-10 h-10 rounded-[8px]
                  bg-[#123D32] dark:bg-[#28664D] text-[#FAF7F0]
                  flex items-center justify-center
                  shrink-0 font-mono text-xs font-bold
                ">
                  <Icon size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-[#10251C] dark:text-[#F7F5ED] text-xs sm:text-sm tracking-tight truncate">
                      {step.title}
                    </p>
                    <span className="text-[10px] font-mono text-[#696B64] dark:text-[#B9C8BF] font-bold uppercase tracking-wider">
                      Step {step.stepNum}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#696B64] dark:text-[#B9C8BF] mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* COMPLIANCE NOTE */}
        <div className="mt-6 p-3 bg-white dark:bg-[#061A16] border border-[#DED7CA] dark:border-[#1E3E34] rounded-[8px] text-[#696B64] dark:text-[#B9C8BF] text-[11px] flex items-center gap-2 shadow-xs">
          <UserCheck size={14} className="shrink-0 text-[#123D32] dark:text-[#347858]" />
          <span>Profile photo & government-issued license required during registration.</span>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push("/partner/onboard/vehicle")}
          className="
            mt-6 w-full h-12 sm:h-13
            rounded-[8px]
            bg-[#123D32] dark:bg-[#28664D] hover:bg-[#0D3027] dark:hover:bg-[#347858] text-white
            font-bold text-xs sm:text-sm tracking-wider uppercase
            flex items-center justify-center gap-2.5
            transition-colors shadow-sm cursor-pointer
          "
        >
          <span>Begin Registration</span>
          <ArrowRight size={16} />
        </motion.button>

        {/* FOOT NOTE */}
        <p className="text-[10px] font-mono uppercase tracking-wider text-[#696B64]/70 dark:text-[#B9C8BF]/70 text-center mt-4">
          Estimated completion: ~4 minutes · Verified 256-bit encryption
        </p>
      </motion.div>
    </div>
  );
}
