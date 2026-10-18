"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, ArrowRight, Sparkles,
  Leaf, Flame, Users, Car, Crown, Truck, Package,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { VehicleType } from "@/lib/vehicleConfig";
import { VEHICLE_SVG_ICONS } from "@/shared/components/VehicleIcons";

interface FleetSliderItem {
  id: VehicleType;
  key: string;
  title: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  TagIcon?: React.ComponentType<{ size?: number; className?: string }>;
  image: string;
  tagKey: string;
  tag: string;
  tagBg: string;
  rate: string;
}

const FLEET_ITEMS: FleetSliderItem[] = [
  {
    id: "scooty",
    key: "scooty",
    title: "Jatri Scooty",
    desc: "Comfortable and eco-friendly rides",
    Icon: VEHICLE_SVG_ICONS.scooty,
    TagIcon: Leaf,
    image: "/fleet/scooty.webp",
    tagKey: "eco",
    tag: "ECO",
    tagBg: "bg-[#E5EBDD] text-[#123D32] border-[#cdd6c3]",
    rate: "7/km",
  },
  {
    id: "bike",
    key: "bike",
    title: "Jatri Moto",
    desc: "Fast, affordable, everyday rides",
    Icon: VEHICLE_SVG_ICONS.bike,
    TagIcon: Flame,
    image: "/fleet/moto.webp",
    tagKey: "popular",
    tag: "POPULAR",
    tagBg: "bg-[#faebe8] text-[#B83A24] border-[#f0c8c1]",
    rate: "8/km",
  },
  {
    id: "auto",
    key: "auto",
    title: "Jatri Auto",
    desc: "Quick and economical for short trips",
    Icon: VEHICLE_SVG_ICONS.auto,
    TagIcon: Users,
    image: "/fleet/auto.webp",
    tagKey: "budget",
    tag: "BUDGET",
    tagBg: "bg-[#eaf3e7] text-[#1e5a28] border-[#c8e3c3]",
    rate: "11.5/km",
  },
  {
    id: "mini",
    key: "mini",
    title: "Jatri Car Mini",
    desc: "Affordable and comfortable for city rides",
    Icon: VEHICLE_SVG_ICONS.mini,
    TagIcon: Car,
    image: "/fleet/car-mini.webp",
    tagKey: "mini",
    tag: "MINI",
    tagBg: "bg-[#e7eff8] text-[#1e4d7d] border-[#c8dcf1]",
    rate: "13.5/km",
  },
  {
    id: "car",
    key: "car",
    title: "Jatri Car Premier",
    desc: "Spacious and premium sedan for a better experience",
    Icon: VEHICLE_SVG_ICONS.car,
    TagIcon: Crown,
    image: "/fleet/premier.webp",
    tagKey: "premier",
    tag: "PREMIER",
    tagBg: "bg-[#fdf3e5] text-[#8a520e] border-[#f5ddbb]",
    rate: "16.5/km",
  },
  {
    id: "priority",
    key: "priority",
    title: "Jatri Car XL",
    desc: "More space for families and groups",
    Icon: VEHICLE_SVG_ICONS.priority,
    TagIcon: Users,
    image: "/fleet/suv.webp",
    tagKey: "xl_priority",
    tag: "XL / PRIORITY",
    tagBg: "bg-[#eee9f8] text-[#51358a] border-[#d8ccf0]",
    rate: "19.5/km",
  },
  {
    id: "loading",
    key: "loading",
    title: "Jatri Express Mini",
    desc: "Small cargo, big convenience",
    Icon: VEHICLE_SVG_ICONS.loading,
    TagIcon: Truck,
    image: "/fleet/express-mini.webp",
    tagKey: "express_mini",
    tag: "EXPRESS MINI",
    tagBg: "bg-[#e5f0fb] text-[#1b589b] border-[#c8e2f8]",
    rate: "25/km",
  },
  {
    id: "truck",
    key: "truck",
    title: "Jatri Freight",
    desc: "Reliable truck service for larger shipments",
    Icon: VEHICLE_SVG_ICONS.truck,
    TagIcon: Package,
    image: "/fleet/freight.webp",
    tagKey: "freight",
    tag: "FREIGHT",
    tagBg: "bg-[#fcf0e4] text-[#9a4f0f] border-[#f4d5b6]",
    rate: "35/km",
  },
];

export default function VehicleCategoriesSlider() {
  const { t } = useTranslation();
  const router = useRouter();
  const sliderRef  = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: "-80px" });
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
    const cardWidth = sliderRef.current.firstElementChild?.clientWidth || 280;
    const scrollAmount = cardWidth + 20; // 1 full card + gap
    sliderRef.current.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
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
    <section
      ref={sectionRef}
      className="w-full bg-[#FAF7F0] border-t border-[#DED7CA]/60 pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Jaatri Vehicle Categories"
    >
      <div className="max-w-7xl mx-auto">

        {/* ── SECTION HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end justify-between mb-5 sm:mb-6"
        >
          <div>
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
              <div className="h-[2px] w-7 sm:w-9 bg-[#B83A24] rounded-full" />
              <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em] text-[#B83A24]">
                {t("fleet.eyebrow", "FLEET")}
              </span>
            </div>
            {/* Main Editorial Heading: DM Serif Display, 36-44px */}
            <h2
              style={{ fontFamily: "var(--font-serif), 'DM Serif Display', Georgia, serif" }}
              className="text-3xl sm:text-4xl lg:text-[42px] font-normal tracking-tight text-[#10251C] leading-[1.08]"
            >
              {t("fleet.title", "Vehicle Categories")}
            </h2>
            {/* Subtitle: 15-17px, muted charcoal */}
            <p className="text-[#696B64] text-sm sm:text-[16px] mt-1.5 sm:mt-2 font-normal leading-normal">
              {t("fleet.subtitle", "Choose the ride that fits your journey")}
            </p>
          </div>

          {/* Nav buttons: Aligned with heading, 8px radius geometry */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => scroll("left")}
              disabled={!canLeft}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-[8px] border border-[#DED7CA] bg-white flex items-center justify-center hover:bg-forest hover:border-forest hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-all duration-150 text-[#10251C] shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            >
              <ChevronLeft size={18} strokeWidth={2.4} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => scroll("right")}
              disabled={!canRight}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-[8px] border border-[#DED7CA] bg-white flex items-center justify-center hover:bg-forest hover:border-forest hover:text-white disabled:opacity-25 disabled:pointer-events-none transition-all duration-150 text-[#10251C] shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
            >
              <ChevronRight size={18} strokeWidth={2.4} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── CAROUSEL WRAPPER ── */}
        <div className="relative">

          {/* Left atmospheric edge fade */}
          <AnimatePresence>
            {canLeft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-r from-[#FAF7F0] to-transparent z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Right atmospheric edge fade */}
          <AnimatePresence>
            {canRight && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-0 bottom-0 w-8 sm:w-14 bg-gradient-to-l from-[#FAF7F0] to-transparent z-10 pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Horizontal scroll track with smooth snap behavior */}
          <div
            ref={sliderRef}
            onScroll={onScroll}
            className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-5 pt-1 px-1 snap-x snap-mandatory scrollbar-hide"
          >
            {vehicleCategories.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 22 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.04 + i * 0.05, duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleSelectVehicle(item.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectVehicle(item.id);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${item.title}: ${item.desc}. Starting from ₹${item.rate}. Click to book.`}
                className="group relative w-[80vw] sm:w-[280px] min-w-[260px] sm:min-w-[280px] max-w-[310px] sm:max-w-[280px] flex-shrink-0 cursor-pointer select-none snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-[14px]"
              >
                {/* Card Container: Editorial white surface on warm ivory with 1px border and restrained elevation */}
                <div className="relative rounded-[14px] border border-[#DED7CA] bg-white p-4 sm:p-5 overflow-hidden h-full flex flex-col justify-between shadow-[0_2px_8px_rgba(18,61,50,0.03)] group-hover:shadow-[0_10px_24px_rgba(18,61,50,0.07)] group-hover:border-forest/35 transition-all duration-250">
                  <div>
                    {/* CARD TOP MEDIA: Hero vehicle artwork with 15% increased visual prominence */}
                    <div className="-mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-3.5 relative overflow-hidden select-none h-48 sm:h-56 lg:h-58 rounded-t-[13px] bg-[#FAF7F0]">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />

                      {/* Small restrained category badge in upper-left */}
                      <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-10 pointer-events-none">
                        <span className={`inline-flex items-center gap-1.5 border text-[9.5px] font-bold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full shadow-2xs backdrop-blur-xs ${item.tagBg}`}>
                          {item.TagIcon ? (
                            <item.TagIcon size={10} className="stroke-[2.2]" />
                          ) : (
                            <Sparkles size={9} />
                          )}
                          {item.tag}
                        </span>
                      </div>

                      {/* Subtle fleet numbering in upper-right */}
                      <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 text-[11px] font-semibold text-[#10251C]/35 tabular-nums pointer-events-none">
                        0{i + 1}
                      </div>
                    </div>

                    {/* Title: 19-20px, semibold, high contrast */}
                    <h3 className="text-[19px] sm:text-[20px] font-bold text-[#10251C] tracking-tight leading-snug mb-1">
                      {item.title}
                    </h3>

                    {/* Description: 13-14px, restrained grey, clamped to 2 lines for perfect card alignment */}
                    <p className="text-[13px] sm:text-[14px] text-[#696B64] font-normal leading-relaxed line-clamp-2 min-h-[38px]">
                      {item.desc}
                    </p>
                  </div>

                  {/* Bottom Pricing & Action Row */}
                  <div className="mt-3.5 pt-3 border-t border-[#DED7CA]/70 flex items-center justify-between">
                    {/* Pale Sage Price Badge with Dark Green text */}
                    <div className="inline-flex items-baseline gap-1 bg-[#E5EBDD] text-forest border border-[#cdd6c3] px-2.5 py-1 rounded-[8px]">
                      <span className="text-[10px] font-semibold text-forest/75 uppercase tracking-wider">From</span>
                      <span className="text-[13px] sm:text-[14px] font-extrabold text-forest tracking-tight">₹{item.rate}</span>
                    </div>

                    {/* Refined Arrow Affordance with 8px radius */}
                    <div className="w-8 h-8 rounded-[8px] border border-[#DED7CA] bg-white group-hover:border-forest group-hover:bg-forest text-forest group-hover:text-white transition-all duration-200 flex items-center justify-center shadow-2xs">
                      <ArrowRight size={14} strokeWidth={2.4} className="transition-transform duration-200 group-hover:translate-x-1 text-forest group-hover:text-[#D7AC62]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FLEET STATISTICS ROW ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-wrap items-center justify-between sm:justify-start gap-4 sm:gap-8 mt-7 sm:mt-9 pt-4 sm:pt-5 border-t border-[#DED7CA]"
        >
          {[
            { num: "8",    label: "Fleet Options" },
            { num: "100%", label: "Verified Drivers" },
            { num: "24/7", label: "Instant Dispatch" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 sm:gap-3">
              <p className="text-forest text-xl sm:text-2xl font-black tracking-tight tabular-nums leading-none">
                {s.num}
              </p>
              <p className="text-[#696B64] text-xs sm:text-[13px] font-medium leading-tight">
                {s.label}
              </p>
              {i < 2 && <div className="hidden sm:block w-px h-4 bg-[#DED7CA] ml-3 sm:ml-4" />}
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}