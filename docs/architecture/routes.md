# Jaatri Route Inventory & Access Permissions

> **Last Verified**: October 18, 2026  
> **Total Routes**: 70+ Page & API routes  
> **Route Guard Middleware**: `jatri/src/proxy.ts`

---

## 1. Public Pages (No Authentication Required)

| Route | Page File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page, hero search, fleet carousel, app download CTA |
| `/book` | `src/app/book/page.tsx` | Main ride search, waypoint selector, fare estimate, vehicle tier picker |
| `/booking` | `src/app/booking/page.tsx` | Booking entry point and query parser |
| `/bookings` | `src/app/bookings/page.tsx` | Ride history and active ride redirector |
| `/fleet` | `src/app/fleet/page.tsx` | Comprehensive showcase of all 8 vehicle tiers with pricing and specs |
| `/search` | `src/app/search/page.tsx` | Location search and nearby vehicle availability |
| `/faq` | `src/app/faq/page.tsx` | Frequently Asked Questions |
| `/contact` | `src/app/contact/page.tsx` | Customer support contact details |
| `/safety` | `src/app/safety/page.tsx` | Safety guidelines, SOS overview, driver vetting standards |
| `/terms` | `src/app/terms/page.tsx` | Terms of service |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy and data retention disclosures |
| `/partner-terms` | `src/app/partner-terms/page.tsx` | Partner terms and vehicle compliance agreements |
| `/payment-terms` | `src/app/payment-terms/page.tsx` | Payment processing and refund policies |
| `/cancellation-refund` | `src/app/cancellation-refund/page.tsx` | Cancellation fee tiers and refund rules |
| `/cookies` | `src/app/cookies/page.tsx` | Cookie and local telemetry policy |
| `/grievance` | `src/app/grievance/page.tsx` | Statutory grievance redressal officer info |

---

## 2. Authenticated Rider Pages (`role: user | vendor | admin`)

| Route | Page File | Access Requirement | Purpose |
|---|---|---|---|
| `/checkout` | `src/app/checkout/page.tsx` | Logged In | Payment method selection (UPI/Razorpay/Cash), ride confirmation |
| `/ride/[id]` | `src/app/ride/[id]/page.tsx` | Logged In (Owner/Driver/Admin) | Live ride telemetry, driver tracking, SOS, chat, OTP display |
| `/profile` | `src/app/profile/page.tsx` | Logged In | User profile, emergency contacts, linked student email |
| `/wallet` | `src/app/wallet/page.tsx` | Logged In | Rider wallet balance, topup, transaction history |
| `/track/[token]` | `src/app/track/[token]/page.tsx` | Public or Logged In with Token | Emergency live ride tracking shared with family/friends |
| `/group/join` | `src/app/group/join/page.tsx` | Logged In | Join split-fare group ride via invite code |

---

## 3. Partner / Driver Pages (`role: vendor | admin`)

| Route | Page File | Access Requirement | Purpose |
|---|---|---|---|
| `/partner` | Redirects in `proxy.ts` | Any User | If vendor -> `/partners/dashboard`; Else -> `/partner/onboard/vehicle` |
| `/partner/onboard/vehicle` | `src/app/partner/onboard/vehicle/page.tsx` | Logged In (Step 1) | Vehicle registration (number, model, category, RC) |
| `/partner/onboard/documents` | `src/app/partner/onboard/documents/page.tsx` | Logged In (Step 2) | Document upload (DL, Aadhaar, Insurance, Fitness) |
| `/partner/onboard/bank` | `src/app/partner/onboard/bank/page.tsx` | Logged In (Step 3) | Bank account details & UPI VPA for payouts |
| `/video-kyc/[roomId]` | `src/app/video-kyc/[roomId]/page.tsx` | Logged In Partner | WebRTC video KYC verification with admin |
| `/partners/dashboard` | `src/app/partners/dashboard/page.tsx` | Role: `vendor` or `admin` | Driver partner console, duty toggle (online/offline), wallet, incoming requests |
| `/partner/active-ride` | `src/app/partner/active-ride/page.tsx` | Role: `vendor` or `admin` | Driver turn-by-turn navigation, pickup/drop OTP entry, ride actions |
| `/partner/bookings` | `src/app/partner/bookings/page.tsx` | Role: `vendor` or `admin` | Driver completed trips and earnings breakdown |
| `/partner/wallet` | `src/app/partner/wallet/page.tsx` | Role: `vendor` or `admin` | Driver ledger, platform commission dues, 1-tap dues settlement |
| `/partner/pending-requests` | `src/app/partner/pending-requests/page.tsx` | Role: `vendor` or `admin` | Broadcast ride requests queue awaiting acceptance |

---

## 4. Admin Portal (`role: admin`)

| Route | Page File | Access Requirement | Purpose |
|---|---|---|---|
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | Role: `admin` | System-wide statistics, active rides, driver metrics |
| `/admin/vendors/[id]` | `src/app/admin/vendors/[id]/page.tsx` | Role: `admin` | Driver partner profile, document audits, approval/rejection |
| `/admin/vehicles/[id]` | `src/app/admin/vehicles/[id]/page.tsx` | Role: `admin` | Vehicle inspection, fitness certificate verification |

---

## 5. API Route Handlers

### Auth & User APIs
- `POST /api/auth/[...nextauth]` — NextAuth v5 session handler.
- `POST /api/auth/phone/send-otp` — Dispatches 6-digit OTP via WhatsApp Cloud API / SMS.
- `POST /api/auth/phone/verify-otp` — Verifies phone OTP and links/logs in user.
- `POST /api/auth/register` — Standard email/password registration.
- `GET /api/me` — Fetches current authenticated session user.
- `POST /api/user/verify-student` — Verifies academic institutional email (`.edu`, `.ac.in`).
- `GET|POST /api/user/family` — Family account management and spending caps.

### Booking & Dispatch APIs
- `POST /api/booking/create` — Computes upfront fare, selects nearby drivers, creates booking.
- `GET /api/booking/my-active` — Restores rider's currently active ride state on load.
- `GET /api/booking/[id]` — Retrieves full booking details.
- `POST /api/booking/[id]/accept` — Driver accepts broadcast request (atomic first-to-claim).
- `POST /api/booking/[id]/arrived` — Driver notifies arrival at pickup point.
- `POST /api/booking/[id]/start` — Driver verifies 4-digit pickup OTP to commence trip.
- `POST /api/booking/[id]/complete` — Driver verifies cryptographic drop OTP to finalize trip.
- `POST /api/booking/[id]/cancel` — Cancels ride with fee assessment via `cancellationEngine.ts`.
- `POST /api/booking/[id]/rematch` — Automatically cascades to next nearest candidate driver.
- `POST /api/booking/[id]/confirm-payment` — Confirms cash or online payment completion.
- `POST /api/booking/[id]/panic` — Triggers emergency SOS broadcast with live coordinates.

### Partner / Driver APIs
- `POST /api/partner/status` — Toggles driver online/offline duty status and GPS coordinates.
- `GET /api/partner/bookings/active` — Retrieves driver's currently assigned active ride.
- `GET /api/partner/bookings/pending` — Polls incoming broadcast ride requests.
- `POST /api/partner/bookings/verify-pickup-otp` — Verifies passenger pickup PIN.
- `POST /api/partner/bookings/verify-drop-otp` — Verifies passenger drop PIN.
- `POST /api/partner/wallet/settle-dues` — Creates Razorpay order for driver platform dues.
- `POST /api/partner/wallet/withdraw` — Driver earnings payout request.

### Maps & Routing APIs
- `POST /api/route` — Valhalla / OSRM route geometry and polyline generation.
- `POST /api/places` — Geocoding and autocomplete search for locations in Assam.
- `POST /api/places/smart-pickups` — Smart transit hub pickup spot suggestions.
- `POST /api/vehicles/nearby` — Retrieves sanitized nearby driver coordinates.

### Payment & Webhooks
- `POST /api/payment/create` — Initiates Razorpay payment order.
- `POST /api/payment/verify` — Validates Razorpay HMAC SHA256 signature.
- `POST /api/payment/webhook` — Idempotent Razorpay webhook event processing.
