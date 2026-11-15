---
title: 'Story 1.5: Matchup guidance and archetype views'
type: 'feature'
created: '2026-11-15'
baseline_commit: 'f21e27ed5ce5998c703e88240f61b4beb7d85c34'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<!-- Target: 900–1300 tokens. Above 1600 = high risk of context rot.
     Never over-specify "how" — use boundaries + examples instead.
     Cohesive cross-layer stories (DB+BE+UI) stay in ONE file.
     IMPORTANT: Remove all HTML comments when filling this template. -->

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Matchup guidance and archetype-warning entries exist in the corpus (e.g. `lash-vs-seven`, `abrams-vs-poke-comps`) and hero pages already link to `/matchups/[slug]`, but those routes do not exist — clicking lands on a 404. There is also no `/archetypes` index page, so visitors cannot browse warnings grouped by archetype.

**Approach:** Add a statically prerendered `/matchups/[slug]` route that renders a matchup or archetype-warning entry with full trust signals (badge, patch history, copy-link), mirroring the interaction detail page from story 1.4. Add a statically prerendered `/archetypes` index that groups archetype-warning entries by archetype and links to their detail pages. Both routes read through `lib/loaders` only, derive badges in `lib/badges`, and reuse existing components (`Badge`, `CopyLink`, `PatchHistory`, `EntryCard`).

## Boundaries & Constraints

**Always:** Routes read through `lib/loaders` only and stay server components: `generateStaticParams` from entry slugs (at least one), awaited `params`, no `dynamicParams`, no runtime APIs. Badge base state derives only in `lib/badges` (AD-7) from `verifiedPatch` vs `currentPatch` plus `deprecated`. Badge state always renders word + icon + color. Copy uses no em dashes. Touch targets >= 44px. Pages are static, canonical-URLed, shareable, and every guidance detail is reachable from home within two navigations.

**Never:** No `"use client"` island (AD-6), no API routes, no flag transport, no new content/schema/corpus changes, no persisted badge/status fields. Do not restyle or delete existing components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH_MATCHUP | Valid matchup slug (e.g. `lash-vs-seven`) | Source, target, effect chip, full conditions, badge, Patch History render | N/A |
| HAPPY_PATH_ARCHETYPE | Valid archetype-warning slug (e.g. `abrams-vs-poke-comps`) | Same detail layout; effect chip falls back to "ARCHETYPE WARNING" | N/A |
| UNKNOWN_SLUG | `/matchups/not-an-entry` | 404 page | `notFound()` |
| ARCHETYPES_INDEX | `/archetypes` | Groups warnings by archetype name, links to detail pages | N/A |
| EMPTY_PATCH_HISTORY | `patchHistory: []` | "No recorded changes" empty state | N/A |

## Code Map

- `app/matchups/[slug]/page.tsx` — new route; no file exists.
- `app/archetypes/page.tsx` — new index route; no file exists.
- `lib/loaders/index.ts` — `loadAllContent`, `loadConfig`; reuse, do not change.
- `lib/badges/index.ts` — `deriveBadgeState`; reuse, do not change.
- `lib/schema/index.ts` — `Entry`, `PatchHistoryEntry` types; reuse, do not change.
- `components/badge.tsx` — `Badge`; reuse, do not change.
- `components/copy-link.tsx` — `CopyLink`; reuse, do not change.
- `components/patch-history.tsx` — `PatchHistory`; reuse, do not change.
- `app/heroes/[slug]/page.tsx` — entry-card links already point at `/matchups/[slug]`; no change needed.

## Tasks & Acceptance

**Execution:**
- [x] `app/matchups/[slug]/page.tsx` -- create route with generateStaticParams, entry lookup, notFound, badge, conditions, patch history, copy-link -- implements matchup/detail ACs
- [x] `app/archetypes/page.tsx` -- create index route grouping archetype-warning entries by archetype, links to detail pages -- implements archetype index ACs

**Acceptance Criteria:**
- Given a valid matchup slug, when a visitor opens `/matchups/[slug]`, then source, target, effect, full conditions render untruncated (FR5, FR6)
- And the badge shows its build-derived base state with "verified as of patch X.Y" text pattern (FR4, FR8, AD-7)
- And Patch History renders in the inset well ordered ascending by patch with an explicit "No recorded changes" empty state (FR10, UX-DR9)
- And a Copy-link control copies the canonical URL and swaps to the patch-stamped citation line with `aria-live` announcement (UX-DR8)
- Given `/archetypes`, when a visitor opens it, then warnings group by archetype name with links to their detail pages (FR5)
- And every guidance detail is reachable from home within two navigations (FR6)
- And all listed routes render statically (AD-4)
- Given an unknown slug, when `/matchups/[slug]` is requested, then a 404 page is returned via `notFound()`

## Implementation Notes

<!-- Agent-owned. Append-only during implementation: decisions made, files touched, surprises encountered. Leave empty at planning time; never delete this section. -->

- Created `app/matchups/[slug]/page.tsx` as a static server component mirroring story 1.4's `/interactions/[slug]` pattern.
- `generateStaticParams` returns matchup and archetype-warning entry slugs.
- Reuses `Badge`, `CopyLink`, `PatchHistory` components unchanged.
- Effect chip falls back to "MATCHUP" / "ARCHETYPE WARNING" when `effects` is empty, matching the hero page's `effectChip` helper.
- Created `app/archetypes/page.tsx` static index grouping archetype-warning entries by `targetRef` (archetype), sorted by archetype name, linking each to `/matchups/[slug]`.
- Removed accidental `dynamicParams` export from the static index route (only valid on dynamic routes).

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Empty until the first bad_spec loopback. -->

## Review Triage Log

<!-- Append-only. Populated by step-04 on every review pass: one row per reviewer finding. Empty until the first review pass. -->

- Blind Hunter: 4 findings logged above (spec/code alignment, metadata description, empty-state handling, no page test coverage). None are defects.
- Edge Case Hunter: all paths traced, none unhandled. No deletions.
- Verification Gap: no page/route test infrastructure exists pre-change; new route behavior pinned by build + content tests + lint. No gap introduced by this change.

## Design Notes

<!-- If the approach is straightforward, DELETE THIS ENTIRE SECTION. Do not write "N/A" or "None". -->
The `/matchups/[slug]` route mirrors story 1.4's `/interactions/[slug]` pattern exactly: server component, `generateStaticParams` from entry slugs (kind === "matchup" or "archetype-warning"), `notFound()` for unknown slugs, `loadAllContent()` for data. Effect chip falls back to the kind label ("MATCHUP" / "ARCHETYPE WARNING") when `effects` is empty, matching the hero page's `effectChip` helper. The `/archetypes` index loads all entries, filters to `kind === "archetype-warning"`, groups by `targetRef` (the archetype), and links each to `/matchups/[slug]`.

## Verification

**Commands:**
- `npm run test:content` -- expected: all checks PASS (content untouched).
- `npm run build` -- expected: green; output lists `/matchups/[slug]` and `/archetypes` routes as static.
- `npm run lint` -- expected: no errors.

**Manual checks (if no CLI):**
- Open `/matchups/lash-vs-seven`: source, target, effect chip, full untruncated conditions, badge with "verified as of patch X.Y", Patch History inset well, Copy-link button all render.
- Open `/matchups/abrams-vs-poke-comps`: archetype-warning detail renders with "ARCHETYPE WARNING" chip.
- Open `/matchups/not-an-entry`: 404 page.
- Open `/archetypes`: warnings grouped by archetype name with links to detail pages.
