# Jaatri (যাত্ৰী) / RideNow — Agent Operating System & Repository Guide

> **Last Verified**: October 20, 2026  
> **Repository Root**: `d:\git\RideNow`  
> **Main Application**: `d:\git\RideNow\jatri` (Next.js 16 App Router, React 19, Turbopack, Tailwind CSS v4)  
> **Realtime Microservice**: `d:\git\RideNow\socketServer` (Node.js, Express 5, Socket.IO 4, Mongoose)

---

## 1. Golden Rules for Future AI Coding Agents

1. **Search Before You Edit**: Never guess file paths, symbol names, or API response formats. Use `git grep` or targeted ripgrep before opening or touching files.
2. **Consult Architecture Docs First**: Read the relevant documents in `docs/architecture/` before attempting architectural changes or adding new workflows.
3. **Preserve Invariants**:
   - **Booking State Transitions**: State transitions MUST go through `jatri/src/lib/bookingStateMachine.ts`. Never perform arbitrary `Booking.findByIdAndUpdate` status changes without transition guards.
   - **Payment Idempotency**: Payment completion, webhook handlers, and confirmation routes must be strictly idempotent and verify ownership/admin permissions before state checks.
   - **Driver Matching & Dispatch**: Broadcast dispatch in `driverMatchingEngine.ts` alerts all online nearby drivers in parallel; first to accept claims the booking atomically.
   - **Design System Tokens**: Jaatri uses a warm ivory (`#F7F1E5` / `#FAF7F0`), forest green (`#123D32` / `#0D3027`), ink (`#10251C`), primary interactive emerald (`#046A38`), and vermilion (`#E34222`) aesthetic with structured rounded corners (`rounded-[8px]` for buttons, `rounded-[10px]` for inputs, `rounded-[12px]` / `rounded-[14px]` for cards). NEVER introduce arbitrary cold grays or brutalist 0px corners.
4. **Mobile-First Application Architecture**: Jaatri is a mobile application first in every implementation decision. Every feature, interaction, setting, layout, and test must be designed and verified for touch, narrow viewports (360px–430px), dynamic mobile viewports (`100dvh`), and WCAG 2.2 AA accessibility first before progressive desktop enhancement. Never shrink a desktop interface to fit mobile.
5. **No Unnecessary Dependencies**: Do not install new styling libraries, state managers, or ORMs. The project already uses Tailwind CSS v4, Redux Toolkit, Mongoose 9, MapLibre GL, and Lucide React.
6. **Always Verify Builds**: Run `npm --prefix jatri run typecheck` and `npm --prefix jatri run build` before committing. Ensure 0 type errors and 0 route generation errors.

---

## 2. Permanent Project Rule: Mobile-First Application Development

*(Permanent binding mandate across all existing & future features, refactoring, bug fixes, settings, accessibility, and operational tools)*

1. **Mobile-First Is Mandatory**: Understand real mobile usage first, inspect mobile screens, design mobile interactions first, and progressively enhance for desktop without compromising mobile usability.
2. **Mobile Interaction Standards**:
   - Touch targets ≥ 44 × 44 CSS pixels with adequate physical spacing.
   - Zero hover-dependent actions; everything works via touch and keyboard.
   - Prevent accidental gestures, double submissions, and scroll contention.
   - Mobile-native controls (bottom sheets, segment selectors; no cramped desktop menus).
   - Form keyboard friendliness (`inputMode`, `autoComplete`, inputs visible above virtual keyboard).
3. **Responsive Layout & Viewport Management**:
   - Build for narrow screens first (360px+); zero horizontal overflow.
   - Dynamic viewports (`100dvh`) with safe-area insets (`env(safe-area-inset-bottom)`).
   - Clear scroll ownership between full-page scroll and internal bottom sheets.
4. **Accessibility as a Core Requirement (WCAG 2.2 AA)**:
   - Semantic HTML, accessible names/labels on all icon buttons.
   - Visible focus rings, focus traps on modals/sheets, screen reader announcements (`aria-live="polite"`).
   - Verified contrast in both light (`#FAF7F0`) and forest dark (`#17211B`) themes.
5. **Mobile-Native Settings & Preferences**:
   - Grouped list layouts with readable labels, descriptive helper text, and accessible switch toggles.
   - No dense administrative data tables crammed onto phones.
   - Explicit confirmation sheets with recovery guidance for destructive actions.
6. **Mobile Navigation & Information Architecture**:
   - Thumb-zone reachability for primary CTAs and search inputs.
   - Predictable back-navigation preserving user context.
7. **Mobile Performance & Reliability**:
   - Minimal client bundle size; lazy load maps and heavy SDKs.
   - Flaky network handling (2G/3G/4G), auto-reconnect with exponential backoff.
   - Form state preservation across transient failures or background app switches.
8. **Mobile Security & Privacy**:
   - Zero trust in client; backend authorization on every route handler and state machine transition.
   - Zero client-exposed secrets; just-in-time permissions with clear rationale.
9. **Full Module Coverage**:
   - Covers passenger booking, live maps, driver dispatch, cargo, authentication, billing, and admin tools.
10. **Preserve Jaatri Design System**:
   - Emerald (`#046A38`), Forest Green (`#123D32`), Warm Ivory (`#F7F1E5`), Vermilion (`#E34222`), `rounded-[8px]` buttons, `rounded-[12px]` cards.
11. **Mandatory Verification**:
   - Test narrow mobile viewport (360px), touch targets, no horizontal scroll, safe areas, accessibility, typecheck, and build.
12. **Permanent Decision Rule**:
   - In any architectural or design trade-off, prioritize mobile usability and touch accessibility first.

---

## 3. Workspace Layout & Execution Context

| Directory / File | Description | Execution Context |
|---|---|---|
| `jatri/` | Next.js 16 full-stack web application | App Router, Server Actions, Route Handlers, Client Components |
| `jatri/src/app/` | 70+ Next.js routes (passenger booking, partner onboarding, admin, checkout) | Next.js Server & Client |
| `jatri/src/app/api/` | 40+ REST API Route Handlers | Node.js Runtime (Edge middleware runs via `proxy.ts`) |
| `jatri/src/models/` | 19 Mongoose Schemas (User, Vehicle, Booking, Payment, Wallet, etc.) | Shared MongoDB Database |
| `jatri/src/lib/` | Core domain engines (Fare, Matching, State Machine, Payment, Cancellation) | Server-side domain logic |
| `socketServer/` | Standalone WebSocket microservice | Node.js process listening on port 5000 (Render / local) |
| `docs/architecture/` | Repository intelligence and architecture maps | Persistent agent memory |
| `.agents/rules/` | Operational rules and agent constraints | Agent runtime guidance |

---

## 4. Essential Commands

All commands should typically be run from the repository root or within `jatri/`:

```bash
# Typecheck (TypeScript 6 / tsc)
npm --prefix jatri run typecheck

# Production Build (Next.js 16 Turbopack)
npm --prefix jatri run build

# Start Development Server (Next.js)
npm --prefix jatri run dev

# Standalone Socket Server
npm --prefix socketServer start
```

---

## 5. Repository Intelligence Map Index

Before making modifications, consult the authoritative documentation in `docs/architecture/`:

- [System Architecture Overview](file:///d:/git/RideNow/docs/architecture/overview.md) — Application boundaries, services, runtime environments.
- [Mobile-First Architecture & Design Principles](file:///d:/git/RideNow/docs/architecture/mobile-first.md) — Touch ergonomics, viewport bounds, safe areas, network resilience.
- [Route Inventory & Access](file:///d:/git/RideNow/docs/architecture/routes.md) — App Router pages, APIs, authentication requirements, and role permissions.
- [Data Flow & Business Logic](file:///d:/git/RideNow/docs/architecture/data-flow.md) — Booking lifecycle, broadcast dispatch, payment verification, and real-time socket events.
- [Data Models & Schemas](file:///d:/git/RideNow/docs/architecture/data-models.md) — 19 Mongoose models, indexes, relationships, and validation rules.
- [External Integrations](file:///d:/git/RideNow/docs/architecture/integrations.md) — Razorpay, ZegoCloud, Cloudinary, Meta WhatsApp Cloud API, Resend, Upstash Redis.
- [Design System & UI Tokens](file:///d:/git/RideNow/docs/architecture/design-system.md) — Typography, palette tokens, corner radii, and component conventions.
- [Testing & Verification](file:///d:/git/RideNow/docs/architecture/testing.md) — Typecheck procedures, build verification, and regression checklists.
- [Known Technical Debt & Workarounds](file:///d:/git/RideNow/docs/architecture/known-issues.md) — Confirmed historical issues, architectural fixes, and rules of thumb.
- [Code Index & Symbol Map](file:///d:/git/RideNow/docs/architecture/code-index.md) — Quick symbol lookup for critical engines, handlers, and stores.

---

## 6. Agent Workflow Checklist

When assigned a new task:
1. **Locate**: Grep for the route, component, or symbol mentioned in the prompt.
2. **Contextualize**: Check its entry in `docs/architecture/code-index.md`, `docs/architecture/routes.md`, and `docs/architecture/mobile-first.md`.
3. **Trace**: Follow caller/callee relationships (e.g. API handler -> Domain engine -> Mongoose model -> Socket emit).
4. **Mobile First Design**: Craft the touch interaction and mobile layout (360px+) before scaling to desktop.
5. **Modify**: Apply targeted, minimal edits preserving existing interfaces, accessibility labels, and comments.
6. **Verify**: Run `npm --prefix jatri run typecheck` and `npm --prefix jatri run build`.
7. **Update Memory**: If you altered any routes, models, domain rules, or mobile patterns, update the corresponding `docs/architecture/*.md` file.
