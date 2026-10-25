# Jaatri (যাত্ৰী) Architecture Overview

> **Last Verified**: October 18, 2026  
> **Platform Name**: Jaatri (যাত্ৰী) / RideNow  
> **Target Region**: Assam & North-East India  
> **Primary Domains**: Passenger transit, micro-mobility, auto-rickshaws, city cabs, and intra-city freight/logistics.

---

## 1. High-Level System Architecture

Jaatri is architected as a decoupled, multi-service platform:

```
                      ┌────────────────────────────────────────┐
                      │              Web Clients               │
                      │  (Passenger App / Partner PWA / Admin) │
                      └──────────────────┬─────────────────────┘
                                         │
                   HTTP/REST & Next.js   │   WebSocket Telemetry
                   App Router Pages      │   (Socket.IO v4)
                                         ▼
   ┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
   │         Next.js 16 Web & API            │     │         Realtime Socket Server          │
   │            (jatri/)                     │     │            (socketServer/)              │
   │  - App Router (SSR + Client Pages)      │     │  - Realtime Driver GPS Telemetry        │
   │  - Route Handlers (/api/*)              │     │  - Instant Broadcast Dispatch           │
   │  - NextAuth v5 Middleware (proxy.ts)    │     │  - In-Ride Chat & Call Signaling        │
   │  - Domain Engines (Fare, Matching, etc.)│     │  - Participant Authorization Guards     │
   └────────────────────┬────────────────────┘     └────────────────────┬────────────────────┘
                        │                                               │
                        │ Internal HTTP Emit (/emit)                     │
                        │ Header: x-socket-secret                       │
                        └───────────────────────┬───────────────────────┘
                                                │
                                                ▼
                        ┌────────────────────────────────────────┐
                        │              MongoDB Atlas             │
                        │        (Mongoose ODM 9.x Models)       │
                        └───────────────────────┬────────────────┘
                                                │
       ┌────────────────────┬───────────────────┼────────────────────┬───────────────────┐
       ▼                    ▼                   ▼                    ▼                   ▼
┌──────────────┐     ┌──────────────┐    ┌──────────────┐     ┌──────────────┐    ┌──────────────┐
│   Razorpay   │     │  ZegoCloud   │    │  Cloudinary  │     │Meta WhatsApp │    │Upstash Redis │
│  (Payments)  │     │ (Video KYC)  │    │  (Doc KYC)   │     │ (Cloud OTP)  │    │ (Cache/Locks)│
└──────────────┘     └──────────────┘    └──────────────┘     └──────────────┘    └──────────────┘
```

---

## 2. Application Boundaries

### A. Next.js Fullstack Web Application (`jatri/`)
- **Framework**: Next.js 16.2.4 (React 19.2.3, Turbopack, Tailwind CSS v4).
- **Hosting Target**: Vercel (configured via root `vercel.json` pointing build commands to `cd jatri && npm run build`).
- **Edge Middleware (`src/proxy.ts`)**:
  - Intercepts requests, verifies NextAuth v5 session cookies.
  - Enforces role-based permissions (`admin`, `vendor`/`partner`, `user`).
  - Guards public vs. protected API routes and static asset caching.
- **Backend Handlers (`src/app/api/`)**:
  - 40+ REST endpoints operating on Node.js runtime with MongoDB connections managed via `src/lib/db.ts` (cached connection pool).
- **State & UI**:
  - Global Redux Toolkit store (`src/redux/store.ts`) with user slice.
  - Contexts: `LanguageContext.tsx` (Assamese, Bengali, English, Hindi dictionaries), `SocketContext.tsx`, `AuthContext.tsx`.

### B. Standalone Real-Time Microservice (`socketServer/`)
- **Runtime**: Node.js ES Modules, Express 5.2.1, Socket.IO 4.8.3, Mongoose 9.2.1.
- **Hosting Target**: Render / Railway / Container service (configured via root `render.yaml`).
- **Port**: Defaults to `5000` (`PORT=5000`).
- **Inter-service Communication**:
  - Next.js API routes trigger real-time updates via internal POST `http://<SOCKET_SERVER_URL>/emit`.
  - Protected with `x-socket-secret: <SOCKET_INTERNAL_SECRET>`.
  - Emits are routed to specific users (`user-<userId>`), specific active rides (`booking-<bookingId>`), or broadcast channels.

### C. Database Layer (MongoDB)
- Connects using Mongoose 9.1+.
- Both `jatri` and `socketServer` connect to the same MongoDB cluster (`MONGODB_URI`).
- Uses 2dsphere geospatial indexing for driver GPS coordinates (`location: { type: "Point", coordinates: [lng, lat] }`).

---

## 3. Deployment Environments & Configuration

| Environment | Web / API Host | Socket Server Host | Database |
|---|---|---|---|
| **Development** | `http://localhost:3000` | `http://localhost:5000` | Local or Remote MongoDB Atlas |
| **Production** | Vercel (`https://ridenow-vehicle-booking-site.vercel.app`) | Render (`https://ridenow-socket.onrender.com` or custom URL) | MongoDB Atlas (Replica Set with SRV) |

---

## 4. Architectural Invariants

1. **Dual Verification Pipeline**:
   - Every trip requires a 4-digit pickup OTP verified by the driver at pickup before transitioning to `started`.
   - Every trip requires a cryptographic drop OTP verified at destination before transitioning to `completed`.
2. **Unified State Progression**:
   - State progression is strictly linear and gated by `bookingStateMachine.ts`.
   - Idempotent early-returns must always run AFTER role/ownership checks to prevent unauthorized state or OTP reads.
3. **No Phantom Drivers**:
   - Driver matching engine strictly sweeps verified, online vendors who have cleared platform due limits (< ₹300).
   - Mock/dummy driver injections are banned in production logic.
