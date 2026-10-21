import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

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
console.log("   PATH TO OPPORTUNITIES — PAGES & ARCH TEST ");
console.log("==========================================\n");

const PAGES = [
  { file: "index.html", controller: "/src/js/pages/landing.js" },
  { file: "opportunities.html", controller: "/src/js/pages/opportunities.js" },
  { file: "detail.html", controller: "/src/js/pages/detail.js" },
  { file: "guide.html", controller: "/src/js/pages/guide.js" },
  { file: "login.html", controller: "/src/js/pages/auth.js" },
  { file: "register.html", controller: "/src/js/pages/auth.js" },
];

test("4.1 All 6 HTML pages exist and link to their dedicated page controllers", () => {
  PAGES.forEach(({ file, controller }) => {
    assert.ok(fs.existsSync(file), `Page ${file} must exist`);
    const content = fs.readFileSync(file, "utf8");
    assert.ok(
      content.includes(`src="${controller}"`),
      `Page ${file} must include script ${controller}`
    );
    assert.ok(
      content.includes('href="/src/styles/main.css"'),
      `Page ${file} must include main.css`
    );
  });
});

test("4.2 All 6 HTML pages have proper semantic HTML, lang, and dir attributes", () => {
  PAGES.forEach(({ file }) => {
    const content = fs.readFileSync(file, "utf8");
    assert.ok(content.includes('dir="rtl"'), `Page ${file} must have default dir="rtl"`);
    assert.ok(content.includes('lang="ar"'), `Page ${file} must have default lang="ar"`);
    assert.ok(content.includes("<meta charset="), `Page ${file} must have charset declaration`);
    assert.ok(content.includes("<meta name=\"viewport\""), `Page ${file} must have responsive viewport`);
  });
});

test("4.3 Shared Navigation exists across all pages", () => {
  PAGES.forEach(({ file }) => {
    const content = fs.readFileSync(file, "utf8");
    assert.ok(content.includes('id="mobile-drawer"'), `Page ${file} must include mobile-drawer`);
    assert.ok(content.includes('id="lang-toggle"'), `Page ${file} must include lang-toggle`);
    assert.ok(content.includes('id="mobile-menu-toggle"'), `Page ${file} must include mobile-menu-toggle`);
    assert.ok(content.includes('href="opportunities.html"'), `Page ${file} must link to opportunities.html`);
    assert.ok(content.includes('href="guide.html"'), `Page ${file} must link to guide.html`);
    assert.ok(content.includes('href="index.html#about"'), `Page ${file} must link to index.html#about`);
  });
});

test("4.4 Full translation dictionary coverage for all HTML elements", () => {
  const ar = JSON.parse(fs.readFileSync("src/locales/ar/translation.json", "utf8")).translation;
  const en = JSON.parse(fs.readFileSync("src/locales/en/translation.json", "utf8")).translation;

  function getNested(obj, keyPath) {
    return keyPath.split(".").reduce((acc, part) => acc && acc[part], obj);
  }

  PAGES.forEach(({ file }) => {
    const html = fs.readFileSync(file, "utf8");
    const matches = [...html.matchAll(/data-i18n(?:-placeholder)?=["']([^"']+)["']/g)].map((m) => m[1]);
    matches.forEach((key) => {
      assert.ok(getNested(ar, key), `Missing Arabic translation for key "${key}" in ${file}`);
      assert.ok(getNested(en, key), `Missing English translation for key "${key}" in ${file}`);
    });
  });
});

test("4.5 Canonical opportunities.json exists at root and is valid JSON array", () => {
  assert.ok(fs.existsSync("opportunities.json"), "Canonical opportunities.json must exist at root");
  const rootData = JSON.parse(fs.readFileSync("opportunities.json", "utf8"));
  assert.ok(Array.isArray(rootData) && rootData.length > 0, "Root data must be non-empty array");
  assert.ok(fs.existsSync("opportunities.schema.json"), "opportunities.schema.json must exist");
});

console.log("\n==========================================");
const failed = results.filter((r) => r.status === "FAIL");
if (failed.length === 0) {
  console.log(`ALL ${results.length} PAGES & ARCH TESTS PASSED!`);
} else {
  console.error(`${failed.length} OF ${results.length} TESTS FAILED!`);
  process.exit(1);
}
console.log("==========================================");
