# طريق الفرص | PATH TO OPPORTUNITIES

[English Version Below](#english-version)

---

## عن المنصة

منصة **«طريق الفرص (PATH TO OPPORTUNITIES)»** هي بوابة ويب تفاعلية مستقلة تهدف إلى مساعدة الطلاب والباحثين العرب في اكتشاف المنح الدراسية الدولية، البرامج التدريبية، والدورات التعليمية المجانية. تعمل المنصة بمعمارية بدون خادم (Serverless MPA) سريعة وخفيفة وتضمن الخصوصية الكاملة وتضع روابط المصادر الرسمية المباشرة في متناول الباحث دون وسطاء.

---

## الوظائف الأساسية المنفذة فعلياً

1. **استعراض الفرص التعليمية:** عرض 109 فرصة دراسية وتدريبية في بطاقات متجاوبة تبرز الجهة، الدولة، المستوى، التخصص، والتمويل.
2. **البحث المتقدم ثنائي اللغة (AR/EN):** محرك بحث يدعم العربية والإنجليزية مع تطبيع ذكي للهمزات، التاء المربوطة، وعلامات التشكيل.
3. **الفلترة التراكمية (Cumulative AND Filters):** تصفية متزامنة حسب التخصص الأكاديمي، الدولة، المرحلة الدراسية، ونوع التمويل (كامل/جزئي).
4. **صفحة تفاصيل الفرصة (`detail.html`):** استعراض شامل لكل فرصة يوضح الشروط، المزايا، المواعيد النهائية، وروابط المصادر الرسمية.
5. **نظام المفضلة المحلي المستمر:** حفظ الفرص في قائمة المفضلة واسترجاعها عبر التخزين المحلي للمتصفح (`localStorage`) دون اشتراط تسجيل حساب.
6. **مؤشرات المواعيد النهائية:** حساب تفاعلي للأيام المتبقية وتنبيهات بصرية بالشارات العاجلة للمنح التي اقترب موعد انتهائها.
7. **دليل التقديم والمستندات (`guide.html`):** إرشادات أكاديمية تفصيلية لشرح خطوات التقديم وكيفية تجهيز السيرة الذاتية وخطاب الدافع والتوصيات.
8. **ثنائية اللغة والاتجاه (RTL / LTR):** دعم كامل للغة العربية كوضع افتراضي رئيسي، مع إمكانية التبديل الفوري للغة الإنجليزية وتعديل اتجاه الصفحة ومحاذاة الواجهة.
9. **العمل دون اتصال (Offline Mode):** دعم كامل للعمل عند انقطاع الإنترنت عبر Service Worker مخصص (`public/sw.js`) يقوم بتخزين صفحات المنصة وأصولها وبيانات الفرص في كاش آمن يتم تحديثه تلقائياً مع كل بناء جديد.

---

## هيكل صفحات المشروع

يتكون المشروع من 6 صفحات مستقلة مبنية بتقنيات الويب القياسية:
- `index.html`: الصفحة الرئيسية (البحث السريع، إبراز الفرص، قيم المنصة، وشرح آلية العمل).
- `opportunities.html`: صفحة استعراض الدليل الشامل للفرص مع محرك البحث وشريط الفلاتر التراكمية.
- `detail.html`: صفحة العرض التفصيلي لبيانات المنحة المختارة والشروط وروابط التقديم.
- `guide.html`: دليل التقديم الشامل وتجهيز الملفات والمستندات الأكاديمية.
- `login.html`: واجهة تسجيل الدخول المحلية التوضيحية.
- `register.html`: واجهة إنشاء الحساب المحلية التوضيحية.

---

## حزمة التقنيات (Tech Stack)

- **البنية الأساسية:** HTML5 دلالي + Vanilla JavaScript (ES Modules) دون أطر عمل ثقيلة.
- **التصميم وتنسيق الأنماط:** Tailwind CSS v4 (تهيئة عبر `@theme` بنظام ألوان OKLCH) مع مكونات daisyUI v5 المخصصة.
- **أداة البناء والتطوير:** Vite 8.
- **التدويل والترجمة:** i18next (العربية افتراضياً `dir="rtl"` والإنجليزية `dir="ltr"`).
- **التفاعلات الحركية:** Motion for JavaScript مع مراعاة تفضيل تقليل الحركة (`prefers-reduced-motion`).
- **الخطوط المستضافة ذاتياً:** Noto Sans Arabic و Inter بصيغة WOFF2 (خلو تام من الـ CDNs الخارجية).

---

## التثبيت والتشغيل المحلي

```bash
# تثبيت التبعيات
npm install

# تشغيل خادم التطوير المحلي
npm run dev
```

التطبيق يعمل افتراضياً على: `http://localhost:5173`

---

## الاختبارات الآلية وضمان الجودة

يحتوي المشروع على حزمة اختبارات آلية شاملة تضم **52 اختباراً برمجياً ناجحاً**:

```bash
# تشغيل جميع الاختبارات
npm test
```

تتوزع الاختبارات على 5 مجموعات في مجلد `tests/`:
- `tests/qa.test.js`: 31 اختباراً لجودة البيانات، محرك البحث والتطبيع، الفلترة التراكمية، وسلامة روابط HTTPS.
- `tests/pages.test.js`: 6 اختبارات لسلامة مسارات وهيكل الصفحات الست.
- `tests/card-ui.test.js`: 7 اختبارات لبنية بطاقة الفرصة ومقاييس إمكانية الوصول للّمس ($\ge 44\text{px}$).
- `tests/favorites.test.js`: 4 اختبارات لدورة حياة المفضلة واستمراريتها في التخزين المحلي.
- `tests/share-modal.test.js`: 4 اختبارات لنافذة المشاركة ونسخ الروابط.

### بناء حزم الإنتاج:
```bash
npm run build
npm run preview
```

---

## بنية البيانات ومصدر الحقيقة (SSOT)

- تُحفظ كافة بيانات الفرص في الملف الموحد `opportunities.json` في جذر المستودع وتخضع لمخطط صارم `opportunities.schema.json`.
- يتم استيراد البيانات كـ ES Module داخل `src/js/lib/opportunitiesStore.js` وتقوم Vite بتحزيمها في كود الإنتاج دون تكرار ودون حاجة لخادم خلفي.
- **حالة التحقق من المصادر الرسمية:** تضم قاعدة البيانات **109 فرصة** حقيقية تم استبعاد السجلات الوهمية منها؛ وقد أقر مالك المشروع (بتوثيق مؤرخ في 2026-10-24) بإجراء مراجعة وتحقق يدوي لـ **66 فرصة** بالرجوع المباشر للمصادر الرسمية للجهات المانحة (وهو ما يتجاوز الحد الأدنى المطلوب للمشروع البالغ 20 فرصة بمقدار 46 فرصة). يُشار إلى أن علامات كائن `verification` داخل ملف `opportunities.json` تضم 16 علامة مسجلة تاريخياً ولا تعكس بالضرورة حصر جميع المراجعات اليدوية التي أنجزها مالك المشروع، مع استمرار العمل على استكمال توثيق بقية السجلات.

---

## حدود النسخة الحالية

- **التقديم الجامعي:** المنصة دليل إرشادي ومعلوماتي؛ التقديم الفعلي يتم دائماً وبصورة مباشرة عبر المواقع الرسمية للجامعات والجهات المانحة.
- **الحسابات والتخزين:** المنصة لا تستخدم قواعد بيانات سحابية خلفية (Backend DB) لجمع بيانات المستخدمين؛ يتم حفظ التفضيلات وقائمة المفضلة محلياً في متصفح المستخدم فقط حفاظاً على أمانه وخصوصيته.
- **التشغيل دون اتصال (Offline Mode):** تم تنفيذه وتفعيله بنجاح عبر Service Worker مخصص (`public/sw.js`)، حيث يقوم بتخزين الأصول الأساسية وصفحات المنصة وبيانات الفرص محلياً في الكاش مع ربط تلقائي لإصدار الكاش بهاش الإنتاج، مما يتيح تصفح الموقع واستعراض الفرص والمفضلة عند انقطاع الاتصال (مع اشتراط الاتصال بالإنترنت فقط للروابط الخارجية المؤدية لبوابات التقديم الرسمية).

---

## التطويرات المستقبلية (Future Roadmap)

تهدف الرؤية المستقبلية لمنصة **«طريق الفرص»** إلى التحول من دليل رقمي استرشادي للمنح إلى بيئة رقمية متكاملة تدعم الطالب في كافة مراحل التقديم الأكاديمي. يُشار صراحةً إلى أن **جميع الميزات التالية هي مقترحات تطويرية مستقبلية قيد التخطيط ولم تُنفذ بعد في النسخة الحالية**:

1. **قاعدة بيانات وحسابات مستخدمين:** إنشاء حسابات شخصية آمنة تتيح للمستخدمين مزامنة قائمة المفضلة والبيانات المخصصة عبر مختلف الأجهزة، مع إمكانية حفظ ملفات ونماذج التقديم سحابياً.
2. **مساعد ذكاء اصطناعي لوثائق التقديم:** أداة ذكية للمساعدة في صياغة وتحسين السيرة الذاتية الأكاديمية وخطاب الدافع، وتحليل الوثائق ومقارنتها بمتطلبات وشروط المنح ومعايير الأهلية، مع تقديم مقترحات تصحيحية دون تقديم أي ضمانات بالقبول.
3. **مجتمع تفاعلي للطلاب:** غرف محادثة ومجموعات نقاش تتيح للطلاب والمهتمين بالمنح والتدريب تبادل الخبرات الأكاديمية وطرح الاستفسارات، مدعومة بأدوات إشراف صارمة وبروتوكولات حماية للخصوصية.
4. **نظام التوصية الذكية بالفرص:** محرك توصية يقترح المنح والبرامج الأكثر ملاءمة وفق المؤهلات الأكاديمية للمستخدم وتخصصه ومستواه الدراسي، مع إظهار مؤشر دقيق لمدى مطابقة الشروط ومعايير الأهلية.
5. **متابعة طلبات التقديم والتنبيهات:** لوحة تحكم شخصية لتتبع حالة الطلبات والمواعيد النهائية، مع إرسال تذكيرات مجدولة بمواعيد إغلاق التقديم ومواعيد المقابلات والوثائق الإلزامية الناقصة.
6. **التحديث والتحقق الآلي من الفرص:** نظام آلي يراقب بوابات الجامعات والجهات المانحة لاكتشاف الفرص الجديدة ورصد أي تغييرات في المواعيد والشروط، مع خضوعها لمراجعة وتدقيق بشري إلزامي قبل اعتمادها ونشرها.
7. **أداة مقارنة المنح وتحليل التمويل:** واجهة تفاعلية لمقارنة منحتين أو أكثر جنباً إلى جنب من حيث شروط القبول، التغطية المالية (رسوم، سكن، تأمين، بدل معيشة)، والالتزامات المترتبة على الطالب.

---

<div id="english-version"></div>

# English Version

## Overview

**PATH TO OPPORTUNITIES («طريق الفرص»)** is an independent, bilingual web platform engineered to empower Arab students and researchers in discovering verified international scholarships, training programs, and free educational courses. Built with a lightweight, serverless static multi-page architecture (MPA), it delivers maximum speed, complete user privacy, and direct deep links to official university and provider application portals without intermediaries.

---

## Implemented Core Features

1. **Opportunity Discovery:** 109 educational opportunities presented in responsive cards highlighting institution, country, academic level, field, and funding model.
2. **Bilingual Search Engine (AR/EN):** Robust search matching across composite fields with Arabic text normalization (Hamza forms, Ta Marbuta, Tashkeel diacritics removal).
3. **Cumulative Multi-Dimensional Filters:** Strict `AND` filtering across academic discipline, country, degree level, and funding coverage (full/partial).
4. **Detail Page (`detail.html`):** Dedicated view for each opportunity detailing verified benefits, eligibility, deadlines, and verified external source links.
5. **Persistent Local Favorites:** Bookmarking stored in browser `localStorage`, persisting across sessions without requiring account creation.
6. **Deadline Tracking:** Dynamic countdown calculating days remaining with visual badges for upcoming deadlines.
7. **Application Guide (`guide.html`):** Comprehensive step-by-step guidance for preparing academic CVs, letters of motivation, and recommendation files.
8. **Full Bilingual Localization (RTL / LTR):** Arabic by default with seamless toggle to English, automatically updating layout direction and alignment.
9. **Offline Capability:** Custom Service Worker architecture (`public/sw.js`) that caches core application shell, styles, fonts, and dataset, enabling continuous browsing and favorites management even without an active internet connection.

---

## Page Structure

The platform consists of 6 standalone HTML pages:
- `index.html`: Landing page featuring quick search, core platform values, and workflow explanation.
- `opportunities.html`: Full opportunities catalog with search and cumulative filters.
- `detail.html`: Comprehensive single-opportunity details view.
- `guide.html`: Application guidelines and document preparation guide.
- `login.html`: Local demonstrative login portal.
- `register.html`: Local demonstrative registration portal.

---

## Tech Stack

- **Core:** Semantic HTML5 + Vanilla JavaScript (ES Modules). Zero heavy framework overhead.
- **Styling:** Tailwind CSS v4 (`@theme` CSS-first OKLCH palette) with customized daisyUI v5 components.
- **Tooling:** Vite 8.
- **Localization:** i18next (Arabic default `dir="rtl"`, English `dir="ltr"`).
- **Interactions:** Motion for JavaScript (strictly respecting `prefers-reduced-motion`).
- **Typography:** Self-hosted Noto Sans Arabic Variable and Inter Variable fonts (WOFF2, zero external CDNs).

---

## Development & Testing

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Runs by default at `http://localhost:5173`.

### Automated Testing:
The test suite consists of **52 automated unit/QA tests**:

```bash
# Run all tests
npm test
```

Test suites located in `tests/`:
- `tests/qa.test.js`: 31 tests (data integrity, search normalization, cumulative filters, HTTPS sanitization).
- `tests/pages.test.js`: 6 tests (page routing, structure, and metadata).
- `tests/card-ui.test.js`: 7 tests (card layout, responsive hierarchy, touch targets $\ge 44\text{px}$).
- `tests/favorites.test.js`: 4 tests (favorites storage lifecycle and events).
- `tests/share-modal.test.js`: 4 tests (share modal and clipboard interactions).

### Production Build:
```bash
npm run build
npm run preview
```

---

## Data Architecture & Verification Status

- Single Source of Truth (SSOT) is maintained in `opportunities.json` at repository root, guarded by `opportunities.schema.json`.
- Bundled as an ES Module in `src/js/lib/opportunitiesStore.js` and compiled by Vite without duplication.
- **Source Verification Status:** The database contains **109 opportunities** with all synthetic/demo records eliminated. The project owner confirmed (documentation dated 2026-10-24) having personally manually verified **66 opportunities** directly against official awarding institution portals (exceeding the project minimum threshold of 20 opportunities by 46 opportunities). Note that the `verification` flags in `opportunities.json` reflect 16 historical flags and do not necessarily account for all 66 manual reviews conducted by the owner, with documentation continuing for the remaining records.

---

## Current Scope & Limitations

- **University Applications:** The platform acts as an informational index; applications are submitted directly on the official portals of the respective awarding institutions.
- **Accounts & Privacy:** No cloud backend database is employed; favorites and preferences are stored strictly in the user's browser `localStorage` to safeguard privacy.
- **Offline Mode:** Fully implemented and active via a custom Service Worker (`public/sw.js`). Core application assets, pages, and opportunity data are pre-cached with automatic build hash tracking, enabling offline navigation and review of cached opportunities and favorites (navigating to external application portals still requires an active internet connection).

---

## Future Roadmap

The long-term vision of **PATH TO OPPORTUNITIES** is to evolve from an informational directory into a comprehensive academic enablement ecosystem. Please note that **all features listed below are proposed future enhancements currently in planning and have not yet been implemented in the active release**:

1. **User Accounts & Cloud Database:** Secure user authentication allowing cross-device synchronization of favorites, saved filters, preferences, and personal application files.
2. **AI Document Assistant:** An AI-powered drafting and review tool to refine academic CVs and motivation letters, analyze uploaded application materials against specific grant requirements and eligibility criteria, and offer actionable suggestions (without guarantees of admission).
3. **Interactive Student Community:** Discussion groups and moderated student forums for peer-to-peer knowledge exchange, Q&A, and mentorship, protected by strict privacy guidelines and content moderation tools.
4. **Smart Opportunity Matching:** Intelligent recommendation engine that analyzes user academic profiles, disciplines, and study levels to match relevant opportunities, providing an eligibility fit indicator.
5. **Application Tracker & Notifications:** A personalized dashboard to track application stages and deadlines, dispatching automated reminders for application closings, interview dates, and missing required documents.
6. **Automated Opportunity Ingestion & Verification:** Automated monitoring of official awarding portals to detect new programs, deadline extensions, or criteria changes, paired with mandatory human review before publication.
7. **Opportunity Comparison & Funding Analysis:** Side-by-side comparative analysis of multiple scholarships, contrasting academic prerequisites, financial coverage (tuition, housing, living stipends, health insurance), and cost-of-living differences.
