# Jaatri Data Flow & Critical Business Workflows

> **Last Verified**: October 18, 2026  
> **Core Engines**: `driverMatchingEngine.ts`, `bookingStateMachine.ts`, `fareEngine.ts`, `paymentService.ts`, `cancellationEngine.ts`

---

## 1. End-to-End Booking Lifecycle

The following sequence illustrates the complete trip progression from passenger request to settlement:

```
Rider Client                      Next.js API                      Driver Client(s)             Socket Server
    │                                  │                                  │                           │
    ├─ 1. Select Route & Vehicle ─────>│                                  │                           │
    │     (Calculates Fare)            │                                  │                           │
    │                                  │                                  │                           │
    ├─ 2. POST /api/booking/create ───>│                                  │                           │
    │                                  ├─ Find nearby online drivers      │                           │
    │                                  ├─ Status: "searching_driver"      │                           │
    │                                  ├─ Emit "new-ride-request" ───────────────────────────────────>│
    │                                  │                                  │<── Broadcast request ─────┤
    │<─ Return Booking ID & Fare ──────┤                                  │                           │
    │                                  │                                  │                           │
    │                                  │<─ 3. POST /booking/[id]/accept ──┤ (First to accept wins)    │
    │                                  ├─ Atomic driver assignment        │                           │
    │                                  ├─ Status: "driver_assigned"       │                           │
    │                                  ├─ Generate 4-digit pickupOtp      │                           │
    │                                  ├─ Emit "driver-assigned" ────────────────────────────────────>│
    │<─ Receive Driver Info ───────────┴──────────────────────────────────┴── (Rider & Driver join)───┤
    │                                                                     │                           │
    │                                  │<─ 4. POST /booking/[id]/arrived ─┤                           │
    │                                  ├─ Status: "driver_arrived"        │                           │
    │<─ Driver Arrived Alert ──────────┴──────────────────────────────────────────────────────────────┤
    │                                                                     │                           │
    │                                  │<─ 5. POST /verify-pickup-otp ────┤ (Enters passenger OTP)    │
    │                                  ├─ Status: "started"               │                           │
    │                                  ├─ Generate cryptographic dropOtp  │                           │
    │<─ Ride Commenced ────────────────┴──────────────────────────────────────────────────────────────┤
    │                                                                     │                           │
    │ ~~~ Live GPS Telemetry via Socket.IO: driver-location-update ~~~~~~ │                           │
    │                                                                     │                           │
    │                                  │<─ 6. POST /verify-drop-otp ──────┤ (At Destination)          │
    │                                  ├─ Status: "awaiting_payment"      │                           │
    │                                  │   (or "completed" if pre-paid)   │                           │
    │                                  │                                  │                           │
    │ 7. Payment Confirmation ────────>│                                  │                           │
    │    (Cash or Razorpay)            ├─ Status: "completed"             │                           │
    │                                  ├─ Settle Wallet & Commission      │                           │
    │<─ Final Receipt ─────────────────┴──────────────────────────────────┴── Trip Closed ────────────┤
```

---

## 2. Broadcast Dispatch Architecture

In traditional sequential dispatch, a trip request waits 15-30 seconds per driver in a waterfall queue, causing rider drop-offs.
Jaatri uses an **Instant Parallel Broadcast Dispatch Engine** ([`driverMatchingEngine.ts`](file:///d:/git/RideNow/jatri/src/lib/driverMatchingEngine.ts)):

1. **Nearby Query**:
   - Sweeps online vendors within a 10 km radius (expanding to 25 km in semi-urban areas if none found within 10 km).
   - Filters out delinquent drivers with unpaid platform commissions exceeding ₹300.
2. **Parallel Dispatch**:
   - An alert is broadcast simultaneously to all qualified candidate drivers via WebSocket (`new-ride-request`).
3. **Atomic Claim Lock**:
   - When a driver clicks "Accept", `POST /api/booking/[id]/accept` executes an atomic conditional update:
     ```typescript
     const updated = await Booking.findOneAndUpdate(
       {
         _id: bookingId,
         status: { $in: ["requested", "searching_driver", "auto_rematching"] },
         driver: { $in: [null, undefined] },
       },
       {
         $set: {
           driver: driverId,
           status: "driver_assigned",
           assignedAt: new Date(),
         }
       },
       { new: true }
     );
     ```
   - If another driver accepted milliseconds earlier, the condition fails, returning `{ success: false, message: "Ride has already been accepted by another partner" }`.
   - The winning driver is assigned; all other candidates receive a dismiss signal.

---

## 3. Strict State Machine Invariants

All booking status transitions are guarded by [`bookingStateMachine.ts`](file:///d:/git/RideNow/jatri/src/lib/bookingStateMachine.ts):

| Initial Status | Allowed Target Transitions |
|---|---|
| `scheduled` | `requested`, `searching_driver`, `driver_assigned`, `awaiting_payment`, `confirmed`, `cancelled`, `expired` |
| `requested` | `searching_driver`, `driver_assigned`, `awaiting_payment`, `confirmed`, `cancelled`, `expired`, `no_drivers_available` |
| `searching_driver` | `driver_assigned`, `awaiting_payment`, `confirmed`, `cancelled`, `expired`, `no_drivers_available` |
| `awaiting_payment`| `confirmed`, `driver_assigned`, `driver_arriving`, `driver_arrived`, `started`, `ride_started`, `cancelled`, `expired`, `payment_failed` |
| `confirmed` | `driver_assigned`, `driver_arriving`, `driver_arrived`, `started`, `ride_started`, `cancelled`, `disputed` |
| `driver_assigned` | `driver_arriving`, `driver_arrived`, `started`, `ride_started`, `cancelled`, `disputed` |
| `driver_arriving` | `driver_arrived`, `started`, `ride_started`, `cancelled`, `disputed` |
| `driver_arrived`  | `started`, `ride_started`, `cancelled`, `disputed` |
| `started` / `ride_started` | `ride_in_progress`, `completed`, `cancelled`, `disputed` |
| `completed` | **Terminal State** (No further transitions allowed) |
| `cancelled` | **Terminal State** (No further transitions allowed) |

---

## 4. Payment Settlement & Wallet Ledger

Implemented in [`walletLedger.ts`](file:///d:/git/RideNow/jatri/src/lib/walletLedger.ts) and [`settlePayment.ts`](file:///d:/git/RideNow/jatri/src/lib/settlePayment.ts):

### A. Online Pre-paid Rides (Razorpay / UPI)
1. Rider pays 100% of gross fare to platform account via Razorpay.
2. Upon trip completion:
   - Platform commission (e.g. 20%) is retained.
   - Net driver earnings (80%) are credited to the driver's partner wallet balance.

### B. Cash / Pay Later Rides
1. Rider pays 100% of gross fare directly in cash to the driver upon trip completion.
2. The platform's commission (20%) is debited from the driver's partner wallet, increasing their `platformDues`.
3. If `platformDues` exceeds ₹300:
   - The driver is locked from toggling duty to `isOnline = true`.
   - Driver must click **"Settle Dues"** to pay via Razorpay/UPI before receiving new ride requests.
