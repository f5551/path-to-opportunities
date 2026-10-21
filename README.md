# طريق الفرص | PATH TO OPPORTUNITIES

منصة عربية لاكتشاف المنح الدراسية والدورات المجانية وفرص التدريب، مع دعم اللغة الإنجليزية.

## Stack

- **HTML5 + CSS3 + Vanilla JavaScript (ES Modules)**
- **Vite** — build tool
- **Tailwind CSS v4** — CSS-first configuration via `@theme`
- **daisyUI v5** — UI components (customized to brand identity)
- **Motion for JavaScript** — lightweight, purposeful animations
- **i18next** — Arabic/English localization
- **Noto Sans Arabic Variable** + **Inter Variable** — self-hosted fonts

## Project Structure

```
├── index.html                   # HTML entry point
├── vite.config.js               # Vite + Tailwind v4 config
├── package.json
├── opportunities.json           # ← preserved, never modified
├── opportunities.schema.json    # ← preserved, never modified
├── public/
│   └── fonts/                   # Self-hosted variable fonts
│       ├── NotoSansArabic-VariableFont_wdth,wght.woff2
│       └── InterVariable.woff2
└── src/
    ├── styles/
    │   └── main.css             # Design system (@theme tokens, all styles)
    ├── locales/
    │   ├── ar/translation.json  # Arabic strings
    │   └── en/translation.json  # English strings
    └── js/
        ├── main.js              # App entry point
        ├── lib/
        │   ├── i18n.js          # i18next init + lang toggle
        │   ├── opportunitiesStore.js  # Data layer (Vite JSON import)
        │   └── animations.js    # Motion animations
        └── components/
            └── OpportunityCard.js  # Card factory component
```

## Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Production Build

```bash
npm run build
npm run preview
```

## Adding Opportunities

Edit `opportunities.json` following `opportunities.schema.json`. Each opportunity requires:

```json
{
  "id": "opp-unique-id",
  "type": "scholarship|course|internship",
  "title_ar": "العنوان بالعربية",
  "title_en": "Title in English",
  "organization": "Organization Name",
  "country": "Country or Online",
  "field": "Field of study",
  "level": "Undergraduate|Graduate|Any",
  "deadline": "2025-12-31",
  "source_url": "https://...",
  "verified_at": "2025-01-01"
}
```

## How JSON is bundled in production

`opportunities.json` is imported as an ES module in `src/js/lib/opportunitiesStore.js`:

```js
import rawData from "../../../opportunities.json";
```

Vite bundles it into the JavaScript output at build time. The original file at the project root remains unchanged. No duplication, no manual copy step, no backend required.

## Design System

Colors defined in `src/styles/main.css` under `@theme`:

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#0F766E` (oklch) | Buttons, active states, links |
| `--color-primary-dark` | `#115E59` (oklch) | Hover states |
| `--color-accent` | `#1D4ED8` (oklch) | Secondary accent |
| `--color-bg` | `#F8FAFC` (oklch) | Page background |
| `--color-surface` | `#FFFFFF` | Cards, header |
| `--color-text` | `#0F172A` (oklch) | Body text |
| `--color-border` | `#E2E8F0` (oklch) | Borders |

## Localization

Language toggle (AR/EN) is persistent via `localStorage`. Direction (`rtl`/`ltr`) updates on `<html>`. All CSS uses logical properties (`inset-inline-start`, `padding-inline`, etc.) for automatic RTL support.

## Fonts

Place font files in `public/fonts/`:
- `NotoSansArabic-VariableFont_wdth,wght.woff2` — download from Google Fonts
- `InterVariable.woff2` — download from rsms.me/inter

The app works without the fonts (falls back to system fonts).
