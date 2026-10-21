"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Clock, User, Car, Navigation, ClipboardList, Wallet } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useSession } from "next-auth/react";

// Routes where full-screen interaction, map manipulation, or pinned CTAs must NOT be obstructed
const HIDDEN_PATTERNS = [
  /^\/book($|\?)/,           // Interactive map booking sheet & pinned confirm CTA
  /^\/ride\//,               // Live turn-by-turn passenger tracking & panic controls
  /^\/track\//,              // Public live tracking map view
  /^\/video-kyc\//,          // Full-screen camera & video KYC stream
  /^\/admin/,                // Admin management interface (has dedicated operational layout)
  /^\/partner\/active-ride/, // Driver operational turn-by-turn navigation
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { userData } = useSelector((state: RootState) => state.user);
  const { data: session } = useSession();

  // If currently on an excluded full-screen route, do not render
  if (!pathname || HIDDEN_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return null;
  }

  const currentUser = userData || session?.user;
  const isVendor = currentUser?.role === "vendor" || pathname.startsWith("/partner");

  if (isVendor) {
    return (
      <>
        {/* Spacer to prevent page bottom content from being obscured */}
        <div
          className="h-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:hidden pointer-events-none w-full shrink-0"
          aria-hidden="true"
        />

        {/* Vendor/Driver Mobile Dock */}
        <nav
          aria-label="Partner Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#FAF7F0]/95 dark:bg-[#121C17]/95 backdrop-blur-xl border-t border-[#DED7CA]/90 dark:border-[#2D3E33] shadow-[0_-4px_24px_rgba(18,61,50,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] transition-colors duration-200"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center justify-around h-[60px] px-2 max-w-lg mx-auto relative">
            {/* 1. Dashboard */}
            <Link
              href="/partners/dashboard"
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] ${
                pathname === "/partners/dashboard" ? "text-[#046A38] dark:text-[#A8E0C0]" : "text-[#696B64] dark:text-[#929D93]"
              }`}
            >
              <Home size={20} strokeWidth={pathname === "/partners/dashboard" ? 2.5 : 1.9} />
              <span className="text-[10px] tracking-tight mt-1 font-semibold">{t("nav.dashboard", "Dashboard")}</span>
            </Link>

            {/* 2. Requests */}
            <Link
              href="/partner/pending-requests"
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] ${
                pathname === "/partner/pending-requests" ? "text-[#046A38] dark:text-[#A8E0C0]" : "text-[#696B64] dark:text-[#929D93]"
              }`}
            >
              <ClipboardList size={20} strokeWidth={pathname === "/partner/pending-requests" ? 2.5 : 1.9} />
              <span className="text-[10px] tracking-tight mt-1 font-semibold">{t("nav.requests", "Requests")}</span>
            </Link>

            {/* 3. Central Active Ride */}
            <div className="flex-1 flex justify-center items-center">
              <Link
                href="/partner/active-ride"
                aria-label="Partner Active Ride"
                className="w-12 h-12 rounded-full bg-[#046A38] hover:bg-[#03532C] text-white flex items-center justify-center -mt-6 border-[3.5px] border-[#FAF7F0] dark:border-[#121C17] shadow-[0_6px_20px_rgba(4,106,56,0.38)] active:scale-90 transition-transform"
              >
                <Navigation size={22} className="fill-white" />
              </Link>
            </div>

            {/* 4. Bookings */}
            <Link
              href="/partner/bookings"
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] ${
                pathname === "/partner/bookings" ? "text-[#046A38] dark:text-[#A8E0C0]" : "text-[#696B64] dark:text-[#929D93]"
              }`}
            >
              <Clock size={20} strokeWidth={pathname === "/partner/bookings" ? 2.5 : 1.9} />
              <span className="text-[10px] tracking-tight mt-1 font-semibold">{t("nav.bookings", "Bookings")}</span>
            </Link>

            {/* 5. Wallet */}
            <Link
              href="/partner/wallet"
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] ${
                pathname === "/partner/wallet" ? "text-[#046A38] dark:text-[#A8E0C0]" : "text-[#696B64] dark:text-[#929D93]"
              }`}
            >
              <Wallet size={20} strokeWidth={pathname === "/partner/wallet" ? 2.5 : 1.9} />
              <span className="text-[10px] tracking-tight mt-1 font-semibold">{t("nav.wallet", "Wallet")}</span>
            </Link>
          </div>
        </nav>
      </>
    );
  }

  // Passenger / Consumer 5-Position Dock matching Reference Screenshot
  const isHomeActive = pathname === "/";
  const isServicesActive = pathname === "/fleet" || pathname === "/search";
  const isBookingsActive = pathname === "/bookings";
  const isAccountActive = pathname === "/profile" || pathname === "/wallet" || pathname === "/settings";

  return (
    <>
      {/* Spacer to prevent page bottom content from being obscured */}
      <div
        className="h-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:hidden pointer-events-none w-full shrink-0"
        aria-hidden="true"
      />

      {/* Fixed Mobile Bottom Navigation Dock */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#FAF7F0]/95 dark:bg-[#121C17]/95 backdrop-blur-xl border-t border-[#DED7CA]/90 dark:border-[#2D3E33] shadow-[0_-4px_24px_rgba(18,61,50,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] transition-colors duration-200"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between h-[60px] px-2 max-w-md mx-auto relative">
          {/* Position 1: Home */}
          <Link
            href="/"
            aria-label="Home"
            aria-current={isHomeActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A38] rounded-[8px] ${
              isHomeActive
                ? "text-[#046A38] dark:text-[#A8E0C0]"
                : "text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8]"
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-150 ${
                isHomeActive
                  ? "px-3 py-0.5 rounded-full bg-[#DDEBE0] dark:bg-[#1D3428]"
                  : "px-3 py-0.5"
              }`}
            >
              <Home size={20} strokeWidth={isHomeActive ? 2.5 : 1.9} />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-tight mt-0.5 transition-colors ${
                isHomeActive ? "font-bold text-[#046A38] dark:text-[#A8E0C0]" : "font-medium"
              }`}
            >
              {t("nav.home", "Home")}
            </span>
          </Link>

          {/* Position 2: Services */}
          <Link
            href="/fleet"
            aria-label="Services"
            aria-current={isServicesActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A38] rounded-[8px] ${
              isServicesActive
                ? "text-[#046A38] dark:text-[#A8E0C0]"
                : "text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8]"
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-150 ${
                isServicesActive
                  ? "px-3 py-0.5 rounded-full bg-[#DDEBE0] dark:bg-[#1D3428]"
                  : "px-3 py-0.5"
              }`}
            >
              <LayoutGrid size={20} strokeWidth={isServicesActive ? 2.5 : 1.9} />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-tight mt-0.5 transition-colors ${
                isServicesActive ? "font-bold text-[#046A38] dark:text-[#A8E0C0]" : "font-medium"
              }`}
            >
              {t("nav.services", "Services")}
            </span>
          </Link>

          {/* Position 3: Central Circular Elevated Action Button */}
          <div className="flex-1 flex justify-center items-center pointer-events-auto">
            <Link
              href="/book?fresh=true"
              aria-label="Book a Ride or Search Trips"
              className="w-13 h-13 rounded-full bg-[#046A38] hover:bg-[#03532C] dark:bg-[#058A48] dark:hover:bg-[#046A38] text-white flex items-center justify-center -mt-6 border-[3.5px] border-[#FAF7F0] dark:border-[#121C17] shadow-[0_6px_20px_rgba(4,106,56,0.38)] active:scale-90 transition-transform cursor-pointer"
            >
              <Car size={23} strokeWidth={2.4} />
            </Link>
          </div>

          {/* Position 4: Bookings */}
          <Link
            href="/bookings"
            aria-label="Bookings"
            aria-current={isBookingsActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A38] rounded-[8px] ${
              isBookingsActive
                ? "text-[#046A38] dark:text-[#A8E0C0]"
                : "text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8]"
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-150 ${
                isBookingsActive
                  ? "px-3 py-0.5 rounded-full bg-[#DDEBE0] dark:bg-[#1D3428]"
                  : "px-3 py-0.5"
              }`}
            >
              <Clock size={20} strokeWidth={isBookingsActive ? 2.5 : 1.9} />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-tight mt-0.5 transition-colors ${
                isBookingsActive ? "font-bold text-[#046A38] dark:text-[#A8E0C0]" : "font-medium"
              }`}
            >
              {t("nav.bookings", "Bookings")}
            </span>
          </Link>

          {/* Position 5: Account */}
          <Link
            href="/profile"
            aria-label="Account"
            aria-current={isAccountActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-all select-none active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A38] rounded-[8px] ${
              isAccountActive
                ? "text-[#046A38] dark:text-[#A8E0C0]"
                : "text-[#696B64] dark:text-[#929D93] hover:text-[#10251C] dark:hover:text-[#F3F1E8]"
            }`}
          >
            <div
              className={`flex items-center justify-center transition-all duration-150 ${
                isAccountActive
                  ? "px-3 py-0.5 rounded-full bg-[#DDEBE0] dark:bg-[#1D3428]"
                  : "px-3 py-0.5"
              }`}
            >
              <User size={20} strokeWidth={isAccountActive ? 2.5 : 1.9} />
            </div>
            <span
              className={`text-[10px] tracking-tight leading-tight mt-0.5 transition-colors ${
                isAccountActive ? "font-bold text-[#046A38] dark:text-[#A8E0C0]" : "font-medium"
              }`}
            >
              {t("nav.account", "Account")}
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}
