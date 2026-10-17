"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Wallet,
  ArrowRight,
  HelpCircle,
  FileText,
  Star,
  User as UserIcon,
  Tag,
  Car,
} from "lucide-react";
import AuthModal from "@/features/auth/components/AuthModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { signOut, useSession } from "next-auth/react";
import { setUserData } from "@/redux/userSlice";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import NotificationToggle from "./NotificationToggle";
import { useTranslation } from "@/context/LanguageContext";

const NAV_ITEMS = ["Home", "Bookings", "Fleet", "FAQ", "Contact"];
const NAV_ROUTES: Record<string, string> = {
  Home: "/",
  Bookings: "/bookings",
  Fleet: "/fleet",
  FAQ: "/faq",
  Contact: "/contact",
};
const NAV_KEYS: Record<string, string> = {
  Home: "nav.home",
  Bookings: "nav.bookings",
  Fleet: "nav.fleet",
  FAQ: "nav.faq",
  Contact: "nav.contact",
};

export default function Nav({ user: propUser }: { user?: any } = {}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [pendingCount, setPendingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [passengerActiveRide, setPassengerActiveRide] = useState<any | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { userData } = useSelector((state: RootState) => state.user);
  const { data: session, status } = useSession();

  const currentUser = userData || propUser || (status === "authenticated" ? session?.user : null);
  const isVendorRoute = pathname?.startsWith("/partner") || pathname?.startsWith("/partners");

  useEffect(() => {
    if (propUser && !userData) {
      dispatch(setUserData(propUser));
    }
  }, [propUser, userData, dispatch]);

  /* Fetch vendor counts */
  useEffect(() => {
    if (currentUser?.role !== "vendor" && !isVendorRoute) return;

    const fetchCounts = async () => {
      try {
        const res = await axios.get("/api/partner/bookings/counts", {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        setPendingCount(res.data.pending || 0);
        setActiveCount(res.data.active || 0);
      } catch {}
    };

    fetchCounts();
  }, [currentUser?.role, isVendorRoute]);

  /* Fetch passenger active ride */
  useEffect(() => {
    let isMounted = true;

    if (!currentUser || currentUser?.role === "vendor" || isVendorRoute) {
      Promise.resolve().then(() => {
        if (isMounted) setPassengerActiveRide(null);
      });
      return () => {
        isMounted = false;
      };
    }

    const checkActive = async () => {
      try {
        const res = await axios.get("/api/booking/my-active", {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        if (!isMounted) return;
        if (res.data?.booking) {
          setPassengerActiveRide(res.data.booking);
        } else {
          setPassengerActiveRide(null);
        }
      } catch {
        if (isMounted) setPassengerActiveRide(null);
      }
    };

    checkActive();
    const interval = setInterval(checkActive, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.role, isVendorRoute]);

  /* Close menus on route change */
  useEffect(() => {
    Promise.resolve().then(() => {
      setMenuOpen(false);
      setProfileOpen(false);
    });
  }, [pathname]);

  /* Desktop outside click for profile */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    dispatch(setUserData(null));
    setProfileOpen(false);
    setMenuOpen(false);
    router.push("/");
  };

  /* Desktop navigation items with 300% visual prominence */
  const renderNavItems = () => {
    if (currentUser?.role === "vendor" || isVendorRoute) {
      return (
        <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3" aria-label="Partner Navigation">
          <Link
            href="/partners/dashboard"
            className={`text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full transition active:scale-95 ${
              pathname === "/partners/dashboard"
                ? "bg-white text-black font-extrabold shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Dashboard
          </Link>

          <Link
            href="/partner/active-ride"
            className={`relative text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full transition active:scale-95 ${
              pathname === "/partner/active-ride"
                ? "bg-white text-black font-extrabold shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Active Ride
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-600 text-white text-[11px] rounded-full flex items-center justify-center font-black">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/partner/pending-requests"
            className={`relative text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full transition active:scale-95 ${
              pathname === "/partner/pending-requests"
                ? "bg-white text-black font-extrabold shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Requests
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-600 text-white text-[11px] rounded-full flex items-center justify-center font-black">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/partner/bookings"
            className={`relative text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full transition active:scale-95 ${
              pathname === "/partner/bookings"
                ? "bg-white text-black font-extrabold shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Bookings
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-2 w-5 h-5 bg-emerald-500 text-white text-[11px] rounded-full flex items-center justify-center font-black">
                {activeCount}
              </span>
            )}
          </Link>

          <Link
            href="/partner/wallet"
            className={`text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full transition active:scale-95 ${
              pathname === "/partner/wallet"
                ? "bg-white text-black font-extrabold shadow-sm"
                : "text-zinc-300 hover:text-white hover:bg-white/10"
            }`}
          >
            Wallet
          </Link>
        </nav>
      );
    }

    return (
      <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const href = NAV_ROUTES[item];
          const active = pathname === href;
          return (
            <Link
              key={item}
              href={href}
              className={`text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full transition active:scale-95 ${
                active
                  ? "bg-white text-black font-extrabold shadow-sm"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {t(NAV_KEYS[item] || item, item)}
            </Link>
          );
        })}

        {currentUser?.role === "admin" && (
          <Link
            href="/admin/dashboard"
            className="text-[16px] lg:text-[17px] font-bold px-4 py-2 rounded-full text-amber-400 hover:text-amber-300 hover:bg-white/10 transition active:scale-95"
          >
            Admin Panel
          </Link>
        )}
      </nav>
    );
  };

  return (
    <>
      {/* ================= UBER / RAPIDO FLUSH RECTANGULAR NAVBAR ================= */}
      <header
        className="fixed top-0 left-0 w-full z-50 rounded-none bg-black text-white border-b border-zinc-900 transition-colors shadow-lg"
        style={{ backgroundColor: "var(--theme-nav-bg, #000000)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          {/* LEFT: BRAND LOGO + DESKTOP LINKS */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link
              href={currentUser?.role === "vendor" || isVendorRoute ? "/partners/dashboard" : "/"}
              onClick={() => {
                if (typeof window !== "undefined") {
                  try {
                    sessionStorage.removeItem("ridenow_booking_draft");
                    localStorage.removeItem("ridenow_booking_draft");
                  } catch (_) {}
                }
              }}
              className="flex items-center flex-shrink-0 active:scale-98 transition"
              aria-label="RideNow Home"
            >
              <Image
                src="/logo.webp"
                alt="RideNow"
                width={150}
                height={46}
                className="h-9 sm:h-10 md:h-11 w-auto object-contain"
                priority
              />
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden md:flex items-center">{renderNavItems()}</div>
          </div>

          {/* RIGHT: ONGOING RIDE, TOOLS & PROFILE */}
          <div className="flex items-center gap-3 sm:gap-4 relative">
            {/* Passenger Ongoing Ride Indicator */}
            {passengerActiveRide && (
              <Link
                href={`/ride/${passengerActiveRide._id}`}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs sm:text-sm font-black animate-pulse transition hover:bg-emerald-500/30 active:scale-95"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Ongoing Ride</span>
              </Link>
            )}

            {/* Desktop Notification & Language controls */}
            <div className="hidden md:flex items-center gap-2">
              <NotificationToggle />
              <LanguageSelector variant="pill" />
            </div>

            {/* DESKTOP PROFILE BUTTON & DROPDOWN */}
            <div className="hidden md:block relative" ref={profileRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="w-11 h-11 rounded-full bg-white text-black font-black text-base flex items-center justify-center shadow-md active:scale-95 transition border border-white/20 hover:bg-zinc-100"
                    aria-label="Open User Profile Menu"
                  >
                    {currentUser.name?.charAt(0).toUpperCase() || "P"}
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ type: "spring", damping: 28, stiffness: 350 }}
                        className="absolute top-14 right-0 w-[340px] bg-white text-zinc-950 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-zinc-200 overflow-hidden z-50"
                      >
                        <UberProfileDropdown
                          userData={currentUser}
                          handleLogout={handleLogout}
                          router={router}
                          onClose={() => setProfileOpen(false)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : status === "loading" || isVendorRoute ? (
                <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse border border-white/10" />
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-extrabold text-[15px] sm:text-[16px] hover:bg-zinc-200 active:scale-95 transition shadow-sm"
                >
                  {t("nav.signIn", "Sign In")}
                </button>
              )}
            </div>

            {/* MOBILE QUICK SIGN IN / PROFILE BUTTON */}
            <div className="md:hidden flex items-center gap-2">
              {currentUser ? (
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-10 h-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm shadow-sm active:scale-95 transition"
                  aria-label="Open Profile Details"
                >
                  {currentUser.name?.charAt(0).toUpperCase() || "P"}
                </button>
              ) : status === "loading" || isVendorRoute ? (
                <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse border border-white/10" />
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-4 py-2 rounded-full bg-white text-black text-sm font-extrabold active:scale-95 transition"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              className="md:hidden text-white p-2 rounded-full hover:bg-white/10 active:scale-90 transition cursor-pointer"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* ================= UBER-STYLE FULLSCREEN MOBILE MENU DRAWER ================= */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-black text-white z-50 md:hidden flex flex-col justify-between overflow-y-auto px-6 py-6"
          >
            {/* TOP BAR INSIDE DRAWER */}
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-zinc-800">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center active:scale-95 transition"
                >
                  <Image
                    src="/logo.webp"
                    alt="RideNow"
                    width={140}
                    height={44}
                    className="h-10 w-auto object-contain"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="w-11 h-11 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center active:scale-90 transition"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Passenger Active Ride Banner in Mobile Drawer */}
              {passengerActiveRide && (
                <div className="mt-4">
                  <Link
                    href={`/ride/${passengerActiveRide._id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm transition active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>Active Ride in Progress</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {/* MASSIVE UBER-STYLE NAVIGATION LINKS (+300% SIZING) */}
              <div className="flex flex-col gap-2 pt-6">
                {currentUser?.role === "vendor" || isVendorRoute ? (
                  <>
                    <Link
                      href="/partners/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 hover:text-zinc-300 transition active:scale-98 ${
                        pathname === "/partners/dashboard" ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      Dashboard
                    </Link>

                    <Link
                      href="/partner/active-ride"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 hover:text-zinc-300 transition active:scale-98 flex items-center justify-between ${
                        pathname === "/partner/active-ride" ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <span>Active Ride</span>
                      {pendingCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white text-base font-extrabold">
                          {pendingCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/partner/pending-requests"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 hover:text-zinc-300 transition active:scale-98 flex items-center justify-between ${
                        pathname === "/partner/pending-requests" ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <span>Requests</span>
                      {pendingCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white text-base font-extrabold">
                          {pendingCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/partner/bookings"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 hover:text-zinc-300 transition active:scale-98 flex items-center justify-between ${
                        pathname === "/partner/bookings" ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <span>My Bookings</span>
                      {activeCount > 0 && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-base font-extrabold">
                          {activeCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      href="/partner/wallet"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 hover:text-zinc-300 transition active:scale-98 ${
                        pathname === "/partner/wallet" ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      Wallet & Earnings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/book"
                      onClick={() => setMenuOpen(false)}
                      className="text-3xl sm:text-4xl font-black tracking-tight py-3 text-white hover:text-zinc-300 transition active:scale-98"
                    >
                      Ride
                    </Link>

                    <Link
                      href="/bookings"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 transition active:scale-98 ${
                        pathname === "/bookings" ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      My Bookings
                    </Link>

                    <Link
                      href="/partner/onboard/vehicle"
                      onClick={() => setMenuOpen(false)}
                      className="text-3xl sm:text-4xl font-black tracking-tight py-3 text-zinc-400 hover:text-white transition active:scale-98"
                    >
                      Drive
                    </Link>

                    <Link
                      href="/fleet"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 transition active:scale-98 ${
                        pathname === "/fleet" ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Fleet
                    </Link>

                    <Link
                      href="/faq"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 transition active:scale-98 ${
                        pathname === "/faq" ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Help
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => setMenuOpen(false)}
                      className={`text-3xl sm:text-4xl font-black tracking-tight py-3 transition active:scale-98 ${
                        pathname === "/contact" ? "text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Contact
                    </Link>

                    {currentUser?.role === "admin" && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="text-3xl sm:text-4xl font-black tracking-tight py-3 text-amber-400 hover:text-amber-300 transition active:scale-98"
                      >
                        Admin Panel
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* BOTTOM SECTION OF MOBILE DRAWER */}
            <div className="pt-6 border-t border-zinc-800 space-y-4">
              {currentUser ? (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white text-black font-black text-lg flex items-center justify-center">
                      {currentUser.name?.charAt(0).toUpperCase() || "P"}
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-base truncate">{currentUser.name || "User"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs uppercase font-black px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {currentUser.role || "user"}
                        </span>
                        {currentUser.role !== "vendor" && (
                          <span className="text-xs font-bold text-zinc-400">
                            ₹{currentUser.walletBalance || 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition"
                    aria-label="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg flex items-center justify-center gap-2 active:scale-98 transition shadow-lg"
                >
                  <span>{t("nav.signIn", "Login or Sign Up")}</span>
                  <ArrowRight size={20} />
                </button>
              )}

              {/* Language and notifications in mobile drawer */}
              <div className="flex items-center justify-between pt-2">
                <LanguageSelector variant="pill" />
                <NotificationToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MOBILE PROFILE BOTTOM SHEET ================= */}
      <AnimatePresence>
        {profileOpen && currentUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed inset-x-0 bottom-0 bg-white text-zinc-950 rounded-t-3xl shadow-2xl z-50 md:hidden overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mt-3 mb-1" />
              <UberProfileDropdown
                userData={currentUser}
                handleLogout={handleLogout}
                router={router}
                onClose={() => setProfileOpen(false)}
                mobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

/* ================= UBER-STYLE PROFILE DROPDOWN COMPONENT ================= */
function UberProfileDropdown({
  userData,
  handleLogout,
  router,
  onClose,
  mobile,
}: {
  userData: any;
  handleLogout: () => void;
  router: any;
  onClose: () => void;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "p-6 pb-10" : "p-5"}>
      {/* 1. USER HEADER WITH STAR RATING & AVATAR */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div className="min-w-0 pr-3">
          <p className="font-extrabold text-xl text-zinc-900 truncate">
            {userData?.name || "RideNow Member"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-xs font-bold">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{userData?.rating ? Number(userData.rating).toFixed(1) : "5.0"}</span>
            </div>
            <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
              {userData?.role === "vendor" ? "Partner" : "Rider"}
            </span>
          </div>
        </div>

        <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center font-black text-lg flex-shrink-0 shadow-sm">
          {userData?.name?.charAt(0).toUpperCase() || "R"}
        </div>
      </div>

      {/* 2. THREE QUICK-ACTION TILES (HELP, WALLET, ACTIVITY) */}
      <div className="grid grid-cols-3 gap-2 py-3.5 border-b border-zinc-100">
        <button
          onClick={() => {
            onClose();
            router.push("/faq");
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 transition active:scale-95 text-zinc-800"
        >
          <HelpCircle size={22} className="text-zinc-700 mb-1" />
          <span className="text-xs font-bold">Help</span>
        </button>

        <button
          onClick={() => {
            onClose();
            router.push(userData?.role === "vendor" ? "/partner/wallet" : "/wallet");
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 transition active:scale-95 text-zinc-800"
        >
          <Wallet size={22} className="text-zinc-700 mb-1" />
          <span className="text-xs font-bold">Wallet</span>
        </button>

        <button
          onClick={() => {
            onClose();
            router.push(userData?.role === "vendor" ? "/partner/bookings" : "/bookings");
          }}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 transition active:scale-95 text-zinc-800"
        >
          <FileText size={22} className="text-zinc-700 mb-1" />
          <span className="text-xs font-bold">Activity</span>
        </button>
      </div>

      {/* 3. UBER CASH / RIDENOW WALLET BANNER */}
      <div
        onClick={() => {
          onClose();
          router.push(userData?.role === "vendor" ? "/partner/wallet" : "/wallet");
        }}
        className="mt-3.5 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between cursor-pointer hover:bg-zinc-100 transition active:scale-98"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">RideNow Wallet</p>
          <p className="text-sm font-semibold text-zinc-700 mt-0.5">Available Balance</p>
        </div>
        <p className="text-2xl font-black text-zinc-950">₹{userData?.walletBalance || 0}</p>
      </div>

      {/* 4. STRUCTURED ACTION LINKS */}
      <div className="py-2 divide-y divide-zinc-100 text-sm font-semibold text-zinc-800">
        <button
          onClick={() => {
            onClose();
            router.push("/profile");
          }}
          className="w-full flex items-center gap-3 py-3 px-2 hover:bg-zinc-100 rounded-xl transition text-left"
        >
          <UserIcon size={18} className="text-zinc-600" />
          <span>Manage account</span>
          <ChevronRight size={16} className="ml-auto text-zinc-400" />
        </button>

        {userData?.role !== "vendor" ? (
          <button
            onClick={() => {
              onClose();
              router.push("/partner/onboard/vehicle");
            }}
            className="w-full flex items-center gap-3 py-3 px-2 hover:bg-zinc-100 rounded-xl transition text-left"
          >
            <Car size={18} className="text-zinc-600" />
            <span>Drive with RideNow</span>
            <ChevronRight size={16} className="ml-auto text-zinc-400" />
          </button>
        ) : (
          <button
            onClick={() => {
              onClose();
              router.push("/partners/dashboard");
            }}
            className="w-full flex items-center gap-3 py-3 px-2 hover:bg-zinc-100 rounded-xl transition text-left"
          >
            <ShieldCheck size={18} className="text-zinc-600" />
            <span>Partner Dashboard</span>
            <ChevronRight size={16} className="ml-auto text-zinc-400" />
          </button>
        )}

        {userData?.role === "admin" && (
          <button
            onClick={() => {
              onClose();
              router.push("/admin/dashboard");
            }}
            className="w-full flex items-center gap-3 py-3 px-2 hover:bg-zinc-100 rounded-xl transition text-left text-amber-600"
          >
            <ShieldCheck size={18} />
            <span>Admin Control Panel</span>
            <ChevronRight size={16} className="ml-auto text-amber-500" />
          </button>
        )}
      </div>

      {/* 5. RED SIGN OUT BUTTON */}
      <button
        onClick={handleLogout}
        className="w-full mt-2 py-3 rounded-2xl text-red-600 font-bold hover:bg-red-50 transition active:scale-98 text-center text-base"
      >
        Sign out
      </button>
    </div>
  );
}