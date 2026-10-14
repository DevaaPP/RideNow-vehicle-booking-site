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

### Refactored
- **Address Search & Dead Code (`DevaaPP`)**:
  - Removed dead `isDrop` parameter from `debouncedSearchAddress` and `searchAddress` (was used for old bbox-restricted search; fully superseded in Phase 0). Removed all 4 call-site remnants across pickup/drop inputs and quick-chip buttons.
  - Extracted a single module-level `VEHICLE_DISTANCE_LIMITS` constant, eliminating the two duplicated inline `defaultLimits` tables inside `checkLimit` and `getDistanceValidity`. Both functions now read from dynamic `rates` with a typed static fallback.
  - Guarded `geocodeAddress` fallback effects in `RouteMap.tsx` to skip while `activePinMode !== null`, preventing background reverse-geocode fetches from racing against the pin state machine and overwriting in-flight coordinates.

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
