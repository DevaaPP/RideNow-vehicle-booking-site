"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ArrowRight, Sparkles,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { VEHICLE_OPTIONS, VehicleType } from "@/lib/vehicleConfig";
import { VEHICLE_SVG_ICONS } from "@/shared/components/VehicleIcons";

interface FleetSliderItem {
  id: VehicleType;
  key: string;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  tagKey: string;
  tag: string;
  rate: string;
}

const FLEET_ITEMS: FleetSliderItem[] = [
  {
    id: "bike",
    key: "bike",
    title: VEHICLE_OPTIONS.bike.label,
    desc: VEHICLE_OPTIONS.bike.tagline,
    Icon: VEHICLE_SVG_ICONS.bike,
    tagKey: "quick",
    tag: "Quick",
    rate: "₹8/km",
  },
  {
    id: "scooty",
    key: "scooty",
    title: VEHICLE_OPTIONS.scooty.label,
    desc: VEHICLE_OPTIONS.scooty.tagline,
    Icon: VEHICLE_SVG_ICONS.scooty,
    tagKey: "eco",
    tag: "Eco",
    rate: "₹7/km",
  },
  {
    id: "auto",
    key: "auto",
    title: VEHICLE_OPTIONS.auto.label,
    desc: VEHICLE_OPTIONS.auto.tagline,
    Icon: VEHICLE_SVG_ICONS.auto,
    tagKey: "popular",
    tag: "Popular",
    rate: "₹11.5/km",
  },
  {
    id: "mini",
    key: "mini",
    title: VEHICLE_OPTIONS.mini.label,
    desc: VEHICLE_OPTIONS.mini.tagline,
    Icon: VEHICLE_SVG_ICONS.mini,
    tagKey: "economy",
    tag: "Economy",
    rate: "₹13.5/km",
  },
  {
    id: "car",
    key: "car",
    title: VEHICLE_OPTIONS.car.label,
    desc: VEHICLE_OPTIONS.car.tagline,
    Icon: VEHICLE_SVG_ICONS.car,
    tagKey: "comfort",
    tag: "Comfort",
    rate: "₹16.5/km",
  },
  {
    id: "priority",
    key: "priority",
    title: VEHICLE_OPTIONS.priority.label,
    desc: VEHICLE_OPTIONS.priority.tagline,
    Icon: VEHICLE_SVG_ICONS.priority,
    tagKey: "premium",
    tag: "Premium",
    rate: "₹21/km",
  },
  {
    id: "loading",
    key: "loading",
    title: VEHICLE_OPTIONS.loading.label,
    desc: VEHICLE_OPTIONS.loading.tagline,
    Icon: VEHICLE_SVG_ICONS.loading,
    tagKey: "cargo",
    tag: "Cargo",
    rate: "₹20/km",
  },
  {
    id: "truck",
    key: "truck",
    title: VEHICLE_OPTIONS.truck.label,
    desc: VEHICLE_OPTIONS.truck.tagline,
    Icon: VEHICLE_SVG_ICONS.truck,
    tagKey: "logistics",
    tag: "Logistics",
    rate: "₹35/km",
  },
];

export default function VehicleCategoriesSlider() {
  const { t } = useTranslation();
  const router = useRouter();
  const sliderRef  = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-80px" });
  const [hovered, setHovered] = useState<number | null>(null);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const vehicleCategories = FLEET_ITEMS.map((c) => ({
    ...c,
    title: t(`fleet.${c.key}`, c.title),
    desc: t(`fleet.${c.key}Desc`, c.desc),
    tag: t(`fleet.${c.tagKey}`, c.tag),
  }));

  const scroll = (dir: "left" | "right") => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  const onScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanLeft(scrollLeft > 8);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("ridenow_booking_draft");
        localStorage.removeItem("ridenow_booking_draft");
      } catch (_) {}
    }
    router.push(`/book?vehicle=${vehicleId}&fresh=true`);
  };

  return (
    <section ref={sectionRef} className="w-full bg-white py-10 sm:py-20 px-3 sm:px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between mb-6 sm:mb-10"
        >
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="h-px w-8 bg-zinc-900" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{t("fleet.eyebrow", "Fleet")}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 leading-none">
              {t("fleet.title", "Vehicle Categories")}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-2 sm:mt-3 font-medium">{t("fleet.subtitle", "Choose the ride that fits your journey")}</p>
          </div>

          {/* Nav buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => scroll("left")}
              disabled={!canLeft}
              aria-label="Scroll left"
              className="w-11 h-11 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white disabled:opacity-25 disabled:hover:bg-white disabled:hover:text-zinc-900 disabled:hover:border-zinc-200 transition-all text-zinc-700 shadow-sm cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => scroll("right")}
              disabled={!canRight}
              aria-label="Scroll right"
              className="w-11 h-11 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-900 hover:border-zinc-900 hover:text-white disabled:opacity-25 disabled:hover:bg-white disabled:hover:text-zinc-900 disabled:hover:border-zinc-200 transition-all text-zinc-700 shadow-sm cursor-pointer"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── SLIDER ── */}
        <div className="relative">

          {/* Left fade */}
          <AnimatePresence>
            {canLeft && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Right fade */}
          <AnimatePresence>
            {canRight && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div
            ref={sliderRef}
            onScroll={onScroll}
            className="flex gap-3.5 sm:gap-5 pt-2 sm:pt-4 overflow-x-auto scroll-smooth pb-4 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {vehicleCategories.map((item, i) => {
              const isHovered = hovered === i;
              const Icon = item.Icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 28 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onHoverStart={() => setHovered(i)}
                  onHoverEnd={() => setHovered(null)}
                  whileHover={{ y: -6 }}
                  onClick={() => handleSelectVehicle(item.id)}
                  className="group relative min-w-[220px] sm:min-w-[270px] flex-shrink-0 cursor-pointer select-none"
                >
                  {/* Card */}
                  <motion.div
                    animate={{
                      backgroundColor: isHovered ? "#09090b" : "#ffffff",
                      borderColor: isHovered ? "#09090b" : "#e4e4e7",
                      boxShadow: isHovered
                        ? "0 20px 48px rgba(0,0,0,0.18)"
                        : "0 2px 14px rgba(0,0,0,0.05)",
                    }}
                    transition={{ duration: 0.25 }}
                    className="relative rounded-2xl sm:rounded-3xl border p-5 sm:p-7 overflow-hidden h-full flex flex-col justify-between"
                  >

                    {/* BG dot pattern on hover */}
                    <motion.div
                      animate={{ opacity: isHovered ? 0.06 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    />

                    <div>
                      {/* TAG */}
                      <motion.div
                        animate={{
                          backgroundColor: isHovered ? "rgba(255,255,255,0.12)" : "#f4f4f5",
                          color: isHovered ? "#ffffff" : "#71717a",
                          borderColor: isHovered ? "rgba(255,255,255,0.15)" : "#e4e4e7",
                        }}
                        className="inline-flex items-center gap-1.5 border text-[9px] font-black uppercase tracking-[0.18em] px-2.5 py-1.5 rounded-full mb-5 transition-colors"
                      >
                        <Sparkles size={8} />
                        {item.tag}
                      </motion.div>

                      {/* ICON BOX */}
                      <motion.div
                        animate={{
                          backgroundColor: isHovered ? "rgba(255,255,255,0.1)" : "#f4f4f5",
                          borderColor: isHovered ? "rgba(255,255,255,0.15)" : "#e4e4e7",
                        }}
                        className="w-16 h-16 rounded-2xl border flex items-center justify-center mb-5 p-2 transition-colors overflow-hidden"
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          <Icon size={44} className="w-full h-full object-contain" />
                        </div>
                      </motion.div>

                      {/* TEXT */}
                      <motion.h3
                        animate={{ color: isHovered ? "#ffffff" : "#09090b" }}
                        transition={{ duration: 0.2 }}
                        className="text-lg font-black tracking-tight leading-none mb-2"
                      >
                        {item.title}
                      </motion.h3>
                      <motion.p
                        animate={{ color: isHovered ? "rgba(255,255,255,0.6)" : "#71717a" }}
                        transition={{ duration: 0.2 }}
                        className="text-xs font-medium leading-relaxed"
                      >
                        {item.desc}
                      </motion.p>
                    </div>

                    {/* Bottom Rate & Book Action */}
                    <div className="mt-5 pt-3.5 border-t border-zinc-100 group-hover:border-zinc-800 transition-colors flex items-center justify-between">
                      <span className={`text-xs font-bold ${isHovered ? "text-amber-400" : "text-zinc-900"}`}>
                        From {item.rate}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${isHovered ? "text-white" : "text-zinc-500"}`}>
                        Book <ArrowRight size={12} />
                      </span>
                    </div>

                    {/* Static index number — subtle */}
                    <div className="absolute top-5 right-5 text-[10px] font-black tabular-nums" style={{ color: isHovered ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}>
                      0{i + 1}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM COUNTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-between sm:justify-start gap-3 sm:gap-6 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-zinc-100"
        >
          {[
            { num: "8",    label: "Fleet Options" },
            { num: "100%", label: "Verified Drivers" },
            { num: "24/7", label: "Instant Dispatch" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 sm:gap-3">
              <p className="text-zinc-900 text-base sm:text-lg font-black tracking-tight">{s.num}</p>
              <p className="text-zinc-400 text-[11px] sm:text-xs font-medium">{s.label}</p>
              {i < 2 && <div className="hidden sm:block w-px h-5 bg-zinc-200 ml-3" />}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}