import assert from "node:assert";
import data from "../opportunities.json" with { type: "json" };
import schema from "../opportunities.schema.json" with { type: "json" };
import {
  isValidOpportunity,
  filter,
  getAll,
  getById,
  getFeatured,
  getFilterOptions,
} from "../src/js/lib/opportunitiesStore.js";
import { getScholarshipFilterOptions } from "../src/js/features/list.js";
import {
  normalizeText,
  matchQuery,
  sanitizeUrl,
  escHtml,
  escAttr,
} from "../src/js/lib/searchUtils.js";
import { formatDate } from "../src/js/lib/i18n.js";

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, status: "PASS" });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: "FAIL", error: err.message });
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

console.log("==========================================");
console.log("   PATH TO OPPORTUNITIES — QA TEST SUITE  ");
console.log("==========================================\n");

// ─── 1. DATA CONTRACT & SCHEMA ──────────────────────────

test("1.1 Exactly 12 demo opportunities present", () => {
  assert.strictEqual(data.length, 12);
  const counts = { scholarship: 0, course: 0, internship: 0 };
  data.forEach((d) => counts[d.type]++);
  assert.strictEqual(counts.scholarship, 4);
  assert.strictEqual(counts.course, 4);
  assert.strictEqual(counts.internship, 4);
});

test("1.2 All items pass isValidOpportunity & Schema validation", () => {
  data.forEach((item, idx) => {
    assert.ok(isValidOpportunity(item), `Item at index ${idx} (${item.id}) must be valid`);
  });
});

test("1.3 Unique IDs and matching regex format", () => {
  const ids = new Set();
  data.forEach((item) => {
    assert.ok(!ids.has(item.id), `Duplicate ID found: ${item.id}`);
    ids.add(item.id);
    assert.match(item.id, /^opp-[a-zA-Z0-9_-]+$/, `Invalid ID format: ${item.id}`);
  });
});

test("1.4 Date validation (deadline & verified_at)", () => {
  data.forEach((item) => {
    if (item.deadline !== null) {
      assert.match(item.deadline, /^\d{4}-\d{2}-\d{2}$/, `Invalid deadline date: ${item.deadline}`);
      assert.ok(!isNaN(Date.parse(item.deadline)), `Unparseable deadline date: ${item.deadline}`);
    }
    assert.match(item.verified_at, /^\d{4}-\d{2}-\d{2}$/, `Invalid verified_at date: ${item.verified_at}`);
    assert.ok(!isNaN(Date.parse(item.verified_at)), `Unparseable verified_at date: ${item.verified_at}`);
  });
});

test("1.5 HTTPS source URLs on all items & XSS prevention", () => {
  data.forEach((item) => {
    assert.ok(item.source_url.startsWith("https://"), `source_url must start with https:// for ${item.id}`);
    assert.ok(item.source_url.includes("example.org"), `demo source_url should point to example.org for ${item.id}`);
    assert.strictEqual(sanitizeUrl(item.source_url), item.source_url);
  });
  // Test unsafe protocols rejected
  assert.strictEqual(sanitizeUrl("http://insecure.com"), "#");
  assert.strictEqual(sanitizeUrl("javascript:alert(1)"), "#");
  assert.strictEqual(sanitizeUrl("data:text/html,<script>"), "#");
  assert.strictEqual(sanitizeUrl(""), "#");
  assert.strictEqual(sanitizeUrl(null), "#");
  // Test HTML & Attr escaping
  assert.strictEqual(escHtml(`<script>alert("xss")</script>`), `&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;`);
  assert.strictEqual(escAttr(`" onclick="alert(1)`), `&quot; onclick=&quot;alert(1)`);
});

test("1.6 Level unification & array support", () => {
  data.forEach((item) => {
    if (Array.isArray(item.level)) {
      assert.ok(item.level.length > 0, `Level array should not be empty for ${item.id}`);
      item.level.forEach((lvl) => {
        assert.strictEqual(typeof lvl, "string");
        assert.ok(lvl.length >= 2);
      });
    } else {
      assert.strictEqual(typeof item.level, "string");
      assert.ok(item.level.length >= 2);
    }
  });
});

test("1.7 Funding type support on scholarships", () => {
  const scholarships = data.filter((x) => x.type === "scholarship");
  const fundingTypesFound = new Set();
  scholarships.forEach((sch) => {
    assert.ok(["full", "partial", "unspecified"].includes(sch.funding_type), `Invalid funding_type: ${sch.funding_type}`);
    fundingTypesFound.add(sch.funding_type);
  });
  assert.ok(fundingTypesFound.has("full"));
  assert.ok(fundingTypesFound.has("partial"));
  assert.ok(fundingTypesFound.has("unspecified"));
});

// ─── 2. FUNCTIONAL SEARCH & FILTERING ─────────────────

test("2.1 Arabic search normalization (Hamza, Tashkeel, Ta Marbuta)", () => {
  const res1 = filter({ query: "المانيا" });
  assert.ok(res1.some((x) => x.country === "ألمانيا"), "Should match ألمانيا when searching with المانيا");

  const resPlain = filter({ query: "منحة" });
  const resTashkeel = filter({ query: "مِنْحَة" });
  assert.strictEqual(resPlain.length, 3, "Plain search for منحة should return 3 items");
  assert.strictEqual(resTashkeel.length, 3, "Tashkeel search for مِنْحَة should return exact same 3 items");

  const res3 = filter({ query: "واحه" });
  assert.ok(res3.some((x) => x.id === "opp-demo-sch-01"), "Should match واحة when searching with واحه");
});

test("2.2 English search (case-insensitive)", () => {
  const resUpper = filter({ query: "FUTURE OASIS" });
  const resLower = filter({ query: "future oasis" });
  const resMixed = filter({ query: "FuTuRe OaSiS" });

  assert.strictEqual(resUpper.length, 1);
  assert.strictEqual(resLower.length, 1);
  assert.strictEqual(resMixed.length, 1);
  assert.strictEqual(resUpper[0].id, "opp-demo-sch-01");
});

test("2.3 Category filtering (all, scholarship, course, internship)", () => {
  assert.strictEqual(filter({ type: "all" }).length, 12);
  assert.strictEqual(filter({ type: "scholarship" }).length, 4);
  assert.strictEqual(filter({ type: "course" }).length, 4);
  assert.strictEqual(filter({ type: "internship" }).length, 4);
});

test("2.4 Advanced scholarship filters - individually", () => {
  const schCountry = filter({ type: "scholarship", country: "ألمانيا" });
  assert.strictEqual(schCountry.length, 1);
  assert.strictEqual(schCountry[0].id, "opp-demo-sch-03");

  const schLevelArray = filter({ type: "scholarship", level: "ماجستير" });
  assert.strictEqual(schLevelArray.length, 2);

  const schField = filter({ type: "scholarship", field: "العلوم الطبية الحيوية" });
  assert.strictEqual(schField.length, 1);
  assert.strictEqual(schField[0].id, "opp-demo-sch-02");

  const schFull = filter({ type: "scholarship", fundingType: "full" });
  assert.strictEqual(schFull.length, 2);
  const schPartial = filter({ type: "scholarship", fundingType: "partial" });
  assert.strictEqual(schPartial.length, 1);
  const schUnspec = filter({ type: "scholarship", fundingType: "unspecified" });
  assert.strictEqual(schUnspec.length, 1);
});

test("2.5 Advanced scholarship filters - combined with AND logic", () => {
  const match = filter({
    type: "scholarship",
    country: "المملكة العربية السعودية",
    level: "دكتوراه",
    field: "هندسة البرمجيات والذكاء الاصطناعي",
    fundingType: "full",
  });
  assert.strictEqual(match.length, 1);
  assert.strictEqual(match[0].id, "opp-demo-sch-01");

  const mismatch = filter({
    type: "scholarship",
    country: "المملكة العربية السعودية",
    fundingType: "partial",
  });
  assert.strictEqual(mismatch.length, 0);
});

test("2.6 Combining Search with Advanced Filters", () => {
  const combined = filter({
    type: "scholarship",
    country: "ألمانيا",
    query: "الرواد",
  });
  assert.strictEqual(combined.length, 1);
  assert.strictEqual(combined[0].id, "opp-demo-sch-03");

  const combinedZero = filter({
    type: "scholarship",
    country: "ألمانيا",
    query: "طاقة متجددة",
  });
  assert.strictEqual(combinedZero.length, 0);
});

test("2.7 Clear filters / Reset functionality", () => {
  const filtered = filter({
    type: "scholarship",
    country: "ألمانيا",
    level: "ماجستير",
  });
  assert.strictEqual(filtered.length, 1);

  const reset = filter({ type: "scholarship" });
  assert.strictEqual(reset.length, 4);

  const resetAll = filter({ type: "all" });
  assert.strictEqual(resetAll.length, 12);
});

test("2.8 No results handling", () => {
  const noMatch = filter({ query: "xyzNonExistentKeyword999" });
  assert.strictEqual(noMatch.length, 0);
});

test("2.9 Dynamic Filter Options Extraction", () => {
  const opts = getFilterOptions();
  assert.ok(Array.isArray(opts.countries) && opts.countries.length === 4);
  assert.ok(Array.isArray(opts.levels) && opts.levels.length === 5);
  assert.ok(Array.isArray(opts.fields) && opts.fields.length === 4);
  assert.ok(Array.isArray(opts.fundingTypes) && opts.fundingTypes.length === 3);
});

// ─── 3. STORE ENHANCEMENT METHODS ─────────────────────

test("3.1 getById returns exact item or null", () => {
  const item = getById("opp-demo-sch-01");
  assert.ok(item !== null);
  assert.strictEqual(item.id, "opp-demo-sch-01");

  const nonExistent = getById("non-existent-id");
  assert.strictEqual(nonExistent, null);
  assert.strictEqual(getById(null), null);
});

test("3.2 getFeatured returns balanced representation", () => {
  const featured = getFeatured(3);
  assert.strictEqual(featured.length, 3);
  const types = featured.map((f) => f.type);
  assert.ok(types.includes("scholarship"), "Featured should include scholarship");
  assert.ok(types.includes("course"), "Featured should include course");
  assert.ok(types.includes("internship"), "Featured should include internship");
});

console.log("\n==========================================");
const failed = results.filter((r) => r.status === "FAIL");
if (failed.length === 0) {
  console.log(`ALL ${results.length} TESTS PASSED!`);
} else {
  console.error(`${failed.length} OF ${results.length} TESTS FAILED!`);
  process.exit(1);
}
console.log("==========================================");
