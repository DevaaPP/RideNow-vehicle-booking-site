"use client";

import { motion } from "framer-motion";
import { ArrowRight, Car, Zap, Shield, TrendingUp, Sparkles, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import { VEHICLE_OPTIONS } from "@/lib/vehicleConfig";

const FLEET_CATEGORIES = [
  {
    id: "scooty",
    name: VEHICLE_OPTIONS.scooty.label,
    description: VEHICLE_OPTIONS.scooty.tagline,
    price: "Starting from ₹7/km",
    image: "/fleet/scooty.webp",
    capacity: "1 Passenger",
    badge: "Eco City Glide",
  },
  {
    id: "bike",
    name: VEHICLE_OPTIONS.bike.label,
    description: VEHICLE_OPTIONS.bike.tagline,
    price: "Starting from ₹8/km",
    image: "/fleet/moto.webp",
    capacity: "1 Passenger",
    badge: "Fast & Agile",
  },
  {
    id: "auto",
    name: VEHICLE_OPTIONS.auto.label,
    description: VEHICLE_OPTIONS.auto.tagline,
    price: "Starting from ₹11.5/km",
    image: "/fleet/auto.webp",
    capacity: "3 Passengers",
    badge: "Everyday Transit",
  },
  {
    id: "mini",
    name: VEHICLE_OPTIONS.mini.label,
    description: VEHICLE_OPTIONS.mini.tagline,
    price: "Starting from ₹13.5/km",
    image: "/fleet/car-mini.webp",
    capacity: "4 Passengers (AC)",
    badge: "Comfort Compact",
  },
  {
    id: "car",
    name: VEHICLE_OPTIONS.car.label,
    description: VEHICLE_OPTIONS.car.tagline,
    price: "Starting from ₹16.5/km",
    image: "/fleet/premier.webp",
    capacity: "4 Passengers (Sedan)",
    badge: "Executive Sedan",
  },
  {
    id: "priority",
    name: VEHICLE_OPTIONS.priority.label,
    description: VEHICLE_OPTIONS.priority.tagline,
    price: "Starting from ₹21/km",
    image: "/fleet/suv.webp",
    capacity: "6 Passengers (SUV)",
    badge: "Spacious XL",
  },
  {
    id: "loading",
    name: VEHICLE_OPTIONS.loading.label,
    description: VEHICLE_OPTIONS.loading.tagline,
    price: "Starting from ₹20/km",
    image: "/fleet/express-mini.webp",
    capacity: "Up to 500 kg Cargo",
    badge: "Logistics Mini",
  },
  {
    id: "truck",
    name: VEHICLE_OPTIONS.truck.label,
    description: VEHICLE_OPTIONS.truck.tagline,
    price: "Starting from ₹35/km",
    image: "/fleet/freight.webp",
    capacity: "Up to 2,000 kg Freight",
    badge: "Commercial Heavy",
  },
];

const FLEET_STANDARDS = [
  {
    icon: Car,
    title: "8 Dedicated Vehicle Classes",
    description: "From micro-mobility two-wheelers to multi-ton commercial trucks, choose the right vehicle for every journey across Assam.",
  },
  {
    icon: Zap,
    title: "Instant Dispatch & Live GPS",
    description: "Real-time dispatch algorithm pairs you with verified local driver partners in seconds with live telemetry.",
  },
  {
    icon: Shield,
    title: "Rigorous 100% Vetting",
    description: "Commercial fitness certificates, valid insurance, driving licenses, and background checks verified on every vehicle.",
  },
  {
    icon: TrendingUp,
    title: "Transparent Upfront Fares",
    description: "No hidden surge surprises or arbitrary fees. Know your exact toll, distance, and base fare before confirmation.",
  },
];

export default function FleetPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F1E5] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] justify-between">
      <Nav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        {/* ================= HERO INTRO ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#90C8A8] border border-[#cdd6c3] dark:border-[#2D4E3A] text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={13} className="text-[#E34222]" />
              <span>Verified Fleet Architecture</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#10251C] dark:text-[#F3F1E8] tracking-tight leading-[1.08] mb-4">
              Our Complete Fleet
            </h1>
            <p className="text-[#696B64] dark:text-[#929D93] text-base sm:text-lg leading-relaxed max-w-2xl">
              Engineered for Assam&apos;s diverse transit landscape. Whether navigating Guwahati&apos;s bustling city corridors or transporting cargo along national highways, Jaatri guarantees inspected vehicles, upfront fares, and professional driver partners.
            </p>
          </motion.div>
        </section>

        {/* ================= FLEET STANDARDS GRID ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {FLEET_STANDARDS.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[12px] p-6 shadow-2xs hover:border-[#123D32]/40 dark:hover:border-[#90C8A8]/40 transition duration-200"
                >
                  <div className="w-11 h-11 rounded-[8px] bg-[#E5EBDD] dark:bg-[#1D3428] text-[#123D32] dark:text-[#90C8A8] flex items-center justify-center mb-4">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-base text-[#10251C] dark:text-[#F3F1E8] mb-2">{feature.title}</h3>
                  <p className="text-[#696B64] dark:text-[#929D93] text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ================= VEHICLE CATEGORIES SHOWCASE ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
            <div>
              <p className="text-xs sm:text-[13px] font-semibold uppercase tracking-[0.16em] text-[#E34222] mb-2">
                TRANSIT TIERS
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#10251C] dark:text-[#F3F1E8] tracking-tight">
                Choose Your Vehicle Class
              </h2>
            </div>
            <Link
              href="/book?fresh=true"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#123D32] dark:text-[#90C8A8] hover:text-[#0D3027] dark:hover:text-[#A8E0C0] group"
            >
              <span>Instant ride estimate</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {FLEET_CATEGORIES.map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[14px] p-5 sm:p-6 flex flex-col justify-between group hover:border-[#123D32]/50 dark:hover:border-[#90C8A8]/50 hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Category Image */}
                  <div className="relative w-full h-36 sm:h-40 bg-[#F7F1E5] dark:bg-[#101713] rounded-[10px] mb-4 overflow-hidden flex items-center justify-center p-2 border border-[#DED7CA]/60 dark:border-[#34443A]/60">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Header info */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#E34222]">
                      {category.badge}
                    </span>
                    <span className="text-[11px] font-semibold text-[#123D32] dark:text-[#90C8A8] bg-[#E5EBDD] dark:bg-[#1D3428] px-2 py-0.5 rounded-full">
                      {category.capacity}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-[#10251C] dark:text-[#F3F1E8] font-normal mb-1.5">{category.name}</h3>
                  <p className="text-[#696B64] dark:text-[#929D93] text-xs leading-relaxed mb-4 min-h-[32px]">{category.description}</p>
                </div>

                {/* Pricing & CTA */}
                <div className="pt-4 border-t border-[#DED7CA]/70 dark:border-[#34443A]/70 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#696B64] dark:text-[#929D93] block">Transparent rate</span>
                    <p className="text-[#10251C] dark:text-[#F3F1E8] text-sm font-bold">{category.price}</p>
                  </div>
                  <Link
                    href={`/book?vehicle=${category.id}&fresh=true`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#046A38] hover:bg-[#03532C] dark:bg-[#058A48] dark:hover:bg-[#046A38] text-white text-xs font-bold transition active:scale-95 shadow-2xs"
                  >
                    <span>Book</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ================= BOTTOM CTA ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAF7F0] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[16px] p-8 sm:p-12 text-center shadow-xs">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#E34222] mb-2 block">
              READY TO COMMUTE?
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#10251C] dark:text-[#F3F1E8] max-w-xl mx-auto mb-4">
              Fast, reliable rides at your fingertips across Assam.
            </h2>
            <p className="text-[#696B64] dark:text-[#929D93] text-sm sm:text-base max-w-lg mx-auto mb-8">
              Experience seamless booking with transparent upfront pricing, real-time vehicle dispatch, and verified local drivers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/book?fresh=true"
                className="px-8 py-3.5 bg-[#046A38] hover:bg-[#03532C] dark:bg-[#058A48] dark:hover:bg-[#046A38] text-white font-bold rounded-[8px] transition active:scale-95 shadow-xs text-sm sm:text-base"
              >
                Book a Ride Now
              </Link>
              <Link
                href="/partner/onboard/vehicle"
                className="px-6 py-3.5 bg-white dark:bg-[#1E2B23] border border-[#DED7CA] dark:border-[#34443A] hover:border-[#123D32] dark:hover:border-[#90C8A8] text-[#10251C] dark:text-[#F3F1E8] font-bold rounded-[8px] transition active:scale-95 text-sm sm:text-base"
              >
                Drive with Jaatri
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
