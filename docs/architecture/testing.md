# Jaatri Testing & Quality Verification Guide

> **Last Verified**: October 18, 2026  
> **Primary Check Suite**: TypeScript Typecheck + Next.js Turbopack Full Build

---

## 1. Primary Verification Commands

Run from the repository root:

```bash
# 1. Typecheck the entire Next.js codebase (Zero TypeScript errors allowed)
npm --prefix jatri run typecheck

# 2. Production build with Next.js Turbopack (70/70 pages verified)
npm --prefix jatri run build

# 3. Check standalone socketServer syntax
node -c socketServer/index.js
```

---

## 2. Pre-Commit Regression Checklist

Before committing any code change or reporting task completion, verify:

1. **TypeScript Integrity**:
   - Run `npm --prefix jatri run typecheck`.
   - Ensure `tsc --noEmit` exits with status `0`.
2. **Next.js Route Compilation**:
   - Run `npm --prefix jatri run build`.
   - Ensure all static and dynamic pages compile without syntax, import, or build errors.
3. **State Machine Safety**:
   - If modifying booking states or endpoints, verify against `ALLOWED_TRANSITIONS` in [`bookingStateMachine.ts`](file:///d:/git/RideNow/jatri/src/lib/bookingStateMachine.ts).
4. **Security & Ownership**:
   - In all `/api/booking/[id]/*` endpoints, confirm that ownership or admin checks run **before** returning idempotency results or sensitive data (e.g. `pickupOtp`, `dropOtp`).
5. **UI & Theme Tokens**:
   - Check that UI changes use the warm ivory/green palette and appropriate `rounded-[8px]` / `rounded-[12px]` corner radius tokens.
6. **No Phantom Driver Mocks**:
   - Verify that driver dispatch sweeps only real online users from the database.

---

## 3. Database & Simulation Scripts

Located in [`jatri/scripts/`](file:///d:/git/RideNow/jatri/scripts/):

- `dbcheck.js`: Validates MongoDB connectivity and counts active collections.
- `test_booking.js`: End-to-end command-line test script simulating booking creation, driver candidate selection, and fare calculation.
