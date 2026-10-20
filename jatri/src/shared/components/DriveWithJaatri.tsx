"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Wallet, CalendarClock, Users } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function DriveWithJaatri() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-[#F7F1E5] dark:bg-[#101713] overflow-hidden min-h-[490px] sm:min-h-[520px] lg:min-h-[550px] xl:min-h-[570px] flex items-center py-12 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8"
      aria-label="Drive with Jaatri Driver Partnership"
    >
      {/* ================= ATMOSPHERIC TOP & BOTTOM DISSOLVES ================= */}
      {/* Subtle top fade that visually connects the image with the preceding fleet section */}
      <div className="absolute top-0 left-0 right-0 h-14 sm:h-20 bg-gradient-to-b from-[#F7F1E5] via-[#F7F1E5]/60 to-transparent dark:from-[#101713] dark:via-[#101713]/60 pointer-events-none z-10" />

      {/* Restrained bottom fade so the photograph blends naturally into the next section */}
      <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-18 bg-gradient-to-t from-[#F7F1E5] via-[#F7F1E5]/50 to-transparent dark:from-[#101713] dark:via-[#101713]/50 pointer-events-none z-10" />

      {/* ================= FULL-BLEED PHOTOGRAPHIC COMPOSITION ================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
        <Image
          src="/drivejatri.webp"
          alt="Drive with Jaatri - Assamese Driver Partner with Car and Brahmaputra River"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[85%_center] sm:object-[80%_center] md:object-[82%_center] lg:object-center"
        />

        {/* Sophisticated Layered Gradient:
            - Mobile: Strong vertical and horizontal ivory fade to keep stacked copy perfectly legible.
            - Desktop: Strong left fade fading cleanly into transparent on the right to showcase the driver & branded sedan.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F7F1E5] via-[#F7F1E5]/80 via-40% to-[#F7F1E5]/90 dark:from-[#101713] dark:via-[#101713]/85 dark:via-40% dark:to-[#101713]/95 sm:hidden" />
        <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-[#F7F1E5] via-[#F7F1E5]/95 via-35% to-transparent sm:via-[#F7F1E5]/90 sm:via-42% md:via-[#F7F1E5]/75 md:via-48% lg:via-[#F7F1E5]/25 lg:via-55% lg:to-transparent dark:from-[#101713] dark:via-[#101713]/95 dark:sm:via-[#101713]/90 dark:md:via-[#101713]/75 dark:lg:via-[#101713]/30" />
      </div>

      {/* ================= CONTENT CONTAINER (Grid-aligned with max-w-7xl) ================= */}
      <div className="relative z-20 max-w-7xl mx-auto w-full">
        <div className="max-w-xl lg:max-w-[620px] text-left">
          
          {/* Eyebrow: FOR OUR DRIVER PARTNERS */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-3 mb-2 sm:mb-2.5"
          >
            <span className="text-xs sm:text-[13px] lg:text-[14px] font-semibold uppercase tracking-[0.16em] text-[#E34222] dark:text-[#E06A50]">
              {t("partnerSection.eyebrow", "FOR OUR DRIVER PARTNERS")}
            </span>
            <span className="w-8 sm:w-12 h-[1.5px] bg-[#E34222]/70 dark:bg-[#E06A50]/70 rounded-full" />
          </motion.div>

          {/* Main Heading: DM Serif Display in dark forest ink (#10251C) with Assamese vermilion brush stroke */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
            style={{
              fontFamily: "var(--font-serif), 'DM Serif Display', Georgia, serif",
              fontSize: "clamp(2.5rem, 4.8vw + 0.5rem, 4.25rem)",
              lineHeight: 1.02,
            }}
            className="font-normal text-[#10251C] dark:text-[#F3F1E8] tracking-tight whitespace-nowrap sm:whitespace-normal"
          >
            {t("partnerSection.titlePrefix", "Drive with")}{" "}
            <span className="relative inline-block">
              {t("partnerSection.titleBrand", "Jaatri.")}
              <svg
                aria-hidden="true"
                viewBox="0 0 100 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-[8px] sm:h-[10px] text-[#E34222] dark:text-[#E06A50] pointer-events-none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 7 C 28 3.5, 62 10.5, 98 4"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h2>

          {/* Supporting Headline: Inter, 22-26px, Deep Forest Green */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          >
            <p className="text-lg sm:text-[22px] lg:text-[25px] font-bold text-[#123D32] dark:text-[#388463] mt-3 sm:mt-4 leading-snug tracking-tight">
              {t("partnerSection.headline", "Your vehicle. Your earnings. Your freedom.")}
            </p>
            {/* Description: Muted Charcoal (#555D57) */}
            <p className="text-sm sm:text-base lg:text-[17px] text-[#555D57] dark:text-[#B8C2B8] font-normal mt-1.5 sm:mt-2 leading-relaxed max-w-lg">
              {t("partnerSection.subtext", "Join Jaatri and move Assam forward, one ride at a time.")}
            </p>
          </motion.div>

          {/* Coordinated Premium Feature Row */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-6 sm:mt-7"
          >
            {/* Benefit 1: Direct payouts */}
            <div className="bg-[#FAF7F0]/90 sm:bg-[#E5EBDD]/60 dark:bg-[#17211B]/90 dark:sm:bg-[#1E2B23]/70 backdrop-blur-xs border border-[#123D32]/15 dark:border-[#34443A] rounded-[8px] p-3 sm:px-3.5 sm:py-3.5 flex items-center gap-3 shadow-[0_2px_8px_rgba(18,61,50,0.03)]">
              <div className="w-10 h-10 rounded-[8px] bg-[#123D32]/10 dark:bg-[#28664D]/25 border border-[#123D32]/15 dark:border-[#34443A] text-[#123D32] dark:text-[#388463] flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-[#123D32] dark:text-[#388463]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#10251C] dark:text-[#F3F1E8] leading-snug tracking-tight truncate">
                  {t("partnerSection.card1Title", "Direct payouts")}
                </h4>
                <p className="text-xs text-[#555D57] dark:text-[#929D93] font-medium leading-tight mt-0.5">
                  {t("partnerSection.card1Desc", "100% driver pay")}
                </p>
              </div>
            </div>

            {/* Benefit 2: Flexible hours */}
            <div className="bg-[#FAF7F0]/90 sm:bg-[#E5EBDD]/60 dark:bg-[#17211B]/90 dark:sm:bg-[#1E2B23]/70 backdrop-blur-xs border border-[#123D32]/15 dark:border-[#34443A] rounded-[8px] p-3 sm:px-3.5 sm:py-3.5 flex items-center gap-3 shadow-[0_2px_8px_rgba(18,61,50,0.03)]">
              <div className="w-10 h-10 rounded-[8px] bg-[#123D32]/10 dark:bg-[#28664D]/25 border border-[#123D32]/15 dark:border-[#34443A] text-[#123D32] dark:text-[#388463] flex items-center justify-center shrink-0">
                <CalendarClock className="w-5 h-5 text-[#123D32] dark:text-[#388463]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#10251C] dark:text-[#F3F1E8] leading-snug tracking-tight truncate">
                  {t("partnerSection.card2Title", "Flexible hours")}
                </h4>
                <p className="text-xs text-[#555D57] dark:text-[#929D93] font-medium leading-tight mt-0.5">
                  {t("partnerSection.card2Desc", "Drive on your schedule")}
                </p>
              </div>
            </div>

            {/* Benefit 3: A local service */}
            <div className="bg-[#FAF7F0]/90 sm:bg-[#E5EBDD]/60 dark:bg-[#17211B]/90 dark:sm:bg-[#1E2B23]/70 backdrop-blur-xs border border-[#123D32]/15 dark:border-[#34443A] rounded-[8px] p-3 sm:px-3.5 sm:py-3.5 flex items-center gap-3 shadow-[0_2px_8px_rgba(18,61,50,0.03)]">
              <div className="w-10 h-10 rounded-[8px] bg-[#123D32]/10 dark:bg-[#28664D]/25 border border-[#123D32]/15 dark:border-[#34443A] text-[#123D32] dark:text-[#388463] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#123D32] dark:text-[#388463]" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[#10251C] dark:text-[#F3F1E8] leading-snug tracking-tight truncate">
                  {t("partnerSection.card3Title", "A local service")}
                </h4>
                <p className="text-xs text-[#555D57] dark:text-[#929D93] font-medium leading-tight mt-0.5">
                  {t("partnerSection.card3Desc", "Built for Assam, by Assam")}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Call-to-Action Hierarchy */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-5 sm:gap-7 mt-8 sm:mt-9"
          >
            {/* Primary CTA */}
            <Link
              href="/partner/onboard/vehicle"
              className="group inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-[8px] bg-[#046A38] hover:bg-[#03532C] dark:bg-[#058A48] dark:hover:bg-[#046A38] text-white font-semibold text-base transition-all duration-200 active:scale-[0.97] shadow-[0_4px_16px_rgba(18,61,50,0.22)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A38]"
            >
              <span>{t("partnerSection.ctaPrimary", "Become a Jaatri Partner")}</span>
              <ArrowRight className="w-4 h-4 text-[#D7AC62] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/partner-terms"
              className="inline-flex items-center text-sm sm:text-base font-semibold text-[#123D32] dark:text-[#388463] hover:text-[#0D3027] dark:hover:text-emerald-400 underline underline-offset-4 decoration-[#123D32]/40 dark:decoration-[#388463]/40 hover:decoration-[#123D32] transition duration-150 cursor-pointer"
            >
              {t("partnerSection.ctaSecondary", "Learn more")}
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
