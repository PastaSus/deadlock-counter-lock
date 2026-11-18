---
title: 'Story 2.3: Flag overlay on badges'
type: 'feature'
created: '2026-11-18'
baseline_commit: '594d35016c263632397f036d8935c7d3259d7007'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every badge still shows only its build-derived state. Story 2.1's public overlay knows which entries have pending outdated flags, but nothing consumes it, so other visitors never see the promised "community-flagged outdated, in review" signal.

**Approach:** Add one overlay-badge client island that renders the existing Badge with the build-derived base state, fetches `GET /api/flags/overlay` once per page load after hydration, and upgrades `verified` or `stale` to `flagged` when the entry slug appears. A failed or unparseable response leaves the base badge untouched. Put response parsing and upgrade policy in a pure, client-safe module so they can be tested without a DOM.

## Boundaries & Constraints

**Always:** Render the base badge on the server and during the first client render; never block or replace base freshness. Upgrade only `verified`/`stale` to `flagged`; `deprecated` always wins. Fetch the relative `/api/flags/overlay` with `cache: "no-store"` and share one request across every badge mounted in the page load. Treat any throw, non-2xx status, `ok` other than `true`, missing `flaggedSlugs`, or unparseable body as failure: keep the base badge and never claim flagged. Announce "Community-flagged outdated, in review" through `aria-live="polite"` only when a badge actually upgrades. Cover every surface that already renders an entry Badge: both detail routes, the archetypes listing, home featured cards, and hero-page entry cards. Keep the overlay badge inside AD-6's closed island list and keep every content route static.

**Never:** No client-side freshness computation, KV access, auth, cookies, or accounts. No API, schema, store, Badge, or content changes. No new route or npm dependency. No flag control on cards, roster tiles, or search results. No overlay on non-entry surfaces. No immediate self-upgrade after a visitor submits (the flag control confirmation remains the only feedback). No absolute API URL. No restyling of the existing Badge.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| FLAGGED_UPGRADE | Overlay lists the slug; base `verified` or `stale` | Badge becomes `flagged` and announces the review phrase | N/A |
| NOT_FLAGGED | Slug absent from `flaggedSlugs` | Base badge unchanged, no announcement | N/A |
| DEPRECATED_PROTECTED | Base `deprecated`; slug listed | Stays `deprecated`, no announcement | N/A |
| FETCH_FAILURE | Throw, 500, `ok:false`, or unparseable body | Base badge unchanged, no announcement | Silent fallback |
| SHARED_FETCH | Several badges on one page | Exactly one overlay request per page load | Shared promise |
| BASE_RENDER | Before hydration | Base badge is present in static markup | N/A |
| BAD_ENTRIES | Array contains non-strings or duplicates | Non-strings ignored; duplicates harmless | Parser filters |
| SLUG_CHANGE | Client navigation to another entry | Upgrade state is scoped to the current slug | No stale upgrade |

</frozen-after-approval>

## Code Map

- `lib/flags/overlay.ts` -- new pure client-safe module: `parseFlaggedSlugs(body)`, `requestFlagOverlay(fetchImpl)`, `overlayBadgeVariant(base, isFlagged)`, and `FLAGGED_ANNOUNCEMENT`; no `node:` imports.
- `components/flag-overlay-badge.tsx` -- new `"use client"` island: module-level shared overlay promise, per-slug upgrade state, live region, renders `Badge`; accepts `entrySlug`, `baseVariant`, `patch`, `className`.
- `components/badge.tsx` -- existing four-state Badge; import and render, do not change.
- `components/entry-card.tsx:52` -- renders Badge in the footer; add an `entrySlug` prop and swap in the overlay badge.
- `app/page.tsx:78,108` -- EntryCard call sites; pass `entrySlug={entry.slug}`.
- `app/heroes/[slug]/page.tsx:179` -- EntryCard call site; pass the entry slug.
- `app/interactions/[slug]/page.tsx:107` and `app/matchups/[slug]/page.tsx:113` -- detail Badge; swap in the overlay badge with the derived base variant.
- `app/archetypes/page.tsx:112` -- listing Badge; swap in the overlay badge.
- `app/api/flags/overlay/route.ts` -- existing public `{ok, data:{flaggedSlugs}}` contract with `no-store`; do not change.
- `lib/badges/index.ts` -- `deriveBadgeState` and `BaseBadgeState`; type-only import, do not change.
- `components/flag-control.tsx` -- reference for an existing client island; do not change.
- `scripts/test-flags.ts` -- request-scope pattern for invoking the overlay route; mirror it, do not modify.
- `package.json` -- add `test:flag-overlay` using the existing `tsx` pattern.

## Tasks & Acceptance

**Execution:**
- [x] `lib/flags/overlay.ts` -- parsing, request, announcement copy, and upgrade policy -- one tested, client-safe decision layer.
- [x] `components/flag-overlay-badge.tsx` -- shared fetch, slug-scoped upgrade, live announcement, base fallback -- delivers the overlay behavior.
- [x] `components/entry-card.tsx` + `app/page.tsx` + `app/heroes/[slug]/page.tsx` -- pass and render the overlay badge on cards -- covers home and hero surfaces.
- [x] `app/interactions/[slug]/page.tsx` + `app/matchups/[slug]/page.tsx` + `app/archetypes/page.tsx` -- replace the static Badge -- covers detail and listing surfaces.
- [x] `components/index.ts` -- export the overlay badge -- keeps the component surface consistent.
- [x] `scripts/test-flag-overlay.ts` + `package.json` -- cover every matrix row plus a real overlay-route contract check -- pins the behavior.

**Acceptance Criteria:**
- Given a static entry surface whose slug appears in `flaggedSlugs`, when the overlay arrives after hydration, then the badge renders `flagged` with the announced phrase and no layout-blocking behavior (FR4, FR9, AD-12).
- Given an absent slug, a deprecated badge, or a failed fetch, then the build-derived base badge stays visible and no flagged state is claimed (AD-7, AD-12).
- And server markup and the first client render always show the base badge, and the overlay never computes freshness (AD-7, AD-12).
- And several badges share one request, and the only new client boundary is the overlay badge, which stays within AD-6's list (AD-6).
- And all content routes remain static and only `/api/flags/*` stays dynamic (AD-4).

## Implementation Notes

- `lib/flags/overlay.ts` now also owns `createOverlayLoader`, `resolveOverlayPresentation`, and the in-memory submission marker. `requestFlagSubmission` marks the slug when a submission starts, and the badge ignores an overlay result whose request began before that mark, so a slow GET cannot self-upgrade the badge immediately after a submission.
- The overlay request uses `cache: "no-store"` plus a 10s `AbortSignal.timeout`. A missing or non-array `flaggedSlugs` is treated as a failure and returns `null`, so the shared loader can retry on a later mount.
- `FlagOverlayBadge` skips the fetch for `deprecated`, stores the confirmed slug rather than a boolean, and derives both the variant and the live-region text from `resolveOverlayPresentation`.
- `EntryCard` now requires `entrySlug`, and its `badgeVariant` type is narrowed to `BaseBadgeState` because the base state can never be `flagged`.
- `scripts/test-flag-control.ts` gained a test-only keep-alive interval around the hung-request check. Node's `AbortSignal.timeout` timer is unref'd, so the pending fake fetch let the process exit before that check could run; production code is unchanged.

## Spec Change Log

No frozen-intent changes.

## Review Triage Log

- **Missing `flaggedSlugs` was cached as a successful empty list.** Fixed: `requestFlagOverlay` now returns `null` unless `data.flaggedSlugs` is an array; added failure checks for missing and non-array values.
- **The overlay fetch had no timeout, so a hung request could wedge the shared loader.** Fixed: added a 10s `AbortSignal.timeout`; the loader already clears a `null` result for a later retry.
- **A slow overlay GET could self-upgrade the badge after a submission.** Fixed: submissions mark the slug at request start, and badges ignore overlay results that started before the mark. Added a marker integration test for success and failure paths.
- **`SLUG_CHANGE` and duplicate-entry coverage were missing.** Fixed: `resolveOverlayPresentation` is tested for a previous slug versus the current slug, and the parser test now passes duplicates through unchanged.
- **Per-badge live regions can repeat the phrase on grids.** Accepted for this story: each upgraded badge is required to announce, and a single page-level live region needs cross-page plumbing outside this scope. Deferred in `deferred-work.md`.
- **The test-only `test-flag-control` keep-alive edit is outside the Code Map.** Accepted: without it the existing 26-check suite exits early under Node's unref'd timeout timer. No production behavior changed.

## Design Notes

The shared request lives in a module-level promise inside the client island, so every badge mounted during a page load joins the same GET. A null result from a failed request is not cached permanently; the next mount can retry. Upgrade state stores the slug that was confirmed flagged rather than a boolean, so client navigation to another entry cannot inherit the previous upgrade. The effect records its start time and checks the submission marker before applying a result, which closes the narrow GET-after-POST race. The live region holds the phrase only while the current badge is flagged; it is swapped to empty when the slug changes.

## Verification

**Commands:**
- `npm run test:flag-overlay` -- PASS, 18/18: every matrix row, the submission marker, and the real overlay route.
- `npm run test:flag-control` -- PASS, 26/26 (unchanged behavior; test harness keep-alive added).
- `npm run test:flags` -- PASS, 20/20 (unchanged).
- `npm run lint` -- PASS, no errors.
- `npm run build` -- PASS; content routes stay static or partially prerendered and only `/api/flags` and `/api/flags/overlay` are dynamic.

**Manual checks (if no CLI):**
- Browser-level checks were not run. Automated coverage verifies the base static markup, upgrade policy, slug scoping, failure fallback, and the real overlay route. A manual pass should still submit an outdated flag, open another surface showing that entry, block `/api/flags/overlay`, and confirm a deprecated entry stays `DEPRECATED`.
