"use client";



import nextDynamic from "next/dynamic";
import {
  Phone, User2, Car, IndianRupee,
  ChevronUp, Clock, Zap,
  CheckCircle2, KeyRound, ArrowRight,
  MapPin, Navigation, MessageCircle,
  AlertCircle, XCircle, AlertTriangle,
  Mic, MicOff, Volume2, PhoneOff, PhoneCall, Siren, ShieldAlert,
  ExternalLink
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IUser } from "@/models/user.model";
import { IVehicle } from "@/models/vehicle.model";
import RideChat from "@/features/rides/components/RideChat";
import { haversineKm } from "@/lib/routeUtils";

const LiveRideMap = nextDynamic(() => import("@/features/maps/components/LiveTrackingMap"), { ssr: false });

export const DRIVER_CANCELLATION_REASONS = [
  "Vehicle breakdown / Mechanical issue",
  "Heavy traffic / Impassable route",
  "Rider requested cancellation",
  "Rider did not answer phone / Unavailable",
  "Personal or medical emergency",
  "Other operational reason",
];

/* ─── TYPES ──────────────────────────────────────────────────────────── */
export type BookingStatus =
  | "requested" | "awaiting_payment" | "confirmed"
  | "started"   | "completed"        | "cancelled"
  | "rejected"  | "expired";

export type PaymentStatus = "pending" | "paid" | "cash" | "failed";

export interface IBooking {
  _id: string;
  user: IUser;
  driver: IUser;
  vehicle: IVehicle;
  pickupAddress: string;
  dropAddress: string;
  pickupLocation?: { type: "Point"; coordinates: [number, number] };
  dropLocation?:   { type: "Point"; coordinates: [number, number] };
  fare: number;
  adminCommission?: number;
  partnerAmount?: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentDeadline?: Date;
  userMobileNumber: string;
  driverMobileNumber: string;
  isPanicActive?: boolean;
  panicActivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── CONFIG ──────────────────────────────────────────────────────────── */
const MAP_STATUS: Record<BookingStatus, "arriving" | "ongoing" | "completed"> = {
  requested:        "arriving",
  awaiting_payment: "arriving",
  confirmed:        "arriving",
  started:          "ongoing",
  completed:        "completed",
  cancelled:        "completed",
  rejected:         "completed",
  expired:          "completed",
};

const STATUS_LABEL: Record<BookingStatus, { label: string; sublabel: string; dot: string }> = {
  requested:        { label: "Awaiting Confirmation", sublabel: "Booking is being processed",    dot: "bg-amber-400"   },
  awaiting_payment: { label: "Payment Pending",        sublabel: "Customer payment is pending",   dot: "bg-purple-400"  },
  confirmed:        { label: "Heading to Pickup",      sublabel: "Drive to the pickup location",  dot: "bg-amber-400"   },
  started:          { label: "Ride in Progress",       sublabel: "Heading to drop location",      dot: "bg-emerald-400" },
  completed:        { label: "Ride Completed",         sublabel: "Trip has ended successfully",   dot: "bg-zinc-400"    },
  cancelled:        { label: "Ride Cancelled",         sublabel: "This ride was cancelled",       dot: "bg-red-400"     },
  rejected:         { label: "Ride Rejected",          sublabel: "Ride was rejected",             dot: "bg-red-400"     },
  expired:          { label: "Request Expired",        sublabel: "Booking timed out",             dot: "bg-orange-400"  },
};

const PAYMENT_BADGE: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700"    },
  paid:    { label: "Paid",    cls: "bg-emerald-100 text-emerald-700" },
  cash:    { label: "Cash",    cls: "bg-zinc-100 text-zinc-700"       },
  failed:  { label: "Failed",  cls: "bg-red-100 text-red-700"         },
};

const TERMINAL = ["completed", "cancelled", "rejected", "expired"];
const PEEK_H   = 148;

function extractCoords(val: any): [number, number] | null {
  if (!val) return null;
  if (Array.isArray(val) && val.length >= 2) {
    const [a, b] = val.map(Number);
    if (isNaN(a) || isNaN(b)) return null;
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
    if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return [b, a];
    return [a, b];
  }
  if (val.coordinates && Array.isArray(val.coordinates) && val.coordinates.length >= 2) {
    const [lng, lat] = val.coordinates.map(Number);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  if (typeof val.lat === "number" && typeof val.lng === "number") {
    return [val.lat, val.lng];
  }
  if (typeof val.latitude === "number" && typeof val.longitude === "number") {
    return [val.latitude, val.longitude];
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════ */
export default function DriverRidePage() {

  const [booking,       setBooking]       = useState<IBooking | null>(null);
  const [fetchDone,     setFetchDone]     = useState(false);
  const [driverPos,     setDriverPos]     = useState<[number, number] | null>(null);
  const [pickupPos,     setPickupPos]     = useState<[number, number] | null>(null);
  const [dropPos,       setDropPos]       = useState<[number, number] | null>(null);
  const [etaToPickup,   setEtaToPickup]   = useState(0);
  const [etaToDrop,     setEtaToDrop]     = useState(0);
  const [distanceToPickup, setDistanceToPickup] = useState(0);
  const [distanceToDrop,   setDistanceToDrop]   = useState(0);

  /* Pickup OTP */
  const [otpMode,     setOtpMode]     = useState(false);
  const [otp,         setOtp]         = useState("");
  const [loadingOtp,  setLoadingOtp]  = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError,    setOtpError]    = useState("");

  /* Drop OTP */
  const [dropOtpMode,    setDropOtpMode]    = useState(false);
  const [dropOtp,        setDropOtp]        = useState("");
  const [loadingDropOtp, setLoadingDropOtp] = useState(false);
  const [dropOtpError,   setDropOtpError]   = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelError, setShowCancelError] = useState<string | null>(null);
  const [selectedDriverReason, setSelectedDriverReason] = useState<string>("");
  const [customDriverNote, setCustomDriverNote] = useState<string>("");
  const [cancellingRide, setCancellingRide] = useState<boolean>(false);

  /* Chat & Sheet */
  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  /* Secure VoIP Call State */
  const [activeCall, setActiveCall] = useState<{ isOpen: boolean } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    isOpen: boolean;
    callerName: string;
    callerRole: "user" | "driver";
  } | null>(null);
  const [zegoContainer, setZegoContainer] = useState<HTMLDivElement | null>(null);
  const zegoCallJoined = useRef(false);
  const zpRef = useRef<any>(null);
  const lastGpsEmitRef = useRef<{ time: number; lat: number; lng: number }>({ time: 0, lat: 0, lng: 0 });

  const playRingTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  const startVoipCall = () => {
    setActiveCall({ isOpen: true });
    const socket = getSocket();
    if (booking?._id) {
      socket.emit("call-user", {
        bookingId: booking._id,
        callerName: (booking?.driver as any)?.name || "Driver",
        callerRole: "driver",
      });
    }
  };

  useEffect(() => {
    if (!activeCall?.isOpen || !zegoContainer || zegoCallJoined.current) return;
    
    let active = true;
    zegoCallJoined.current = true;
    
    const initZego = async () => {
      try {
        const res = await fetch("/api/zego/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ roomId: `call-${booking?._id}` }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch Zego token");
        }
        
        const data = await res.json();
        if (!active) return;
        
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
          data.appID,
          data.token,
          `call-${booking?._id}`,
          data.userID,
          data.userName
        );
        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;
        
        zp.joinRoom({
          container: zegoContainer,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showPreJoinView: false,
          turnOnCameraWhenJoining: false,
          showMyCameraToggleButton: false,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showUserList: false,
          onLeaveRoom: () => {
            if (active) {
              setActiveCall(null);
              zegoCallJoined.current = false;
            }
          },
        });
      } catch (err) {
        console.error("Zego connection failed:", err);
        if (active) {
          zegoCallJoined.current = false;
        }
      }
    };
    
    initZego();
    
    return () => {
      active = false;
    };
  }, [activeCall?.isOpen, booking?._id, zegoContainer]);

  /* Keep latest booking in a ref so GPS callback never has stale closure */
  const bookingRef = useRef<IBooking | null>(null);
  bookingRef.current = booking;

  /* ── FETCH ── */
  const fetchBookingDetails = () => {
    const bookingId = bookingRef.current?._id;
    const url = bookingId ? `/api/booking/${bookingId}` : "/api/partner/bookings/active";
    fetch(url, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data._id) {
          setBooking(data);
          const p = extractCoords(data.pickupLocation);
          if (p) setPickupPos(p);
          const d = extractCoords(data.dropLocation);
          if (d) setDropPos(d);
          const drv = extractCoords(data.driver?.location);
          if (drv) setDriverPos(prev => prev || drv);

          if (data.status === "started")   { setOtpVerified(true); setOtpMode(false); }
          if (data.status === "completed") { setOtpVerified(true); }
        } else {
          // Safeguard: Never mark booking as cancelled just because an API roundtrip returned null
          // or was interrupted by a page refresh/network lag. Only clear if no booking was ever loaded.
          if (!bookingId) {
            setBooking(null);
          }
        }
      })
      .catch(err => console.error("Fetch error:", err))
      .finally(() => setFetchDone(true));
  };

  useEffect(() => {
    fetchBookingDetails();

    // Fast initial GPS fix for driver map
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setDriverPos([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // Poll active ride details every 8 seconds as safety net
    const interval = setInterval(fetchBookingDetails, 8000);
    return () => clearInterval(interval);
  }, []);

  /* ── GPS — only for active rides, uses ref to avoid stale closure ── */
  useEffect(() => {
    if (!booking?._id) return;
    if (TERMINAL.includes(booking.status)) return;
    if (!navigator.geolocation) return;

    const socket = getSocket();
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const b = bookingRef.current;
        if (!b?._id || TERMINAL.includes(b.status)) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const now = Date.now();
        const last = lastGpsEmitRef.current;
        const dLat = Math.abs(lat - last.lat);
        const dLng = Math.abs(lng - last.lng);
        const timeElapsed = now - last.time;
        const movedSignificantly = dLat > 0.00004 || dLng > 0.00004;

        // Smooth GPS throttling: minimum 2 seconds between updates when moving, or 8s heartbeat
        if ((timeElapsed >= 2000 && movedSignificantly) || timeElapsed >= 8000) {
          lastGpsEmitRef.current = { time: now, lat, lng };
          setDriverPos([lat, lng]);
          socket.emit("driver-location-update", {
            bookingId: b._id, latitude: lat, longitude: lng, status: b.status,
          });
        }
      },
      err => console.error("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [booking?._id, booking?.status]);

  /* ── SOCKET ── */
  useEffect(() => {
    if (!booking?._id) return;
    if (TERMINAL.includes(booking.status)) return;
    const socket = getSocket();
    socket.emit("join-booking", booking._id);
    socket.on("driver-location", (d: any) => setDriverPos([d.latitude, d.longitude]));
    socket.on("booking-updated", (data: any) => {
      setBooking(prev => prev ? { ...prev, ...data } : null);
    });

    const handleIncomingCall = (data: any) => {
      if (data && data.callerRole === "user") {
        setIncomingCall({
          isOpen: true,
          callerName: data.callerName || (booking?.user as any)?.name || "Passenger",
          callerRole: "user",
        });
        playRingTone();
      }
    };

    const handleCallRejected = () => {
      alert("Call was declined.");
      setActiveCall(null);
      setIncomingCall(null);
    };

    const handleCallEnded = () => {
      setActiveCall(null);
      setIncomingCall(null);
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("driver-location");
      socket.off("booking-updated");
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
    };
  }, [booking?._id, booking?.status]);

  /* ── OTP HANDLERS ── */
  const sendPickupOtp = async () => {
    if (!booking?._id) return;
    await fetch("/api/partner/bookings/send-pickup-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking._id }),
    }).catch(console.error);
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return;
    setOtpError("");
    try {
      setLoadingOtp(true);
      const res  = await fetch("/api/partner/bookings/verify-pickup-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking?._id, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.message || "Invalid OTP"); return; }
      setOtpVerified(true);
      setOtpMode(false);
      setOtp("");
      setChatOpen(false);
      setBooking(prev => prev ? { ...prev, status: "started" } : prev);
    } catch { setOtpError("Verification failed"); }
    finally   { setLoadingOtp(false); }
  };

  const sendDropOtp = async () => {
    if (!booking?._id) return;
    await fetch("/api/partner/bookings/send-drop-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking._id }),
    }).catch(console.error);
  };

  const handleVerifyDropOtp = async () => {
    if (!dropOtp || dropOtp.length < 4) return;
    setDropOtpError("");
    try {
      setLoadingDropOtp(true);
      const res  = await fetch("/api/partner/bookings/verify-drop-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking?._id, otp: dropOtp }),
      });
      const data = await res.json();
      if (!res.ok) { setDropOtpError(data.message || "Invalid OTP"); return; }
      setDropOtp("");
      setDropOtpMode(false);
      setBooking(prev => prev ? { ...prev, status: "completed" } : prev);
    } catch { setDropOtpError("Verification failed"); }
    finally   { setLoadingDropOtp(false); }
  };

  const getElapsedAcceptanceSeconds = () => {
    const ref = (booking as any)?.acceptedAt || booking?.updatedAt || booking?.createdAt;
    if (!ref) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(ref).getTime()) / 1000));
  };

  const handleCancel = () => {
    setSelectedDriverReason("");
    setCustomDriverNote("");
    setShowCancelConfirm(true);
  };

  const confirmCancelRide = async () => {
    if (!booking?._id) return;
    const finalReason =
      selectedDriverReason === "Other operational reason" && customDriverNote.trim()
        ? `Other: ${customDriverNote.trim()}`
        : selectedDriverReason || "Driver cancelled ride";

    try {
      setCancellingRide(true);
      const res = await fetch(`/api/partner/bookings/${booking._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: finalReason, cancelledBy: "driver" }),
      });
      if (res.ok) {
        setShowCancelConfirm(false);
        setBooking(prev => (prev ? { ...prev, status: "cancelled", cancellationReason: finalReason } : null));
      } else {
        const data = await res.json().catch(() => ({}));
        setShowCancelError(data.message || "Failed to cancel booking. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setShowCancelError("Failed to cancel booking due to a network error.");
    } finally {
      setCancellingRide(false);
    }
  };

  const [actionPending, setActionPending] = useState(false);

  const handleAcceptRide = async () => {
    if (!booking?._id || actionPending) return;
    try {
      setActionPending(true);
      const res = await fetch(`/api/booking/${booking._id}/accept`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setBooking(data.booking);
        fetchBookingDetails();
      } else {
        alert(data.message || "Failed to accept ride");
      }
    } catch (err) {
      console.error("Accept ride error:", err);
      alert("Failed to accept ride");
    } finally {
      setActionPending(false);
    }
  };

  const handleDeclineRide = async () => {
    if (!booking?._id || actionPending) return;
    try {
      setActionPending(true);
      await fetch("/api/partner/bookings/dispatch-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id }),
      });
      setBooking(null);
      window.location.href = "/partners/dashboard";
    } catch (err) {
      console.error("Decline ride error:", err);
      window.location.href = "/partners/dashboard";
    } finally {
      setActionPending(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     RENDER LOGIC — all hooks above, early returns below
  ══════════════════════════════════════════════════════════════════ */

  /* Loading */
  if (!fetchDone) return (
    <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-white/40 text-sm tracking-widest uppercase font-medium">Loading ride…</p>
      </div>
    </div>
  );

  /* No active booking */
  if (!booking) return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className="w-28 h-28 rounded-full bg-zinc-800/60 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-zinc-700/60 flex items-center justify-center">
            <Car size={40} className="text-zinc-500" />
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-white text-2xl font-black mb-2">No Active Ride</h1>
        <p className="text-zinc-500 text-sm mb-8 max-w-xs">You don't have any active booking right now. Go online to start receiving ride requests.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => window.location.href = "/partners/dashboard"}
          className="bg-white text-zinc-900 px-8 py-4 rounded-2xl text-sm font-bold hover:bg-zinc-100 transition-colors"
        >
          Back to Dashboard
        </motion.button>
      </motion.div>
    </div>
  );

  const status    = (booking?.status ?? "confirmed") as BookingStatus;
  const cfg       = STATUS_LABEL[status];
  const mapStatus = MAP_STATUS[status];

  /* ── COMPLETED — full screen, no map ── */
  if (status === "completed" && booking) {
    return <CompletedScreen booking={booking} />;
  }

  /* ── FAILED (cancelled / rejected / expired) — full screen, no map ── */
  if (TERMINAL.includes(status) && status !== "completed" && booking) {
    return <FailedScreen booking={booking} status={status} cfg={cfg} />;
  }

  /* No booking found after fetch */
  if (!booking || !pickupPos || !dropPos) return (
    <div className="h-screen w-full bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-white/40 text-sm tracking-widest uppercase font-medium">Loading ride…</p>
      </div>
    </div>
  );

  const isActive        = ["confirmed", "started"].includes(status);
  const canChat         = status === "confirmed";

  const initialTripEta = (pickupPos && dropPos)
    ? Math.max(3, Math.round((haversineKm(pickupPos[0], pickupPos[1], dropPos[0], dropPos[1]) / 25) * 60))
    : 0;

  const initialDriverEta = (driverPos && pickupPos)
    ? Math.max(2, Math.round((haversineKm(driverPos[0], driverPos[1], pickupPos[0], pickupPos[1]) / 25) * 60))
    : 4;

  const effectiveEtaToPickup = etaToPickup > 0 ? etaToPickup : initialDriverEta;
  const effectiveEtaToDrop = etaToDrop > 0 ? etaToDrop : initialTripEta;
  const displayEta      = mapStatus === "arriving" ? effectiveEtaToPickup : effectiveEtaToDrop;
  const displayDistance = mapStatus === "arriving" ? distanceToPickup : distanceToDrop;

  const panelProps = {
    booking, status, cfg, isActive, canChat, displayEta, displayDistance,
    pickupPos, dropPos,
    otpMode, otp, loadingOtp, otpVerified, otpError,
    setOtpMode, setOtp, setOtpError, handleVerifyOtp, sendPickupOtp,
    dropOtpMode, dropOtp, loadingDropOtp, dropOtpError,
    setDropOtpMode, setDropOtp, setDropOtpError, handleVerifyDropOtp, sendDropOtp,
    chatOpen, onChatToggle: () => canChat && setChatOpen(v => !v),
    onCancel: handleCancel,
    onCallClick: startVoipCall,
    onAcceptRide: handleAcceptRide,
    onDeclineRide: handleDeclineRide,
    actionPending,
  };

  return (
    <div className="h-screen w-full bg-zinc-100 flex flex-col lg:flex-row overflow-hidden">

      {/* MAP */}
      <div className="relative flex-1 h-full z-0">
        <LiveRideMap
          driverLocation={driverPos}
          pickupLocation={pickupPos}
          dropLocation={dropPos}
          pickupAddress={booking?.pickupAddress}
          dropAddress={booking?.dropAddress}
          status={mapStatus}
          onStats={({ distanceToPickup, durationToPickup, distanceToDrop, durationToDrop }: any) => {
            setDistanceToPickup(distanceToPickup); setEtaToPickup(durationToPickup);
            setDistanceToDrop(distanceToDrop);     setEtaToDrop(durationToDrop);
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-none shadow-md border border-zinc-300">
            <span className={`w-2 h-2 rounded-none ${cfg.dot}`} />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900">{cfg.label}</span>
          </div>
        </motion.div>
      </div>

      {/* DESKTOP PANEL */}
      <motion.div
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex w-[420px] xl:w-[460px] bg-white border-l border-zinc-200 flex-col overflow-hidden"
      >
        <div className="bg-zinc-950 px-6 py-5 flex-shrink-0">
          <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">Driver Panel</p>
          <div className="flex items-center justify-between">
            <h1 className="text-white text-xl font-black uppercase tracking-tight">Active Ride</h1>
            {isActive && (
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-none">
                <Zap size={12} className="text-amber-400" />
                <span className="text-white text-xs font-mono font-bold">{Math.round(displayEta)} MIN</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <PanelContent {...panelProps} />
          </div>
          <ActionBar {...panelProps} />
        </div>
      </motion.div>

      {/* MOBILE BOTTOM SHEET */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
        <motion.div
          className="bg-white rounded-none shadow-2xl pointer-events-auto overflow-hidden border-t-2 border-zinc-950 flex flex-col"
          animate={{ height: expanded ? "82vh" : PEEK_H }}
          transition={{ type: "spring", stiffness: 340, damping: 34 }}
        >
          {/* Interactive Drag Handle Header */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.y < -35 || info.velocity.y < -250) setExpanded(true);
              else if (info.offset.y > 35 || info.velocity.y > 250) setExpanded(false);
            }}
            onClick={() => setExpanded(v => !v)}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing select-none bg-white border-b border-zinc-200"
          >
            <div className="pt-2 pb-1 flex flex-col items-center">
              <div className="w-12 h-1 bg-zinc-300 rounded-none mb-1 cursor-pointer hover:bg-zinc-500 transition-colors" />
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                {expanded ? "Swipe down for map" : "Swipe up for ride details"}
              </span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-none flex-shrink-0 ${cfg.dot}`} />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-950 leading-tight truncate">{cfg.label}</p>
                  <p className="text-[11px] text-zinc-500 font-medium leading-tight truncate">{cfg.sublabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                {isActive && (
                  <div className="text-right">
                    <p className="text-xl font-black text-zinc-950 leading-none">{Math.round(displayEta)}</p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">min</p>
                  </div>
                )}
                <motion.div
                  animate={{ rotate: expanded ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-7 h-7 rounded-none border border-zinc-300 bg-zinc-100 flex items-center justify-center text-zinc-700"
                >
                  <ChevronUp size={14} />
                </motion.div>
              </div>
            </div>
          </motion.div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <PanelContent {...panelProps} />
          </div>
          <ActionBar {...panelProps} />
        </motion.div>
      </div>

      {/* ── DRIVER CANCELLATION & PENALTY WARNING MODAL ── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[9999] px-4"
          >
            <motion.div
              initial={{ scale: 0.98, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 15 }}
              className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden border border-zinc-300 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950">Cancel Accepted Ride</h3>
                    <p className="text-[11px] text-zinc-500 font-medium">Review reasons and reliability impact</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-7 h-7 rounded-none border border-zinc-300 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-4 space-y-4 overflow-y-auto">
                {/* Time & Location Indicators */}
                {(() => {
                  const elapsedSec = getElapsedAcceptanceSeconds();
                  const isNearPickup = distanceToPickup > 0 && distanceToPickup <= 1.0;

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                        <div className="bg-zinc-100 border border-zinc-300 rounded-none p-2.5 flex items-center gap-2 text-zinc-700">
                          <Clock size={14} className="text-zinc-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Accepted</p>
                            <p className="truncate font-black text-zinc-900">{Math.floor(elapsedSec / 60)}m {elapsedSec % 60}s ago</p>
                          </div>
                        </div>
                        <div className="bg-zinc-100 border border-zinc-300 rounded-none p-2.5 flex items-center gap-2 text-zinc-700">
                          <Navigation size={14} className="text-zinc-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Pickup Distance</p>
                            <p className="truncate font-black text-zinc-900">
                              {distanceToPickup > 0 ? `${distanceToPickup.toFixed(1)} km (${etaToPickup}m)` : "Arrived"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Penalty Impact Warning */}
                      {isNearPickup || elapsedSec > 120 ? (
                        <div className="bg-red-50 border border-red-200 rounded-none p-3.5 text-left">
                          <div className="flex items-center gap-1.5 text-red-950 text-xs font-black mb-1">
                            <AlertTriangle size={15} className="text-red-600 flex-shrink-0" />
                            <span>Driver Penalty & Reliability Impact</span>
                          </div>
                          <p className="text-[11px] text-red-900 leading-relaxed font-medium">
                            You accepted this ride <strong>{Math.floor(elapsedSec / 60)}m {elapsedSec % 60}s ago</strong> and are <strong>{distanceToPickup > 0 ? `${distanceToPickup.toFixed(1)} km from pickup` : "at pickup"}</strong>. Cancelling after approaching the passenger lowers your Reliability Score and may temporarily pause new booking requests.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 border border-zinc-300 rounded-none p-3.5 text-left">
                          <div className="flex items-center gap-1.5 text-zinc-900 text-xs font-black mb-1">
                            <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
                            <span>Early Cancellation Notice</span>
                          </div>
                          <p className="text-[11px] text-zinc-600 leading-relaxed font-medium">
                            Please cancel only when unavoidable. Another nearby driver will be auto-dispatched to assist the passenger.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Driver Reasons */}
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-800 mb-2">Select cancellation reason:</p>
                  <div className="space-y-1.5">
                    {DRIVER_CANCELLATION_REASONS.map((r) => {
                      const isSelected = selectedDriverReason === r;
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setSelectedDriverReason(r)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-none text-xs transition-all flex items-center justify-between border cursor-pointer ${
                            isSelected
                              ? "bg-zinc-950 text-white border-zinc-950 font-bold"
                              : "bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-300"
                          }`}
                        >
                          <span>{r}</span>
                          <span
                            className={`w-3.5 h-3.5 rounded-none border flex items-center justify-center flex-shrink-0 ml-2 ${
                              isSelected ? "border-white bg-white" : "border-zinc-400 bg-white"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-none bg-zinc-950" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDriverReason === "Other operational reason" && (
                    <textarea
                      value={customDriverNote}
                      onChange={(e) => setCustomDriverNote(e.target.value)}
                      placeholder="Please specify operational reason..."
                      className="w-full text-xs p-3 border border-zinc-300 rounded-none outline-none focus:border-zinc-950 mt-2.5 resize-none text-zinc-900"
                      rows={2}
                    />
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancellingRide}
                  className="flex-1 py-3 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 rounded-none text-xs font-black uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  Keep Ride
                </button>
                <button
                  type="button"
                  onClick={confirmCancelRide}
                  disabled={!selectedDriverReason || cancellingRide}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-none text-xs font-black uppercase tracking-wider transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {cancellingRide ? (
                    <span className="w-4 h-4 rounded-none border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Confirm Cancellation"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Error Modal */}
      <AnimatePresence>
        {showCancelError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] px-4"
          >
            <motion.div
              initial={{ scale: 0.98, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 15 }}
              className="bg-white w-full max-w-sm rounded-none shadow-2xl overflow-hidden border border-zinc-300"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-red-100 rounded-none flex items-center justify-center mx-auto text-red-600">
                  <XCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black uppercase text-zinc-950">Error</h3>
                  <p className="text-zinc-600 text-xs font-medium leading-relaxed">
                    {showCancelError}
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => setShowCancelError(null)}
                  className="w-full py-3 bg-zinc-950 hover:bg-black text-white rounded-none text-xs font-black uppercase tracking-wider transition active:scale-[0.98] cursor-pointer"
                >
                  Okay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECURE MASKED VOIP CALL OVERLAY */}
      <AnimatePresence>
        {activeCall && activeCall.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-zinc-950/85 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative flex flex-col items-center">
              {/* Header */}
              <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/50 shadow-sm mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Secure Voice Bridge</span>
              </div>
              
              {/* Zego Container */}
              <div 
                ref={setZegoContainer} 
                className="w-full h-[400px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800"
              />
              
              {/* Close button */}
              <button
                onClick={() => {
                  if (booking?._id) {
                    const socket = getSocket();
                    socket.emit("end-call", { bookingId: booking._id });
                  }
                  if (zpRef.current && typeof zpRef.current.destroy === 'function') {
                    try {
                      zpRef.current.destroy();
                    } catch (e) {
                      console.error("Error destroying Zego instance:", e);
                    }
                  }
                  setActiveCall(null);
                  zegoCallJoined.current = false;
                }}
                className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition active:scale-95"
              >
                End / Close Call
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INCOMING VOICE CALL RINGING MODAL ── */}
      <AnimatePresence>
        {incomingCall && incomingCall.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl flex flex-col items-center"
            >
              <div className="relative mb-5">
                <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-emerald-500 opacity-40"></span>
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                  <Phone size={28} className="animate-bounce" />
                </div>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-1">Incoming Voice Call</p>
              <h3 className="text-xl font-black text-white">{incomingCall.callerName}</h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium">In-ride secure audio bridge</p>

              <div className="flex gap-3 w-full mt-6">
                <button
                  onClick={() => {
                    if (booking?._id) {
                      const socket = getSocket();
                      socket.emit("reject-call", { bookingId: booking._id });
                    }
                    setIncomingCall(null);
                  }}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <PhoneOff size={16} /> Decline
                </button>
                <button
                  onClick={() => {
                    if (booking?._id) {
                      const socket = getSocket();
                      socket.emit("accept-call", { bookingId: booking._id });
                    }
                    setIncomingCall(null);
                    setActiveCall({ isOpen: true });
                  }}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                >
                  <PhoneCall size={16} /> Answer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ACTION BAR
══════════════════════════════════════════════════════════════════════ */
function ActionBar({
  status,
  booking,
  pickupPos,
  dropPos,
  otpMode, otp, loadingOtp, otpVerified, otpError,
  setOtpMode, setOtp, setOtpError, handleVerifyOtp, sendPickupOtp,
  dropOtpMode, dropOtp, loadingDropOtp, dropOtpError,
  setDropOtpMode, setDropOtp, setDropOtpError, handleVerifyDropOtp, sendDropOtp,
  onAcceptRide, onDeclineRide, actionPending,
}: any) {
  if (status === "requested") {
    return (
      <div className="flex-shrink-0 border-t border-zinc-200 bg-white px-4 py-3 flex gap-2">
        <button
          type="button"
          onClick={onDeclineRide}
          disabled={actionPending}
          className="flex-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 py-3.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={onAcceptRide}
          disabled={actionPending}
          className="flex-1 bg-zinc-950 hover:bg-black text-white py-3.5 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
        >
          <CheckCircle2 size={15} />
          <span>{actionPending ? "Accepting..." : "Accept Ride"}</span>
        </button>
      </div>
    );
  }

  if (!["confirmed", "started"].includes(status)) return null;

  const targetCoords = status === "started" ? dropPos : pickupPos;
  const targetAddress = status === "started" ? booking?.dropAddress : booking?.pickupAddress;
  const navUrl = targetCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${targetCoords[0]},${targetCoords[1]}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(targetAddress || "")}&travelmode=driving`;

  return (
    <div className="flex-shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
      {/* 🧭 Turn-by-Turn GPS Navigation Action */}
      <a
        href={navUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full mb-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 px-4 rounded-none font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-none transition-all cursor-pointer"
      >
        <Navigation size={14} className="fill-white" />
        <span>Navigate in Maps ({status === "started" ? "To Drop" : "To Pickup"})</span>
        <ExternalLink size={13} className="opacity-80 ml-1" />
      </a>

      <AnimatePresence mode="wait">

        {/* STATE 1 — Arrived */}
        {status === "confirmed" && !otpMode && !otpVerified && (
          <motion.button key="arrived"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            onClick={async () => { await sendPickupOtp(); setOtpMode(true); }}
            className="w-full bg-zinc-950 hover:bg-black active:scale-[0.98] text-white py-3.5 rounded-none font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MapPin size={15} /> I've Arrived at Pickup <ArrowRight size={14} className="ml-1" />
          </motion.button>
        )}

        {/* STATE 2 — Pickup OTP */}
        {status === "confirmed" && otpMode && !otpVerified && (
          <motion.div key="pickup-otp"
            initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.2 }}
            className="bg-zinc-50 border-2 border-zinc-950 rounded-none overflow-hidden"
          >
            <div className="bg-zinc-950 px-4 py-2.5 flex items-center gap-2">
              <KeyRound size={14} className="text-amber-400" />
              <p className="text-white text-xs font-black tracking-wider uppercase">Enter Customer OTP</p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-zinc-600 font-medium">Ask customer for their 4-digit PIN to start ride.</p>
              <div className="flex justify-center">
                <input type="text" inputMode="numeric" maxLength={4} value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                  placeholder="· · · ·"
                  className="w-48 border-2 border-zinc-900 focus:border-black rounded-none px-4 py-2 text-center text-2xl tracking-[0.5em] font-mono font-black outline-none transition-colors bg-white text-zinc-950"
                />
              </div>
              {otpError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-xs text-center font-bold">{otpError}</motion.p>}
              <div className="flex gap-2">
                <button onClick={() => { setOtpMode(false); setOtp(""); setOtpError(""); }}
                  className="flex-1 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 py-2.5 rounded-none text-xs font-black uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                >Cancel</button>
                <button onClick={handleVerifyOtp} disabled={loadingOtp || otp.length < 4}
                  className="flex-1 bg-zinc-950 hover:bg-black disabled:opacity-40 text-white py-2.5 rounded-none text-xs font-black uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                >
                  {loadingOtp ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-none animate-spin" />Verifying…</span> : "Verify OTP"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STATE 3 — Pickup verified */}
        {otpVerified && status === "confirmed" && (
          <motion.div key="pickup-verified"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-4 py-2.5 rounded-none">
              <CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0" />
              <p className="text-emerald-900 text-xs font-black uppercase tracking-wider">OTP Verified — Trip In Progress</p>
            </div>
          </motion.div>
        )}

        {/* STATE 4 — Mark as Dropped */}
        {status === "started" && !dropOtpMode && (
          <motion.button key="drop-btn"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            onClick={async () => { await sendDropOtp(); setDropOtpMode(true); }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 rounded-none font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation size={15} /> Mark as Dropped <ArrowRight size={14} />
          </motion.button>
        )}

        {/* STATE 5 — Drop OTP */}
        {status === "started" && dropOtpMode && (
          <motion.div key="drop-otp"
            initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.2 }}
            className="bg-zinc-50 border-2 border-zinc-950 rounded-none overflow-hidden"
          >
            <div className="bg-zinc-950 px-4 py-2.5 flex items-center gap-2">
              <KeyRound size={14} className="text-white" />
              <p className="text-white text-xs font-black tracking-wider uppercase">Confirm Drop OTP</p>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-zinc-600 font-medium">Ask customer for their drop PIN to end the ride.</p>
              <div className="flex justify-center">
                <input type="text" inputMode="numeric" maxLength={4} value={dropOtp}
                  onChange={e => { setDropOtp(e.target.value.replace(/\D/g, "")); setDropOtpError(""); }}
                  placeholder="· · · ·"
                  className="w-48 border-2 border-zinc-900 focus:border-black rounded-none px-4 py-2 text-center text-2xl tracking-[0.5em] font-mono font-black outline-none transition-colors bg-white text-zinc-950"
                />
              </div>
              {dropOtpError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-600 text-xs text-center font-bold">{dropOtpError}</motion.p>}
              <div className="flex gap-2">
                <button onClick={() => { setDropOtpMode(false); setDropOtp(""); setDropOtpError(""); }}
                  className="flex-1 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 py-2.5 rounded-none text-xs font-black uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                >Cancel</button>
                <button onClick={handleVerifyDropOtp} disabled={loadingDropOtp || dropOtp.length < 4}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white py-2.5 rounded-none text-xs font-black uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                >
                  {loadingDropOtp ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-none animate-spin" />Verifying…</span> : "Complete Ride"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PANEL CONTENT
══════════════════════════════════════════════════════════════════════ */
function PanelContent({
  booking, status, isActive, canChat, displayEta, chatOpen, onChatToggle, onCancel, onCallClick,
  onAcceptRide, onDeclineRide, actionPending,
}: any) {
  return (
    <div className="flex flex-col pt-4 pb-4 gap-3">

      {/* ── NEW INCOMING TRIP REQUEST BANNER & ACCEPT/DECLINE CONTROLS ── */}
      {status === "requested" && (
        <div className="mx-4 lg:mx-6 p-4 bg-zinc-950 border-2 border-zinc-900 text-white rounded-none shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-none animate-ping" />
              <p className="text-xs font-black uppercase tracking-widest text-amber-400">Incoming Ride Request</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-400 font-mono">₹{booking?.partnerAmount || Math.round((booking?.fare || 0) * 0.9)}</span>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Net Payout</p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-medium leading-relaxed">
            A passenger nearby has requested a ride. Accept to confirm booking and start navigating.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onDeclineRide}
              disabled={actionPending}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 py-3 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={onAcceptRide}
              disabled={actionPending}
              className="flex-1 bg-white hover:bg-zinc-100 text-zinc-950 py-3 rounded-none text-xs font-black uppercase tracking-wider transition cursor-pointer active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={15} className="text-zinc-950" />
              <span>{actionPending ? "Accepting..." : "Accept Ride"}</span>
            </button>
          </div>
        </div>
      )}

      {/* DRIVER PANIC ALERT BANNER */}
      {booking?.isPanicActive && (
        <div className="mx-4 lg:mx-6">
          <div className="bg-red-950 border-2 border-red-600 rounded-none p-4 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-red-600 flex items-center justify-center flex-shrink-0">
              <Siren size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Emergency SOS Triggered</p>
              <p className="text-xs font-medium text-red-100">Passenger requested emergency safety assistance. Please adhere to standard safety guidelines.</p>
            </div>
          </div>
        </div>
      )}

      {/* ETA + FARE */}
      {isActive && (
        <div className="mx-4 lg:mx-6 grid grid-cols-2 gap-2">
          <div className="bg-white border border-zinc-300 rounded-none p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-zinc-100 border border-zinc-200 flex items-center justify-center flex-shrink-0">
              <Clock size={15} className="text-zinc-600" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">ETA</p>
              <p className="text-base font-black text-zinc-950 leading-none mt-0.5">
                {Math.round(displayEta)}<span className="text-xs font-normal text-zinc-500 ml-0.5">min</span>
              </p>
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-950 rounded-none p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
              <IndianRupee size={15} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Fare</p>
              <p className="text-base font-black text-white leading-none mt-0.5 font-mono">₹{booking?.fare ?? "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CARD */}
      {booking?.user && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-4 lg:mx-6">
          <div className="bg-zinc-950 border border-zinc-900 rounded-none p-4 flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-none bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <User2 size={24} className="text-zinc-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-400 w-3 h-3 rounded-none border border-zinc-950" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-black text-sm truncate uppercase tracking-tight">{(booking.user as any)?.name || "Customer"}</p>
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-none flex-shrink-0">
                  <IndianRupee size={10} className="text-amber-400" />
                  <span className="text-white text-xs font-mono font-bold">{booking.fare}</span>
                </div>
              </div>
              {booking.paymentStatus && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-none font-mono font-black uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {PAYMENT_BADGE[booking.paymentStatus as PaymentStatus]?.label ?? booking.paymentStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isActive && (
            <div className="grid grid-cols-2 sm:flex gap-2 mt-2">
              <button
                onClick={onCallClick}
                className="flex items-center justify-center gap-1.5 bg-zinc-950 hover:bg-black text-white border border-zinc-900 active:scale-[0.98] transition-all py-2.5 sm:py-3 rounded-none text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                <Phone size={13} /> <span>In-App Call</span>
              </button>
              {booking.userMobileNumber && (
                <a
                  href={`tel:${booking.userMobileNumber}`}
                  className="flex items-center justify-center gap-1.5 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 active:scale-[0.98] transition-all py-2.5 sm:py-3 rounded-none text-xs font-black uppercase tracking-wider cursor-pointer"
                  title="Direct Cellular Phone Call"
                >
                  <PhoneCall size={13} /> <span>Phone</span>
                </a>
              )}
              {canChat && (
                <button onClick={onChatToggle}
                  className={`col-span-2 sm:flex-1 flex items-center justify-center gap-2 active:scale-[0.98] transition-all py-2.5 sm:py-3 rounded-none text-xs font-black uppercase tracking-wider border cursor-pointer ${chatOpen ? "bg-zinc-200 text-zinc-900 border-zinc-300" : "bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300"}`}
                >
                  <MessageCircle size={13} />
                  <span>{chatOpen ? "Close Chat" : "Message"}</span>
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* CHAT — confirmed only */}
      <AnimatePresence>
        {chatOpen && canChat && (
          <motion.div key="chat"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-4 lg:mx-6 overflow-hidden"
          >
            <div className="rounded-none overflow-hidden border border-zinc-300 h-[460px]">
              <RideChat currentRole="driver" rideId={booking._id} userName={(booking?.user as any)?.name} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VEHICLE CARD */}
      {booking?.vehicle && (
        <div className="mx-4 lg:mx-6">
          <div className="bg-white border border-zinc-300 rounded-none p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-zinc-950 flex items-center justify-center flex-shrink-0 text-white">
              <Car size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-0.5">Your Vehicle</p>
              <p className="text-xs font-black text-zinc-900 truncate uppercase">{(booking.vehicle as any).vehicleModel}</p>
            </div>
            {(booking.vehicle as any).number && (
              <div className="flex-shrink-0 bg-zinc-950 px-3 py-1 rounded-none border border-zinc-950">
                <p className="text-white text-xs font-black tracking-widest font-mono">{(booking.vehicle as any).number}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROUTE CARD */}
      <div className="mx-4 lg:mx-6">
        <div className="bg-white border border-zinc-300 rounded-none overflow-hidden">
          <div className="flex gap-3 p-3.5 border-b border-zinc-200">
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
              <div className="w-2.5 h-2.5 rounded-none bg-zinc-950 flex-shrink-0" />
              <div className="w-0.5 bg-zinc-300 mt-1 flex-1 min-h-[20px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Pickup</p>
              <p className="text-xs font-bold text-zinc-900 leading-snug">{booking?.pickupAddress || "—"}</p>
            </div>
          </div>
          <div className="flex gap-3 p-3.5">
            <div className="flex-shrink-0 pt-1">
              <div className="w-2.5 h-2.5 rounded-none border-2 border-zinc-950 bg-white flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Drop</p>
              <p className="text-xs font-black text-zinc-900 leading-snug">{booking?.dropAddress || "—"}</p>
            </div>
          </div>
        </div>
      </div>
      {/* CANCEL BUTTON */}
      {["confirmed", "awaiting_payment"].includes(status) && (
        <div className="mx-4 lg:mx-6 mt-1">
          <button
            onClick={onCancel}
            className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-3.5 rounded-none text-xs font-black uppercase tracking-wider transition-all border border-zinc-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            Cancel Ride
          </button>
        </div>
      )}

      {/* DRIVER EMERGENCY SOS & HELPLINE */}
      {["confirmed", "started"].includes(status) && (
        <div className="mx-4 lg:mx-6 mt-2 pt-2 border-t border-zinc-200 flex gap-2">
          <a
            href="tel:112"
            className="flex-1 bg-red-100 hover:bg-red-200 border border-red-300 text-red-900 py-2.5 rounded-none text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
          >
            <Siren size={14} className="text-red-700" />
            Police (112)
          </a>
          <button
            type="button"
            onClick={async () => {
              if (confirm("Trigger Driver Emergency Assistance? This will alert RideNow Dispatch & Safety.")) {
                try {
                  await fetch(`/api/booking/${booking._id}/panic`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: "Driver triggered emergency safety assistance" }),
                  });
                  alert("Emergency assistance alert dispatched. Operations team alerted.");
                } catch (e) {
                  console.error("Driver panic error:", e);
                }
              }
            }}
            className="flex-1 bg-zinc-950 hover:bg-black text-white py-2.5 rounded-none text-xs font-black uppercase tracking-wider border border-zinc-900 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
          >
            <ShieldAlert size={14} className="text-amber-400" />
            Safety SOS
          </button>
        </div>
      )}

    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPLETED FULL SCREEN
══════════════════════════════════════════════════════════════════════ */
function CompletedScreen({ booking }: { booking: IBooking }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="h-screen w-full bg-zinc-950 flex flex-col overflow-y-auto"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="w-24 h-24 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-emerald-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.25em] font-black text-center mb-1">Trip Complete</p>
          <h1 className="text-white text-2xl font-black uppercase tracking-tight text-center mb-1">Ride Completed!</h1>
          <p className="text-zinc-400 text-xs text-center mb-6">You have successfully dropped the customer.</p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-none p-5 mb-3">
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black mb-1 text-center">Net Earnings Credited</p>
            <p className="text-emerald-400 text-4xl font-black flex items-center justify-center gap-1 mb-4 font-mono">
              <IndianRupee size={28} strokeWidth={2.5} /> {booking.partnerAmount || Math.round(booking.fare * 0.9)}
            </p>

            {/* Itemized Price Confirmation */}
            <div className="space-y-1.5 border-t border-zinc-800 pt-3 pb-3 text-xs">
              <div className="flex justify-between text-zinc-400 font-medium">
                <span>Customer Gross Fare:</span>
                <span className="font-mono text-white">₹{booking.fare}</span>
              </div>
              <div className="flex justify-between text-zinc-400 font-medium">
                <span>Platform Commission (10%):</span>
                <span className="font-mono text-rose-400">-₹{booking.adminCommission || Math.round(booking.fare * 0.1)}</span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-zinc-800/80 pt-1.5">
                <span className="text-emerald-400">Net Driver Payout:</span>
                <span className="font-mono text-emerald-400">₹{booking.partnerAmount || Math.round(booking.fare * 0.9)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs border-t border-zinc-800 pt-3">
              <span className="text-zinc-400 font-bold uppercase text-[10px] tracking-wider">Payment Mode</span>
              <span className={`px-2 py-0.5 rounded-none font-mono font-black text-[10px] uppercase tracking-wider ${PAYMENT_BADGE[booking.paymentStatus]?.cls ?? "bg-zinc-700 text-zinc-300"}`}>
                {booking.paymentStatus === "cash" ? "Cash (Keep Full Fare)" : "Online Wallet Credited"}
              </span>
            </div>
          </div>

          {booking.user && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-none p-3.5 flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-none bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <User2 size={20} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Customer</p>
                <p className="text-white text-xs font-black uppercase">{(booking.user as any)?.name || "Customer"}</p>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-none overflow-hidden mb-5">
            <div className="flex gap-3 p-3.5 border-b border-zinc-800">
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className="w-2 h-2 rounded-none bg-zinc-400" />
                <div className="w-0.5 bg-zinc-700 mt-1 flex-1 min-h-[16px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Pickup</p>
                <p className="text-xs text-zinc-300 leading-snug">{booking.pickupAddress || "—"}</p>
              </div>
            </div>
            <div className="flex gap-3 p-3.5">
              <div className="flex-shrink-0 pt-1">
                <div className="w-2 h-2 rounded-none border border-emerald-400 bg-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Drop</p>
                <p className="text-xs text-zinc-300 leading-snug">{booking.dropAddress || "—"}</p>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = "/partners/dashboard"}
            className="w-full bg-white text-zinc-950 py-3.5 rounded-none text-xs font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FAILED FULL SCREEN (cancelled / rejected / expired)
══════════════════════════════════════════════════════════════════════ */
function FailedScreen({ booking, status, cfg }: {
  booking: IBooking;
  status: BookingStatus;
  cfg: { label: string; sublabel: string; dot: string };
}) {
  const isExpired = status === "expired";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <div className={`w-20 h-20 rounded-none flex items-center justify-center border ${isExpired ? "bg-orange-500/10 border-orange-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          {isExpired ? <AlertCircle size={36} className="text-orange-400" /> : <XCircle size={36} className="text-red-400" />}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        <h1 className="text-white text-2xl font-black uppercase tracking-tight mb-1">{cfg.label}</h1>
        <p className="text-zinc-500 text-xs mb-6">{cfg.sublabel}</p>

        {booking.user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-none p-3.5 flex items-center gap-3 mb-3 text-left">
            <div className="w-10 h-10 rounded-none bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <User2 size={18} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Customer</p>
              <p className="text-white text-xs font-black uppercase">{(booking.user as any)?.name || "Customer"}</p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-none overflow-hidden mb-5 text-left">
          <div className="flex gap-3 p-3.5 border-b border-zinc-800">
            <div className="flex flex-col items-center flex-shrink-0 pt-1">
              <div className="w-2 h-2 rounded-none bg-zinc-600" />
              <div className="w-0.5 bg-zinc-700 mt-1 flex-1 min-h-[16px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Pickup</p>
              <p className="text-xs text-zinc-300 leading-snug">{booking.pickupAddress || "—"}</p>
            </div>
          </div>
          <div className="flex gap-3 p-3.5">
            <div className="flex-shrink-0 pt-1">
              <div className="w-2 h-2 rounded-none bg-zinc-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Drop</p>
              <p className="text-xs text-zinc-300 leading-snug">{booking.dropAddress || "—"}</p>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = "/partners/dashboard"}
          className="w-full bg-white text-zinc-950 py-3.5 rounded-none text-xs font-black uppercase tracking-wider hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          Back to Dashboard
        </motion.button>
      </motion.div>


    </motion.div>
  );
}