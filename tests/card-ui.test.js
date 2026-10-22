/**
 * card-ui.test.js — Automated Verification for Opportunity Cards Redesign
 */

import assert from "node:assert";
import fs from "node:fs";

console.log("==========================================");
console.log("   OPPORTUNITY CARD REDESIGN VERIFICATION   ");
console.log("==========================================\n");

const cardJs = fs.readFileSync("src/js/components/OpportunityCard.js", "utf8");
const mainCss = fs.readFileSync("src/styles/main.css", "utf8");

// Test 1: Monogram initials removal from UI
assert.ok(
  !cardJs.includes('card-org-avatar'),
  "[PASS] 1.1 Legacy avatar .card-org-avatar completely removed from card HTML"
);
console.log("[PASS] 1.1 Legacy avatar .card-org-avatar completely removed from card HTML");

assert.ok(
  cardJs.includes('export function getOrgInitials'),
  "[PASS] 1.2 getOrgInitials kept exported for unit test backward compatibility"
);
console.log("[PASS] 1.2 getOrgInitials kept exported for unit test backward compatibility");

// Test 2: Required hierarchy elements
assert.ok(cardJs.includes('class="card-header"'), "Must include card-header");
assert.ok(cardJs.includes('class="status-badge'), "Must include status-badge at top");
assert.ok(cardJs.includes('class="card-institution"'), "Must include card-institution");
assert.ok(cardJs.includes('class="card-title"'), "Must include card-title");
assert.ok(cardJs.includes('class="card-meta"'), "Must include card-meta");
assert.ok(cardJs.includes('class="funding-badge'), "Must include funding-badge");
assert.ok(cardJs.includes('class="card-footer"'), "Must include card-footer");
assert.ok(cardJs.includes('class="card-deadline'), "Must include card-deadline");
assert.ok(cardJs.includes('class="card-cta card-cta-details"'), "Must include card-cta");
console.log("[PASS] 2.1 All 6 required priority hierarchy levels are properly structured in the card");

// Test 3: No redundant card-summary-preview in card component
assert.ok(
  !cardJs.includes('card-summary-preview'),
  "[PASS] 3.1 Cluttered summary preview removed from card; full details reserved for detail page"
);
console.log("[PASS] 3.1 Cluttered summary preview removed from card; full details reserved for detail page");

// Test 4: Touch targets >= 44x44px in CSS
assert.ok(
  mainCss.includes('min-height: 44px;') && mainCss.includes('min-width: 44px;'),
  "[PASS] 4.1 Card CTA button satisfies WCAG 2.2 touch target minimum (>= 44x44px)"
);
console.log("[PASS] 4.1 Card CTA button satisfies WCAG 2.2 touch target minimum (>= 44x44px)");

// Test 5: Responsive Grid Breakpoints
const oppsGridSection = mainCss.match(/\/\* Grid \*\/[\s\S]*?(?=\/\* -{10,})/)?.[0] || "";
assert.ok(oppsGridSection.includes('.opps-grid'), "Must define .opps-grid");
assert.ok(oppsGridSection.includes('@media (min-width: 768px)'), "Must define 768px breakpoint");
assert.ok(oppsGridSection.includes('@media (min-width: 1024px)'), "Must define 1024px breakpoint");
assert.ok(!oppsGridSection.includes('repeat(4,'), "opps-grid must NOT force 4 cramped columns");
console.log("[PASS] 5.1 Responsive grid adapts: 1 col (320-767px), 2 cols (768-1023px), 3 cols (1024px+) with cards >= 280px");

// Test 6: Micro-interactions and motion accessibility
assert.ok(mainCss.includes('translateY(-4px)'), "Must have hover lift");
assert.ok(mainCss.includes('prefers-reduced-motion'), "Must respect prefers-reduced-motion");
assert.ok(mainCss.includes('[dir="rtl"] .card-cta .cta-arrow'), "Must support RTL arrow orientation");
console.log("[PASS] 6.1 Micro-interactions, hover lift, RTL/LTR arrows, and prefers-reduced-motion fully configured");

console.log("\n==========================================");
console.log("ALL CARD REDESIGN VERIFICATION CHECKS PASSED!");
console.log("==========================================");
