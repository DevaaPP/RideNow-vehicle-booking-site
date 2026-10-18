# Jaatri Known Issues, Technical Debt & Verified Workarounds

> **Last Verified**: October 18, 2026  
> **Source**: Historical investigations and architectural audits.

---

## 1. Resolved Historical Issues & Invariants (DO NOT REINTRODUCE)

### A. Idempotency Early-Return Security Bug (`/api/booking/[id]/confirm-payment`)
- **Bug**: Idempotency check returned `status: "confirmed"` and `pickupOtp` before verifying user ownership or admin role.
- **Fix**: The ownership check (`const isOwner = booking.user?.toString() === sessionUser._id.toString();`) MUST run before any idempotency return.
- **Rule**: Never expose OTPs or booking states without authenticating the requesting user first.

### B. Checkout Polling Fallback Storm
- **Bug**: `CheckoutContent.tsx` previously polled `/api/booking/my-active` every 1500ms unconditionally and re-bound intervals on every state change, causing request queuing and loop locks.
- **Fix**: Implemented adaptive polling intervals (2500ms during payment, 5000ms during idle/confirmed, 1500ms during searching) with state guards preventing old draft sessions from hijacking idle forms.

### C. Partner Active-Ride Top Bar Overlap
- **Bug**: Top navigation bar elements collided with driver status indicators on smaller screens.
- **Fix**: Rebuilt with responsive `flex flex-col sm:flex-row justify-between` layout, separating navigation buttons from live shift and status badges.

### D. Redundant Driver Payment Pop-up
- **Bug**: In `/partner/active-ride`, a persistent "Customer Payment" modal and yellow reopen button obstructed turn-by-turn navigation during cash rides.
- **Fix**: Removed modal; fare collection is streamlined directly in the ride completion receipt card.

### E. Missing Fleet Images on `/fleet` Page
- **Bug**: In `/fleet`, vehicle cards for `priority`, `loading`, and `truck` attempted to load nonexistent paths (`xl.webp`, `truck.webp`, `heavy.webp`), displaying broken image placeholders.
- **Fix**: Updated `FLEET_CATEGORIES` to use canonical assets (`/fleet/suv.webp`, `/fleet/express-mini.webp`, `/fleet/freight.webp`) and added compatibility aliases in `public/fleet/`.

---

## 2. Active Technical Debt & Areas for Future Polish

### A. Temporary Map Vehicle Marker Disable
- **Status**: Intentionally disabled per user instruction.
- **Context**: In `src/features/maps/components/RouteMap.tsx`, default top-down vehicle icons were disabled pending replacement with custom, distinct vehicle models/artwork for each category.
- **Action**: When ready, implement distinct SVG/3D vehicle pins in `createVehicleMapMarkerEl` in `RouteMap.tsx`.

### B. Standalone Socket Server Deployment Synchronization
- **Status**: Operational, requires coordinated deployments.
- **Context**: Next.js API routes emit to `socketServer` via HTTP POST `/emit` with `x-socket-secret`.
- **Action**: Ensure both `jatri` and `socketServer` have matching `SOCKET_INTERNAL_SECRET` and `MONGODB_URI` environment variables configured in production (Render + Vercel).
