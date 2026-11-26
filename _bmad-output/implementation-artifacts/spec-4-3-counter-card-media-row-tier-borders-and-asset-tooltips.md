---
title: 'Story 4.3: Counter card media row, tier borders, and asset tooltips'
type: 'feature'
created: '2026-11-24'
status: 'in-review'
baseline_commit: '4872aa32672ed5a68dc70eb4843a9f5d86facd2e'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Entry cards and detail pages are still text-only, so players cannot recognize the heroes, abilities, and items in a matchup at a glance. Story 4.1 resolved asset props and Story 4.2 added hero tiles, but counter cards and detail show no media, no item-tier cue, and no accessible asset detail.

**Approach:** Add the tier tokens, one reusable media row (source/target hero portraits plus the ability/item icons each entry references), and the single `AssetTooltip` client island, then wire the row into entry cards, interaction/matchup detail, and search results using loader-resolved and search-index-embedded asset data.

## Boundaries & Constraints

**Always:** Media row is server-rendered except the tooltip island; components receive asset props from `lib/loaders` or the search index and never import the manifest or fetch. The row groups per side: `[source portrait][source icon]` then a `vs` divider then `[target portrait][target icon]`. Portraits render at 32px and ability/item icons at 24px; each item icon carries a 2px border in its `tier-1`..`tier-4` color and the tooltip states the tier in words. The tooltip opens on hover OR keyboard focus, persists while hovered/focused, dismisses with `Esc`, links to its trigger via `aria-describedby`, and renders name + type/tier + one-line summary within a 280px max width (`surface-raised`, `border-strong`, `rounded.md`, 12px padding, caption type). The trigger is a real button with an accessible name; the image inside is decorative. A missing or failed image renders a neutral `surface-raised` placeholder with the entity initial, and the tooltip still opens with text details. Tier is never color-only. Kebab-case files, PascalCase components, `.ts`/`.tsx`.

**Never:** No new `"use client"` file beyond `AssetTooltip` (AD-6). No manifest import, asset API call, or `fetch` in any component, page, or client island (AD-16, AD-17, NFR9). No hover-only affordance and no layout shift. No tier color as the only tier signal. No badge or deprecated-callout changes (Story 4.4). The archetypes page custom card is out of scope. If sync reveals a curated item with `item_tier` 5, stop and surface the DESIGN tier-5 token gap before shipping.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hero side | `sourceRef`/`targetRef` is a hero with an asset | 32px portrait (portrait path) + tooltip | initial placeholder if unstamped |
| Ability side | ref is an ability | 32px owning-hero portrait + 24px ability icon + tooltip | placeholder per missing slot |
| Item side | ref is an item | 24px icon, 2px tier border, tooltip says "Tier N item" | placeholder initial + text tooltip |
| Archetype side | ref is an archetype | 24px placeholder initial + tooltip name/type | no artwork, never broken |
| Missing file | `imagePath` set but 404 | img hidden, initial base shows | tooltip still opens |

</frozen-after-approval>

## Code Map

- `app/globals.css` -- add `--tier-1..4` + `--color-tier-1..4` in `@theme inline`, and the `--asset-tooltip-max-width` spec token -- required tokens (UX-DR18, UX-DR22)
- `lib/schema/index.ts` -- add `MediaAsset`, `EntryMediaSide`, `EntryMedia` interface types -- shared contract (AD-10)
- `lib/loaders/index.ts` -- add `buildEntryMedia(entry, registry, assets)` (owning hero via `registry[ref].heroSlug`) and expose `entryMedia` on `AllContent` -- single join site (AD-17)
- `lib/search-index.ts` -- embed `media` on entry items; keep existing `asset`/`sourceAsset`/`targetAsset` -- no client manifest import (AD-14)
- `components/asset-tooltip.tsx` -- new `"use client"` island: button trigger + persistent tooltip panel, hover/focus/Esc, `aria-describedby`, img error fallback -- the one new island
- `components/asset-media-row.tsx` -- server composition: portraits then icons, placeholders, `vs` divider -- reusable row
- `components/entry-card.tsx` -- optional `media?: EntryMedia` prop; render row above the effect chip; keep full-card link and raise row above it -- card integration
- `app/page.tsx`, `app/heroes/[slug]/page.tsx` -- pass `content.entryMedia[entry.slug]` to each `EntryCard` -- list surfaces
- `app/interactions/[slug]/page.tsx`, `app/matchups/[slug]/page.tsx` -- render `AssetMediaRow` in the detail body -- detail surfaces
- `components/home-search.tsx` -- render media from `item.media` / `item.asset` -- search results (AD-14)
- `components/index.ts` -- export the row -- barrel
- `scripts/test-asset-media.ts`, `package.json` -- add `test:asset-media` render/join suite -- verification
- Do not change: badges, flag components, patch history, hero artwork backdrop, archetypes page.

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- tier tokens + tooltip max width -- unblocks tier borders
- [x] `lib/schema/index.ts` -- media interface types -- shared contract
- [x] `lib/loaders/index.ts` -- `buildEntryMedia` + `AllContent.entryMedia` -- single resolution site
- [x] `lib/search-index.ts` -- embed entry `media` -- search without manifest
- [x] `components/asset-tooltip.tsx` -- client island -- accessible tooltip
- [x] `components/asset-media-row.tsx` -- reusable row -- recognition
- [x] `components/entry-card.tsx` -- media prop + row -- card surface
- [x] `app/page.tsx`, `app/heroes/[slug]/page.tsx`, `app/interactions/[slug]/page.tsx`, `app/matchups/[slug]/page.tsx` -- pass/render media -- list + detail surfaces
- [x] `components/home-search.tsx` -- render index media -- search surface
- [x] `components/index.ts`, `scripts/test-asset-media.ts`, `package.json` -- barrel + suite + script -- verification

**Acceptance Criteria:**
- Given an entry card on `/` or `/heroes/[slug]`, when it renders, then the media row shows the 32px hero portrait(s) and 24px ability/item icon(s) the entry references, resolved at build.
- Given an item icon, when it renders, then it carries a 2px `tier-1`..`tier-4` border and its tooltip states the tier in words.
- Given a keyboard user, when they focus an icon, then the tooltip opens and persists, and `Esc` dismisses it; the trigger is a button with an accessible name and `aria-describedby`.
- Given an entry with no artwork, when it renders, then the neutral placeholder initial shows and the tooltip still opens with text details; no broken image appears.
- Given an interaction or matchup detail page, when it renders, then it shows the same media row.
- Given a search result, when it renders, then its media comes from the search index; no client imports the manifest.
- Given the default build, when it runs, then no component fetches asset data and `AssetTooltip` is the only new client island.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

The owning-hero portrait for an ability ref comes from `registry[ref].heroSlug` and `assets[heroSlug]`; item refs have no portrait. Resolution lives once in `buildEntryMedia`, and the search index reuses it so search and pages render identical media. The tooltip panel stays in the DOM at `opacity-0 pointer-events-none` when closed so `aria-describedby` always resolves and there is no layout shift; the image uses `onError` to swap to the initial.

## Verification

**Commands:**
- `npm run test:asset-media` -- expected: all render/join checks PASS.
- `npm run test:assets` -- expected: 11/11 PASS.
- `npm run test:content` -- expected: 8/8 PASS.
- `npm run test:heroes` -- expected: 7/7 PASS.
- `npm run test:hero-artwork` -- expected: 10/10 PASS.
- `npm run lint` -- expected: no errors.
- `npm run build` -- expected: green; no new dynamic routes.

**Manual checks (if no CLI):**
- Hover and focus an icon: tooltip opens, stays open while hovered/focused, `Esc` closes.
- Item icons show the correct tier border; tooltip names the tier.
- Unstamped entities (Doorman, Curse, Silence Glyph) show the initial placeholder and still open a text tooltip.
- Search results show media; no manifest import or `fetch` exists in `app/` or `components/`.
