"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";
import { useTranslation } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useTranslation();

  const socialLinks = [
    { Icon: Facebook, href: "https://facebook.com", name: "Facebook" },
    { Icon: Instagram, href: "https://instagram.com", name: "Instagram" },
    { Icon: Twitter, href: "https://twitter.com", name: "Twitter" },
    { Icon: Linkedin, href: "https://linkedin.com", name: "LinkedIn" },
  ];

  return (
    <footer className="w-full bg-[#123D32] text-[#F7F1E5] border-t border-[#426457]/50 relative overflow-hidden">
      {/* Subtle Assamese Gamosa-inspired vermilion top accent line */}
      <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-[#B83A24] via-45% via-[#D7AC62] to-transparent opacity-85" />

      {/* MAIN FOOTER CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10 sm:pb-14"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12">

          {/* LEVEL A: BRAND INTRODUCTION (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              {/* Brand Logo Asset */}
              <Link
                href="/"
                className="inline-flex items-center active:scale-[0.98] transition mb-3"
                aria-label="Jaatri Home"
              >
                <Image
                  src="/logojatri.png"
                  alt="Jaatri by RideNow"
                  width={240}
                  height={76}
                  className="h-12 sm:h-14 w-auto object-contain brightness-0 invert opacity-95"
                  priority
                />
              </Link>

              {/* Tagline */}
              <p
                style={{ fontFamily: "var(--font-serif), 'DM Serif Display', Georgia, serif" }}
                className="text-lg sm:text-xl text-[#F7F1E5] font-normal tracking-tight mt-1"
              >
                {t("footer.tagline", "More than a ride.")}
              </p>

              {/* Description */}
              <p className="mt-2.5 text-[#C4D2C8] text-sm leading-relaxed max-w-[340px]">
                {t(
                  "footer.aboutText",
                  "Assam's local mobility platform for everyday journeys, vehicle rentals and deliveries."
                )}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-7">
              {socialLinks.map((item, i) => (
                <motion.a
                  key={i}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-[#426457] bg-[#0D3027]/70 text-[#C4D2C8] hover:text-[#F7F1E5] hover:border-[#D7AC62] hover:bg-[#0D3027] transition-all duration-200 cursor-pointer shadow-2xs"
                >
                  <item.Icon size={16} strokeWidth={2.2} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* LEVEL B: NAVIGATION COLUMNS (lg:col-span-8) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-7 sm:gap-6 lg:gap-8">

            {/* Column 1: COMPANY */}
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#D7AC62]">
                {t("footer.company", "COMPANY")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: t("footer.about", "About"), href: "/" },
                  { label: t("footer.careers", "Careers"), href: "/" },
                  { label: t("footer.blog", "Blog"), href: "/" },
                  { label: t("footer.contact", "Contact Us"), href: "/contact" },
                  { label: t("footer.faq", "Help & FAQs"), href: "/faq" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[#C4D2C8] hover:text-[#F7F1E5] transition-colors duration-150 inline-block leading-relaxed"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: SERVICES */}
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#D7AC62]">
                {t("footer.services", "SERVICES")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: t("footer.bookRide", "Book a Ride"), href: "/book" },
                  { label: t("footer.ourFleet", "Our Fleet"), href: "/fleet" },
                  { label: t("footer.parcelCargo", "Parcel & Cargo"), href: "/book?category=trucks" },
                  { label: t("footer.rentals", "Rentals"), href: "/book?rental=true" },
                  { label: t("footer.myBookings", "My Bookings"), href: "/bookings" },
                  { label: t("footer.becomePartner", "Become a Partner"), href: "/partner/onboard/vehicle" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[#C4D2C8] hover:text-[#F7F1E5] transition-colors duration-150 inline-block leading-relaxed"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: SAFETY & SUPPORT */}
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#D7AC62]">
                {t("footer.safetySupport", "SAFETY & SUPPORT")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: t("footer.safetyStandards", "Safety Standards"), href: "/safety" },
                  { label: t("footer.faq", "Help & FAQs"), href: "/faq" },
                  { label: t("footer.contact", "Contact Us"), href: "/contact" },
                  { label: t("footer.grievanceOfficer", "Grievance Officer"), href: "/grievance" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[#C4D2C8] hover:text-[#F7F1E5] transition-colors duration-150 inline-block leading-relaxed"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: LEGAL & COMPLIANCE */}
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#D7AC62]">
                {t("footer.legal", "LEGAL")}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { label: t("footer.privacy", "Privacy Policy"), href: "/privacy" },
                  { label: t("footer.terms", "Terms of Service"), href: "/terms" },
                  { label: t("footer.paymentTerms", "Payment Terms"), href: "/payment-terms" },
                  { label: t("footer.refunds", "Refunds"), href: "/cancellation-refund" },
                  { label: t("footer.driverTerms", "Driver Terms"), href: "/partner-terms" },
                  { label: t("footer.cookies", "Cookies"), href: "/cookies" },
                  { label: t("footer.grievance", "Grievance Redressal"), href: "/grievance" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-[#C4D2C8] hover:text-[#F7F1E5] transition-colors duration-150 inline-block leading-relaxed"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      </motion.div>

      {/* LEVEL C: BOTTOM LEGAL BAR */}
      <div className="border-t border-[#426457]/70 bg-[#0D3027]/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4">
          {/* Tier 1: Interactive System Controls (Theme & Languages) and Quick Legal Links */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-xs text-[#C4D2C8]">
            {/* System Controls: Theme & Languages in unified cluster */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3.5">
              <ThemeToggle variant="footer" />
              <div className="h-3.5 w-px bg-[#426457] hidden sm:block" />
              <LanguageSelector variant="footer" />
            </div>

            {/* Quick Legal Links */}
            <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-2 justify-center lg:justify-end text-xs text-[#C4D2C8]">
              <Link href="/privacy" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.privacy", "Privacy Policy")}
              </Link>
              <Link href="/terms" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.terms", "Terms of Service")}
              </Link>
              <Link href="/payment-terms" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.paymentTerms", "Payment Terms")}
              </Link>
              <Link href="/cancellation-refund" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.refunds", "Refunds")}
              </Link>
              <Link href="/partner-terms" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.driverTerms", "Driver Terms")}
              </Link>
              <Link href="/cookies" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.cookies", "Cookies")}
              </Link>
              <Link href="/grievance" className="hover:text-[#F7F1E5] transition-colors">
                {t("footer.grievance", "Grievance Redressal")}
              </Link>
            </div>
          </div>

          {/* Tier 2: Clean Sub-divider & Legal Copyright Sign-off */}
          <div className="pt-3 border-t border-[#426457]/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#C4D2C8]/75 gap-2 text-center sm:text-left">
            <p>
              © {new Date().getFullYear()} {t("footer.allRights", "RideNow Mobility Technologies Pvt. Ltd. All rights reserved.")}
            </p>
            <p className="text-[#C4D2C8]/50">
              Assam moves with you • Built with pride in Assam
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
