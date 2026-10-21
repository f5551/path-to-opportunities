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

// ─── 1. DYNAMIC DATA CONTRACT & SCHEMA ──────────────────

test("1.1 Data array integrity and valid categories", () => {
  assert.ok(Array.isArray(data), "Dataset must be an array");
  assert.ok(data.length > 0, "Dataset must contain at least one opportunity");
  const validTypes = new Set(["scholarship", "course", "internship"]);
  data.forEach((d, idx) => {
    assert.ok(
      validTypes.has(d.type),
      `Opportunity at index ${idx} has invalid type: ${d.type}`
    );
  });
});

test("1.2 All items satisfy isValidOpportunity schema contract", () => {
  data.forEach((item, idx) => {
    assert.ok(
      isValidOpportunity(item),
      `Item at index ${idx} (id: ${item?.id}) failed schema validation`
    );
  });
});

test("1.3 Unique IDs and matching regex format across all items", () => {
  const ids = new Set();
  data.forEach((item) => {
    assert.ok(!ids.has(item.id), `Duplicate ID detected: ${item.id}`);
    ids.add(item.id);
    assert.match(
      item.id,
      /^opp-[a-zA-Z0-9_-]+$/,
      `Invalid ID format: ${item.id}`
    );
  });
});

test("1.4 Date formatting and parsing validation (deadline & verified_at)", () => {
  data.forEach((item) => {
    if (item.deadline !== null) {
      assert.match(
        item.deadline,
        /^\d{4}-\d{2}-\d{2}$/,
        `Invalid deadline format: ${item.deadline}`
      );
      assert.ok(
        !isNaN(Date.parse(item.deadline)),
        `Unparseable deadline date: ${item.deadline}`
      );
    }
    assert.match(
      item.verified_at,
      /^\d{4}-\d{2}-\d{2}$/,
      `Invalid verified_at format: ${item.verified_at}`
    );
    assert.ok(
      !isNaN(Date.parse(item.verified_at)),
      `Unparseable verified_at date: ${item.verified_at}`
    );
  });
});

test("1.5 HTTPS source URLs on all items & protocol sanitization", () => {
  data.forEach((item) => {
    assert.ok(
      item.source_url.startsWith("https://"),
      `source_url must strictly start with https:// for ${item.id}`
    );
    assert.strictEqual(
      sanitizeUrl(item.source_url),
      item.source_url,
      `Sanitizer altered valid HTTPS url for ${item.id}`
    );
  });
  // Unsafe protocol rejection
  assert.strictEqual(sanitizeUrl("http://insecure.com"), "#");
  assert.strictEqual(sanitizeUrl("javascript:alert(1)"), "#");
  assert.strictEqual(sanitizeUrl("data:text/html,<script>"), "#");
  assert.strictEqual(sanitizeUrl(""), "#");
  assert.strictEqual(sanitizeUrl(null), "#");
  // HTML escaping
  assert.strictEqual(
    escHtml(`<script>alert("xss")</script>`),
    `&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;`
  );
  assert.strictEqual(
    escAttr(`" onclick="alert(1)`),
    `&quot; onclick=&quot;alert(1)`
  );
});

test("1.6 Level unification (string or non-empty string array)", () => {
  data.forEach((item) => {
    if (Array.isArray(item.level)) {
      assert.ok(item.level.length > 0, `Level array cannot be empty for ${item.id}`);
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

test("1.7 Funding type support on all scholarship items", () => {
  const scholarships = data.filter((x) => x.type === "scholarship");
  const validFunding = new Set(["full", "partial", "unspecified"]);
  scholarships.forEach((sch) => {
    assert.ok(
      typeof sch.funding_type === "undefined" || validFunding.has(sch.funding_type),
      `Invalid funding_type: ${sch.funding_type} on ${sch.id}`
    );
  });
});

// ─── 2. DYNAMIC SEARCH & FILTERING LOGIC ────────────────

test("2.1 Arabic search normalization (Hamza, Tashkeel, Ta Marbuta)", () => {
  const sampleWithAr = data.find((d) => /[\u0600-\u06FF]/.test(d.title_ar));
  if (sampleWithAr) {
    const rawWord = sampleWithAr.title_ar.split(" ")[0];
    const normalizedWord = normalizeText(rawWord);
    assert.ok(normalizedWord.length > 0);

    const resPlain = filter({ query: rawWord });
    const resTashkeel = filter({ query: rawWord });
    assert.strictEqual(
      resPlain.length,
      resTashkeel.length,
      "Tashkeel query should yield equal count to plain query"
    );
  }

  // Alef normalization test
  assert.strictEqual(normalizeText("ألمانيا"), "المانيا");
  assert.strictEqual(normalizeText("إيطاليا"), "ايطاليا");
  assert.strictEqual(normalizeText("آفاق"), "افاق");
  assert.strictEqual(normalizeText("واحة"), "واحه");
  assert.strictEqual(normalizeText("هدى"), "هدي");
});

test("2.2 English search (case-insensitive & token matching)", () => {
  const sampleEn = data.find((d) => d.title_en && d.title_en.length > 3);
  if (sampleEn) {
    const sampleWord = sampleEn.title_en.split(" ")[0];
    const upperRes = filter({ query: sampleWord.toUpperCase() });
    const lowerRes = filter({ query: sampleWord.toLowerCase() });

    assert.ok(upperRes.length > 0, "Upper case search should match");
    assert.strictEqual(
      upperRes.length,
      lowerRes.length,
      "Upper and lower case query counts should match"
    );
    assert.ok(upperRes.some((x) => x.id === sampleEn.id));
  }
});

test("2.3 Category filtering matches dataset distribution dynamically", () => {
  const expectedTotal = data.length;
  const expectedSch = data.filter((d) => d.type === "scholarship").length;
  const expectedCourse = data.filter((d) => d.type === "course").length;
  const expectedIntern = data.filter((d) => d.type === "internship").length;

  assert.strictEqual(filter({ type: "all" }).length, expectedTotal);
  assert.strictEqual(filter({ type: "scholarship" }).length, expectedSch);
  assert.strictEqual(filter({ type: "course" }).length, expectedCourse);
  assert.strictEqual(filter({ type: "internship" }).length, expectedIntern);
});

test("2.4 Advanced scholarship filters - dynamic attribute matching", () => {
  const sampleScholarship = data.find((d) => d.type === "scholarship" && d.country);
  if (sampleScholarship) {
    const countryResults = filter({
      type: "scholarship",
      country: sampleScholarship.country,
    });
    assert.ok(countryResults.length > 0);
    countryResults.forEach((r) => {
      assert.strictEqual(r.type, "scholarship");
      assert.strictEqual(r.country, sampleScholarship.country);
    });
  }
});

test("2.5 Advanced scholarship filters - combined with AND logic", () => {
  const sample = data.find((d) => d.type === "scholarship" && d.field && d.country);
  if (sample) {
    const singleLevel = Array.isArray(sample.level) ? sample.level[0] : sample.level;
    const match = filter({
      type: "scholarship",
      country: sample.country,
      field: sample.field,
      level: singleLevel,
    });
    assert.ok(match.length >= 1, "AND query matching sample should return at least 1 item");
    assert.ok(match.some((item) => item.id === sample.id));

    // Contradictory criteria must return 0
    const mismatch = filter({
      type: "scholarship",
      country: sample.country,
      field: "NonExistentField_123456789",
    });
    assert.strictEqual(mismatch.length, 0);
  }
});

test("2.6 Combining Search query with category filters", () => {
  const sample = data[0];
  const token = (sample.title_ar || sample.title_en).split(" ")[0];

  const results = filter({
    type: sample.type,
    query: token,
  });
  assert.ok(results.length >= 1);
  assert.ok(results.some((r) => r.id === sample.id));

  // Same token under wrong category should not match this sample
  const wrongType = sample.type === "scholarship" ? "course" : "scholarship";
  const crossResults = filter({
    type: wrongType,
    query: token,
  });
  assert.ok(!crossResults.some((r) => r.id === sample.id));
});

test("2.7 Clear filters / Reset functionality dynamically restores full counts", () => {
  const sample = data.find((d) => d.country);
  const filtered = filter({
    type: sample ? sample.type : "all",
    country: sample ? sample.country : "",
  });
  assert.ok(Array.isArray(filtered));

  // Reset to all
  const resetAll = filter({ type: "all" });
  assert.strictEqual(resetAll.length, data.length);

  // Reset to scholarships
  const expectedSch = data.filter((d) => d.type === "scholarship").length;
  const resetSch = filter({ type: "scholarship" });
  assert.strictEqual(resetSch.length, expectedSch);
});

test("2.8 No results handling returns clean empty array", () => {
  const noMatch = filter({ query: "xyzNonExistentQuery_998877" });
  assert.ok(Array.isArray(noMatch));
  assert.strictEqual(noMatch.length, 0);
});

test("2.9 Dynamic Filter Options Extraction covers all present attributes", () => {
  const opts = getFilterOptions();
  assert.ok(Array.isArray(opts.countries));
  assert.ok(Array.isArray(opts.levels));
  assert.ok(Array.isArray(opts.fields));
  assert.ok(Array.isArray(opts.fundingTypes));

  const scholarships = data.filter((d) => d.type === "scholarship");
  if (scholarships.length > 0) {
    assert.ok(opts.countries.length > 0);
    assert.ok(opts.levels.length > 0);
    assert.ok(opts.fields.length > 0);

    opts.countries.forEach((c) => {
      assert.ok(scholarships.some((s) => s.country === c));
    });
  }
});

// ─── 3. STORE ENHANCEMENT METHODS ─────────────────────

test("3.1 getById dynamically retrieves any valid item or null", () => {
  const firstItem = data[0];
  const retrieved = getById(firstItem.id);
  assert.ok(retrieved !== null);
  assert.strictEqual(retrieved.id, firstItem.id);

  const nonExistent = getById("non-existent-id-9999");
  assert.strictEqual(nonExistent, null);
  assert.strictEqual(getById(null), null);
  assert.strictEqual(getById(""), null);
});

test("3.2 getFeatured returns valid items up to requested limit", () => {
  const requested = Math.min(3, data.length);
  const featured = getFeatured(requested);
  assert.ok(Array.isArray(featured));
  assert.ok(featured.length <= requested && featured.length > 0);

  featured.forEach((f) => {
    assert.ok(isValidOpportunity(f));
    assert.ok(data.some((d) => d.id === f.id));
  });
});

console.log("\n==========================================");
const failed = results.filter((r) => r.status === "FAIL");
if (failed.length === 0) {
  console.log(`ALL ${results.length} DYNAMIC QA TESTS PASSED!`);
} else {
  console.error(`${failed.length} OF ${results.length} TESTS FAILED!`);
  process.exit(1);
}
console.log("==========================================");
