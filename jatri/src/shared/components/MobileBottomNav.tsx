"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, Clock, User } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useSession } from "next-auth/react";

interface NavDestination {
  key: string;
  labelKey: string;
  defaultLabel: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  isActive: (pathname: string) => boolean;
}

const DESTINATIONS: NavDestination[] = [
  {
    key: "home",
    labelKey: "nav.home",
    defaultLabel: "Home",
    href: "/",
    icon: Home,
    isActive: (pathname) => pathname === "/",
  },
  {
    key: "ride",
    labelKey: "nav.fleet",
    defaultLabel: "Ride",
    href: "/fleet",
    icon: Car,
    isActive: (pathname) => pathname === "/fleet" || pathname === "/search",
  },
  {
    key: "bookings",
    labelKey: "nav.bookings",
    defaultLabel: "Bookings",
    href: "/bookings",
    icon: Clock,
    isActive: (pathname) => pathname === "/bookings",
  },
  {
    key: "account",
    labelKey: "nav.profile",
    defaultLabel: "Account",
    href: "/profile",
    icon: User,
    isActive: (pathname) => pathname === "/profile" || pathname === "/wallet",
  },
];

// Routes where full-screen interaction, map manipulation, or pinned CTAs must NOT be obstructed
const HIDDEN_PATTERNS = [
  /^\/book/,                 // Interactive map booking sheet & pinned confirm CTA
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

  // Destination definitions adapted for driver/partner routes if partner is logged in
  const destinations = isVendor
    ? [
        {
          key: "dashboard",
          labelKey: "nav.dashboard",
          defaultLabel: "Dashboard",
          href: "/partners/dashboard",
          icon: Home,
          isActive: (p: string) => p === "/partners/dashboard",
        },
        {
          key: "activeRide",
          labelKey: "nav.activeRide",
          defaultLabel: "Active Ride",
          href: "/partner/active-ride",
          icon: Car,
          isActive: (p: string) => p === "/partner/active-ride",
        },
        {
          key: "bookings",
          labelKey: "nav.bookings",
          defaultLabel: "Bookings",
          href: "/partner/bookings",
          icon: Clock,
          isActive: (p: string) => p === "/partner/bookings",
        },
        {
          key: "account",
          labelKey: "nav.wallet",
          defaultLabel: "Wallet",
          href: "/partner/wallet",
          icon: User,
          isActive: (p: string) => p === "/partner/wallet",
        },
      ]
    : DESTINATIONS;

  return (
    <>
      {/* Spacer to prevent page bottom content from being obscured by the fixed bar */}
      <div
        className="h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:hidden pointer-events-none w-full shrink-0"
        aria-hidden="true"
      />

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#FAF7F0]/95 dark:bg-[#101713]/95 backdrop-blur-md border-t border-[#DED7CA]/90 dark:border-[#34443A] shadow-[0_-4px_20px_rgba(18,61,50,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.45)] transition-colors duration-200"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-around h-[58px] px-2 max-w-lg mx-auto">
          {destinations.map((dest) => {
            const active = dest.isActive(pathname);
            const Icon = dest.icon;
            const label = t(dest.labelKey, dest.defaultLabel);

            return (
              <Link
                key={dest.key}
                href={dest.href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 transition-all select-none active:scale-[0.93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#046A38] rounded-[8px]"
              >
                {/* Tactile Icon container with Apple/Uber-style active pill highlight */}
                <div
                  className={`flex items-center justify-center transition-all duration-150 ${
                    active
                      ? "px-3.5 py-0.5 rounded-full bg-[#DDEBE0] dark:bg-[#1D3428] text-[#046A38] dark:text-[#A8E0C0]"
                      : "px-3.5 py-0.5 text-[#696B64] dark:text-[#929D93]"
                  }`}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.4 : 1.9}
                    className="shrink-0 transition-transform"
                  />
                </div>

                {/* Micro Label */}
                <span
                  className={`text-[10.5px] tracking-tight leading-tight mt-0.5 transition-colors ${
                    active
                      ? "font-bold text-[#046A38] dark:text-[#A8E0C0]"
                      : "font-medium text-[#696B64] dark:text-[#929D93]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
