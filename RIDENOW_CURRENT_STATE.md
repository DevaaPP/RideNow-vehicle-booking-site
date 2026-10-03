# RideNow — Current State Master Production Audit & Baseline (Phase 0)
**Document Version:** `1.0.0-baseline`  
**Git Branch:** `audit/baseline-v1`  
**Date of Audit:** October 3, 2026  
**Auditor:** Antigravity Autonomous Systems & DeepMind Engineering  
**Classification Standard:** `[Working | Partially working | Broken | Mocked | Hardcoded | Missing | Needs redesign]`

---

## 1. Executive Summary

This master audit establishes the definitive technical baseline for **RideNow** before further feature development begins. RideNow is a full-stack, hyper-local ride-hailing and logistics platform built on **Next.js 16 (App Router)**, **React 19**, **MongoDB (Mongoose 9)**, **Tailwind CSS 4**, and a standalone **Node.js Express + Socket.IO realtime server**.

### Audit Snapshot
* **Total API Endpoints Cataloged:** 68
* **Total Frontend Pages Cataloged:** 31
* **Total Shared Components Cataloged:** 20
* **Total Database Models Cataloged:** 12
* **Build Status:** Next.js Turbopack build passes (93 routes compiled cleanly), TypeScript passes with 0 type errors.
* **Core Strengths:** Complete end-to-end booking state machine (requested → assigned → arrived → OTP verification → started → drop OTP → completed), Razorpay + Cash + Wallet payments, WebRTC in-ride audio calling, Valhalla & OSRM routing with alternative routes, Vernacular i18n support (English, Hindi, Bengali, Assamese), and Web Push notifications.
* **Top Production Risks Identified:**
  1. **Security Vulnerability:** Client-side fallback references `process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET` in `video-kyc/[roomId]/page.tsx`, potentially leaking server secrets to the browser.
  2. **Financial Discrepancy:** Commission calculation mismatch—10% platform fee in `booking/create/route.ts` vs 15% platform fee in `settlePayment.ts`.
  3. **Mock Data in Production Code:** Unseeded driver fallback automatically registers `fleet.driver@ridenow.com` with hardcoded phone `"9876543210"` directly in `booking/create/route.ts`.
  4. **Frontend Monoliths:** 4 core pages exceed 1,300–1,900 lines of code each (`book/page.tsx`, `checkout/CheckoutContent.tsx`, `ride/[id]/page.tsx`, `partner/active-ride/page.tsx`), bundling maps, chat, audio, routing, and form logic together.
  5. **Unused Dependencies:** `leaflet`, `react-leaflet`, and `@types/leaflet` are bundled in `package.json` despite the codebase fully migrating to `maplibre-gl`.
  6. **Dual Source of Truth:** `User.walletBalance` and `Wallet.balance` exist simultaneously, with non-atomic dual writes in `settlePayment.ts`.

---

## 2. Master Feature Inventory & Status Matrix

| ID | Feature | Module | Status | Technical Details & Root Cause |
|---|---|---|---|---|
| F-01 | Customer Pickup/Drop Autocomplete | Booking / Maps | `Working` | Photon OSM geocoding API with client-side 300ms debounce. Returns lat/lng, formatted addresses, and category icons. |
| F-02 | Smart Pickup Points | Booking / Maps | `Partially working` | Static predefined landmark spots returned by `/api/places/smart-pickups` for Guwahati/Kolkata. Lacks dynamic spatial clustering or GPS walking paths. |
| F-03 | Multi-Stop Booking | Booking | `Working` | Supports intermediate waypoints with drag-and-drop reordering, cumulative Haversine distance, and per-stop completion flags. |
| F-04 | Fare Calculation & Estimates | Pricing | `Partially working` | Dynamic distance-only pricing via `fareEngine.ts`. However, platform fee (₹15), GST (5%), and vehicle base rates are hardcoded fallbacks when DB `FareConfig` is empty. |
| F-05 | Student Pass Discount | Pricing | `Working` | 10% discount applied when `user.isStudent: true`. Verified via `/api/user/verify-student` with educational email validation. |
| F-06 | Scheduled Rides | Booking | `Partially working` | Stored in DB with `isScheduled: true`. Minimum 20-minute lead time enforced. Dispatch cron route `/api/booking/scheduled/dispatch` exists but has no recurring automated runner/worker. |
| F-07 | Family Rides | Booking | `Working` | Allows ride booking for saved family members with automated emergency notification SMS/WhatsApp data payloads. |
| F-08 | Map Routing & Geometry | Maps | `Working` | MapLibre GL renders raster OSM base tiles with GeoJSON vector route layers. Valhalla & OSRM dual routing with alternative route display. |
| F-09 | Driver Matching Engine | Dispatch | `Mocked` | Searches 10km radius for online vendors. If no driver exists, **auto-creates a mock driver (`fleet.driver@ridenow.com`, phone `9876543210`)** and auto-assigns. |
| F-10 | Driver Auto-Rematching | Dispatch | `Partially working` | Re-matches to next candidate driver if rejected or timed out (20s). Candidate queue logic works, but no concurrency locking exists for competing drivers. |
| F-11 | Realtime Driver Location Tracking | Realtime / Maps | `Working` | Socket.IO broadcasts `driver-location-update` to `booking-{id}` room. `LiveTrackingMap.tsx` animates marker bearing and coordinates. |
| F-12 | Two-Way Pickup OTP Verification | Security / Ride | `Working` | 4-digit cryptographically generated OTP verified by driver before trip begins (`/api/partner/bookings/verify-pickup-otp`). |
| F-13 | Two-Way Drop OTP Verification | Security / Ride | `Working` | 4-digit drop OTP required to complete trip, preventing premature ride termination by driver. |
| F-14 | Emergency Panic / SOS | Safety | `Working` | `/api/booking/[id]/panic` flags ride, sends alerts, and provides 112 emergency dialer trigger. |
| F-15 | Route Deviation Detection | Safety | `Partially working` | `getMinDistanceToPolyline` computes deviation from planned route. Triggers UI safety check-in prompt if driver drifts >300m, but lacks automated backend webhook dispatch. |
| F-16 | In-Ride WebRTC Audio Calling | Comms | `Working` | Peer-to-peer audio calling via Socket.IO signaling (`call-user`, `accept-call`, `reject-call`, `end-call`) and WebRTC `RTCPeerConnection`. |
| F-17 | In-Ride Chat Messaging | Comms | `Working` | Real-time chat stored in `chatMessage` collection and broadcasted via `chat-message` socket event. |
| F-18 | Web Push Notifications | Notifications | `Working` | VAPID Web Push notifications via Service Worker `sw.js` for ride acceptance, driver arrival, trip start, dropoff, and cancellation. |
| F-19 | WhatsApp Verification & Alerts | Comms | `Partially working` | Meta WhatsApp Cloud API in `whatsapp.ts`. Falls back to console output if `WHATSAPP_API_TOKEN` is unset. |
| F-20 | Razorpay Payment Gateway | Payments | `Partially working` | Test and live Razorpay checkout supported. Lacks automated webhook verification endpoint; verification is done solely via `/api/payment/verify` client POST. |
| F-21 | Cash Settlement Flow | Payments | `Working` | Passenger pays driver in cash; driver wallet is debited for platform commission upon trip completion. |
| F-22 | Customer & Driver Wallet | Wallet | `Needs redesign` | Split source of truth: `User.walletBalance` (Number) and `Wallet.balance` (Document) are duplicated and out of sync. |
| F-23 | Driver Onboarding & KYC | Partner | `Working` | Multi-step vendor registration (Profile, Vehicle Details, RC/Insurance Documents, Bank Account, Video KYC). |
| F-24 | Video KYC Verification | Partner / Admin | `Partially working` | ZegoCloud WebRTC video room for admin inspection. Contains high-severity client secret vulnerability (`NEXT_PUBLIC_ZEGO_SERVER_SECRET`). |
| F-25 | Admin Fleet & Commission Dashboard | Admin | `Working` | Recharts visual analytics, vehicle approval/rejection, vendor verification, and revenue tracking. |
| F-26 | Vernacular i18n Localization | Platform | `Working` | Context-based translations for English, Assamese, Bengali, and Hindi with persistent language toggle. |
| F-27 | Cancellation Reasons & Penalties | Ride Engine | `Working` | Calculates tiered cancellation fees based on minutes elapsed since acceptance and distance covered by driver. |

---

## 3. Page & Route Inventory

| Route Path | Type | Auth Required | Status | Analysis & Issues |
|---|---|---|---|---|
| `/` | Server / Client | No | `Working` | Home landing page with hero banner, service highlights, vehicle categories, and quick book form. |
| `/book` | Client | Optional | `Needs redesign` | **Monolithic file (1,927 lines)**. Manages location search, multi-stops, family mode, scheduling, vehicle selection, fare calculation, and MapLibre GL map. Heavy bundle, potential re-render lag. |
| `/booking` | Server | No | `Needs redesign` | Redundant route; simply runs `redirect("/book")`. Should be handled via `next.config.ts` redirect. |
| `/bookings` | Client | Yes (`user`) | `Working` | Customer ride history with status filtering (All, Completed, Cancelled), vehicle details, and receipts. |
| `/checkout` | Client | Yes (`user`) | `Needs redesign` | **Monolithic file (1,388 lines in CheckoutContent.tsx)**. Reads booking params from URL query string. Loses draft if URL is truncated or browser refreshed without active booking. |
| `/checkout/page_new.tsx` | N/A | N/A | `Broken` / `Mocked` | **Orphaned draft file**. Not recognized by Next.js App Router; dead code cluttering the repository. |
| `/ride/[id]` | Client | Yes (`user`) | `Needs redesign` | **Monolithic file (1,887 lines)**. Houses map tracking, in-ride chat, WebRTC audio calls, panic SOS, safety check-in, OTP display, cancellation modal, and ratings. |
| `/partner` (`/partners/dashboard`) | Client | Yes (`vendor`) | `Working` | Driver dashboard with online/offline toggle, active ride radar, shift summary stats, and earnings graph. |
| `/partner/active-ride` | Client | Yes (`vendor`) | `Needs redesign` | **Monolithic file (1,480 lines)**. Driver trip fulfillment cockpit with OTP inputs, navigation links, client polling fallback (8s), in-ride audio, and chat. |
| `/partner/bookings` | Client | Yes (`vendor`) | `Working` | Driver ride history, trip earnings, and status breakdown. |
| `/partner/pending-requests` | Client | Yes (`vendor`) | `Working` | Driver incoming ride request radar with countdown timer, pickup address, distance, and accept/reject actions. |
| `/partner/wallet` | Client | Yes (`vendor`) | `Working` | Driver wallet balance, earnings history, platform commission deductions, and bank withdrawal request form. |
| `/partner/onboard` | Client | Yes (`vendor`) | `Working` | Onboarding stepper showing registration progress (Steps 0–8). |
| `/partner/onboard/bank` | Client | Yes (`vendor`) | `Working` | Bank account, IFSC code, and UPI ID collection for payouts. |
| `/partner/onboard/documents` | Client | Yes (`vendor`) | `Working` | Driving license, Aadhaar card, and PAN card upload via Cloudinary. |
| `/partner/onboard/vehicle` | Client | Yes (`vendor`) | `Working` | Vehicle registration number, model, RC document, and vehicle photographs. |
| `/admin/dashboard` | Client | Yes (`admin`) | `Working` | High-level metrics: total revenue, active drivers, completed rides, pending KYC, and interactive Recharts graphs. |
| `/admin/vendors/[id]` | Client | Yes (`admin`) | `Working` | Admin review page for vendor verification, document inspection, and approve/reject actions. |
| `/admin/vehicles/[id]` | Client | Yes (`admin`) | `Working` | Admin review page for vehicle verification, RC inspection, and approve/reject actions. |
| `/video-kyc/[roomId]` | Client | Yes (`vendor`/`admin`) | `Broken` (Security) | ZegoCloud WebRTC video room. **Security hazard:** exposes `NEXT_PUBLIC_ZEGO_SERVER_SECRET`. |
| `/track/[token]` | Client | No (Public Token) | `Working` | Public live ride-sharing tracking page for family and friends. No login required; uses secure URL `shareToken`. |
| `/wallet` | Client | Yes (`user`) | `Working` | Passenger wallet top-up via Razorpay and transaction ledger. |
| `/profile` | Client | Yes (`user`) | `Working` | User profile, phone linking, student discount verification, and family member management. |
| `/group/join` | Client | Yes (`user`) | `Working` | Split-fare group ride acceptance page via `groupInviteCode`. |
| `/safety` | Static | No | `Working` | RideNow safety policies, emergency features, and driver screening standards. |
| `/fleet` | Static | No | `Working` | Vehicle fleet descriptions (Bike, Auto, Car, Loading, Truck) with capacity specs. |
| `/terms` | Static | No | `Working` | General terms of service. |
| `/partner-terms` | Static | No | `Working` | Partner driver terms of agreement and commission policies. |
| `/payment-terms` | Static | No | `Working` | Payment processing, settlement, and chargeback rules. |
| `/privacy` | Static | No | `Working` | Privacy policy and data handling disclosures. |
| `/cancellation-refund` | Static | No | `Working` | Customer cancellation fee schedules and refund policies. |
| `/contact` | Static | No | `Working` | Customer support contact details, email, and office address. |
| `/faq` | Static | No | `Working` | Frequently asked questions for riders and drivers. |
| `/grievance` | Static | No | `Working` | Grievance officer designation and dispute resolution channels. |
| `/cookies` | Static | No | `Working` | Cookie usage policy. |

---

## 4. Shared Components Inventory

| Component File | Size | Role / Usage | Status | Notes |
|---|---|---|---|---|
| `RouteMap.tsx` | 1,019 lines | WebGL route rendering via MapLibre GL for `/book` | `Needs redesign` | Handles map init, markers, routing queries, smart pickup rendering, fallback geocoding. High complexity. |
| `LiveTrackingMap.tsx` | 752 lines | WebGL live driver and trip tracking for active rides | `Working` | Smooth animated bearing calculation, custom SVG markers for auto/bike/car/truck, dynamic camera bounds. |
| `DriverLocationMap.tsx` | 119 lines | Driver dashboard mini-map showing current GPS position | `Working` | Lightweight MapLibre GL map instance. |
| `Nav.tsx` | 230 lines | Main navigation header across rider/partner/admin | `Working` | Responsive navbar with language switcher, push notification toggle, auth triggers, role badge. |
| `Footer.tsx` | 185 lines | Global site footer | `Working` | Links to legal, safety, fleet, social channels, and copyright. |
| `AuthModal.tsx` | 380 lines | Global modal for user authentication | `Working` | Tabbed login/signup supporting Email + Password, Google OAuth, and WhatsApp Phone + OTP. |
| `PhoneLinkModal.tsx` | 220 lines | Mandatory WhatsApp phone number verification modal | `Working` | Sends and verifies 6-digit OTP before allowing booking creation. |
| `NotificationToggle.tsx` | 85 lines | Push notification bell trigger | `Working` | Requests browser notification permissions and registers Service Worker VAPID subscription. |
| `LanguageSelector.tsx` | 95 lines | Vernacular language picker | `Working` | Dropdown supporting English (`en`), Assamese (`as`), Hindi (`hi`), Bengali (`bn`). |
| `RideChat.tsx` | 240 lines | In-ride chat interface | `Working` | Real-time chat box with auto-scroll, message persistence via MongoDB, and Socket.IO delivery. |
| `GeoUpdater.tsx` | 65 lines | Driver background geolocation daemon | `Partially working` | Captures HTML5 `navigator.geolocation.watchPosition` and emits `update-location` to socket server every few seconds. |
| `VehicleBookingCard.tsx` | 145 lines | Vehicle selection card in booking flow | `Working` | Displays vehicle icon, estimated fare, ETA, and capacity details. |
| `VehicleCategoriesSlider.tsx`| 110 lines | Home page category carousel | `Working` | Interactive slider highlighting vehicle types. |
| `Herosection.tsx` | 165 lines | Home page hero banner | `Working` | Call to action with pickup/drop quick search inputs. |
| `PublicHome.tsx` | 195 lines | Unauthenticated landing page content | `Working` | Marketing showcase, trust indicators, app features. |
| `VendorDashboard.tsx` | 310 lines | Driver primary dashboard controls | `Working` | Online/offline toggle, ride requests list, daily stats summary. |
| `PartnerEarningChart.tsx` | 95 lines | Recharts earnings visualizer for drivers | `Working` | Daily/weekly revenue bar chart. |
| `AdminEarning.tsx` | 120 lines | Admin revenue breakdown component | `Working` | Aggregates gross GMV, driver payouts, and net platform commissions. |
| `AdminStatusChart.tsx` | 85 lines | Admin ride status pie/donut chart | `Working` | Visualizes completed vs cancelled vs active bookings. |
| `DriverWalletCard.tsx` | 115 lines | Driver wallet balance summary card | `Working` | Displays available earnings, pending withdrawals, and payout button. |

---

## 5. Complete API Route Inventory (68 Endpoints)

### A. Authentication & User Profile
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | None | NextAuth v5 session handler (Credentials & Google) | `Working` |
| `/api/auth/register` | POST | None | Email/password user account creation | `Working` |
| `/api/auth/verify-otp` | POST | None | Email verification OTP confirmation | `Working` |
| `/api/auth/phone/send-otp` | POST | None | Dispatches 6-digit WhatsApp OTP for phone login | `Working` |
| `/api/auth/phone/verify-otp` | POST | None | Validates phone OTP and issues user session | `Working` |
| `/api/auth/phone/link` | POST | Session | Links verified phone number to existing user profile | `Working` |
| `/api/me` | GET | Session | Returns authenticated user profile, role, and wallet | `Working` |
| `/api/user/delete-account` | POST | Session | Soft-deletes user account and invalidates sessions | `Working` |
| `/api/user/verify-student` | POST | Session | Verifies student `.edu` email for 10% fare discount | `Working` |
| `/api/user/family` | GET, POST | Session | Retrieves or saves family emergency member contacts | `Working` |
| `/api/user/family/member` | DELETE | Session | Removes a family contact | `Working` |

### B. Customer Booking Engine
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/booking/create` | POST | Session | Creates ride booking, matches driver, emits socket | `Mocked` (mock driver fallback) |
| `/api/booking/my-active` | GET | Session | Fetches passenger's ongoing active booking | `Working` |
| `/api/booking/[id]` | GET | Session | Retrieves complete booking details | `Working` |
| `/api/booking/[id]/status` | GET | Session | Polls current ride and payment status | `Working` |
| `/api/booking/[id]/cancel` | POST | Session | Cancels ride, computes penalty fee based on time/distance | `Working` |
| `/api/booking/[id]/confirm-payment` | POST | Session | Confirms cash payment or offline payment method | `Working` |
| `/api/booking/[id]/rematch` | POST | Session | Re-dispatches booking to next candidate driver | `Working` |
| `/api/booking/[id]/reschedule` | POST | Session | Updates pickup time for scheduled ride | `Working` |
| `/api/booking/[id]/panic` | POST | Session | Triggers SOS emergency panic state | `Working` |
| `/api/booking/[id]/safety-checkin` | POST | Session | Confirms passenger safety after route deviation alert | `Working` |
| `/api/booking/[id]/group/invite` | POST | Session | Generates split-fare invite code and adds co-riders | `Working` |
| `/api/booking/group/join` | POST | Session | Joins split-fare group ride via invite code | `Working` |
| `/api/booking/scheduled/dispatch` | POST | Secret | Dispatches upcoming scheduled rides | `Missing` (no automated cron worker) |
| `/api/user/bookings` | GET | Session | Customer complete ride history with status filter | `Working` |

### C. Driver / Partner Operations
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/partner/status` | GET, POST | Vendor | Toggles driver online/offline availability | `Working` |
| `/api/partner/bookings/pending` | GET | Vendor | Polls incoming ride requests pending acceptance | `Working` |
| `/api/partner/bookings/active` | GET | Vendor | Fetches currently assigned active ride for driver | `Working` |
| `/api/partner/bookings/counts` | GET | Vendor | Aggregates daily completed, active, and pending rides | `Working` |
| `/api/partner/bookings/dispatch-next` | POST | Vendor | Auto-advances ride matching queue | `Working` |
| `/api/partner/bookings/[id]/cancel` | POST | Vendor | Driver-initiated ride cancellation with reason tracking | `Working` |
| `/api/partner/bookings/send-pickup-otp` | POST | Vendor | Re-sends 4-digit pickup verification OTP | `Working` |
| `/api/partner/bookings/verify-pickup-otp` | POST | Vendor | Verifies pickup OTP and starts ride | `Working` |
| `/api/partner/bookings/send-drop-otp` | POST | Vendor | Dispatches 4-digit drop verification OTP | `Working` |
| `/api/partner/bookings/verify-drop-otp` | POST | Vendor | Verifies drop OTP and triggers completion & settlement | `Working` |
| `/api/partner/earnings` | GET | Vendor | Computes driver gross, net earnings, and commission | `Working` |
| `/api/partner/shift-summary` | GET | Vendor | Driver daily online hours, completed trips, earnings | `Working` |
| `/api/partner/documents` | GET, POST | Vendor | Uploads and checks KYC documents (License, Aadhaar) | `Working` |
| `/api/partner/bank` | GET, POST | Vendor | Sets bank account and UPI details for payouts | `Working` |
| `/api/partner/vehicle` | GET, POST | Vendor | Registers and retrieves driver vehicle data | `Working` |
| `/api/partner/vehicle/pricing` | GET | Vendor | Driver custom rate preferences | `Working` |
| `/api/partner/vehicle/pricing/edit`| POST | Vendor | Edits driver rate configuration | `Working` |
| `/api/partner/video-kyc/request` | POST | Vendor | Requests admin Video KYC appointment | `Working` |
| `/api/partner/wallet` | GET | Vendor | Driver earnings ledger and transaction history | `Working` |
| `/api/partner/wallet/withdraw` | POST | Vendor | Submits withdrawal request from driver wallet | `Working` |

### D. Booking Lifecycle State Transitions (Backend Internal)
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/booking/[id]/accept` | POST | Vendor | Driver accepts ride request; assigns driver to booking | `Working` |
| `/api/booking/[id]/reject` | POST | Vendor | Driver declines request; advances matching index | `Working` |
| `/api/booking/[id]/arriving` | POST | Vendor | Driver signals they are en route to pickup location | `Working` |
| `/api/booking/[id]/arrived` | POST | Vendor | Driver signals physical arrival at pickup spot | `Working` |
| `/api/booking/[id]/start` | POST | Vendor | Starts ride (fallback if OTP bypass is allowed) | `Working` |
| `/api/booking/[id]/complete` | POST | Vendor | Completes ride and initiates settlement | `Working` |
| `/api/booking/[id]/timeout` | POST | System | Marks candidate driver as timed out (20s) | `Working` |
| `/api/booking/[id]/expire` | POST | System | Marks entire booking as expired if no drivers accept | `Working` |

### E. Payments & Wallet
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/payment/create` | POST | Session | Creates Razorpay order for ride fare | `Working` |
| `/api/payment/verify` | POST | Session | Verifies Razorpay HMAC-SHA256 signature and settles | `Working` |
| `/api/wallet` | GET | Session | Fetches user/driver wallet balance & transactions | `Working` |
| `/api/wallet/pay` | POST | Session | Debits passenger wallet to pay for ride fare | `Working` |
| `/api/wallet/topup/create` | POST | Session | Initiates Razorpay order for wallet top-up | `Working` |
| `/api/wallet/topup/verify` | POST | Session | Verifies Razorpay signature and credits wallet balance | `Working` |

### F. Realtime, Chat & Web Push Notifications
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/chat/get-all` | GET | Session | Retrieves message history for booking chat room | `Working` |
| `/api/chat/send` | POST | Session | Saves chat message to DB and emits socket event | `Working` |
| `/api/notifications/vapid-key` | GET | None | Returns public VAPID key for browser push registration | `Working` |
| `/api/notifications/subscribe` | POST | Session | Saves browser Web Push subscription to MongoDB | `Working` |
| `/api/notifications/unsubscribe` | POST | Session | Deactivates device push subscription | `Working` |
| `/api/track/[token]` | GET | None | Public ride tracking data endpoint for shared links | `Working` |
| `/api/socket/connect` | GET | None | Socket server connectivity health check | `Working` |

### G. Maps, Routing & Pricing Services
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/places` | GET | None | Forward/reverse geocoding proxy via Photon OSM | `Working` |
| `/api/places/smart-pickups` | GET | None | Predefined pickup hotspots for airports/stations | `Partially working` |
| `/api/route` | POST | None | Turn-by-turn routing proxy via Valhalla and OSRM | `Working` |
| `/api/vehicles/nearby` | GET | None | Discovers nearby active vehicles for home map display | `Working` |
| `/api/vehicles/pricing` | GET | None | Authoritative vehicle pricing configuration | `Working` |

### H. Video KYC & Media
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/zego/token` | POST | Session | Generates server-side ZegoCloud WebRTC access token | `Working` |

### I. Admin Management & Fleet Verification
| Endpoint | Method | Auth | Description | Status |
|---|---|---|---|---|
| `/api/admin/dashboard` | GET | Admin | Revenue, active rides, vehicle counts, platform totals | `Working` |
| `/api/admin/earnings` | GET | Admin | Platform commission analytics | `Working` |
| `/api/admin/pricing` | GET, POST | Admin | Views and updates dynamic vehicle pricing rules | `Working` |
| `/api/admin/vendors/[id]` | GET | Admin | Fetches vendor profile, documents, and onboarding state | `Working` |
| `/api/admin/vendors/[id]/approve` | POST | Admin | Approves partner driver for active fleet duty | `Working` |
| `/api/admin/vendors/[id]/reject` | POST | Admin | Rejects partner driver with reason | `Working` |
| `/api/admin/vendors/video-kyc/pending` | GET | Admin | Lists vendors awaiting video verification | `Working` |
| `/api/admin/vendors/video-kyc/start/[vendorId]` | POST | Admin | Initiates Video KYC room for vendor | `Working` |
| `/api/admin/vendors/video-kyc/complete` | POST | Admin | Approves or rejects vendor Video KYC outcome | `Working` |
| `/api/admin/vehicles/[id]` | GET | Admin | Fetches vehicle details and RC documents | `Working` |
| `/api/admin/vehicles/[id]/approve` | POST | Admin | Approves vehicle for road service | `Working` |
| `/api/admin/vehicles/[id]/reject` | POST | Admin | Rejects vehicle application | `Working` |
| `/api/debug-db` | GET | None | Database diagnostic endpoint | `Needs redesign` (should be disabled in production) |

---

## 6. Database Collections Schema & Integrity Audit

RideNow uses **MongoDB** via **Mongoose 9.1.3** across 12 distinct collections:

```
MongoDB Database: rydex
├── users                      (122 lines schema in jatri, 223 lines in socketServer)
├── bookings                   (389 lines schema)
├── vehicles                   (Registered cars, autos, bikes, trucks)
├── vehicleDocuments           (Cloudinary KYC files: RC, Insurance, DL)
├── wallets                    (User & Driver financial balances)
├── walletTransactions         (Double-entry ledger for credits/debits)
├── fareConfigs                (Base fares, per-km rates, surge multipliers)
├── chatMessages               (In-ride conversation history)
├── pushSubscriptions         (Browser Web Push VAPID credentials)
├── partnerBanks               (Driver payout bank details & UPI IDs)
├── families                   (Passenger emergency contacts & family profiles)
└── legalConsents              (Terms of Service & Privacy Policy acceptance logs)
```

### Detailed Schema Analysis

1. **`users` (`user.model.ts`)**
   * **Fields:** `name`, `email` (sparse unique), `password`, `mobileNumber` (sparse indexed), `isMobileVerified`, `role` (`user` \| `vendor` \| `admin`), `isOnline`, `socketId`, `location` (GeoJSON Point), `walletBalance`, `isStudent`, `vendorStatus`, `vendorOnboardingStep`, `videoKycStatus`.
   * **Geospatial Indexes:** `UserSchema.index({ location: "2dsphere" })` and compound `UserSchema.index({ location: "2dsphere", role: 1, isOnline: 1 })`.
   * **Flaw Identified:** Schema divergence between `jatri/src/models/user.model.ts` and `socketServer/models/user.models.js`. `socketServer` defines `email` as `required: true, unique: true` without `sparse: true`, causing update failures for mobile-only users.

2. **`bookings` (`booking.model.ts`)**
   * **Fields:** `user`, `driver`, `vehicle`, `pickupAddress`, `dropAddress`, `pickupLocation` (Point), `dropLocation` (Point), `fare`, `fareBreakdown`, `status`, `paymentStatus`, `pickupOtp`, `dropOtp`, `candidateDrivers` (Array of ObjectIds), `currentDriverIndex`, `isPanicActive`, `shareToken`, `isMultiStop`, `stops`, `isFamilyRide`, `isScheduled`, `scheduledPickupTime`, `acceptedAt`, `startedAt`, `completedAt`, `cancellationDetails`.
   * **Geospatial Indexes:** `pickupLocation: "2dsphere"`, `dropLocation: "2dsphere"`.
   * **Flaw Identified:** Status enum contains 11 states (`requested`, `awaiting_payment`, `confirmed`, `started`, `completed`, `cancelled`, `rejected`, `expired`, `auto_rematching`, `no_drivers_available`, `scheduled`). No DB-level state machine transition constraint prevents an expired or cancelled ride from receiving a payment update.

3. **`wallets` (`wallet.model.ts`) vs `walletTransactions` (`wallet-transaction.model.ts`)**
   * **Fields in Wallet:** `userId`, `balance`, `currency`, `totalEarnings`, `totalCommission`, `totalWithdrawn`.
   * **Fields in Transaction:** `walletId`, `userId`, `rideId`, `type` (`credit` \| `debit`), `transactionType` (`EARNING` \| `COMMISSION` \| `TOPUP` \| `WITHDRAWAL` \| `REFUND`), `amount`, `balanceBefore`, `balanceAfter`, `status`.
   * **Flaw Identified:** `User.walletBalance` is maintained alongside `Wallet.balance`. In `settlePayment.ts`, both fields are updated non-atomically. If `wallet.save()` succeeds but `User.findByIdAndUpdate` fails, customer or driver balances permanently diverge.

4. **`fareConfigs` (`fareConfig.model.ts`)**
   * **Fields:** `vehicleType`, `baseFare`, `pricePerKm`, `pricePerMinute`, `multiplier` (surge), `minDistance`, `maxDistance`.
   * **Flaw Identified:** If collection is empty, `fareEngine.ts` falls back to hardcoded `DEFAULT_VEHICLE_RATES` in JavaScript rather than guaranteeing seeded records in DB.

---

## 7. Environment Variables & Security Audit

### Environment Variable Matrix

| Variable Name | Exposure | Required By | Documented in `.env.example`? | Risk Level |
|---|---|---|---|---|
| `MONGODB_URI` / `MONGODB_URL` | Server Only | Next.js API & Socket Server | Yes | Normal |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Server Only | NextAuth v5 session encryption | Yes | Normal |
| `GOOGLE_CLIENT_ID` | Server Only | NextAuth Google OAuth | Yes | Low |
| `GOOGLE_CLIENT_SECRET` | Server Only | NextAuth Google OAuth | Yes | High |
| `RAZORPAY_KEY_ID` | Server Only | Razorpay SDK Order Creation | Yes | Low |
| `RAZORPAY_KEY_SECRET` | Server Only | Razorpay Signature Verification | Yes | Critical |
| `NEXT_PUBLIC_RAZORPAY_KEY` | Client (Public) | Razorpay Frontend Checkout Modal | Yes | Low |
| `NEXT_PUBLIC_SOCKET_SERVER` | Client (Public) | Client Socket.IO connection | Yes | Low |
| `CLOUDINARY_CLOUD_NAME` | Server Only | Document KYC Uploads | Yes | Low |
| `CLOUDINARY_API_KEY` | Server Only | Document KYC Uploads | Yes | Low |
| `CLOUDINARY_API_SECRET` | Server Only | Document KYC Uploads | Yes | High |
| `ZEGO_APP_ID` | Server Only | ZegoCloud WebRTC Token Generator | Yes | Low |
| `ZEGO_SERVER_SECRET` | Server Only | ZegoCloud Server Signature | Yes | Critical |
| `NEXT_PUBLIC_ZEGO_APP_ID` | Client (Public) | ZegoCloud UIKit Component | Yes | Low |
| **`NEXT_PUBLIC_ZEGO_SERVER_SECRET`** | **Client (Public)** | `video-kyc/[roomId]/page.tsx` line 169 | **NO** | **CRITICAL SECURITY RISK** |
| `RESEND_API_KEY` | Server Only | Email OTP & Receipts | Yes | Medium |
| `WHATSAPP_API_TOKEN` | Server Only | Meta WhatsApp Cloud API | **NO** | High |
| `WHATSAPP_PHONE_NUMBER_ID` | Server Only | Meta WhatsApp Cloud API | **NO** | Medium |
| `UPSTASH_REDIS_REST_URL` | Server Only | Distributed Caching & Rate Limiting | **NO** | Low |
| `UPSTASH_REDIS_REST_TOKEN` | Server Only | Distributed Caching & Rate Limiting | **NO** | High |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Client (Public) | Web Push Browser Subscription | **NO** | Low |
| `VAPID_PRIVATE_KEY` | Server Only | Web Push Payload Signing | **NO** | High |
| `VAPID_SUBJECT` | Server Only | Web Push Contact Mailto | **NO** | Low |

### Vulnerability Findings:
1. **Critical Secret Exposure:** `NEXT_PUBLIC_ZEGO_SERVER_SECRET` is referenced on line 169 and 199 in `jatri/src/app/video-kyc/[roomId]/page.tsx` as a test fallback (`ZegoUIKitPrebuilt.generateKitTokenForTest`). Any client viewing this page can inspect browser network/scripts and extract the ZegoCloud server secret.
2. **Missing Environment Keys in Template:** 7 active environment variables (`WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) are missing from `.env.example`.
3. **Hardcoded Fallback VAPID Keys:** `jatri/src/lib/webPush.ts` embeds public and private fallback keys directly in source code if environment variables are not set.

---

## 8. Architectural & End-to-End Data Flows

### A. Customer Booking & Dispatch Journey
```
1. USER (/book)
   ├── Selects Pickup & Drop on MapLibre GL Map (Photon OSM Geocoding)
   ├── Distance & Route Polylines calculated via Valhalla / OSRM API
   ├── Distance-only Fare Breakdown computed via fareEngine.ts
   └── Clicks "Book Ride" ──► Redirects to /checkout?params...

2. CHECKOUT (/checkout)
   ├── Hydrates parameters (Query strings or sessionStorage draft)
   ├── Validates WhatsApp Phone Verification (PhoneLinkModal)
   ├── POST /api/booking/create
   │    ├── Geospatial query for nearby online drivers within 10km
   │    ├── (If none: creates mock driver "fleet.driver@ridenow.com")
   │    ├── Inserts booking record (status: "requested")
   │    ├── Emits "new-booking" socket event to driver
   │    └── Dispatches Web Push notification to candidate driver
   └── Client enters 20-second countdown polling / socket listener

3. DRIVER RADAR (/partner/pending-requests)
   ├── Driver receives "new-booking" socket event & audio chime
   ├── Clicks "Accept Ride" ──► POST /api/booking/[id]/accept
   ├── Status updates to "awaiting_payment" (or "confirmed" for Cash)
   └── Socket emits "booking-accepted" to customer room

4. PAYMENT SETTLEMENT (/checkout ──► /ride/[id])
   ├── Case A (Cash): User selects Cash ──► POST /confirm-payment ──► Status: "confirmed"
   ├── Case B (Online): User pays via Razorpay / Wallet ──► Status: "confirmed"
   └── Customer auto-redirected to /ride/[id]
```

### B. Driver Fulfillment & Safety Journey
```
1. DRIVER APPROACH (/partner/active-ride)
   ├── Driver clicks "Arrived at Pickup" ──► POST /api/booking/[id]/arrived
   ├── System generates 4-digit pickupOtp; sent to Rider via Push & In-App UI
   └── Rider meets driver

2. TRIP START
   ├── Driver asks rider for Pickup OTP
   ├── Driver enters OTP ──► POST /api/partner/bookings/verify-pickup-otp
   └── Status updates to "started"; start timestamp recorded

3. TRIP IN PROGRESS
   ├── Driver GPS updates stream via socket ("driver-location-update")
   ├── Rider map renders live animated vehicle with calculated bearing
   ├── Safety Engine monitors distance to polyline (triggers check-in if >300m drift)
   └── Both parties have access to In-Ride WebRTC audio call & In-Ride chat

4. TRIP COMPLETION & SETTLEMENT
   ├── Driver clicks "Complete Ride" ──► Triggers Drop OTP challenge
   ├── Driver inputs Drop OTP ──► POST /api/partner/bookings/verify-drop-otp
   ├── Status updates to "completed"
   └── SettlePayment.ts executes:
        ├── Online: Gross fare credited to platform, 85% net earnings credited to Driver Wallet
        └── Cash: 100% fare in driver hand, 15% platform commission debited from Driver Wallet
```

---

## 9. Identified Code Duplication

1. **Haversine Distance Calculations:**
   * Found in `jatri/src/lib/routeUtils.ts` (`haversineKm`).
   * Duplicated inline in `jatri/src/lib/fareEngine.ts`.
   * Duplicated inline in `jatri/src/app/api/booking/create/route.ts` (`haversineDistance`).
   * Duplicated in `jatri/src/components/RouteMap.tsx`.
   * Duplicated in `jatri/src/components/LiveTrackingMap.tsx`.
   * *Remediation:* Centralize all distance, bearing, and polyline operations strictly into `@/lib/routeUtils.ts`.

2. **User Models Between Repositories:**
   * `jatri/src/models/user.model.ts` (TypeScript, Next.js).
   * `socketServer/models/user.models.js` (JavaScript, Express Socket Server).
   * *Risk:* Schema drift. Changes made to one model are not reflected in the other, causing database indexing conflicts and silent write failures.

3. **Driver Cancellation Reasons & Penalties:**
   * Redundant reason arrays declared in `ride/[id]/page.tsx` and `partner/active-ride/page.tsx`.
   * *Remediation:* Move cancellation reasons and penalty tier formulas to a unified config in `@/lib/cancellationRules.ts`.

4. **Phone OTP Generation & Normalization:**
   * Phone digit cleaning (`replace(/\D/g, "")`) and 10-digit formatting duplicated across `api/auth/phone/send-otp`, `api/auth/phone/verify-otp`, `api/auth/phone/link`, `auth.ts`, and `whatsapp.ts`.

---

## 10. Temporary & Mock Data Audit

1. **Auto-Generated Mock Driver Fallback:**
   * **Location:** `jatri/src/app/api/booking/create/route.ts` lines 205–258.
   * **Mock Details:** If no registered driver is online within 10km, the server creates or updates a fictitious driver:
     * Email: `fleet.driver@ridenow.com`
     * Phone: `"9876543210"`
     * Vehicle Number: `RN-CAR-101`
     * Status: `approved`
   * **Status:** `Mocked`. Masks empty database states in staging, but would cause ghost ride dispatches in a live environment.

2. **Hardcoded Fallback Coordinates:**
   * **Location:** `jatri/src/components/RouteMap.tsx` line 54 and `LiveTrackingMap.tsx`.
   * **Mock Coordinates:** `[78.9629, 20.5937]` (geographic center of India) used whenever geolocation fails.

3. **Fallback VAPID Signing Credentials:**
   * **Location:** `jatri/src/lib/webPush.ts` lines 7–12.
   * Hardcoded demo keys embedded in source code as defaults.

---

## 11. Hardcoded Values Audit

1. **Platform Commission Percentage Inconsistency:**
   * `jatri/src/app/api/booking/create/route.ts` line 375: `calculatedFare * 0.1` (**10% Commission**).
   * `jatri/src/lib/settlePayment.ts` line 43: `fare * 0.15` (**15% Commission**).
   * **Impact:** Booking receipt shows 10% commission, but wallet settlement debits 15%!

2. **Fixed Platform Service Fee:**
   * `jatri/src/lib/fareEngine.ts` line 65: `const platformFee = 15;` (₹15 hardcoded).

3. **Fixed GST Tax Rate:**
   * `jatri/src/lib/fareEngine.ts` line 73: `subtotalWithSurge * 0.05` (5% GST hardcoded).

4. **Fixed Estimated Travel Speed:**
   * `jatri/src/lib/fareEngine.ts` line 63: `(distKm / 25) * 60` (Hardcoded 25 km/h urban speed assumption).

5. **Hardcoded Fallback Phone Numbers:**
   * `jatri/src/app/api/booking/create/route.ts` line 344: `"9876543210"`.

---

## 12. Unused Packages & Dependencies

Inspecting `jatri/package.json` against actual project imports:

1. **`leaflet` (v1.9.4) & `react-leaflet` (v5.0.0) & `@types/leaflet` (v1.9.21):**
   * **Audit Finding:** Leaflet was historically used for the map view. The entire project was migrated to WebGL-based **MapLibre GL** (`RouteMap.tsx`, `LiveTrackingMap.tsx`, `DriverLocationMap.tsx`).
   * **Source Search:** `grep` confirms **zero** active imports of `leaflet` or `react-leaflet` in `src/`.
   * **Impact:** ~180 KB of unnecessary vendor JavaScript dependencies packaged in `node_modules` and risk of accidental import.
   * **Status:** `Unused package` — candidate for immediate removal.

---

## 13. Unused & Orphaned Files

1. **`jatri/src/app/checkout/page_new.tsx`:**
   * 1,388 lines of experimental checkout code. Not accessible via Next.js routing. Orphaned draft file.
2. **`jatri/src/auth/index.ts`:**
   * 0 bytes file. Completely empty.
3. **`jatri/src/auth/server.ts`:**
   * Contains dummy mock authentication function (`token: "dummy-token"`). Not used anywhere; the actual NextAuth configuration lives in `jatri/src/auth.ts`.
4. **`jatri/src/app/booking/page.tsx`:**
   * 6 lines file that only does `redirect("/book")`.

---

## 14. Broken Links, Console & Network Errors

1. **Browser Refresh Destroys Active Booking State:**
   * On `/checkout`, booking state is kept in React local state (`bookingId`). Although `/api/booking/my-active` polls in the background, a hard refresh before payment causes state desynchronization and re-triggers create booking requests.
2. **Uncaught Video KYC Token Exception:**
   * In `/video-kyc/[roomId]/page.tsx`, if the server token endpoint `/api/zego/token` fails or is delayed, the code immediately catches and attempts `generateKitTokenForTest` with `NEXT_PUBLIC_ZEGO_SERVER_SECRET`, throwing a runtime console warning if the environment variable is undefined.
3. **`debug-db` Route Exposed:**
   * `/api/debug-db` exposes raw database connection status to anyone without authentication.

---

## 15. State Machine Transition Audit

The RideNow booking state machine lifecycle:

```
                    ┌──────────────┐
                    │  REQUESTED   │
                    └──────┬───────┘
                           │ Driver Match
                    ┌──────▼───────┐
                    │AWAITING_PAYMT│
                    └──────┬───────┘
                           │ Payment Confirmed (Cash / Online)
                    ┌──────▼───────┐
                    │  CONFIRMED   │◄─── (Driver On The Way)
                    └──────┬───────┘
                           │ Pickup OTP Verified
                    ┌──────▼───────┐
                    │   STARTED    │◄─── (Trip In Progress)
                    └──────┬───────┘
                           │ Drop OTP Verified
                    ┌──────▼───────┐
                    │  COMPLETED   │───► Financial Settlement
                    └──────────────┘

Alternative Exit Paths:
├── CANCELLED             (Passenger or driver cancels before trip start)
├── REJECTED / TIMEOUT    (Driver declines; auto-rematches to next candidate)
├── NO_DRIVERS_AVAILABLE  (Exhausted candidate queue within 10km radius)
└── EXPIRED               (Payment deadline passed or request timed out)
```

### Critical State Transition Flaws Identified:
1. **Concurrent Accept Race Condition:** If two candidate drivers accept the same booking simultaneously, there is no MongoDB optimistic lock (`versionKey` or atomic `findOneAndUpdate({ _id, status: "requested" })`). Both drivers could be assigned.
2. **Non-Idempotent Settlement:** If `/api/partner/bookings/verify-drop-otp` is triggered multiple times due to poor mobile network retries, `settlePayment.ts` checks `WalletTransaction.findOne`, which prevents duplicate earnings, but the wallet update itself is not wrapped in a MongoDB ACID session transaction.

---

## 16. Master Remediation Roadmap (Phase Alignment)

```
Phase 0: Baseline Freeze & Current State Audit  ◄── [COMPLETED BY THIS DOCUMENT]
Phase 1: Frontend Architecture & Modularization (Break up monolithic pages into features/)
Phase 2: Booking Engine & State Machine Hardening (Atomic transitions & MongoDB transactions)
Phase 3: Financial Engine & Settlement Reconciliation (Resolve 10% vs 15% discrepancy)
Phase 4: Security Hardening & Secret Protection (Eradicate NEXT_PUBLIC_ZEGO_SERVER_SECRET)
Phase 5: Package & Asset Clean Up (Prune Leaflet, delete orphaned page_new.tsx & auth stubs)
```

---
*Baseline Audit Certified for `audit/baseline-v1`.*
