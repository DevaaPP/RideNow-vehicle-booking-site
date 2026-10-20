# Permanent Project Rule: Mobile-First Application Development

> **Effective Date**: Permanent Project Directive  
> **Applies to**: Entire Jaatri (যাত্ৰী) / RideNow codebase, all features, refactoring, bug fixes, UI/UX, settings, operational panels, and future modules.

---

## 1. Mobile-First Development Is Mandatory

Treat Jaatri as a mobile application first in every implementation decision. Do not treat mobile responsiveness as a final polishing step. Mobile is the primary product experience and guides architecture, component design, interactions, navigation, accessibility, and testing from inception.

Before implementing any change:
1. **Understand Mobile Usage**: Trace how the user touches, navigates, and perceives the feature on a physical mobile device.
2. **Inspect Existing Mobile Experience**: Audit existing mobile screens for usability regressions, overflowing text, or cramped interactions.
3. **Design Mobile Interaction First**: Build the layout and interaction flow for narrow viewports (360px–430px) first.
4. **Use Reusable, Touch-Ready Components**: Standardize on responsive, touch-accessible building blocks.
5. **Progressively Enhance for Desktop**: Expand to tablet and desktop viewports *without* diluting, breaking, or diverging from mobile ergonomics.
6. **Verify Workflows on Mobile**: Ensure end-to-end mobile tasks (booking, dispatch, onboarding, payment, profile) remain uninterrupted.

*Never design a desktop interface first and shrink it to fit a phone.*

---

## 2. Mobile Interaction Standards

All interactive elements must be engineered for touch-first use:
- **Touch Targets**: Minimum 44 × 44 CSS pixels for all interactive targets with adequate physical separation to prevent mis-taps.
- **Zero Hover Dependence**: Every essential action, tooltip, popover, or status state must be fully operable via tap and keyboard navigation.
- **Predictable Gestures**: Support natural taps, swipes, drags, bottom-sheet dismissal, and vertical scrolling without jank or scroll contention.
- **Prevent Accidental Gestures**: Debounce submissions, guard against double taps, and prevent conflicting internal scroll traps.
- **Immediate State Feedback**: Provide instant visual feedback for active, pressed, loading, pending, disabled, error, and success states.
- **Mobile-Native Controls**: Prefer clean bottom sheets, segmented selectors, and slide-overs over nested desktop menus or microscopic icons.
- **Keyboard-Friendly Forms**:
  - Always set appropriate `inputMode` (`tel`, `numeric`, `email`, `decimal`).
  - Configure `autoComplete` attributes properly.
  - Position actions so virtual keyboards do not occlude active inputs or primary submit CTAs.
  - Preserve all form state upon validation errors or background app switches.

---

## 3. Responsive Layout & Viewport Management

- **Narrow-First Architecture**: Layouts start at 360px width and scale up cleanly (`sm:`, `md:`, `lg:`).
- **Zero Horizontal Overflow**: `overflow-x: hidden` on viewport boundaries, prevent clipped containers, and wrap long text safely.
- **Dynamic Viewports (`100dvh`)**: Use `100dvh` for full-screen modals, sheets, and maps with appropriate fallbacks to handle mobile browser address bars.
- **Safe-Area Insets**: Respect `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, and system home indicator bars.
- **Clear Scroll Ownership**: Distinct separation between page scroll and fixed bottom sheets or map layers. Floating action buttons and persistent bottom bars must never obscure content or CTAs.
- **Orientation & Resizing**: Handle orientation shifts and virtual keyboard appearance smoothly without layout breaks.

---

## 4. Accessibility Is a Core Requirement (WCAG 2.2 AA)

Accessibility is part of core implementation, never an afterthought:
- **Semantic HTML**: Prefer native HTML elements (`<button>`, `<input>`, `<nav>`, `<main>`, `<dialog>`) over custom ARIA divs.
- **Accessible Names & Labels**: Ensure every icon button has an `aria-label` or visually hidden text.
- **Focus Management**: Visible focus rings (`focus-visible:ring-2`), logical tab order, and active focus trapping when modals or sheets open.
- **High Contrast**: Verify text contrast against background tokens in both light (`#10251C` on `#FAF7F0`) and dark forest modes (`#F3F1E8` on `#17211B`).
- **Screen Reader Announcements**: Use `aria-live="polite"` or `role="status"` for asynchronous updates (driver accepted, OTP verified, fare calculated).
- **Motion & Zoom**: Honor `prefers-reduced-motion` and verify layouts survive 200% browser text zoom without loss of function.
- **No Color-Only Cues**: Accompany color indicators with descriptive text, icons, or badges.

---

## 5. Mobile-Native Settings and Preferences

All settings and configuration screens (Customer, Driver, Admin, Privacy, Security, Theme) must be mobile-native:
- **Grouped List Layouts**: Organize settings into clean, tactile grouped lists with descriptive subtext.
- **Accessible Toggles**: Sized, high-contrast toggle switches (`role="switch"`) with clear active/inactive states.
- **No Crammed Tables**: Transform dense administrative tables into mobile-friendly detail cards or stacked rows.
- **Consequence Warnings for Destructive Actions**: Explicit confirmation sheets with clear recovery guidance before irreversible changes.
- **Optimistic or Confirmed Persistence**: Never claim a setting is saved until backend persistence succeeds.

---

## 6. Mobile Navigation and Information Architecture

- **Thumb-Zone Accessibility**: Place primary actions, search bars, and main confirmation buttons within comfortable one-handed reach.
- **Bottom Navigation**: Use dedicated bottom navigation bar for high-frequency destinations where appropriate.
- **Predictable Back Behavior**: Unambiguous back buttons (`history.back()` or explicit fallback routes) with context preservation.
- **Safe Sheet Dismissal**: Allow swipe-down or backdrop tap to dismiss non-critical modals and bottom sheets.
- **Clutter-Free Viewports**: Avoid overcrowded headers; tuck secondary actions into slide-over sheets or mobile menus.

---

## 7. Mobile Performance & Network Reliability

- **Lean Bundles**: Zero unnecessary third-party dependencies; lazy-load heavy components (MapLibre GL, ZegoCloud SDK).
- **Image Optimization**: Use Next.js `<Image>` with explicit width/height, WebP/AVIF formats, and priority hints only for LCP heroes.
- **Flaky Network Handling**: Handle 2G/3G connections, transient disconnections, and failed REST/Socket requests gracefully.
- **Automatic Retry & Reconnect**: Exponential backoff on failed API calls and Socket.IO reconnect logic with telemetry recovery.
- **Idempotency & Race-Condition Guards**: Prevent double-tap form submissions with disabled pending states.

---

## 8. Mobile Security & Privacy

- **Zero Trust in Client**: All validation, authorization, and state transitions must be verified on the backend (`bookingStateMachine.ts`, Next.js route handlers).
- **Zero Secrets on Client**: No privileged API keys, database credentials, or secret tokens in client bundles.
- **Just-in-Time Permissions**: Request Geolocation, Camera, and Notifications only when triggered by user intent with clear explanations.
- **Graceful Permission Degradation**: Provide manual search fallbacks when GPS is denied.
- **DPDP Act 2023 Compliance**: Secure session tokens, clean logout, and zero personal data leakage in URLs or query strings.

---

## 9. Full Product Scope

This mobile-first standard applies unconditionally to every module:
1. **Customer Booking & Ride Tracking** (`/book`, `/booking`, `/ride/[id]`, `/track/[token]`)
2. **Partner Onboarding & Driver App** (`/partner`, `/partner/dashboard`, `/partner/active-ride`, `/partner/wallet`)
3. **Driver Availability & Broadcast Dispatch** (Instant dispatch modal, acceptance countdown, OTP verification)
4. **Logistics & Cargo Booking** (Mini Truck, 2-wheeler parcel delivery)
5. **Authentication & Profile** (`/profile`, OTP login, phone linking, document uploads)
6. **Payments & Invoicing** (Razorpay modal, wallet topup, itemized ride invoices, refund requests)
7. **Admin & Operational Dashboards** (`/admin/dashboard`, `/admin/vendors`, `/admin/vehicles`) — redesigned for responsive card-flow mobility.

---

## 10. Design System Harmony

Always honor the official Jaatri tokens:
- **Primary Emerald**: `#046A38` (Interactive brand CTA)
- **Forest Green**: `#123D32` (Structural green, display typography, headers)
- **Deep Forest**: `#0D3027` (Dark panels and dark theme base)
- **Warm Ivory**: `#F7F1E5` / `#FAF7F0` (Light surfaces)
- **Assamese Vermilion**: `#E34222` (Accent, destination markers, alerts)
- **Warm Border**: `#DED7CA`
- **Corner Radii**: `rounded-[8px]` for buttons, `rounded-[10px]` for inputs, `rounded-[12px]` to `rounded-[14px]` for cards.
- **Banned**: Sharp 0px corners (`rounded-none`) and cold grays (`zinc`).

---

## 11. Mandatory Verification Checklist

Before declaring any implementation complete:
1. **Narrow Viewport Test**: Verify layout at 360px–390px width.
2. **Comfortable Touch Target Audit**: Confirm tap targets are ≥ 44×44px.
3. **No Horizontal Scroll**: Ensure 0 unintended horizontal overflow.
4. **Safe Areas & Virtual Keyboard**: Check `100dvh` and safe bottom padding.
5. **Accessibility**: Test tab navigation, visible focus, ARIA labels, and contrast.
6. **Error & Empty States**: Verify offline banners, error recovery, and loading spinners.
7. **Typecheck & Build**: Run `npm --prefix jatri run typecheck` and `npm --prefix jatri run build`.
8. **Regression Guard**: Confirm core booking and partner workflows remain unbroken.

---

## 12. Permanent Decision Rule

Whenever a request or technical choice presents a trade-off, **prioritize mobile usability, touch accessibility, and mobile performance first**. Never compromise the mobile experience for desktop convenience.
