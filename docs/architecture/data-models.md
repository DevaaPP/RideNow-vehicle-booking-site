# Jaatri Database Models & Data Schema Guide

> **Last Verified**: October 18, 2026  
> **ODM**: Mongoose 9.1+  
> **Location**: `jatri/src/models/`  
> **Total Schemas**: 19 Models

---

## 1. Core Entity Models

### A. `User` (`user.model.ts`)
- **Primary Roles**: `"user"` (passenger), `"vendor"` (driver partner), `"admin"`.
- **Identity Fields**: `name`, `email`, `password`, `mobileNumber`, `image`, `role`.
- **Geospatial & Telemetry**:
  - `location`: GeoJSON Point `{ type: "Point", coordinates: [lng, lat] }` with `2dsphere` index.
  - `isOnline`: Boolean toggle for driver availability.
  - `socketId`: Active WebSocket client ID.
  - `lastLocationUpdate`: Timestamp of latest GPS ping.
- **Verification Pillars (Vendors)**:
  - `isDriverVerified`: Overall admin vetting approval.
  - `isVendorBlocked`: Flag disabling delinquent or suspended drivers.
  - `platformDues`: Accumulation of unremitted platform commissions from cash rides.
  - `verificationPillars`: Document audit subdocument.

### B. `Vehicle` (`vehicle.model.ts`)
- **Owner Relationship**: `owner` ref to `User` (`role: vendor`).
- **Classification**:
  - `type`: `"scooty" | "bike" | "auto" | "mini" | "car" | "priority" | "loading" | "truck"`.
  - `vehicleModel`: e.g. "Maruti Suzuki Dzire", "Tata Ace Gold", "Honda Activa".
  - `number`: Registration license plate string (unique index).
  - `color`: Vehicle exterior colour.
  - `capacity`: Seating passenger count or max payload weight (kg).
  - `status`: `"pending" | "approved" | "rejected"`.

### C. `Booking` (`booking.model.ts`)
- **Relationships**:
  - `user`: ref to `User` (Rider).
  - `driver`: ref to `User` (Assigned driver).
  - `vehicle`: Embedded snapshot `{ type, model, plateNumber, color }`.
  - `candidateDrivers`: Array of `ObjectId` refs sent broadcast dispatch.
  - `cancelledDriverIds`: Array of drivers who rejected or timed out.
- **State Machine**:
  - `status`: Canonical status string (`"requested"`, `"searching_driver"`, `"driver_assigned"`, `"driver_arrived"`, `"started"`, `"awaiting_payment"`, `"confirmed"`, `"completed"`, `"cancelled"`).
- **Route Geometry**:
  - `pickupAddress`, `dropAddress`.
  - `pickupLocation`: GeoJSON Point `[lng, lat]`.
  - `dropLocation`: GeoJSON Point `[lng, lat]`.
  - `stops`: Optional intermediate waypoints array.
  - `routePolyline`: Encoded route coordinate string.
- **Financials**:
  - `fare`: Total calculated fare amount.
  - `fareBreakdown`: Sub-breakdown (base fare, distance, time, surge, discount, tax).
  - `paymentStatus`: `"pending" | "paid" | "cash" | "failed" | "refunded"`.
  - `paymentMethod`: `"cash" | "upi" | "card" | "wallet"`.
- **Security Codes**:
  - `pickupOtp`: 4-digit numeric code required to start ride.
  - `dropOtp`: Cryptographic code required to complete ride.
  - `trackingToken`: Secret sharing token for public emergency tracking.

---

## 2. Financial & Payment Models

### A. `Payment` (`payment.model.ts`)
- Tracks individual gateway attempts with Razorpay:
  - `booking`: ref to `Booking`.
  - `user`: ref to `User`.
  - `orderId`: Razorpay order ID (`order_...`).
  - `paymentId`: Razorpay transaction ID (`pay_...`).
  - `signature`: HMAC SHA-256 signature for verification.
  - `amount`: Transaction amount in INR.
  - `status`: `"created" | "authorized" | "captured" | "failed" | "refunded"`.

### B. `Wallet` (`wallet.model.ts`)
- Double-entry balance holder for both riders and driver partners:
  - `user`: ref to `User` (1-to-1 unique index).
  - `balance`: Spendable funds balance.
  - `lockedBalance`: Funds locked during in-progress rides or withdrawal processing.
  - `currency`: Default `"INR"`.

### C. `WalletTransaction` (`wallet-transaction.model.ts`)
- Ledger records for balance changes:
  - `wallet`: ref to `Wallet`.
  - `type`: `"credit" | "debit"`.
  - `category`: `"ride_fare" | "platform_commission" | "topup" | "withdrawal" | "cancellation_fee" | "refund"`.
  - `amount`: Number.
  - `referenceId`: Booking ID or payout batch ID.

### D. `Withdrawal` (`withdrawal.model.ts`)
- Payout requests from driver partners to verified bank accounts / UPI VPAs.

---

## 3. Operations & Safety Models

### A. `SafetyIncident` (`safetyIncident.model.ts`)
- SOS panic button triggers and route deviation alerts:
  - `booking`: ref to `Booking`.
  - `triggeredBy`: ref to `User`.
  - `location`: Coordinates at moment of panic.
  - `severity`: `"low" | "medium" | "high" | "critical"`.
  - `status`: `"open" | "investigating" | "resolved"`.

### B. `VehicleDocument` (`vehicleDocument.model.ts`)
- Driver KYC uploads (Driving License, Vehicle RC, Commercial Insurance, Fitness Certificate).
- Stores Cloudinary secure URLs and expiry dates monitored by `documentExpiryEngine.ts`.

### C. `PartnerBank` (`partnerBank.model.ts`)
- Verified IFSC codes, account numbers, and UPI handles for partner disbursements.

### D. `FareConfig` (`fareConfig.model.ts`)
- Dynamic, DB-driven pricing rules (base fares, per-km rates, night surge windows, rain multipliers) across vehicle categories in Assam.

### E. `AuditLog` (`auditLog.model.ts`)
- Immutable records of critical security events (admin approvals, document rejections, wallet balance adjustments).
