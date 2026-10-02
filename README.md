# 🚗 RideNow – Next-Generation Urban Mobility & Vehicle Booking Platform

<p align="center">
  <a href="https://github.com/niyar18/RideNow-vehicle-booking-site">
    <img src="https://img.shields.io/badge/🚀%20Live%20Web%20App-Launch%20RideNow-10b981?style=for-the-badge&logo=safari&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/niyar18/RideNow-vehicle-booking-site">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <img src="https://img.shields.io/badge/Next.js%2016-Turbopack-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
</p>

---

### 🌐 Live Application Link
> **Experience RideNow Live**: [**https://ridenow-mobility.vercel.app**](#-live-application-link) *(or update with your live deployment URL)*  
> Anyone visiting this repository can click the button above to directly explore instant vehicle bookings, WhatsApp OTP authentication, live driver dispatch, and the driver wallet.

---

## 🌟 Key Platform Features

### 1. 👥 Group Ride Splitting
- Split trip fares seamlessly among friends and colleagues with unique invite tokens.
- Dynamic per-passenger fare calculation updating in real time as participants join or decline.
- Visual passenger roster and payment contribution tracking.

### 2. 📍 Smart Pickup Spot Suggester
- AI-inspired pickup recommendation engine for transit hubs, airports, corporate tech parks, and commercial centers.
- Automatically calculates pedestrian walking time and distance to optimized pickup gates for faster dispatch.
- Visual badge highlighting fast-dispatch spots with one-click selection.

### 3. 🔄 Auto-Rematch Driver Failover
- Automated multi-driver dispatch cascade when a driver rejects or times out on a trip request.
- Real-time status sync via WebSockets with visual countdown timer and seamless rematch progression.
- Graceful fallbacks ensuring riders are never left stranded.

### 4. 🛡️ In-Ride Safety Monitor & Live SOS
- Automated safety check-in prompts triggered during extended trip stops or unexpected route deviations.
- One-tap Emergency SOS panic button broadcasting instant alerts with live GPS coordinates to the safety operations center.
- Continuous rider peace-of-mind with real-time trip status tracking.

### 5. 🏷️ Transparent Fare Breakdown Engine
- Complete, crystal-clear fare transparency prior to booking confirmation.
- Interactive fare breakdown itemizing base fare, distance charges, night travel allowance, surge multiplier, student concessions, and platform fees.

### 6. 🎓 Student Verification & Discount Mode
- Dedicated student verification portal validating accredited institutional domains (`.edu`, `.ac.in`).
- Automated 15% promotional discount applied across daily campus commutes.
- Instant digital student verification badge.

### 7. 🗺️ Multi-Stop Route Planner & Fare Matrix
- Add, reorder, and remove multiple waypoints along the journey.
- Real-time route polyline rendering and cumulative distance computation via Haversine geometry.
- Individual stop arrival estimation and multi-drop itinerary management.

### 8. 👨‍👩‍👧 Family & Corporate Linked Accounts
- Centralized billing supporting primary account holders and authorized secondary members.
- Configurable monthly trip spending caps with per-ride balance verification.
- Instant member invitation and real-time wallet deduction.

### 9. 📅 Scheduled Rides Dispatch Calendar
- Advance ride reservations with integrated date and time picker.
- Automated 45-minute pre-dispatch buffer transitioning scheduled bookings into active driver matchmaking queues.
- Rider calendar management with instant cancellation or rescheduling capabilities.

### 10. 📹 Live Video KYC & Partner Onboarding
- Comprehensive multi-step driver partner registration with vehicle inspection and document uploads.
- Real-time WebRTC Video KYC powered by ZegoCloud with live audio/video test and admin verification room.
- Role-based admin approval and rejection workflows.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) |
| **Backend & APIs** | Next.js Route Handlers, [Mongoose ODM](https://mongoosejs.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) (Atlas or local instance) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) (Credentials, Google OAuth) |
| **Realtime Telemetry** | [Socket.IO](https://socket.io/) (Node.js microservice + Client) |
| **Mapping & Routing** | [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/), OpenStreetMap |
| **Payment Gateway** | [Razorpay](https://razorpay.com/) (Checkout & HMAC signature verification) |
| **Video Infrastructure** | [ZegoCloud WebRTC UIKit](https://www.zegocloud.com/) |
| **Media Storage** | [Cloudinary](https://cloudinary.com/) |
| **Email Service** | [Resend](https://resend.com/) |

---

## 📁 Repository Structure

```text
RideNow-vehicle-booking-site/
├── rydex/                     # Next.js 16 Full-Stack Application
│   ├── public/                # Static assets, branding, and icons
│   ├── src/
│   │   ├── app/               # App Router pages and REST API routes
│   │   │   ├── admin/         # Admin fleet management and KYC verification
│   │   │   ├── api/           # Protected API routes (bookings, auth, payments, partners)
│   │   │   ├── book/          # Multi-step ride booking & vehicle selector
│   │   │   ├── checkout/      # Razorpay payment & ride confirmation
│   │   │   ├── partner/       # Driver partner onboarding portal
│   │   │   ├── video-kyc/     # ZegoCloud WebRTC verification room
│   │   │   └── ...
│   │   ├── components/        # Reusable React components & maps
│   │   ├── lib/               # Utility modules (fareEngine, routeUtils, db, razorpay)
│   │   ├── models/            # Mongoose schemas (User, Vehicle, Booking, FareConfig)
│   │   ├── redux/             # Redux Toolkit store & user slices
│   │   ├── auth.ts            # NextAuth configuration and callbacks
│   │   └── proxy.ts           # Route protection & role middleware
│   ├── .env.example           # Environment template for frontend/API
│   └── package.json           # Frontend dependencies & scripts
│
├── socketServer/              # Standalone Realtime WebSocket Service
│   ├── server.js              # Socket.IO event handler for driver GPS & trip updates
│   └── package.json           # WebSocket microservice dependencies
│
├── scripts/                   # Database validation & test utility scripts
├── .gitignore                 # Top-level repository ignore rules
├── .env.example               # Root environment variable documentation
└── README.md                  # Comprehensive platform documentation
```

---

## ⚙️ Environment Variables

Create a `.env.local` file inside the `rydex/` directory (see [.env.example](.env.example)):

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rydex?retryWrites=true&w=majority

# NextAuth Authentication
AUTH_SECRET=your_generated_secret_base64_string
NEXTAUTH_SECRET=your_generated_secret_base64_string

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_test_yourKeyId
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_yourKeyId

# Realtime WebSocket Server
NEXT_PUBLIC_SOCKET_SERVER=http://localhost:5000

# Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ZegoCloud Video KYC
ZEGO_APP_ID=1234567890
ZEGO_SERVER_SECRET=your_zego_server_secret
NEXT_PUBLIC_ZEGO_APP_ID=1234567890

# Email Delivery (Resend)
RESEND_API_KEY=re_your_api_key
```

---

## 🚀 Getting Started

### 1. Clone Repository
```bash
git clone https://github.com/niyar18/RideNow-vehicle-booking-site.git
cd RideNow-vehicle-booking-site
```

### 2. Start the Real-time Socket Service
```bash
cd socketServer
npm install
npm run dev # Runs on port 5000
```

### 3. Start the Next.js Web Application
In a separate terminal window:
```bash
cd rydex
npm install
npm run dev # Runs on http://localhost:3000
```

### 4. Build for Production
```bash
cd rydex
npm run build
npm run start
```

---

## 🔐 Role-Based Access & Admin Panel

RideNow features three role levels enforced by middleware (`src/proxy.ts`):
- **User (Rider)**: Access to booking, ride history, group rides, safety SOS, and family accounts.
- **Vendor (Driver Partner)**: Access to vehicle onboarding, trip dispatch acceptance, OTP verification, and earnings dashboard.
- **Admin**: Access to fleet management, driver document approvals, live video KYC verification, and dynamic pricing rules.

To grant administrative access to a user account, set `"role": "admin"` on the user document in MongoDB.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
