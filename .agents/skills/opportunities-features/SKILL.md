---
name: opportunities-features
description: Feature-based architecture, state management, search normalization, cumulative AND filters, dynamic options extraction, and i18n localization for PATH TO OPPORTUNITIES.
---

# opportunities-features — Feature Logic & State Architecture

## 1. Overview
This skill governs the business logic, state handling, search engine, filter mechanisms, and localization for **طريق الفرص | PATH TO OPPORTUNITIES**. All code is written in **Vanilla JavaScript ES Modules** without frameworks or external state managers.

---

## 2. Directory & Module Responsibilities
- `src/js/main.js`: Application bootstrap, top-level state, event dispatching, DOM bindings, and lifecycle coordination.
- `src/js/features/list.js`: Pure filtering algorithms, search execution, and dynamic filter options extraction.
- `src/js/lib/opportunitiesStore.js`: Data store layer, Schema validation, and lazy data loading.
- `src/js/lib/searchUtils.js`: Arabic/English text normalization and phonological token matching.
- `src/js/lib/i18n.js`: `i18next` integration, locale switching (AR/EN), RTL/LTR direction syncing, and persistence in `localStorage`.

---

## 3. Search Normalization Engine (`searchUtils.js`)
The search engine supports simultaneous Arabic and English multi-token querying:
- **Diacritics Removal:** Strips all Arabic Tashkeel (Fatha, Damma, Kasra, Tanwin, Sukun, Shadda) and Tatweel (`[\u064B-\u065F\u0670\u0640]`).
- **Alef Normalization:** Maps all Alef variants (`أ`, `إ`, `آ`, `ٱ`) to bare Alef (`ا`).
- **Ta Marbuta & Alef Maqsura:** Normalizes `ة` to `ه` and `ى` to `ي`.
- **English Normalization:** Case-insensitive, trims and collapses duplicate whitespace.
- **Cross-Field Token Matching:** Multi-word queries split into whitespace-separated tokens where every token must be found in the composite item text (`title_ar`, `title_en`, `organization`, `field`, `country`, `level`).

---

## 4. Cumulative Filtering Engine (`list.js`)
All filters combine via strict **`AND`** logic:
1. **Type Category Filter:** `all`, `scholarship`, `course`, `internship`.
2. **Advanced Scholarship Filters:**
   - **Country:** Exact string equality match.
   - **Level:** Supports both single string levels and array of levels (`Array.isArray(item.level) ? item.level.includes(level) : item.level === level`).
   - **Field:** Exact string equality match.
   - **Funding Type:** Matches `funding_type` (`full`, `partial`, `unspecified`).
3. **Dynamic Options Extraction (`getScholarshipFilterOptions`):**
   - Automatically computes unique distinct options from loaded scholarship data.
   - Flattens level arrays into distinct items.
   - Prevents hardcoded dropdowns or displaying options with zero available opportunities.

---

## 5. State Management & Lifecycle
- `state` in `main.js` tracks:
  - `activeFilter`: Current category tab.
  - `searchQuery`: Debounced input string (280ms debounce).
  - `scholarshipFilters`: Object holding `{ country, level, field, fundingType }`.
- Switching away from the `scholarship` tab immediately hides the advanced filters bar and resets `scholarshipFilters` to default empty strings.
- Triggering "Clear Filters" or "مسح التصفية" resets all controls, restores full dataset rendering, and refocuses input.
