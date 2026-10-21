# RideNow Changelog

All notable changes to the RideNow platform are documented in this file.
This repository follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`type(scope): description`) for all collaborator commits.

---

## [Unreleased] / Phase 0: Map, Routing & Address Integrity Core

### Added
- **Maps & Location Selection (`DevaaPP`)**:
  - Implemented centralized moving map pin with tactical spring-lift and drop physics, querying coordinates from viewport center (`map.getCenter()`) upon pan completion (`19f1fe5`).
  - Added independent lock/unlock state machine: setting Pickup hides Pickup marker and locks Drop; setting Drop hides Drop marker and locks Pickup (`19f1fe5`).
  - Added elevated stem marker callouts: 6px precision road contact dot with 20px hairline stem elevating badges 32px above the road polyline to completely eliminate badge/route overlap (`19f1fe5`).
  - Added rich autocomplete search suggestions with bold primary title, sub-area/locality badges, postal codes, category icons (Airport, Station, Hospital, College, Mall), live distance indicators, and an interactive "Set on map" action (`19f1fe5`).
  - Added RideNow Intercity support for trips $> 100\text{ km}$ up to $500\text{ km}$ with automatic vehicle switching and rate calculations (`19f1fe5`).
  - Added clean "Service unavailable" modal dialog for routes exceeding $500\text{ km}$ or outside serviceable bounds (`19f1fe5`).
- **Data Persistence & Integrity (`DevaaPP`)**:
  - Added structured `IAddressDetails` (`name`, `formattedAddress`, `locality`, `city`, `state`, `postalCode`, `coordinates`) to `Booking` schema, persisted across search, checkout, and invoice completion (`19f1fe5`).

### Fixed
- **Routing & Map Viewport Engine (`DevaaPP`)**:
  - Fixed frozen grey alternative route polyline bug by enforcing client-side purge of `lastAltCoordsRef`, clearing `route-alt-source` GeoJSON on destination change, and setting `alternatives=false` for pre-booking queries (`19f1fe5`).
  - Fixed map auto-zoom looping and excessive zoom-out by gating `fitBounds` to run strictly once per new route with responsive desktop (`left: 470`) and mobile viewport paddings.
  - Eliminated camera snapping during map movement by gating `easeTo` to run only once upon entering active pin mode.
  - Replaced marker direct dragging (`draggable: false`) with pure moving map mode; tapping placed markers or toolbar buttons activates the centralized pin.
  - Fixed off-road destination route termination gap by automatically snapping polyline endpoints to the destination pin ground coordinate.
  - Overhauled places autocomplete with concurrent Photon + Nominatim queries, proximity sorting, removal of restrictive bounding boxes, and universal `action=details` support for `nom_` and `photon_` place IDs.
  - Eliminated premature route drawing on keystrokes by removing speculative background geocoding on unfinished text inputs; route lines now render strictly when both coordinates are explicitly selected.
  - Added automatic route polyline purge via `clearRoute()` whenever pickup or destination coordinates are unset.
  - Upgraded location suggestions to Google Maps standard with live searching spinners, high-contrast category badges, distance indicators, empty state fallbacks, and Enter key selection.

### Refactored
- **Address Search & Dead Code (`DevaaPP`)**:
  - Removed dead `isDrop` parameter from `debouncedSearchAddress` and `searchAddress` (was used for old bbox-restricted search; fully superseded in Phase 0). Removed all 4 call-site remnants across pickup/drop inputs and quick-chip buttons.
  - Extracted a single module-level `VEHICLE_DISTANCE_LIMITS` constant, eliminating the two duplicated inline `defaultLimits` tables inside `checkLimit` and `getDistanceValidity`. Both functions now read from dynamic `rates` with a typed static fallback.
  - Guarded `geocodeAddress` fallback effects in `RouteMap.tsx` to skip while `activePinMode !== null` or `disableFallbackGeocode` is active, preventing background reverse-geocode fetches from racing against the pin state machine and overwriting in-flight coordinates.
  - Connected previously unhandled `disableFallbackGeocode` prop to fallback geocoding effects in `RouteMap.tsx`.
  - Cleared `activeSearchField` and `isEditingRoute` upon map pin confirmation in `book/page.tsx` to prevent overlapping floating overlays.

---

## [2026-10-21]

### Financial Architecture, Ledger & Settlements
- **Atomic Race-Safe Wallet Ledger & Compound Indexes (`Niyar Huzuri`)**:
  - Enforced a unique compound index `{ referenceId: 1, type: 1 }` on `WalletTransaction` to physically prevent duplicate credit transactions at the database level (`85c6c47`).
  - Implemented atomic balance increment locks in `walletLedger.ts`, eliminating race conditions between concurrent trip completion settlements and wallet payouts (`85c6c47`).
- **Resilient & Recoverable Trip Settlements (`Niyar Huzuri`)**:
  - Added persistent `settlementStatus` (`"pending" | "settled" | "failed"`) and `settlementError` fields to the `Booking` schema (`6076cf6`).
  - Transformed settlement failures from unhandled rejections into recoverable operational records, allowing trip completion while queuing settlement for retry (`6076cf6`).
  - Added dedicated `/api/admin/booking/[id]/retry-settlement` operational endpoint for safely reconciling failed driver earnings without duplicate payouts (`9210fb1`).
- **Distributed Redis Idempotency & Rate Limiting (`Niyar Huzuri`)**:
  - Implemented distributed Redis idempotency locks on critical financial mutations (`/api/booking/[id]/complete`, `/api/wallet/pay`, `/api/wallet/topup/create`) (`4b95517`).
  - Added financial route rate limiting to defend against replay and brute-force topup attempts (`4b95517`).
- **Webhook Payment Verification Mirroring (`Niyar Huzuri`)**:
  - Mirrored full client-side verification logic into Razorpay webhook handlers (`paymentService.ts`), ensuring asynchronous gateway webhooks run the identical ledger crediting, state machine transitions, socket emits, and WhatsApp notifications as synchronous checkout returns (`ed5aee8`).
- **Split Wallet & Gateway Payments (`DevaaPP`)**:
  - Enabled split wallet + online payment with automated driver commission reconciliation and instant settlement balance deduction (`5fe3e3a`).

### Security & Cryptographic Hardening
- **Cryptographic Share Tokens (`Niyar Huzuri`)**:
  - Replaced pseudo-random `Math.random()` with `crypto.randomBytes(16).toString("hex")` for tamper-proof public live-ride tracking URLs (`1fefc77`).
- **State Machine Authorization Pre-guards (`Niyar Huzuri`)**:
  - Restructured `bookingStateMachine.ts` to enforce role and ownership checks strictly *before* returning idempotent state responses, closing unauthorized state-probing avenues (`01c9c67`).
- **Production OTP Leak Prevention & Fail-Closed Delivery (`Niyar Huzuri`)**:
  - Sanitized API response payloads to ensure `devOtp` is never leaked in production environments (`0c4c209`).
  - Enforced strict fail-closed exceptions when external SMS/WhatsApp credentials are unconfigured or failing in production (`0c4c209`).
- **Candidate Driver Eligibility Enforcement (`Niyar Huzuri`)**:
  - Enforced strict vendor onboarding, background check, and vehicle documentation verification before allowing drivers to claim bookings via `/api/booking/[id]/accept` (`0be89b3`).
- **Panic & Cancellation Route Guards (`Niyar Huzuri`)**:
  - Added rigorous state machine guards and ownership validation to emergency panic and trip cancellation handlers (`98aa67c`).

### Admin Operations & Observability
- **Wallet Audit & Ledger Drift Resync (`Niyar Huzuri`)**:
  - Built `/api/admin/wallet-audit` to detect discrepancies between cumulative ledger transactions and current wallet balances with automated drift recovery (`9210fb1`).
- **Structured JSON Telemetry (`Niyar Huzuri`)**:
  - Implemented centralized structured JSON logger (`src/lib/logger.ts`) with correlation IDs, latency metrics, and PII masking across payment and webhook pathways (`64242a1`).

### Mobile Experience, Theme & Ergonomics
- **Driver Touch Ergonomics & Safe-Area Bounds (`Niyar Huzuri`)**:
  - Hardened mobile touch ergonomics on driver active ride screens (`partner/active-ride`) with $\ge 44\times 44\text{ px}$ targets, thumb-zone CTAs, and `env(safe-area-inset-bottom)` compliance (`82f8a86`).
  - Added real-time settlement status indicators on driver completion screens and partner booking history (`129c24f`, `4b95517`).
  - Improved touch targets and accessibility on `TripDetailsModal` and `TripInvoiceModal` (`98aa67c`).
- **Mobile Homepage & Scenic Visual Identity (`DevaaPP`)**:
  - Replaced low-res service thumbnails with high-resolution, gutter-free cropped WebP assets for Car Rides, Outstation, Parcel & Cargo, and Schedule Booking (`72e7c1d`).
  - Restored Vehicle Fleets and "Drive with Jaatri" sections immediately following Popular Destinations on mobile (`ecee736`).
  - Integrated cinematic Assamese landscape hero with high-contrast text and eliminated reload theme flash (FOUC) (`ecee736`).
  - Globally removed legacy bus, ferry, and launch references in favor of advance Schedule Booking (`ab9929e`).
  - Eliminated SSR React 418 hydration text mismatches and Framer Motion reduced-motion attribute warnings (`ae48dc9`, `305abc3`).
  - Optimized Next.js `Image` size hints and deduplicated shared desktop/mobile DOM instances (`c07b4d2`).

---

## [2026-10-15]

### Security & Access Control
- **NextAuth Brute-Force Rate Limiting (`Niyar Huzuri`)**:
  - Applied IP and identity-based brute-force rate limiting to NextAuth credentials provider (`7868141`).
- **WebSocket Access Control (`Niyar Huzuri`)**:
  - Enforced server-side socket room authorization and access control (`def0cce`).
  - Implemented cryptographically secure PRNG (`crypto.randomInt`) for OTP generation and prevented secret OTP leaks (`343e064`).

### Financial & Pricing Engine
- **Fare Config Synchronization (`Niyar Huzuri`)**:
  - Propagated full `FareConfig` economic parameters (`waitingChargePerMinute`, `platformFee`, `taxRate`, `cancellationFee`) into the fare engine (`37c332f`).

---

## [2026-10-14]

### Security & Route Hardening
- **Middleware & Endpoint Protection (`Niyar Huzuri`)**:
  - Tightened middleware static-file bypass to prevent authentication bypass via dot-path traversal (`1b55cb9`).
  - Removed synthetic RideNow Partner ghost driver fallback to guarantee genuine driver matching (`a94ecfb`).
  - Removed hardcoded `SOCKET_INTERNAL_SECRET` fallback (`d9579b5`).
  - Required authentication and driver assignment checks on emergency bypass, restricted to admins (`b9f1736`).
  - Added authentication and driver verification to `send-pickup-otp` (`0134172`).
  - Replaced full booking serialization with whitelisted DTOs in tracking endpoints to eliminate data leakage (`151b87e`).
  - Derived wallet topup amounts securely from Razorpay server orders rather than client payloads (`c4174fa`).
  - Added ownership and session verification to payment verify, wallet pay, booking cancel, and confirm-payment flows (`a90a8c4`, `200825f`, `1ccba9e`, `61f604e`).

### Financial & UI Integrity
- **Platform Commission Engine (`Niyar Huzuri`)**:
  - Unified platform commission rate and calculation engine across all booking lifecycles (`58004e4`).
- **Driver Ratings Display (`Niyar Huzuri`)**:
  - Replaced hard-coded 4.9 rating badge with live calculated ratings from MongoDB booking history (`dd27dd8`).

---

## [2026-10-13]

### Features & Improvements
- **Driver KYC & DigiLocker Onboarding (`Niyar Huzuri`)**:
  - Added DigiLocker instant verification gateway, schema attributes, and verification UI to partner onboarding (`a5095f8`, `ac0a41c`, `3002730`).
- **Admin Analytics (`Niyar Huzuri`)**:
  - Added Driver Shift & Cooldown metrics card to vendor review dashboard and exposed metrics in API (`7e7238a`, `d955295`).
- **Student Pass Verification Engine (`Niyar Huzuri`)**:
  - Added comprehensive educational domain validation engine and wired it to `StudentPassModal` and `verify-student` API (`0f4e3ab`, `303c3ca`, `863dde4`, `9748256`).
- **Booking & Fleet Architecture (`Niyar Huzuri`)**:
  - Added service mode tabs (Passenger / Goods Transport), smart vehicle matching, cargo specifications, and RideNow Go presentation (`cbd86b2`, `ad06170`, `f75d60f`, `f9e7c9f`, `14d68d1`, `fadcf13`, `d881035`).

### Performance & Clean-up
- **State Management & Bundle Optimization (`Niyar Huzuri`)**:
  - Eliminated synchronous `setState` in effect cascades during route transitions (`acf5ab3`).
  - Pruned unused starter SVGs and large assets (`heroImage.jpg` -> `heroImage.webp`) (`d940c6a`, `51f84a1`).
  - Removed unauthenticated `debug-db` diagnostic endpoint (`9c3b479`).

---

## Commit Guidelines for Collaborators

To maintain clean and uniform git histories across both collaborators (`DevaaPP` & `Niyar Huzuri`), all commits must strictly follow the Conventional Commits specification:

```text
<type>(<scope>): <subject in lowercase imperative mood>
```

### Types:
- `feat`: New feature or user-facing enhancement (e.g., `feat(maps): ...`, `feat(driver-kyc): ...`)
- `fix`: Bug fix, security fix, or correctness correction (e.g., `fix(security): ...`, `fix(pricing): ...`)
- `perf`: Performance improvement (e.g., `perf(nav): ...`)
- `refactor`: Code refactoring without changing functionality
- `chore`: Build tasks, asset cleanups, or dependency updates (e.g., `chore(assets): ...`)
- `docs`: Documentation updates (e.g., `docs(changelog): ...`)

### Rules:
1. Always write the subject in lowercase without a trailing period (e.g., `fix(ui): replace hard-coded rating with actual booking data`).
2. Include a specific scope (e.g., `maps`, `security`, `pricing`, `booking`, `admin`, `wallet`).
3. Keep subject lines under 72 characters when possible.
