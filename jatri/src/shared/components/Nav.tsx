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
  Bike,
  Car,
  Truck,
  ChevronRight,
  ShieldCheck,
  Wallet,
  ArrowRight,
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

const NAV_ITEMS = ["Home", "Book Ride", "Bookings", "Fleet", "FAQ", "Contact"];
const NAV_ROUTES: Record<string, string> = {
  Home: "/",
  "Book Ride": "/book",
  Bookings: "/bookings",
  Fleet: "/fleet",
  FAQ: "/faq",
  Contact: "/contact",
};
const NAV_KEYS: Record<string, string> = {
  Home: "nav.home",
  "Book Ride": "nav.bookRide",
  Bookings: "nav.bookings",
  Fleet: "nav.fleet",
  FAQ: "nav.faq",
  Contact: "nav.contact",
};

export default function Nav({ user: propUser }: { user?: any } = {}) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
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

  /* Scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Fetch vendor counts */
  useEffect(() => {
    if (currentUser?.role !== "vendor" && !isVendorRoute) return;

    const fetchCounts = async () => {
      try {
        const res = await axios.get("/api/partner/bookings/counts");
        setPendingCount(res.data.pending || 0);
        setActiveCount(res.data.active || 0);
      } catch {}
    };

    fetchCounts();
 
  }, [currentUser?.role, isVendorRoute]);

  /* Fetch passenger active ride */
  useEffect(() => {
    if (!currentUser || currentUser?.role === "vendor" || isVendorRoute) {
      setPassengerActiveRide(null);
      return;
    }

    const checkActive = async () => {
      try {
        const res = await axios.get("/api/booking/my-active");
        if (res.data?.booking) {
          setPassengerActiveRide(res.data.booking);
        } else {
          setPassengerActiveRide(null);
        }
      } catch {
        setPassengerActiveRide(null);
      }
    };

    checkActive();
    const interval = setInterval(checkActive, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.role, isVendorRoute]);

  /* Close on route change */
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  /* Desktop outside click */
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
    router.push("/");
  };

  const renderNavItems = () => {
    if (currentUser?.role === "vendor" || isVendorRoute) {
      return (
        <>
         <Link
            href="/partners/dashboard"
            className={`text-sm font-medium transition ${
              pathname === "/partners/dashboard"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Dashboard
          </Link>

          <Link
            href="/partner/active-ride"
            className="relative text-sm font-medium text-zinc-400 hover:text-white transition"
          >
            Active Ride
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-5 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/partner/pending-requests"
            className="relative text-sm font-medium text-gray-300 hover:text-white transition"
          >
            Pending Requests
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-5 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            href="/partner/bookings"
            className="relative text-sm font-medium text-gray-300 hover:text-white transition"
          >
            My Bookings
            {activeCount > 0 && (
              <span className="absolute -top-2 -right-5 w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </Link>

          <Link
            href="/partner/wallet"
            className={`text-sm font-medium transition ${
              pathname === "/partner/wallet"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Wallet
          </Link>
        </>
      );
    }

    return (
      <>
        {NAV_ITEMS.map((item) => {
          const href = NAV_ROUTES[item];
          const active = pathname === href;
          return (
            <Link
              key={item}
              href={href}
              className={`text-xs font-bold transition px-3.5 py-1.5 rounded-full ${
                active
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {t(NAV_KEYS[item] || item, item)}
            </Link>
          );
        })}

        {currentUser?.role === "admin" && (
          <Link
            href="/admin/dashboard"
            className="text-xs font-bold transition text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/10"
          >
            Admin Panel
          </Link>
        )}
      </>
    );
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-3 left-1/2 -translate-x-1/2
        w-[94%] md:w-[86%]
        z-50 rounded-full bg-[#0B0B0B] text-white
        shadow-[0_15px_50px_rgba(0,0,0,0.7)]
        ${scrolled ? "py-2" : "py-3"}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">

          {/* LOGO */}
          <Link href={currentUser?.role === "vendor" || isVendorRoute ? "/partners/dashboard" : "/"} className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="RideNow"
              width={140}
              height={44}
              className="h-9 md:h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-10">
            {renderNavItems()}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3 relative">
            {/* Desktop Ongoing Ride Indicator */}
            {passengerActiveRide && (
              <Link
                href={`/ride/${passengerActiveRide._id}`}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black animate-pulse transition hover:bg-emerald-500/30"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Ongoing Ride</span>
              </Link>
            )}

            {/* Desktop Notification & Language controls */}
            <div className="hidden md:flex items-center gap-2">
              <NotificationToggle />
              <LanguageSelector variant="pill" />
            </div>

            {/* DESKTOP PROFILE */}
            <div className="hidden md:block relative" ref={profileRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="w-11 h-11 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-md active:scale-95 transition"
                  >
                    {currentUser.name?.charAt(0).toUpperCase() || "P"}
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-14 right-0 w-[300px] bg-white text-black rounded-2xl shadow-xl border"
                      >
                        <ProfileContent userData={currentUser} handleLogout={handleLogout} router={router} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : status === "loading" || isVendorRoute ? (
                <div className="w-11 h-11 rounded-full bg-white/10 animate-pulse border border-white/10" />
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-6 py-2.5 rounded-full border border-white/20 text-sm font-semibold hover:bg-white hover:text-black transition"
                >
                  {t("nav.signIn", "Login")}
                </button>
              )}
            </div>

            {/* MOBILE PROFILE BUTTON */}
            <div className="md:hidden">
              {currentUser ? (
                <button
                  onClick={() => setProfileOpen(true)}
                  className="w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shadow-sm"
                >
                  {currentUser.name?.charAt(0).toUpperCase() || "P"}
                </button>
              ) : status === "loading" || isVendorRoute ? (
                <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse border border-white/10" />
              ) : (
                <button onClick={() => setAuthOpen(true)} className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold">
                  Login
                </button>
              )}
            </div>

            {/* BURGER */}
            <button
              onClick={() => setMenuOpen((p) => !p)}
              className="md:hidden text-white"
            >
              {menuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE MENU */}
      {/* MOBILE MENU */}
<AnimatePresence>
  {menuOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={() => setMenuOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
      />

      {/* Menu Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="
          fixed top-[74px] left-1/2 -translate-x-1/2
          w-[92%] max-h-[82vh]
          bg-[#0B0B0B] border border-white/15
          rounded-3xl
          shadow-[0_20px_60px_rgba(0,0,0,0.85)]
          z-50
          md:hidden
          overflow-y-auto
        "
      >
        {/* User Card if logged in */}
        {currentUser ? (
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-black font-black flex items-center justify-center text-sm shadow-sm">
                {currentUser.name?.charAt(0).toUpperCase() || "P"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{currentUser.name || "Partner"}</p>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {currentUser.role || "vendor"}
                </span>
              </div>
            </div>
            {currentUser.role !== "vendor" && (
              <Link
                href="/wallet"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20 transition"
              >
                <Wallet size={13} />
                <span>₹{currentUser.walletBalance || 0}</span>
              </Link>
            )}
          </div>
        ) : status === "loading" || isVendorRoute ? (
          <div className="p-4 border-b border-white/10 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="h-4 bg-white/10 rounded w-28" />
          </div>
        ) : (
          <div className="p-4 border-b border-white/10">
            <button
              onClick={() => {
                setMenuOpen(false);
                setAuthOpen(true);
              }}
              className="w-full py-3 rounded-2xl bg-white text-black font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition"
            >
              <span>{t("nav.signIn", "Login or Sign Up")}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Passenger Active Ride Banner in Mobile Drawer */}
        {passengerActiveRide && (
          <div className="p-3 border-b border-white/10">
            <Link
              href={`/ride/${passengerActiveRide._id}`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition hover:bg-emerald-500/25"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Active Ride in Progress</span>
              </div>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Quick Language & Push Notification bar */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <LanguageSelector variant="pill" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationToggle />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-white/5 py-1">

          {currentUser?.role === "vendor" || isVendorRoute ? (
            <>
              <Link
                href="/partners/dashboard"
                className={`flex justify-between items-center px-5 py-3.5 hover:bg-white/5 transition ${
                  pathname === "/partners/dashboard" ? "text-white font-bold bg-white/10" : "text-zinc-300"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-sm">{t("nav.partnerDashboard", "Partner Dashboard")}</span>
                <ChevronRight size={16} className="text-zinc-500" />
              </Link>

              <Link
                href="/partner/active-ride"
                className={`flex justify-between items-center px-5 py-3.5 hover:bg-white/5 transition ${
                  pathname === "/partner/active-ride" ? "text-white font-bold bg-white/10" : "text-zinc-300"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-sm">Active Ride</span>
                <ChevronRight size={16} className="text-zinc-500" />
              </Link>

              <Link
                href="/partner/pending-requests"
                className={`flex justify-between items-center px-5 py-3.5 hover:bg-white/5 transition ${
                  pathname === "/partner/pending-requests" ? "text-white font-bold bg-white/10" : "text-zinc-300"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-sm">Pending Requests</span>
                {pendingCount > 0 ? (
                  <span className="w-5 h-5 bg-red-500 text-[11px] rounded-full flex items-center justify-center font-bold text-white">
                    {pendingCount}
                  </span>
                ) : (
                  <ChevronRight size={16} className="text-zinc-500" />
                )}
              </Link>

              <Link
                href="/partner/bookings"
                className={`flex justify-between items-center px-5 py-3.5 hover:bg-white/5 transition ${
                  pathname === "/partner/bookings" ? "text-white font-bold bg-white/10" : "text-zinc-300"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-sm">My Bookings</span>
                {activeCount > 0 ? (
                  <span className="w-5 h-5 bg-emerald-500 text-[11px] rounded-full flex items-center justify-center font-bold text-white">
                    {activeCount}
                  </span>
                ) : (
                  <ChevronRight size={16} className="text-zinc-500" />
                )}
              </Link>

              <Link
                href="/partner/wallet"
                className={`flex justify-between items-center px-5 py-3.5 hover:bg-white/5 transition ${
                  pathname === "/partner/wallet" ? "text-white font-bold bg-white/10" : "text-zinc-300"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-sm">Wallet & Earnings</span>
                <ChevronRight size={16} className="text-zinc-500" />
              </Link>
            </>
          ) : (
            <>
              {/* Quick Book CTA if not on book page */}
              {pathname !== "/book" && (
                <div className="p-3">
                  <Link
                    href="/book"
                    onClick={() => setMenuOpen(false)}
                    className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 font-black text-sm flex items-center justify-between shadow-sm active:scale-98 transition"
                  >
                    <span>⚡ {t("booking.confirmRide", "Book a Ride Now")}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {NAV_ITEMS.map((item) => {
                const href = NAV_ROUTES[item];
                const active = pathname === href;
                return (
                  <Link
                    key={item}
                    href={href}
                    className={`flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition text-sm ${
                      active ? "text-white font-bold bg-white/10" : "text-zinc-300"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{t(NAV_KEYS[item] || item, item)}</span>
                    <ChevronRight size={16} className={active ? "text-white" : "text-zinc-600"} />
                  </Link>
                );
              })}

              {currentUser?.role === "user" && (
                <Link
                  href="/partner/onboard/vehicle"
                  className="flex items-center justify-between px-5 py-3.5 text-emerald-400 hover:bg-white/5 transition text-sm font-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>🚗 Drive with RideNow</span>
                  <ChevronRight size={16} className="text-emerald-500" />
                </Link>
              )}

              {currentUser?.role === "admin" && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center justify-between px-5 py-3.5 text-zinc-300 hover:bg-white/5 transition text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <span>Admin Panel</span>
                  <ChevronRight size={16} className="text-zinc-600" />
                </Link>
              )}
            </>
          )}

          {currentUser && (
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center justify-between px-5 py-3.5 text-red-400 hover:bg-red-500/10 transition text-sm font-semibold w-full text-left"
            >
              <span>Logout</span>
              <LogOut size={15} />
            </button>
          )}

        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

      {/* MOBILE PROFILE SHEET */}
      <AnimatePresence>
        {profileOpen && currentUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden"
            >
              <ProfileContent userData={currentUser} handleLogout={handleLogout} router={router} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

function ProfileContent({ userData, handleLogout, router, mobile }: any) {
  return (
    <div className={`${mobile ? "p-6 pb-10" : "p-5"}`}>
      <p className="font-semibold text-lg">{userData?.name || "User"}</p>
      <p className="text-xs uppercase text-gray-500 mb-4">{userData?.role || "partner"}</p>

      {userData?.role === "admin" ? (
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl"
        >
          <ShieldCheck size={16} />
          Admin Dashboard
          <ChevronRight size={16} className="ml-auto" />
        </button>
      ) : userData.role === "vendor" ? (
        <button
          onClick={() => router.push("/partners/dashboard")}
          className="w-full flex items-center gap-3 py-3 px-3 hover:bg-gray-100 rounded-xl text-left text-sm font-semibold"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
          </svg>
          Partner Dashboard
          <ChevronRight size={16} className="ml-auto text-gray-400" />
        </button>
      ) : (
        <button
          onClick={() => router.push("/partner/onboard/vehicle")}
          className="w-full flex items-center gap-3 py-3 hover:bg-gray-100 rounded-xl"
        >
          <VehicleStack />
          Become a Partner
          <ChevronRight size={16} className="ml-auto" />
        </button>
      )}

      <button
        onClick={() => router.push("/wallet")}
        className="w-full flex items-center gap-3 py-3 px-3 hover:bg-gray-100 rounded-xl text-left text-sm font-semibold mt-2"
      >
        <Wallet size={16} className="text-zinc-600" />
        RideNow Wallet
        {userData.walletBalance !== undefined && (
          <span className="ml-auto text-[11px] font-black px-2 py-0.5 rounded-full bg-zinc-900 text-white">
            ₹{userData.walletBalance}
          </span>
        )}
        <ChevronRight size={16} className="ml-1 text-gray-400" />
      </button>

      <button
        onClick={() => router.push("/profile")}
        className="w-full flex items-center gap-3 py-3 px-3 hover:bg-gray-100 rounded-xl text-left text-sm font-semibold mt-1"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-500"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Edit Profile
        <ChevronRight size={16} className="ml-auto text-gray-400" />
      </button>

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 py-3 px-3 hover:bg-gray-100 rounded-xl mt-2 text-left text-sm font-semibold"
      >
        <LogOut size={16} className="text-gray-500" />
        Logout
      </button>
    </div>
  );
}

function VehicleStack() {
  return (
    <div className="flex -space-x-2">
      <Icon><Bike size={14} /></Icon>
      <Icon><Car size={14} /></Icon>
      <Icon><Truck size={14} /></Icon>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
      {children}
    </div>
  );
}