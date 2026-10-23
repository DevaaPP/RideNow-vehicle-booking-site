# Jaatri Design System & UI Engineering Guide

> **Last Verified**: October 18, 2026  
> **Brand Identity**: Jaatri (যাত্ৰী) / RideNow  
> **Aesthetic Philosophy**: Warm Editorial Assamese Ivory, Forest Green, Tactile Precision, Human Polish, and Seamless Nighttime Forest Dark Mode.

---

## 1. Dual Palette Tokens: Light & Dark Modes

Jaatri pairs an Assamese warm ivory editorial aesthetic for daytime with a deep, organic nighttime forest green dark theme. Cold brutalist blacks, zincs, and generic grays are strictly prohibited.

### A. Semantic Theme Mapping (Canonical Unified Palette)

| Semantic Role | Light Mode Value | Dark Mode Value | Tailwind Usage |
|---|---|---|---|
| **Page / Body Background** | `#FAF7F0` (Warm Ivory Light) | `#061A16` (Twilight Forest Black) | `bg-[#FAF7F0] dark:bg-[#061A16]` |
| **Card / Primary Container** | `#FFFFFF` / `#FAF7F0` | `#0B2822` (Deep Forest Green Surface) | `bg-white dark:bg-[#0B2822]` |
| **Raised Sub-card / Elevated Input**| `#FFFFFF` (Pure White) | `#10352C` (Raised Forest Emerald) | `bg-white dark:bg-[#10352C]` |
| **Active / Hover Highlight Surface** | `#F2ECE1` / `#E5EBDD` | `#143D32` (Active Forest Highlight) | `dark:hover:bg-[#10352C] dark:active:bg-[#143D32]` |
| **Primary Text / Headlines** | `#10251C` (Deep Forest Ink) | `#F7F5ED` (Ivory Cream Text) | `text-[#10251C] dark:text-[#F7F5ED]` |
| **Secondary / Subtitle Text**| `#696B64` (Muted Warm Gray) | `#B9C8BF` (Muted Sage Green) | `text-[#696B64] dark:text-[#B9C8BF]` |
| **Brand Primary Interactive CTA** | `#046A38` (Primary Emerald) | `#046A38` (hover `#03532C`) | `bg-[#046A38] hover:bg-[#03532C] text-white` |
| **Brand Mint / Accent Highlight** | `#046A38` (Deep Emerald) | `#34D399` (Mint Glow) | `text-[#046A38] dark:text-[#34D399]` |
| **Default Border / Divider** | `#DED7CA` (Warm Border) | `#24483D` (Deep Forest Border) | `border-[#DED7CA] dark:border-[#24483D]` |
| **Subtle Border / Divider** | `#E8E2D8` (Soft Ivory Line)| `#1E3E34` (Subtle Night Forest Line)| `border-[#E8E2D8] dark:border-[#1E3E34]` |
| **Assamese Vermilion Signature Accent**| `#E34222` (Assamese Vermilion) | `#E34222` / `#E06A50` | `text-[#E34222] bg-[#E34222]` |
| **Gold / Rating Accent** | `#C28B38` (Assam Silk Gold)| `#D7AC62` (Warm Amber Gold) | `text-[#C28B38] dark:text-[#D7AC62]` |
| **Lime Accent (Badges)** | `#046A38` on `#E5EBDD` | `#A3E635` (Fluorescent Lime) | `text-[#046A38] dark:text-[#A3E635]` |

### B. Tailwind CSS v4 Dark Variant Integration

In Tailwind CSS v4, dark mode variant handling is declared directly in [`jatri/src/app/globals.css`](file:///d:/git/RideNow/jatri/src/app/globals.css):
```css
@custom-variant dark (&:where(.dark, .dark *));
```
This guarantees that both explicit ancestor `.dark` container scopes and root `<html className="dark">` toggle classes apply synchronously without CSS specificity conflicts.

---

## 2. Typography Rules

- **Display & Section Headlines**:
  - Font: `DM Serif Display`, Georgia, Cambria, serif (`font-serif`).
  - Tone: Elegant, editorial, authoritative, warm.
  - Optical sizing active with negative letter tracking (`tracking-tight`, `leading-[1.08]`).
  - Light example: `<h1 className="font-serif text-3xl sm:text-4xl text-[#10251C] dark:text-[#F3F1E8] tracking-tight">`
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

## 4. Map & Spatial Theming (MapLibre GL)

The mapping layer automatically switches styles based on the active theme:
- **Light Theme**: Carto Positron / OSM Warm Vector tiles.
- **Dark Theme**: Carto Dark Matter / Stadia Alidade Smooth Dark tiles (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`).
- **Vehicle Markers**: Glow ring and orientation compass markers use `#A3E635` / `#28664D` in dark mode for maximum contrast and legibility over night roads.

---

## 5. Reusable Shared & Themed Components

Located in [`jatri/src/shared/components/`](file:///d:/git/RideNow/jatri/src/shared/components/):

- [`ThemeToggle.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/ThemeToggle.tsx): Seamless light/dark switcher with persistent `localStorage` cache and automatic OS `prefers-color-scheme` synchronization.
- [`Nav.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/Nav.tsx): Unified top navigation bar with language selector (Assamese, Bengali, English, Hindi), dark mode toggle, and role-aware profile menus.
- [`Footer.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/Footer.tsx): Global footer with statutory disclosures, Assam regional hubs, and theme-aware contrast.
- [`CookieConsent.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/CookieConsent.tsx): DPDP Act 2023 compliant banner styled in `#FAF7F0` / `#17211B` with `rounded-[8px]` actions and granular privacy controls.
- [`TripDetailsModal.tsx`](file:///d:/git/RideNow/jatri/src/features/booking/components/TripDetailsModal.tsx): Ride receipt modal featuring interactive vector SVG route map, driver details, fare ledger, and `rounded-[14px]` surface.
- [`TripInvoiceModal.tsx`](file:///d:/git/RideNow/jatri/src/features/booking/components/TripInvoiceModal.tsx): Printable tax invoice with dark mode viewing chrome while preserving crisp white media print output for physical billing.
- [`VehicleIcons.tsx`](file:///d:/git/RideNow/jatri/src/shared/components/VehicleIcons.tsx): Clean SVG vehicle silhouettes for all 8 categories.
- [`RouteMap.tsx`](file:///d:/git/RideNow/jatri/src/features/maps/components/RouteMap.tsx): High-performance MapLibre GL map container supporting multi-stop waypoints, live user GPS pulse, and route rendering.

