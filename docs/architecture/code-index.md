# Jaatri Compact Code Index & Symbol Directory

> **Last Verified**: October 18, 2026  
> **Search Command**: `git grep -n "<symbol>" jatri/src/`

---

## 1. Domain Engines & Utilities (`jatri/src/lib/`)

| File | Key Symbols | Responsibility |
|---|---|---|
| [`bookingStateMachine.ts`](file:///d:/git/RideNow/jatri/src/lib/bookingStateMachine.ts) | `ALLOWED_TRANSITIONS`, `transitionBookingState`, `isValidTransition` | Enforces atomic, race-free booking lifecycle state transitions. |
| [`driverMatchingEngine.ts`](file:///d:/git/RideNow/jatri/src/lib/driverMatchingEngine.ts) | `findNearbyDrivers`, `escalateToNextCandidate`, `MAX_ALLOWED_PLATFORM_DUES` | Instant broadcast driver search, 10-25km radius sweep, dues filter. |
| [`fareEngine.ts`](file:///d:/git/RideNow/jatri/src/lib/fareEngine.ts) | `calculateFare`, `calculateDynamicSurge`, `calculateNightAllowance` | Upfront pricing, per-km rates, night allowance, student discount. |
| [`paymentService.ts`](file:///d:/git/RideNow/jatri/src/lib/paymentService.ts) | `createPaymentOrder`, `verifyPaymentSignature`, `processWebhookEvent` | Razorpay order creation, HMAC signature validation, transaction logging. |
| [`settlePayment.ts`](file:///d:/git/RideNow/jatri/src/lib/settlePayment.ts) | `settleBookingPayment` | Finalizes trip payments, credits driver wallet, debits platform commission. |
| [`walletLedger.ts`](file:///d:/git/RideNow/jatri/src/lib/walletLedger.ts) | `creditWallet`, `debitWallet`, `recordCommission` | Double-entry ledger for rider balance and driver earnings. |
| [`cancellationEngine.ts`](file:///d:/git/RideNow/jatri/src/lib/cancellationEngine.ts) | `assessCancellationFee`, `processCancellationRefund` | Tiered cancellation fee calculation and automated refund processing. |
| [`socket.ts`](file:///d:/git/RideNow/jatri/src/lib/socket.ts) | `useSocket`, `getSocket` | React hook and singleton client for Socket.IO connection. |
| [`socketServerEmit.ts`](file:///d:/git/RideNow/jatri/src/lib/socketServerEmit.ts) | `emitSocketEvent` | Backend helper making authenticated POST `/emit` to socketServer. |
| [`vehicleConfig.ts`](file:///d:/git/RideNow/jatri/src/lib/vehicleConfig.ts) | `VEHICLE_OPTIONS`, `PASSENGER_VEHICLES`, `LOGISTICS_VEHICLES` | Master catalog of the 8 vehicle classes with titles, badges, and rates. |
| [`routeUtils.ts`](file:///d:/git/RideNow/jatri/src/lib/routeUtils.ts) | `haversineKm`, `calculateCumulativeDistance` | Geospatial distance calculation between coordinate waypoints. |
| [`cryptoOtp.ts`](file:///d:/git/RideNow/jatri/src/lib/cryptoOtp.ts) | `generateSecureOtp`, `verifyOtpHash` | Generates cryptographically secure 4-digit pickup and 6-digit drop OTPs. |
| [`db.ts`](file:///d:/git/RideNow/jatri/src/lib/db.ts) | `connectDb` | Global cached MongoDB connection pool for Next.js route handlers. |

---

## 2. Key UI Features & Components (`jatri/src/features/`)

| File | Component / Symbol | Purpose |
|---|---|---|
| [`RouteMap.tsx`](file:///d:/git/RideNow/jatri/src/features/maps/components/RouteMap.tsx) | `RouteMap` | Primary MapLibre GL map component with route polyline, waypoints, and telemetry. |
| [`DriverWalletCard.tsx`](file:///d:/git/RideNow/jatri/src/features/partner/components/DriverWalletCard.tsx) | `DriverWalletCard` | Driver balance card, platform dues warning, and 1-tap Razorpay settlement button. |
| [`VendorDashboard.tsx`](file:///d:/git/RideNow/jatri/src/features/partner/components/VendorDashboard.tsx) | `VendorDashboard` | Driver console with online duty toggle, incoming ride banner, and quick metrics. |
| [`CheckoutContent.tsx`](file:///d:/git/RideNow/jatri/src/app/checkout/CheckoutContent.tsx) | `CheckoutContent` | Multi-method checkout page with adaptive polling fallback for ride search. |
| [`VehicleCategoriesSlider.tsx`](file:///d:/git/RideNow/jatri/src/features/booking/components/VehicleCategoriesSlider.tsx) | `VehicleCategoriesSlider` | Homepage interactive carousel featuring all 8 vehicle classes. |

---

## 3. Core Database Models (`jatri/src/models/`)

| Model | File | Primary Index / Key Fields |
|---|---|---|
| `User` | [`user.model.ts`](file:///d:/git/RideNow/jatri/src/models/user.model.ts) | `email` (unique), `mobileNumber`, `location` (2dsphere), `role` |
| `Booking` | [`booking.model.ts`](file:///d:/git/RideNow/jatri/src/models/booking.model.ts) | `user`, `driver`, `status`, `trackingToken`, `createdAt` |
| `Vehicle` | [`vehicle.model.ts`](file:///d:/git/RideNow/jatri/src/models/vehicle.model.ts) | `owner`, `number` (unique), `type`, `status` |
| `Payment` | [`payment.model.ts`](file:///d:/git/RideNow/jatri/src/models/payment.model.ts) | `orderId` (unique), `paymentId`, `booking`, `status` |
| `Wallet` | [`wallet.model.ts`](file:///d:/git/RideNow/jatri/src/models/wallet.model.ts) | `user` (unique), `balance`, `currency` |
| `FareConfig` | [`fareConfig.model.ts`](file:///d:/git/RideNow/jatri/src/models/fareConfig.model.ts) | `vehicleType`, `baseFare`, `perKmRate` |
