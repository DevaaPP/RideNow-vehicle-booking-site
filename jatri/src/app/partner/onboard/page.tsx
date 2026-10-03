"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bike, Car, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    icon: Bike,
    title: "Vehicle Details",
    desc: "Add vehicle type, number & capacity",
  },
  {
    icon: Car,
    title: "Document Verification",
    desc: "Upload RC, license & ID proof",
  },
  {
    icon: Truck,
    title: "Bank & Payout",
    desc: "Set up bank account for earnings",
  },
];

export default function PartnerOnboard() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50/50 sm:bg-white flex flex-col justify-center px-3 sm:px-4 py-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="
          w-full max-w-xl mx-auto
          bg-white
          rounded-2xl sm:rounded-3xl
          border border-gray-200/80
          shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:shadow-[0_20px_60px_rgba(0,0,0,0.12)]
          p-5 sm:p-8
        "
      >
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
            Become a Partner
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">
            Start earning by listing your vehicle on our platform
          </p>
        </div>

        {/* STEPS */}
        <div className="mt-6 sm:mt-10 space-y-3 sm:space-y-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.01 }}
                className="
                  flex items-center gap-3.5 sm:gap-4
                  p-3.5 sm:p-5
                  rounded-xl sm:rounded-2xl
                  border border-gray-200/80
                  bg-gray-50/60
                "
              >
                <div className="
                  w-10 h-10 sm:w-11 sm:h-11 rounded-full
                  bg-black text-white
                  flex items-center justify-center
                  shrink-0 shadow-sm
                ">
                  <Icon size={18} className="sm:w-5 sm:h-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-black text-xs sm:text-base leading-tight truncate">
                    {step.title}
                  </p>
                  <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => router.push("/partner/onboard/vehicle")}
          className="
            mt-6 sm:mt-10 w-full h-12 sm:h-14
            rounded-xl sm:rounded-2xl
            bg-black text-white
            font-semibold text-sm sm:text-base
            flex items-center justify-center gap-2
            shadow-lg active:scale-98 transition
          "
        >
          <span>Start Registration</span>
          <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        </motion.button>

        {/* FOOT NOTE */}
        <p className="text-[10px] sm:text-[11px] text-gray-400 text-center mt-3 sm:mt-4">
          Takes less than 5 minutes to complete
        </p>
      </motion.div>
    </div>
  );
}
