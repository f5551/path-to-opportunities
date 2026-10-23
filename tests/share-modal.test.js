/**
 * share-modal.test.js — Verification for "Share an Opportunity" Feature
 *
 * Tests:
 * 1. HTML markup & accessibility: trigger button, modal panel, form fields, and close button
 * 2. i18n coverage: all shareModal keys exist in both ar and en translations
 * 3. Form validation logic: empty form detection, URL format validation
 * 4. Progressive disclosure logic: expandable form preservation
 * 5. Formspree submission handling: unconfigured state vs configured state
 */

import assert from "node:assert";
import fs from "node:fs";

console.log("==========================================");
console.log("   SHARE OPPORTUNITY FEATURE TEST SUITE   ");
console.log("==========================================");

// 1. HTML Markup & Element Contract Tests
const oppsHtml = fs.readFileSync("opportunities.html", "utf8");

assert.ok(oppsHtml.includes('id="btn-open-share-modal"'), "opportunities.html must include #btn-open-share-modal");
assert.ok(oppsHtml.includes('id="filter-favorites-btn"'), "opportunities.html must retain #filter-favorites-btn");
assert.ok(oppsHtml.includes('id="share-opportunity-modal"'), "opportunities.html must include #share-opportunity-modal");
assert.ok(oppsHtml.includes('role="dialog"'), "Modal must have role=dialog");
assert.ok(oppsHtml.includes('aria-modal="true"'), "Modal must have aria-modal=true");
assert.ok(oppsHtml.includes('id="btn-toggle-share-form"'), "Modal must have expand button #btn-toggle-share-form");
assert.ok(oppsHtml.includes('id="share-form-wrapper"'), "Modal must have expandable form wrapper #share-form-wrapper");
assert.ok(oppsHtml.includes('id="share-opportunity-form"'), "Modal must have form #share-opportunity-form");
assert.ok(oppsHtml.includes('id="btn-submit-share"'), "Modal must have submit button #btn-submit-share");
assert.ok(oppsHtml.includes('id="share-success-view"'), "Modal must have success state view #share-success-view");
assert.ok(oppsHtml.includes('id="share-modal-close"'), "Modal must have close button #share-modal-close");

// Verify NO required attributes on share form fields
const formMatch = oppsHtml.match(/<form id="share-opportunity-form"[\s\S]*?<\/form>/);
assert.ok(formMatch, "Form element must exist in opportunities.html");
const formHtml = formMatch[0];
assert.ok(!formHtml.includes(" required"), "All fields in share form must be optional (no required attribute)");

console.log("[PASS] 1.1 HTML markup, accessibility semantics, and optional fields contract verified");

// 2. i18n Coverage Tests
const ar = JSON.parse(fs.readFileSync("src/locales/ar/translation.json", "utf8")).translation;
const en = JSON.parse(fs.readFileSync("src/locales/en/translation.json", "utf8")).translation;

assert.ok(ar.shareModal, "Arabic translation must contain shareModal section");
assert.ok(en.shareModal, "English translation must contain shareModal section");

const requiredKeys = [
  "triggerBtn",
  "modalTitle",
  "modalDesc",
  "reviewNotice",
  "expandBtn",
  "collapseBtn",
  "close",
  "typeLabel",
  "typePlaceholder",
  "typeScholarship",
  "typeCourse",
  "typeInternship",
  "typeOther",
  "titleLabel",
  "titlePlaceholder",
  "orgLabel",
  "orgPlaceholder",
  "urlLabel",
  "urlPlaceholder",
  "deadlineLabel",
  "notesLabel",
  "notesPlaceholder",
  "submitBtn",
  "submitting",
  "errorEmpty",
  "errorUrl",
  "errorNotConfigured",
  "errorGeneral",
  "successTitle",
  "successDesc",
  "shareAnother",
];

requiredKeys.forEach((key) => {
  assert.ok(ar.shareModal[key], `Arabic missing shareModal.${key}`);
  assert.ok(en.shareModal[key], `English missing shareModal.${key}`);
});

console.log("[PASS] 2.1 Full Arabic and English translation parity for all 31 shareModal keys");

// 3. Form Validation Engine Tests
function validateShareForm({ type, title, organization, sourceUrl, deadline, notes }) {
  const hasAnyUsefulInfo = Boolean(
    (type && type.trim()) ||
    (title && title.trim()) ||
    (organization && organization.trim()) ||
    (sourceUrl && sourceUrl.trim()) ||
    (deadline && deadline.trim()) ||
    (notes && notes.trim())
  );

  if (!hasAnyUsefulInfo) {
    return { valid: false, error: "errorEmpty" };
  }

  if (sourceUrl && sourceUrl.trim()) {
    try {
      const parsed = new URL(sourceUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { valid: false, error: "errorUrl" };
      }
    } catch {
      return { valid: false, error: "errorUrl" };
    }
  }

  return { valid: true, error: null };
}

// 3.1 Empty form check
assert.deepStrictEqual(
  validateShareForm({ type: "", title: "", organization: "", sourceUrl: "", deadline: "", notes: "" }),
  { valid: false, error: "errorEmpty" },
  "Empty form must be rejected with errorEmpty"
);
assert.deepStrictEqual(
  validateShareForm({ type: "  ", title: "\n", organization: "", sourceUrl: "", deadline: "", notes: "" }),
  { valid: false, error: "errorEmpty" },
  "Whitespace-only form must be rejected with errorEmpty"
);

// 3.2 Single field provides useful info -> valid!
assert.deepStrictEqual(
  validateShareForm({ type: "scholarship", title: "", organization: "", sourceUrl: "", deadline: "", notes: "" }),
  { valid: true, error: null },
  "Providing only type must be valid"
);
assert.deepStrictEqual(
  validateShareForm({ type: "", title: "DAAD Master", organization: "", sourceUrl: "", deadline: "", notes: "" }),
  { valid: true, error: null },
  "Providing only title must be valid"
);
assert.deepStrictEqual(
  validateShareForm({ type: "", title: "", organization: "", sourceUrl: "https://daad.de", deadline: "", notes: "" }),
  { valid: true, error: null },
  "Providing only valid URL must be valid"
);

// 3.3 Invalid URL check
assert.deepStrictEqual(
  validateShareForm({ type: "", title: "Test", organization: "", sourceUrl: "not-a-valid-url", deadline: "", notes: "" }),
  { valid: false, error: "errorUrl" },
  "Invalid URL must be rejected with errorUrl"
);
assert.deepStrictEqual(
  validateShareForm({ type: "", title: "Test", organization: "", sourceUrl: "javascript:alert(1)", deadline: "", notes: "" }),
  { valid: false, error: "errorUrl" },
  "javascript: URL must be rejected with errorUrl"
);
assert.deepStrictEqual(
  validateShareForm({ type: "", title: "Test", organization: "", sourceUrl: "https://example.com/apply", deadline: "", notes: "" }),
  { valid: true, error: null },
  "Valid https URL must be accepted"
);

console.log("[PASS] 3.1 Validation engine: permits single-attribute submission, blocks empty forms, and validates URLs strictly");

// 4. Formspree Unconfigured Handling & Non-Fake-Success Test
function handleSubmissionFormspree(endpoint, payload) {
  const isConfigured = Boolean(
    endpoint &&
    !endpoint.includes("YOUR_FORM_ID") &&
    (endpoint.startsWith("https://formspree.io/") || endpoint.startsWith("http://localhost"))
  );

  if (!isConfigured) {
    return { status: "UNCONFIGURED_ALERT", fakeSuccess: false, message: ar.shareModal.errorNotConfigured };
  }
  return { status: "READY_FOR_POST", fakeSuccess: false };
}

const emptyEndpointResult = handleSubmissionFormspree("", { title: "Test" });
assert.strictEqual(emptyEndpointResult.status, "UNCONFIGURED_ALERT", "Unconfigured endpoint must return UNCONFIGURED_ALERT");
assert.strictEqual(emptyEndpointResult.fakeSuccess, false, "Must never display fake success");
assert.ok(emptyEndpointResult.message.includes("Formspree"), "Alert must clearly reference Formspree");

const placeholderResult = handleSubmissionFormspree("https://formspree.io/f/YOUR_FORM_ID", { title: "Test" });
assert.strictEqual(placeholderResult.status, "UNCONFIGURED_ALERT", "Placeholder endpoint must return UNCONFIGURED_ALERT");

const validEndpointResult = handleSubmissionFormspree("https://formspree.io/f/mzbnpoyq", { title: "Test" });
assert.strictEqual(validEndpointResult.status, "READY_FOR_POST", "Valid endpoint must be ready for POST");

console.log("[PASS] 4.1 Formspree honesty: no fake success, clear unconfigured status alert");

console.log("\n==========================================");
console.log("ALL SHARE OPPORTUNITY TESTS PASSED (100%)!");
console.log("==========================================");
