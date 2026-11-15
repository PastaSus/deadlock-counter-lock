---
title: 'Story 1.6: Home layout and free-text search'
type: 'feature'
created: '2026-11-15'
baseline_commit: '3addd9d040670060be4727f542616a9694b053e7'
status: 'in-progress'
review_loop_iteration: 0
context: []
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot.
     Never over-specify "how" — use boundaries + examples instead.
     Cohesive cross-layer stories (DB+BE+UI) stay in ONE file.
     IMPORTANT: Remove all HTML comments when filling this template. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The home page (`/`) is still the Next.js scaffold — no headline, no search, no hero roster. Visitors cannot start their counterplay lookup from home. Story 1.6 replaces the scaffold with the real home: hero-first browse and keyword search co-equal above the fold, plus featured entry cards and an archetype warning card below.

**Approach:** Replace `app/page.tsx` with a server-rendered home page that renders a headline, full-width search field, and hero roster above the fold; below the fold, featured entry cards and an archetype warning card. Generate a JSON search index at build from `lib/loaders` covering heroes, abilities, items, and effect terms (including deprecated entries). Search runs entirely client-side, results render in a `surface-sunken` well with `aria-live` count, and queries serialize to `?q=` for shareable reload. Selecting a result navigates to the same `/heroes/[slug]`, `/interactions/[slug]`, or `/matchups/[slug]` routes as browse.

## Boundaries & Constraints

**Always:** Home reads through `lib/loaders` only and stays a server component. Search index is generated at build from the same loaders; search runs entirely client-side (no API route, no server search). `?q=` serialization produces shareable, reloadable URLs. Results render in `surface-sunken` well with `aria-live` count. Touch targets >= 44px. Copy uses no em dashes. Reuse `SearchField`, `EntryCard`, `HeroRosterTile`, `Badge` components unchanged. Page is static and canonical-URLed.

**Never:** No API route for search, no new content/schema/corpus changes, no persisted search state. Search input/results are a permitted client island per AD-6 (closed island list). Do not restyle or delete existing components or the hero roster page.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HOME_LOAD | Visitor opens `/` | Headline + full-width search + hero roster above fold; featured cards + archetype card below fold | N/A |
| SEARCH_QUERY | Visitor types `q` | Client-side results in `surface-sunken` well with `aria-live` count; URL serializes to `?q=` | N/A |
| EMPTY_RESULTS | Query matches nothing | "No matches for '{q}.'" message in well | N/A |
| SELECT_RESULT | Visitor clicks a result | Navigates to `/heroes/[slug]`, `/interactions/[slug]`, or `/matchups/[slug]` | N/A |
| DEPRECATED_IN_INDEX | Deprecated entry included | Deprecated entries searchable in index | N/A |

## Code Map

- `app/page.tsx` — replace scaffold with real home page.
- `lib/search-index.ts` — new: build search index from `loadAllContent()`; reuse, create.
- `scripts/build-search-index.ts` — new: generate `public/search-index.json` at build; reuse, create.
- `components/search-field.tsx` — `SearchField`; reuse, do not change.
- `components/entry-card.tsx` — `EntryCard`; reuse, do not change.
- `components/hero-roster-tile.tsx` — `HeroRosterTile`; reuse, do not change.
- `components/badge.tsx` — `Badge`; reuse, do not change.
- `lib/loaders/index.ts` — `loadAllContent`; reuse, do not change.

## Tasks & Acceptance

**Execution:**
- [x] `lib/search-index.ts` -- create search index builder from loadAllContent -- indexes heroes, abilities, items, effect terms incl. deprecated
- [x] `scripts/build-search-index.ts` -- create build script that writes public/search-index.json -- generates static index at build
- [x] `package.json` -- add search-index step to prebuild -- runs index generation before next build
- [x] `app/page.tsx` -- replace scaffold with home page: headline, search, roster above fold; featured cards + archetype card below -- implements all ACs

**Acceptance Criteria:**
- Given the home page, when a visitor opens `/`, then headline + full-width search field and hero roster both sit above the fold (UX-DR16)
- And a JSON search index generated at build covers heroes, abilities, items, effect terms incl. deprecated entries, and search runs entirely client-side (FR2, AD-5, AD-14)
- And results render in `surface-sunken` well with `aria-live` count and serialize to `?q=` for shareable reload (UX-DR5)
- And selecting a hero or result navigates to the same routes as browse (FR1/FR3 paths converge)
- And featured entry cards and an archetype warning card render below the fold (UX-DR16)

## Implementation Notes

<!-- Agent-owned. Append-only during implementation: decisions made, files touched, surprises encountered. Leave empty at planning time; never delete this section. -->

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Empty until the first bad_spec loopback. -->

## Review Triage Log

<!-- Append-only. Populated by step-04 on every review pass: one row per reviewer finding. Empty until the first review pass. -->

## Design Notes

<!-- If the approach is straightforward, DELETE THIS ENTIRE SECTION. Do not write "N/A" or "None". -->
The home page mirrors the heroes roster pattern: server component, `loadAllContent()`, same layout shell (max-w-[1120px], px-4 md:px-6, py-8 md:py-12). Above-fold hero-first: headline, full-width SearchField, hero grid via HeroRosterTile. Below-fold: featured entry cards (a few representative interaction entries) and a single archetype warning card, each linking to their detail routes. Search index is a static `public/search-index.json` generated at build from `loadAllContent()`; the home page ships a small client search island (`HomeSearch`, `"use client"`, in AD-6's closed island list) that filters the index and renders results. `?q=` serialization makes searches shareable and reloadable.

## Verification

**Commands:**
- `npm run test:content` -- expected: all checks PASS (content untouched).
- `npm run build` -- expected: green; search-index.json generated at build; home route static.
- `npm run lint` -- expected: no errors.

**Manual checks (if no CLI):**
- Open `/`: headline + full-width search + hero roster above fold; featured cards + archetype card below.
- Type a query: results in surface-sunken well with aria-live count; URL shows `?q=`.
- Click a result: navigates to `/heroes/[slug]`, `/interactions/[slug]`, or `/matchups/[slug]`.
