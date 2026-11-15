---
title: 'Story 1.4: Interaction detail with trust signals'
type: 'feature'
created: '2026-11-15'
baseline_commit: 'a90b77ec32e69143abae7756cf5dcacdef19f15f'
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

**Problem:** There is no Interaction Record detail route. A visitor clicking an entry card from a hero page (or any future entry surface) lands on a 404 because `/interactions/[slug]` does not exist, so they cannot see the full record, effect, exact conditions, verification badge, and patch history on one page.

**Approach:** Add a statically prerendered `/interactions/[slug]` route that reads the entry through `lib/loaders` only, derives its base badge in `lib/badges`, renders source/target/effect/full conditions untruncated, shows Patch History in an inset well with a "No recorded changes" empty state, and includes a Copy-link control that copies the canonical URL and swaps to a patch-stamped citation line with `aria-live` announcement. Reuse `EntryDetailSkeleton` for the loading state.

## Boundaries & Constraints

**Always:** Route reads through `lib/loaders` only and stays a server component: `generateStaticParams` from entry slugs (at least one), awaited `params`, no `dynamicParams`, no runtime APIs. Badge base state derives only in `lib/badges` (AD-7) from `verifiedPatch` vs `currentPatch` plus `deprecated`. Badge state always renders word + icon + color. Copy uses no em dashes. Reuse existing components (`Badge`, `CopyLink`, `PatchHistory`, `EntryDetailSkeleton`); touch targets >= 44px. Page is static, canonical-URLed, shareable, and an entry detail is reachable from home within two navigations.

**Never:** No `"use client"` island (AD-6), no API routes, no flag transport, no new content/schema/corpus changes, no persisted badge/status fields. Do not restyle or delete existing components or the home scaffold.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| HAPPY_PATH | Valid interaction slug (e.g. `knockdown-vs-danny-crash`) | Source, target, effect, full conditions render untruncated; badge shows `verified as of patch X.Y`; Patch History lists ascending patches or "No recorded changes"; Copy-link copies URL and swaps to citation line | N/A |
| UNKNOWN_SLUG | `/interactions/not-an-entry` | 404 page | `notFound()` |
| DEPRECATED_ENTRY | `deprecated: true` | `badge-deprecated`; card/detail stays visible; Patch History still renders | N/A |
| STALE_ENTRY | `verifiedPatch` older than `currentPatch` | `badge-stale` with dashed border | N/A |
| CURRENT_ENTRY | `verifiedPatch` equals `currentPatch` | `badge-verified` | N/A |
| EMPTY_PATCH_HISTORY | `patchHistory: []` | "No recorded changes" empty state in inset well | N/A |

## Code Map

- `app/interactions/[slug]/page.tsx` — new route; no file exists.
- `lib/loaders/index.ts` — `loadAllContent`, `loadConfig`; reuse, do not change.
- `lib/badges/index.ts` — `deriveBadgeState`; reuse, do not change.
- `lib/schema/index.ts` — `Entry`, `PatchHistoryEntry` types; reuse, do not change.
- `components/badge.tsx` — `Badge`; reuse, do not change.
- `components/copy-link.tsx` — `CopyLink`; reuse, do not change.
- `components/patch-history.tsx` — `PatchHistory`; reuse, do not change.
- `components/skeletons.tsx` — `EntryDetailSkeleton`; reuse, do not change.
- `app/heroes/[slug]/page.tsx` — existing entry-card links already point at `/interactions/[slug]`; no change needed.

## Tasks & Acceptance

**Execution:**
- [x] `app/interactions/[slug]/page.tsx` -- create route with generateStaticParams, entry lookup, notFound, badge, conditions, patch history, copy-link, skeleton -- implements all ACs for story 1.4

**Acceptance Criteria:**
- Given a valid interaction slug, when a visitor opens `/interactions/[slug]`, then source, target, effect, and full conditions render untruncated (FR3)
- And the badge shows its build-derived base state with "verified as of patch X.Y" text pattern (FR4, FR8, AD-7)
- And Patch History renders in the inset well ordered ascending by patch with an explicit "No recorded changes" empty state (FR10, UX-DR9)
- And a Copy-link control copies the canonical URL and swaps to the patch-stamped citation line with `aria-live` announcement (UX-DR8)
- And the page is static, canonical-URLed, shareable, and an entry detail is reachable from home within two navigations (NFR1, AD-4)
- And a detail-page skeleton (badge → conditions → history) shows during load (UX-DR11)
- Given an unknown slug, when the route is requested, then a 404 page is returned via `notFound()`

## Implementation Notes

<!-- Agent-owned. Append-only during implementation: decisions made, files touched, surprises encountered. Leave empty at planning time; never delete this section. -->

- Created `app/interactions/[slug]/page.tsx` as a static server component mirroring the hero page pattern.
- `generateStaticParams` returns interaction entry slugs only (kind === "interaction").
- Reuses `Badge`, `CopyLink`, `PatchHistory` components unchanged.
- Removed `EntryDetailSkeleton` import — static prerendering means content is present immediately; no Suspense loading state exists on a static page.
- `CopyLink` uses entry title + verified patch for its citation-line label.
- `deriveBadgeState(entry, currentPatch)` derives verified/stale/deprecated base state per AD-7.

## Spec Change Log

<!-- Append-only. Populated by step-04 during review loops. Empty until the first bad_spec loopback. -->

## Review Triage Log

<!-- Append-only. Populated by step-04 on every review pass: one row per reviewer finding. Empty until the first review pass. -->

- Blind Hunter: 4 findings logged above (spec-vs-code skeleton note, metadata not-found path, CopyLink aria-live label, no page test coverage). None are defects.
- Edge Case Hunter: all paths traced, none unhandled. No deletions.
- Verification Gap: no page/route test infrastructure exists pre-change; new route behavior pinned by build + content tests + lint. No gap introduced by this change.

## Design Notes

<!-- If the approach is straightforward, DELETE THIS ENTIRE SECTION. Do not write "N/A" or "None". -->
The page mirrors the hero page pattern from story 1.3: server component, `generateStaticParams` from entry slugs, `notFound()` for unknown slugs, `loadAllContent()` for data. Entry detail layout: header with source vs target, effect chip, untruncated conditions, badge, Patch History inset well, Copy-link control. Skeleton wraps content during initial load.

## Verification

**Commands:**
- `npm run test:content` -- expected: all checks PASS (content untouched).
- `npm run build` -- expected: green; output lists `/interactions/[slug]` param routes as static.
- `npm run lint` -- expected: no errors.

**Manual checks (if no CLI):**
- Open `/interactions/knockdown-vs-danny-crash`: source, target, effect chip, full untruncated conditions, badge with "verified as of patch X.Y", Patch History inset well, Copy-link button all render.
- Open `/interactions/not-an-entry`: 404 page.
