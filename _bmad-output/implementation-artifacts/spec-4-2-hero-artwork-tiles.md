---
title: 'Story 4.2: Hero artwork tiles'
type: 'feature'
created: '2026-11-22'
baseline_commit: '93fe418c52f729f4c80f6b63d4392a83e98c557a'
status: 'review'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hero roster tiles and the hero detail header are still plain text, so players cannot recognize heroes at a glance even though Story 4.1 already syncs official artwork and exposes it through loader props. The `media-scrim-strong/soft` tokens and the `hero-artwork-tile` treatment from DESIGN are not implemented.

**Approach:** Add the media scrim tokens to `app/globals.css`, build one shared server-rendered artwork backdrop (neutral initial base, image layer, optional state tint, scrim), and apply it to `HeroRosterTile` on `/` and `/heroes` plus the `/heroes/[slug]` header. Artwork paths come from `content.assets` loader props; no client fetch and no manifest import.

## Boundaries & Constraints

**Always:** Artwork is decorative (CSS background and `aria-hidden` layers) while the hero name stays real text. The name sits over the strong end of the `to top` scrim with the tile text shadow in `{colors.text}`. Tiles keep the DESIGN `hero-artwork-tile` frame: `surface`, 1px `border`, `{rounded.md}`, min-height 132px, name bottom-aligned. Missing artwork (no `imagePath`, or a failed image load) falls back to `surface-raised` with the entity initial and name; never a broken image and never a page error. Zero-entry heroes keep full tiles and the muted "No entries yet" line. Hover uses a `surface-raised` tint plus `border-border-strong`; selected uses an `accent-dim` tint plus `border-accent`; both stay visible over artwork. Artwork is served only from committed `public/assets/` files via loader props, in server components. Scrim values are `rgba(16, 17, 18, 0.92)` and `rgba(16, 17, 18, 0.55)`, shipped as CSS custom properties and `@theme` color tokens.

**Never:** No client island, no `fetch`, no manifest import, and no Deadlock Assets API call in any component or page. No gradient other than the media scrim. No hiding, dimming, or omitting zero-entry heroes. No broken-image icon on a missing file. No entry-card media row, tier borders, tooltips (Story 4.3), or badge wording changes (Story 4.4).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Artwork, has entries | asset with `imagePath`, `entryCount > 0` | card image cover under scrim, name bottom-left, entry count in aria-label | N/A |
| Artwork, zero entries | asset with `imagePath`, `entryCount = 0` | same artwork, name plus "No entries yet" | N/A |
| No synced artwork | no asset for slug (e.g. Doorman) | `surface-raised` base, entity initial, name | N/A |
| Image file missing | `imagePath` set but file 404s | CSS background fails silently, initial base stays visible | no broken icon |
| Hover / selected | pointer hover or `selected` | surface-raised or accent-dim tint plus border change over artwork | N/A |

</frozen-after-approval>

## Code Map

- `app/globals.css` -- add `--media-scrim-strong/soft` custom properties and `--color-media-scrim-strong/soft` in the existing `@theme inline` block -- required tokens (UX-DR22, AD-15)
- `components/hero-artwork-backdrop.tsx` -- new server component: neutral initial base, image-set background layer, optional state-overlay slot, scrim -- one artwork treatment reused by tiles and header
- `components/hero-roster-tile.tsx` -- add `imagePath`/`imageWebpPath` props, compose the backdrop, bottom-align name and "No entries yet", preserve hover/selected -- roster tiles (UX-DR17)
- `app/heroes/page.tsx` -- pass `content.assets[hero.slug]` image props to each tile -- `/heroes` roster
- `app/page.tsx` -- pass the same asset props to the home roster tiles -- home hero-first browse
- `app/heroes/[slug]/page.tsx` -- wrap the existing `<header>` in the tile frame with the backdrop and text shadow -- hero-page header (UX-DR17)
- `components/index.ts` -- export `HeroArtworkBackdrop` -- component barrel
- `scripts/test-hero-artwork.ts` -- render tests for artwork, fallback, zero-entry, selected, and aria labels -- verification
- `package.json` -- add `test:hero-artwork` script -- expose the suite

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- add the two scrim custom properties and `@theme` color tokens -- unblocks the backdrop
- [x] `components/hero-artwork-backdrop.tsx` -- build the shared backdrop with initial fallback, image-set layer, overlay slot, and scrim -- single artwork surface
- [x] `components/hero-roster-tile.tsx` -- accept image props, use the backdrop, bottom-align text, keep hover/selected states -- roster tile
- [x] `app/heroes/page.tsx` -- pass asset props from `content.assets` -- `/heroes`
- [x] `app/page.tsx` -- pass asset props from `content.assets` -- home roster
- [x] `app/heroes/[slug]/page.tsx` -- apply the backdrop and text shadow to the page header -- hero header
- [x] `components/index.ts` -- export the backdrop -- barrel
- [x] `scripts/test-hero-artwork.ts` and `package.json` -- add the render suite and npm script -- verification

**Acceptance Criteria:**
- Given synced artwork and a visit to `/heroes`, when a tile renders, then the hero card image sits under the `hero-artwork-tile` scrim with the tile text shadow and a readable `{colors.text}` name.
- Given synced artwork and a visit to `/heroes/[slug]`, when the page renders, then the header uses the same artwork, scrim, and text-shadow treatment.
- Given a hero with no synced artwork, when its tile or header renders, then it shows a neutral `surface-raised` placeholder with the entity initial and name, and never a broken image.
- Given a zero-entry hero, when its tile renders, then it keeps the full tile plus the muted "No entries yet" line.
- Given hover or selected state, when applied over artwork, then the `surface-raised` / `accent-dim` tint and the border change remain visible.
- Given the default build, when it runs, then no component fetches artwork or imports the manifest.

## Implementation Notes

- `app/globals.css` ships `--media-scrim-strong` (`rgba(16, 17, 18, 0.92)`) and `--media-scrim-soft` (`rgba(16, 17, 18, 0.55)`) plus `--color-media-scrim-strong/soft` in the existing `@theme inline` block.
- `components/hero-artwork-backdrop.tsx` is the single server-rendered artwork surface: a `bg-surface-raised` initial base layer, an `image-set()` cover layer (webp with png fallback) when `imagePath` is present, a `to top` media scrim, and an optional state-overlay slot. It is `aria-hidden` and `pointer-events-none`; `HERO_ARTWORK_TEXT_SHADOW` is exported for text legibility over the artwork.
- `HeroRosterTile` accepts `imagePath`/`imageWebpPath`, composes the backdrop, bottom-aligns the name (and the muted "No entries yet" line for zero-entry heroes), and keeps the hover (`bg-surface-raised/60` + `border-border-strong`) and selected (`bg-accent-dim/70` + `border-accent`) states over artwork.
- `/` and `/heroes` pass `content.assets[hero.slug]` image props; `/heroes/[slug]` wraps its header in the tile frame using the backdrop at `center 20%` so the face stays visible in a wide band. `components/index.ts` re-exports the backdrop.
- `scripts/test-hero-artwork.ts` (`npm run test:hero-artwork`) covers artwork cover + scrim, initial fallback, text shadow, entry-count aria labels, zero-entry tiles, missing artwork, selected/hover states, and the decorative backdrop crop.

## Spec Change Log

## Review Triage Log

## Design Notes

The name is bottom-aligned because the `to top` scrim is strongest at the bottom, keeping the name on the darkest area for at least 4.5:1 contrast. The initial base layer sits behind the image; if the image 404s, the CSS background fails silently and the initial remains, so no broken-image icon can appear. `image-set()` serves webp with a png fallback, and every path is a manifest-validated `/assets/...` string. The hero header uses the 280x380 card with `background-position: center 20%` so the face stays visible in a wide band.

## Verification

**Commands:**
- `npm run test:hero-artwork` -- expected: all render checks PASS.
- `npm run test:assets` -- expected: 11/11 PASS.
- `npm run test:content` -- expected: 8/8 PASS.
- `npm run test:heroes` -- expected: 7/7 PASS.
- `npm run lint` -- expected: no errors.
- `npm run build` -- expected: green; no new dynamic routes.

**Manual checks (if no CLI):**
- `/heroes` and `/` show card artwork under the scrim with readable names; Doorman shows the initial placeholder.
- `/heroes/haze` and `/heroes/doorman` show the header treatment and the initial fallback.
- Zero-entry tiles still show "No entries yet" and remain fully clickable.
- No `fetch`, manifest import, or assets API call exists in `app/` or `components/`.
