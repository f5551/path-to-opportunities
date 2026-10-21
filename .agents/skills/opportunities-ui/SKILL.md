---
name: opportunities-ui
description: Design system, mobile-first layouts, Tailwind CSS v4, daisyUI themes, OKLCH tokens, and Motion JS animations for the PATH TO OPPORTUNITIES platform.
---

# opportunities-ui — UI, Design System & Motion Guide

## 1. Overview
This skill defines the visual architecture, styling rules, responsive layout patterns, and interaction motion for **طريق الفرص | PATH TO OPPORTUNITIES**. The stack uses **HTML5 + CSS3 + Tailwind CSS v4 + daisyUI v5 + Motion JS**, strictly avoiding React, Vue, or CDNs.

---

## 2. Design System Tokens (OKLCH)
All brand tokens and semantic colors are defined as CSS custom properties in `src/styles/main.css` using the perceptual `oklch` color space:

- **Primary Brand:** `oklch(0.49 0.12 176)` (Deep Emerald / Teal)
- **Primary Light/Dark:** `oklch(0.60 0.13 176)` / `oklch(0.38 0.10 176)`
- **Accent:** `oklch(0.68 0.16 48)` (Warm Amber/Coral)
- **Surfaces:**
  - Background: `oklch(0.985 0.005 180)`
  - Surface: `oklch(1 0 0)`
  - Surface Secondary: `oklch(0.96 0.008 180)`
- **Typography:**
  - Arabic: `@fontsource-variable/noto-sans-arabic` (`--font-arabic`)
  - Latin & Numerals: `@fontsource-variable/inter` (`--font-latin`)

### Usage Rules:
- Never introduce arbitrary hex/rgb colors; reference existing `--color-*` tokens or OKLCH shades.
- Use logical properties (`margin-inline`, `padding-block`, `inset-inline-start`, `inset-inline-end`) for automatic RTL/LTR symmetry.

---

## 3. Responsive Layout & Mobile-First Strategy
The interface is engineered from **Mobile-First (360px)** upward:

### Breakpoints:
- `360px - 539px`: Single column mobile layout.
- `540px - 899px`: Two-column grid (`repeat(2, 1fr)`).
- `900px - 1199px`: Three-column grid (`repeat(3, 1fr)`).
- `1200px+`: Four-column desktop grid (`repeat(4, 1fr)`).

### Grid Patterns:
- **Opportunities Grid (`.opps-grid`):** Responsive card grid adapting cleanly from 1 to 4 columns.
- **Filters Grid (`.filters-grid`):** 1 column on mobile, transitioning to a clean 4-select + reset action layout (`repeat(4, 1fr) auto`) on desktop with `align-items: flex-end`.

---

## 4. Opportunity Card & Badges Architecture
Cards must preserve visual hierarchy:
1. **Header Row:** Type badge (`scholarship`, `course`, `internship`), optional `funding-badge` (`full`, `partial`, `unspecified`), and `demo-tag` alongside the `level-badge`.
2. **Body:** Multi-line clamped title (2 lines max), meta items with inline SVG icons (Organization, Field, Country).
3. **Footer:** Deadline status indicator (`urgent`, normal, or open enrollment) and action CTA (disabled `<button>` for demo items, external link `<a>` for verified live items).

---

## 5. Motion & Micro-interactions
All transitions and animations use **Motion for JavaScript** (`import { animate, stagger } from "motion"`) adhering to:
- **Easing:** Natural cubic curves (`cubic-bezier(0.16, 1, 0.3, 1)` or `--ease-out-cubic`).
- **Duration:** Fast micro-interactions (150ms - 280ms); stagger increments of 40ms for card entrances.
- **Accessibility:** Always check and respect `@media (prefers-reduced-motion: reduce)` by disabling CSS transitions and JavaScript entrance animations.
