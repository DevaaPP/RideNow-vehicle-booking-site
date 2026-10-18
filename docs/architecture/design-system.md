# Jaatri Design System & UI Engineering Guide

> **Last Verified**: October 18, 2026  
> **Brand Identity**: Jaatri (যাত্ৰী)  
> **Aesthetic Philosophy**: Warm Editorial Assamese Ivory, Forest Green, Tactile Precision, and Human Polish.

---

## 1. Core Palette Tokens

| Token | Hex Value | Semantic Role | Tailwind Class / CSS Var |
|---|---|---|---|
| **Forest Green (Primary)** | `#123D32` | Primary brand CTA, active states, key accents | `bg-[#123D32]`, `text-[#123D32]`, `var(--color-forest)` |
| **Forest Hover** | `#0D3027` | Button hover & active pressed states | `hover:bg-[#0D3027]`, `var(--color-forest-hover)` |
| **Warm Ivory (Page BG)** | `#F7F1E5` | Default body and viewport background | `bg-[#F7F1E5]`, `var(--color-ivory)` |
| **Ivory Light (Card Surface)**| `#FAF7F0` | Elevated surfaces, dashboard cards, panels | `bg-[#FAF7F0]`, `var(--color-ivory-light)` |
| **Sage / Mint Accent** | `#E5EBDD` | Badges, success pills, verified tags | `bg-[#E5EBDD]`, `text-[#123D32]`, `var(--color-sage)` |
| **Dark Ink (Headlines)** | `#10251C` | Deep legible text, high-contrast typography | `text-[#10251C]`, `var(--color-ink)` |
| **Muted Slate / Olive** | `#696B64` | Subtitles, helper text, tabular descriptions | `text-[#696B64]`, `var(--color-muted-text)` |
| **Warm Border** | `#DED7CA` | Subtle card dividers, form inputs, borders | `border-[#DED7CA]`, `var(--color-warm-border)` |
| **Vermilion / Rust Accent** | `#B83A24` | Urgent alerts, cancellation tags, accent pills| `text-[#B83A24]`, `bg-[#faebe8]` |

---

## 2. Typography Rules

- **Display & Section Headlines**:
  - Font: `DM Serif Display`, Georgia, Cambria, serif (`font-serif`).
  - Tone: Elegant, editorial, authoritative, warm.
  - Optical sizing active with negative letter tracking (`tracking-tight`, `leading-[1.08]`).
  - Example: `<h1 className="font-serif text-3xl sm:text-4xl text-[#10251C] tracking-tight">`
- **Body & Controls**:
  - Font: `Inter`, system-ui, -apple-system, sans-serif (`font-sans`).
  - Letter spacing: `-0.011em`.
  - Feature settings: `"cv02", "cv03", "cv04", "cv11", "tnum"`.
- **Numbers & Fares**:
  - Always enforce tabular numbers: `font-variant-numeric: tabular-nums;` or `tabular-nums font-bold`.

---

## 3. Corner Radius Geometry (Strict Anti-Brutalist Rule)

All elements must adhere to calibrated physical corner tokens:

| Element Type | Exact Radius | Tailwind Class |
|---|---|---|
| **Buttons & Interactive CTAs** | `8px` | `rounded-[8px]` |
| **Active Tabs & Segment Controls** | `7px` | `rounded-[7px]` |
| **Inputs, Textareas, Selectors** | `10px` | `rounded-[10px]` |
| **Panels, Boxes, Internal Sections**| `12px` | `rounded-[12px]` |
| **Primary Cards & Modals** | `14px` or `16px` | `rounded-[14px]` or `rounded-[16px]` |
| **Pills, Status Badges, Chips** | `9999px` | `rounded-full` |

> ⚠️ **BANNED**: Never use sharp 0px brutalist corners (`rounded-none` or `rounded-0`) for primary UI cards, buttons, or modals.

---

## 4. Reusable Shared Components

Located in [`jatri/src/shared/components/`](file:///d:/git/RideNow/jatri/src/shared/components/):

- [`Nav.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/Nav.tsx): Unified top navigation bar with language selector (Assamese, Bengali, English, Hindi) and role-aware profile menus.
- [`Footer.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/Footer.tsx): Global footer with statutory disclosures and regional Assam coverage links.
- [`VehicleIcons.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/VehicleIcons.tsx): Clean SVG vehicle silhouettes for all 8 categories.
- [`RouteMap.tsx`](file:///d:/git/RideNow/jatri/src/features/maps/components/RouteMap.tsx): High-performance MapLibre GL map container supporting multi-stop waypoints, live user GPS pulse, and route rendering.
