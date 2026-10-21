---
name: opportunities-quality
description: Quality assurance, schema validation, XSS prevention, URL protocol security, WCAG 2.2 accessibility compliance, keyboard navigation, and QA testing standards for PATH TO OPPORTUNITIES.
---

# opportunities-quality — Quality Assurance, Security & Accessibility

## 1. Overview
This skill sets the standards for data contract validation, browser security, accessibility compliance (WCAG 2.2), and automated quality testing for **طريق الفرص | PATH TO OPPORTUNITIES**.

---

## 2. Data Contract & Schema Enforcement (`opportunities.schema.json`)
Every record in `opportunities.json` must strictly satisfy:
- **`id`:** String matching regex `^opp-[a-zA-Z0-9_-]+$`. Must be unique across all opportunities.
- **`type`:** Enum strictly limited to `["scholarship", "course", "internship"]`.
- **`title_ar` / `title_en`:** Strings with `minLength: 3`.
- **`organization` / `country` / `field`:** Strings with `minLength: 2`.
- **`level`:** Either a string or a non-empty array of strings.
- **`funding_type`:** Optional or enum `["full", "partial", "unspecified"]` (primarily for scholarships).
- **`deadline`:** Either `null` (for open/continuous opportunities) or ISO date matching `^\d{4}-\d{2}-\d{2}$`.
- **`source_url`:** Valid URI starting strictly with `https://`.
- **`verified_at`:** ISO date matching `^\d{4}-\d{2}-\d{2}$`.
- **`additionalProperties: false`:** Prevents rogue or unvalidated keys.

---

## 3. Security & Anti-XSS Measures
- **HTML Escaping:** All user or JSON-derived strings rendered in templates must pass through `escHtml(str)` and `escAttr(str)` before insertion into DOM attributes or innerHTML.
- **URL Protocol Sanitization (`sanitizeUrl`):** Enforces strict HTTPS URLs (`/^https:\/\/[^\s$.?#].[^\s]*$/i`). Never allows `javascript:`, `data:`, or unencrypted `http:`. Unsafe URLs resolve to `#`.
- **Synthetic Demo Safeguard:** If an opportunity is identified as a demo record (`opp.id.includes("demo")` or `example.org` link), action buttons MUST be rendered as `<button disabled class="card-cta-disabled" aria-disabled="true">`, preventing accidental live navigation to placeholder domains.

---

## 4. Accessibility Standards (WCAG 2.2 Level AA)
- **Keyboard Operability:**
  - Card elements feature `tabindex="0"`, clean `:focus-visible` outline rings with offset (`outline: 2.5px solid var(--color-primary); outline-offset: 3px;`), and keyboard activation via Space / Enter.
  - Form selects, tabs, and buttons are fully reachable and navigable via `Tab` and Arrow keys.
- **ARIA & Dynamic Announcements:**
  - Dynamic result counts use `aria-live="polite"` and `aria-atomic="true"`.
  - Empty and error states utilize `role="status"` or `role="alert"`.
  - Filter tabs use standard `role="tablist"` with `role="tab"` and dynamic `aria-selected` toggling.
  - Dropdown selects update their `aria-label` dynamically upon language toggle (AR/EN).
- **Contrast & Font Scaling:** Text-to-background contrast maintains at least `4.5:1` for normal text and `3:1` for large text across light and dark tokens.

---

## 5. QA Verification Checklist
Before submitting any changes:
1. Verify `opportunities.json` with `isValidOpportunity()` in Node.js.
2. Confirm 0 syntax or bundling errors with `npm run build`.
3. Check responsive layouts at both mobile (360px - 390px) and desktop (1024px - 1440px).
4. Verify RTL and LTR layout symmetry with language toggles.
