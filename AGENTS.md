# Jaatri (যাত্ৰী) / RideNow — Agent Operating System & Repository Guide

> **Last Verified**: October 18, 2026  
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
   - **Design System Tokens**: Jaatri uses a warm ivory (`#F7F1E5` / `#FAF7F0`), forest green (`#123D32` / `#0D3027`), ink (`#10251C`), and vermilion (`#B83A24`) aesthetic with structured rounded corners (`rounded-[8px]` for buttons, `rounded-[12px]` / `rounded-[14px]` for cards). NEVER introduce arbitrary cold grays or brutalist 0px corners.
4. **No Unnecessary Dependencies**: Do not install new styling libraries, state managers, or ORMs. The project already uses Tailwind CSS v4, Redux Toolkit, Mongoose 9, MapLibre GL, and Lucide React.
5. **Always Verify Builds**: Run `npm --prefix jatri run typecheck` and `npm --prefix jatri run build` before committing. Ensure 0 type errors and 0 route generation errors.

---

## 2. Workspace Layout & Execution Context

| Directory / File | Description | Execution Context |
|---|---|---|
| `jatri/` | Next.js 16 full-stack web application | App Router, Server Actions, Route Handlers, Client Components |
| `jatri/src/app/` | 70+ Next.js routes (passenger booking, partner onboarding, admin, checkout) | Next.js Server & Client |
| `jatri/src/app/api/` | 40+ REST API Route Handlers | Node.js Runtime (Edge middleware runs via `proxy.ts`) |
| `jatri/src/models/` | 19 Mongoose Schemas (User, Vehicle, Booking, Payment, Wallet, etc.) | Shared MongoDB Database |
| `jatri/src/lib/` | Core domain engines (Fare, Matching, State Machine, Payment, Cancellation) | Server-side domain logic |
| `socketServer/` | Standalone WebSocket microservice | Node.js process listening on port 5000 (Render / local) |
| `docs/architecture/` | Repository intelligence and architecture maps | Persistent agent memory |

---

## 3. Essential Commands

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

## 4. Repository Intelligence Map Index

Before making modifications, consult the authoritative documentation in `docs/architecture/`:

- [System Architecture Overview](file:///d:/git/RideNow/docs/architecture/overview.md) — Application boundaries, services, runtime environments.
- [Route Inventory & Access](file:///d:/git/RideNow/docs/architecture/routes.md) — App Router pages, APIs, authentication requirements, and role permissions.
- [Data Flow & Business Logic](file:///d:/git/RideNow/docs/architecture/data-flow.md) — Booking lifecycle, broadcast dispatch, payment verification, and real-time socket events.
- [Data Models & Schemas](file:///d:/git/RideNow/docs/architecture/data-models.md) — 19 Mongoose models, indexes, relationships, and validation rules.
- [External Integrations](file:///d:/git/RideNow/docs/architecture/integrations.md) — Razorpay, ZegoCloud, Cloudinary, Meta WhatsApp Cloud API, Resend, Upstash Redis.
- [Design System & UI Tokens](file:///d:/git/RideNow/docs/architecture/design-system.md) — Typography, palette tokens, corner radii, and component conventions.
- [Testing & Verification](file:///d:/git/RideNow/docs/architecture/testing.md) — Typecheck procedures, build verification, and regression checklists.
- [Known Technical Debt & Workarounds](file:///d:/git/RideNow/docs/architecture/known-issues.md) — Confirmed historical issues, architectural fixes, and rules of thumb.
- [Code Index & Symbol Map](file:///d:/git/RideNow/docs/architecture/code-index.md) — Quick symbol lookup for critical engines, handlers, and stores.

---

## 5. Agent Workflow Checklist

When assigned a new task:
1. **Locate**: Grep for the route, component, or symbol mentioned in the prompt.
2. **Contextualize**: Check its entry in `docs/architecture/code-index.md` or `docs/architecture/routes.md`.
3. **Trace**: Follow caller/callee relationships (e.g. API handler -> Domain engine -> Mongoose model -> Socket emit).
4. **Modify**: Apply targeted, minimal edits preserving existing interfaces and comments.
5. **Verify**: Run `npm --prefix jatri run typecheck` and `npm --prefix jatri run build`.
6. **Update Memory**: If you altered any routes, models, or domain rules, update the corresponding `docs/architecture/*.md` file.
