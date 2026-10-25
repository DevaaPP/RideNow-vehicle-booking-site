# 🚗 Jaatri (যাত্ৰী) / RideNow — Hyperlocal Urban Mobility & Logistics Platform

<p align="center">
  <a href="https://ridenow-vehicle-booking-site.vercel.app" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/🚀%20Live%20Web%20App-Launch%20Jaatri-046A38?style=for-the-badge&logo=safari&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/niyar18/RideNow-vehicle-booking-site">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <img src="https://img.shields.io/badge/Next.js%2016-Turbopack-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React%2019-Enabled-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS v4" />
</p>

---

### 🌐 Live Application
> **Experience Jaatri Live**: [**https://ridenow-vehicle-booking-site.vercel.app**](https://ridenow-vehicle-booking-site.vercel.app)  
> Full-featured ride-hailing and parcel logistics across Northeast India (Guwahati, Shillong, Kaziranga, Majuli, and beyond). Includes WhatsApp & SMS authentication, live driver dispatch, MapLibre GL vector tracking, and driver wallet settlements.

---

## 🌟 Platform Capabilities

### 1. 🛞 Comprehensive Multi-Tier Fleet
Support for 8 distinct transport categories tailored for Northeast India's topography:
- **Scooty & Moto**: Rapid single-passenger intra-city travel through dense urban corridors.
- **Auto Rickshaw**: Economical point-to-point transit.
- **Car Mini & Premier**: Compact sedans and premium air-conditioned city transit.
- **Car XL / Priority SUV**: High-capacity family and all-terrain hill journeys.
- **Express Mini & Freight Truck**: On-demand cargo logistics, goods movement, and commercial dispatch.

### 2. 🗺️ Flexible Booking Modes
- **Instant City Rides**: Automated broadcast dispatch matching nearby online drivers in parallel.
- **Advance Scheduled Reservations**: Date & time picker with automated 45-minute pre-dispatch buffer.
- **Outstation & Inter-District Travel**: Specialized point-to-point routes between key hubs (e.g., Guwahati to Shillong, Jorhat, Tezpur).
- **Parcel & Cargo Delivery**: Dedicated commercial logistics booking with weight tiering and payload management.

### 3. 🛡️ Rider Safety & Cryptographic Security
- **Dual-Stage CSPRNG OTP Verification**: 4-digit cryptographically secure pickup PIN and drop PIN preventing unauthorized ride start or premature completion.
- **Masked Calling & In-Ride WebRTC Audio**: Virtualized calling protects user phone numbers during pickups; direct in-ride audio powered by ZegoCloud.
- **Emergency Panic / SOS**: One-tap trigger dispatching instant alerts, real-time GPS coordinates, and vehicle details to the safety response center.
- **Cryptographic Live Trip Sharing**: Tamper-proof public tracking URLs (`/track/[token]`) generated via `crypto.randomBytes(16)` with zero credential leaks.

### 4. 💰 Financial Architecture & Driver Ledger
- **Race-Safe Wallet Ledger**: Unique compound indexing (`{ referenceId: 1, type: 1 }`) and atomic balance increment locks physically eliminate double credits.
- **Distributed Redis Idempotency**: Upstash Redis distributed locks and rate limiting protect payment completion, checkout verification, and wallet top-ups.
- **Resilient Trip Settlements**: Decoupled settlement state (`pending | settled | failed`) ensures ride completion never crashes on gateway delays, with dedicated admin retry (`/api/admin/booking/[id]/retry-settlement`) and automated ledger audit reconciliation (`/api/admin/wallet-audit`).
- **Flexible Payments & Dues Recovery**: Razorpay UPI/cards, split wallet + online checkout, cash trip commission accounting, and automated platform dues enforcement (₹300 cap).

### 5. 👥 Community & Social Mobility
- **Group Ride Fare Splitting**: Invite link generator allowing passengers to split trip costs dynamically with real-time contribution tracking.
- **Family & Corporate Linked Accounts**: Shared billing with monthly trip spending caps and per-ride authorization controls.
- **Student Verification & Concessions**: Domain verification (`.edu`, `.ac.in`) offering instant digital pass verification and daily commute discounts.
- **Smart Pickup Spot Suggester**: Walk-time calculation to optimal airport gates, transit centers, and commercial hubs.

### 6. 📱 Mobile-First Native Experience
- **Touch-First Ergonomics**: Strict 44×44px minimum touch targets, thumb-zone primary CTAs, dynamic viewports (`100dvh`), and safe-area inset preservation (`env(safe-area-inset-bottom)`).
- **Assam Scenic Visual Identity**: Warm ivory (`#FAF7F0`), forest green (`#123D32`), and primary emerald (`#046A38`) palette with dark twilight theme and zero reload flash (FOUC-free).
- **Network Resilience**: 6-second adaptive polling fallback activating automatically during cellular dips in remote or underground routes.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), CSS custom properties |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) |
| **Database & ODM** | [MongoDB Atlas](https://www.mongodb.com/), [Mongoose 9](https://mongoosejs.com/) (19 domain models) |
| **Realtime Telemetry** | Standalone [Socket.IO 4](https://socket.io/) microservice on Node.js / Express 5 |
| **Maps & Spatial Routing** | [MapLibre GL](https://maplibre.org/), OSRM & Valhalla routing, OpenStreetMap vector tiles |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/), Google OAuth, WhatsApp Cloud API & SMS OTP |
| **Payment Gateway** | [Razorpay](https://razorpay.com/) (Checkout & HMAC webhook verification) |
| **Distributed Locks & Cache** | [Upstash Redis](https://upstash.com/) (Idempotency locks, rate limiters) |
| **Audio & Video Infrastructure** | [ZegoCloud WebRTC](https://www.zegocloud.com/) (In-ride calling & Driver Video KYC) |
| **Media & Storage** | [Cloudinary](https://cloudinary.com/) (Driver licenses, vehicle inspection photos) |
| **Transactional Email** | [Resend](https://resend.com/) |

---

## 📁 Repository Structure

```text
RideNow/
├── jatri/                         # Next.js 16 Full-Stack Web Application
│   ├── public/                    # Production-optimized WebP assets, logos, and manifest
│   │   ├── explore/               # Explore destination & activity card imagery
│   │   ├── fleet/                 # Canonical vehicle artwork (8 tiers)
│   │   └── mobile-home/           # Scenic Assamese hero visuals & service cards
│   ├── src/
│   │   ├── app/                   # App Router pages and 40+ REST API routes
│   │   │   ├── admin/             # Operations, KYC approvals, and wallet audit consoles
│   │   │   ├── api/               # Protected REST API routes (booking, auth, wallet, kyc)
│   │   │   ├── book/              # Multi-step ride booking & vehicle selector
│   │   │   ├── checkout/          # Razorpay payment & ride confirmation
│   │   │   ├── partner/           # Driver partner onboarding portal & active ride UI
│   │   │   └── video-kyc/         # ZegoCloud WebRTC verification room
│   │   ├── features/              # Modular domain features (auth, booking, rides, driver, maps)
│   │   ├── shared/                # Reusable cross-feature components and layouts
│   │   ├── lib/                   # Core domain engines:
│   │   │   ├── bookingStateMachine.ts  # Transition matrix with role pre-guards
│   │   │   ├── driverMatchingEngine.ts # Parallel broadcast dispatch engine
│   │   │   ├── fareEngine.ts           # Dynamic fare calculation & rate matrices
│   │   │   ├── walletLedger.ts         # Double-entry atomic ledger & payout locks
│   │   │   ├── paymentService.ts       # Razorpay webhook and payment verification
│   │   │   └── logger.ts               # Centralized structured JSON telemetry
│   │   ├── models/                # 19 Mongoose Schemas (User, Vehicle, Booking, Wallet, etc.)
│   │   ├── redux/                 # Redux Toolkit store & user slices
│   │   ├── auth.ts                # NextAuth v5 configuration and callbacks
│   │   └── proxy.ts               # Edge route protection & role middleware
│   └── package.json
│
├── socketServer/                  # Standalone Realtime WebSocket Service
│   ├── index.js                   # Socket.IO event handler for driver GPS & trip updates
│   ├── test/                      # Socket integration test suites
│   └── package.json
│
├── docs/                          # Authoritative Architecture Intelligence Maps
│   └── architecture/
│       ├── overview.md            # System topology and deployment boundaries
│       ├── mobile-first.md        # Mobile ergonomics, viewports, and safe areas
│       ├── routes.md              # Complete App Router inventory & authorization
│       ├── data-flow.md           # Booking lifecycle, dispatch, and socket events
│       ├── data-models.md         # 19 Mongoose models, indexes, and relations
│       ├── integrations.md        # Razorpay, ZegoCloud, Upstash, Cloudinary
│       ├── design-system.md       # Color tokens, typography, and corner radii
│       ├── testing.md             # Verification procedures and test checklists
│       ├── known-issues.md        # Technical debt resolutions and architectural fixes
│       └── code-index.md          # Symbol index for critical engines and handlers
│
├── CHANGELOG.md                   # Chronological grouped release changelog
├── AGENTS.md                      # Agent Operating System & Repository Guide
└── README.md                      # Master platform documentation
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file inside `jatri/` using [.env.example](jatri/.env.example) as a baseline:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/jatri?retryWrites=true&w=majority

# NextAuth Authentication
AUTH_SECRET=your_generated_secret_base64_string
NEXTAUTH_SECRET=your_generated_secret_base64_string
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_yourKeyId
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_yourKeyId
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Upstash Redis (Distributed locks & rate limiting)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Realtime WebSocket Microservice
NEXT_PUBLIC_SOCKET_SERVER=http://localhost:5000

# Cloudinary Media Storage (Driver KYC & Vehicle Docs)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ZegoCloud (In-Ride Audio & Video KYC)
ZEGO_APP_ID=1234567890
ZEGO_SERVER_SECRET=your_zego_server_secret
NEXT_PUBLIC_ZEGO_APP_ID=1234567890

# Transactional Email (Resend)
RESEND_API_KEY=re_your_api_key
```

---

## 🚀 Local Development Setup

### 1. Clone & Install
```bash
git clone https://github.com/niyar18/RideNow-vehicle-booking-site.git
cd RideNow-vehicle-booking-site

# Install Next.js frontend dependencies
npm --prefix jatri install

# Install WebSocket server dependencies
npm --prefix socketServer install
```

### 2. Run the Real-time Socket Server
```bash
npm --prefix socketServer run dev
# Microservice starts on http://localhost:5000
```

### 3. Run the Next.js Web Application
In a second terminal window:
```bash
npm --prefix jatri run dev
# Web application starts on http://localhost:3000
```

### 4. Code Quality & Production Verification
```bash
# Typecheck TypeScript across all App Router routes (0 errors)
npm --prefix jatri run typecheck

# Verify Next.js production build with Turbopack
npm --prefix jatri run build
```

---

## 🔐 Role-Based Access Control

Jaatri enforces role-based security via edge middleware ([`jatri/src/proxy.ts`](file:///d:/git/RideNow/jatri/src/proxy.ts)):
- **User (Rider)**: On-demand bookings, scheduled rides, outstation, cargo, safety SOS, wallet top-ups, and group ride invitations.
- **Vendor (Driver Partner)**: Vehicle registration, KYC submission, parallel dispatch acceptance, turn-by-turn navigation, and earnings withdrawals.
- **Admin**: Fleet inventory, partner verification, Video KYC room authorization, settlement retries, and wallet ledger audits.

To elevate an account for local administrative access, update the MongoDB user document:
```json
{ "role": "admin" }
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
