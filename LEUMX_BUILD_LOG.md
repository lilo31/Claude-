# Leumx theme — build log

---

## ☀️ MORNING CHECKLIST — what you need to do

Everything below is code-complete and verified. These are the things only *you*
can provide. Roughly in order:

### 1. Upload brand assets (Theme editor → each section)
- [ ] **Logo** — Header section + Footer section. Until then a Fraunces wordmark
      of your shop name shows.
      - Format: **SVG preferred** (crisp at any size), or transparent PNG @ ~2× the
        display height. Header display height is adjustable (24–80px, default 40px);
        so supply a PNG **≥ 160px tall**. Footer default 36px → PNG ≥ 144px tall.
- [ ] **Hero image** (`Leumx Hero`) — landscape, **2400px wide**, high quality. Text
      sits over a navy scrim on the inline-start side, so keep the left third
      (right third in Arabic) relatively clean.
- [ ] **Category tiles** (`Leumx Categories`) — one image per tile, portrait
      **~1200 × 1500px** (4:5). A "wide" tile crops to 16:10, so supply landscape for
      any tile you mark wide.
- [ ] **Story image** (`Leumx Story`) — **~1400px wide**; fills half the split on
      desktop (min-height 60vh), so a portrait-ish or square crop reads best.
- [ ] **Newsletter/B2B background** (optional) — **2000px wide**; it sits under a
      heavy navy scrim, so almost any dark-ish photo works.
- [ ] **Product images** — uploaded per product as usual; the gallery + thumbnails
      are automatic. First image is treated as the LCP image.

### 2. Fonts (optional — currently working)
- Fraunces (display) + Inter (body) already load from Google Fonts; Noto Naskh/Kufi
  for Arabic. Nothing required to launch.
- If you have **licensed brand fonts**, say so and I'll self-host them and drop the
  Google `<link>`. Or, in **Theme settings → Leumx Brand**, tick *"Use the fonts
  picked above"* and choose from Shopify's font library.

### 3. Navigation (Online store → Navigation)
- [ ] Create/confirm a **`main-menu`** link list → drives the header nav.
- [ ] Create/confirm a **`footer`** link list → drives the footer columns.

### 4. Collections (Products → Collections, then Theme editor)
- [ ] Create collections e.g. **Kitchenware, Cookware, Electric, Home**.
- [ ] Point each **Category tile** at its collection (tile image/title/link fall back
      to the collection's own if left blank).
- [ ] Point **`Leumx Collection`** (featured grid on the homepage) at a collection.

### 5. Brand colours (optional)
- **Theme settings → Leumx Brand** exposes every navy/gold/cream token as a colour
  picker, wired live to the CSS variables. Tweak without touching code.

### 6. Bilingual / Arabic (optional)
- The EN/AR switch appears automatically once you publish **Arabic** in
  *Settings → Languages*. RTL styling + a partial Arabic locale (`locales/ar.json`)
  are already in place; untranslated strings fall back to English.

### 7. Preview the theme live
1. Install the Shopify CLI: `npm i -g @shopify/cli @shopify/theme`.
2. From the repo root: `shopify theme dev --store your-store.myshopify.com`
   → opens a local preview with hot reload against your store's data.
3. Or in admin: **Online Store → Themes → Add theme → Connect from GitHub**
   (branch `claude/leumx-shopify-theme-vpb4mr`), then **Preview**.
4. Run `shopify theme check` for Shopify's own linter (couldn't run in the build
   environment — no store/binary; our static + browser checks all pass).

---

Original Shopify theme for **Leumx®** (homeware/cookware), built on **Dawn 15.5.0**.
All sections follow `LEUMX_THEME_BUILD_BRIEF.md`: navy-dominant + warm gold, Fraunces
(display) / Inter (body), nearly-square 2px corners, gold hairline eyebrows, gold
underline reveals, full RTL/bilingual support via CSS logical properties. No competitor
code, markup, or assets were used — patterns are expressed in the Leumx identity only.

## Base setup
- Fetched clean **Dawn 15.5.0** (official Shopify), replaced the previous unrelated
  "Revive" theme entirely.
- Installed brand tokens `assets/leumx-base.css` and wired it into `layout/theme.liquid`
  **once**, right after Dawn's `base.css`.
- Added brand webfonts in `<head>`: Fraunces + Inter, plus Noto Naskh / Noto Kufi Arabic
  for AR. (Swappable — see "Needs your input".)
- Installed the 3 provided starter sections unchanged: `lx-hero`, `lx-collection`, `lx-story`.

## Sections built (all original, all with `{% schema %}` + presets)

| # | File | Notes / decisions |
|---|------|-------------------|
| 1 | `sections/lx-header.liquid` | Sticky; transparent over hero → solid navy on scroll (JS toggles `.is-scrolled`, or force via "Always solid" setting). Logo center/start. Desktop inline nav with gold hover underline + dropdown; mobile burger → drawer. Actions: EN/AR language switch (native `localization` form), search, account, cart with live count. |
| 2 | `sections/lx-footer.liquid` | Deep-navy, gold hairline dividers (gradient rules). Newsletter (`customer` form, tagged `newsletter`). Block-driven link columns (menu / text+B2B). EN/AR switch, native payment icons, legal line. |
| 3 | `sections/lx-category-showcase.liquid` | 3–4 image tiles, block-driven. Image/title/URL auto-fall back to the chosen collection. Gold kicker + underline-reveal name over navy scrim. Optional wide tile. Responsive 1→2→3/4 up. |
| 4 | `sections/lx-main-product.liquid` | Gallery (thumbs swap main via JS) + **sticky buy box**. Variant picker as radio "chips" resolved to a variant in JS (price/availability/URL update, hidden `name="id"` select for the form). Quantity stepper, add-to-cart. Trust row + spec table via blocks. Wired into `templates/product.json`. |
| 5 | `sections/lx-trust-bar.liquid` | Thin strip, 3–4 icon+microcopy items, block-driven. Light or navy theme, gold hairline separators on desktop. |
| 6 | `sections/lx-newsletter-b2b.liquid` | Two-column navy panel. Retail newsletter (`customer` form) + **B2B/wholesale lead** (`contact` form, tagged `b2b,wholesale` → lands in admin). Modes: both / newsletter only / B2B only. Optional background image. |

## Supporting snippets
- `snippets/lx-icon.liquid` — original thin-line (1.4px) icon set: search, account, bag,
  truck, shield, sparkle, leaf, globe, chevron, arrow, check, plus, minus, close.
- `snippets/lx-price.liquid` — price with compare-at strikethrough + sale / sold-out tag.

## Wiring
- `sections/header-group.json` → `lx-header` only (dropped Dawn's announcement bar).
- `sections/footer-group.json` → `lx-footer` with 4 preset columns.
- `templates/index.json` → Leumx homepage: hero → trust bar → categories → featured
  collection → story → newsletter/B2B.
- `templates/product.json` → `lx-main-product` with default trust + spec blocks.

## Conventions held
- Every brand colour comes from `--lx-*` variables — no hardcoded brand hex in markup
  (verified by `scripts/validate_liquid.py`; schema default values are the only place
  hex appears, as required by the color pickers).
- CSS **logical properties everywhere** (`margin-inline`, `inset-block`, `padding-inline`…)
  and mirrored gradients/underlines for RTL.
- Keyboard-focusable controls with visible `:focus-visible` gold outlines.
- `prefers-reduced-motion` respected globally via `leumx-base.css`.

## Verification
- `scripts/validate_liquid.py` — per file: schema JSON parses, if/for/unless/case/form
  tags balanced, no stray hardcoded brand hex outside schema defaults. All Leumx sections
  and snippets pass.
- All theme JSON (`templates/*.json`, `sections/*-group.json`) parse, and every section
  `type` / snippet `render` target referenced by the templates exists on disk.
- Note: this is static/structural verification. A live Shopify render (Theme Check /
  `shopify theme dev`) still needs a store to confirm pixel output and form submissions —
  see "Needs your input".

## Needs your input
- **Logo**: upload a Leumx logo in the theme editor (Header + Footer). Falls back to the
  shop name wordmark in Fraunces until then.
- **Fonts**: currently loaded from Google Fonts (Fraunces / Inter / Noto Arabic). If you
  hold licensed brand fonts, we can self-host them and drop the external `<link>`.
- **Images**: hero, category tiles, and story image are image-picker slots — add real
  Leumx photography.
- **Menus**: create `main-menu` (header) and `footer` (footer columns) link lists in
  Shopify navigation.
- **Language**: EN/AR switch appears automatically once a second (Arabic) language is
  published in Shopify Markets/Languages. RTL styling is already in place.
- **Collections**: point the category tiles and featured collection at real collections.

## Polish & hardening pass (post-scaffold)

Autonomous pass over the whole theme. Verified with `scripts/validate_liquid.py`
plus a headless-Chromium harness (`scratchpad/`, not shipped) that renders every
section's real CSS with representative markup.

**Accessibility**
- Centralised gold `:focus-visible` outline for all links/buttons/inputs/selects
  and `.lx-btn`, plus a `.visually-hidden` utility — in `leumx-base.css`.
- Header logo changed from `<h1>` to a `<div>` so every page has exactly **one h1**
  (homepage → hero; product → product title). Added an `aria-label` to the logo link.
- Added explicit `alt` fallbacks to every content image (hero, story, collection,
  category); newsletter background image is decorative → `alt=""`.
- Icon-only controls already carry aria-labels (cart, search, account, menu,
  qty ±, gallery thumbs).

**RTL**
- Full sweep: **zero** hardcoded left/right; all spacing uses logical properties.
- Confirmed mirrors for the hero/newsletter scrims (90°↔270°), card & category
  underline reveals (`background-position`), header link underline and dropdowns
  (logical `inset`), and footer submit arrow (`scaleX(-1)`).
- Wrapped the two literal `→` glyphs (collection "View all", category CTA) in
  `.lx-arrow` and flip them under `[dir="rtl"]`.

**Responsive** — headless Chromium at **375 / 768 / 990 / 1440**, LTR *and* RTL:
no horizontal overflow anywhere. Mobile drawer, sticky buy box, and all grids
behave (2→3/4-up collection & category, 1→2-col product, stacked→2-col newsletter).

**Copy / i18n**
- Premium EN copy lives in schema defaults (shows before merchant edits).
- Added a `leumx` namespace to `locales/en.default.json`; created a partial
  **`locales/ar.json`** (Arabic) covering the Leumx UI strings + the header/product
  keys the sections reference. Wired product gallery/qty aria, B2B form placeholders,
  and editor empty-states through `| t`. Untranslated keys fall back to English
  (Shopify locale merge). *Decision:* a full Arabic storefront translation is out of
  scope for tonight — only Leumx-relevant strings are translated.

**Performance**
- Fixed a real bug: product first image emitted `loading="true"` (invalid) — now
  `eager`/`lazy` with `fetchpriority` on the first slide; hero already `eager` +
  `fetchpriority:high`. All other images `lazy`.
- No raw `<img>` — every image uses `image_tag`, which emits width/height (no CLS).
- Externalised the header + product inline scripts into one deferred
  `assets/leumx.js`; Liquid-dependent values (money format, add/sold labels) now
  pass via `data-*` attributes. Verified the variant picker end-to-end in a real
  browser (price + sale strikethrough, hidden select, sold-out state).
- Confirmed `leumx-base.css` and `leumx.js` each load exactly once.

**Brand settings**
- Added a **Leumx Brand** group to `config/settings_schema.json`: colour pickers for
  every navy/gold/cream token + two font pickers, wired to the `--lx-*` CSS variables
  via a `{% style %}` override in `layout/theme.liquid`. Renamed theme identity to
  "Leumx". Fonts default to Fraunces/Inter unless the "use font pickers" toggle is on.

## Product page — premium enhancement pass

`sections/lx-main-product.liquid` upgraded to a premium cookware layout; the
verified variant/gallery/quantity logic was preserved. Re-verified end-to-end in
headless Chromium (swatch + chip selection updates variant id, price/sale,
sold-out state, and the selected-value labels) and no overflow at 375/768/990/1440.

1. **Review-stars slot** (above the title) — outputs the Judge.me container
   `<div class="jdgm-widget jdgm-preview-badge" data-id="{{ product.id }}">` plus a
   generic `[data-product-reviews]` hook other apps can target. Toggle
   `show_reviews` (default on). The wrapper is 0-height with no margin until an app
   injects content (progressive `:has()` reveal) — no empty stars, no baked-in gap.
2. **Feature badges** (under the price) — gold-outlined pills with a thin-line icon +
   text, as reorderable `badge` **blocks** (icon from the lx-icon set + text). Seeded
   one default badge; when its text is left blank it falls back to the localised
   `leumx.product.badge_all_cooktops` → EN "Suitable for all cooktops",
   AR "مناسب لكل مواقد الطبخ" (added to `en.default.json` + `ar.json`). *Decision:* the
   preset badge ships with blank text so it is bilingual out of the box; new badges a
   merchant adds pre-fill the English string and are freely editable.
3. **Colour swatches** — any option whose name matches `color_option_names`
   (schema setting; default `Color, Colour, Couleur, Kleur, Farbe, لون`) renders as
   square swatches instead of chips: the matching variant's image if it has one, else a
   safe colour chip from the value name. Selected swatch gets a gold ring; they share
   the same radio inputs as the picker, so price/availability/URL update on select.
   RTL-mirrored via logical properties. No colour option (or no variants) → no swatch
   block, no gap. Also added a live selected-value label next to each option name
   (synced in `leumx.js`).
4. **Sticky buy box** — confirmed `position: sticky` on desktop (≥990px), static/
   collapsing on mobile; add-to-cart stays Leumx gold (`.lx-btn`).
5. **Layout** — gallery inline-start, buy column inline-end (grid mirrors under
   `[dir="rtl"]`); thumbnail strip under the main image with a gold active-thumb bar.

`templates/product.json` seeds the default badge block and `show_reviews`.
`leumx-base.css` still loads once.
