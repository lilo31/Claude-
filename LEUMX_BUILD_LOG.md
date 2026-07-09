# Leumx theme — build log

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
