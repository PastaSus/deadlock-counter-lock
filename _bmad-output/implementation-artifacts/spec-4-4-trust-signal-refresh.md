---
title: 'Story 4.4: Trust-signal refresh: Patch-Verified and Deprecated callout'
type: 'feature'
created: '2026-11-26'
baseline_commit: 'f5bae02859ff8ccd5a5de4987ff1dee4f8614e45'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The verified badge still reads `VERIFIED`, so players cannot tell the editor's patch verification from a community check, and deprecated entries carry only a rose badge with no explicit patch note. Story 4.4 refreshes the trust-signal wording and adds the deprecated callout.

**Approach:** Relabel the verified base badge to `PATCH-VERIFIED · X.Y` with the accessible phrase "Patch-verified as of patch X.Y", add a rose `DeprecatedCallout` server component driven by the latest `patchHistory` row, render it on deprecated cards and detail pages, ship the callout spec in `app/globals.css`, and build-enforce that `deprecated: true` requires a non-empty `patchHistory`.

## Boundaries & Constraints

**Always:** Only the verified label and accessible phrase change. Stale, flagged, and deprecated badge labels, icons, colors, and aria phrases stay identical. The callout supplements `badge-deprecated` and never replaces it; record content stays fully rendered. Callout patch number and note come from the latest `patchHistory` row (highest patch via `comparePatches`). Rose callout uses existing `status-deprecated` tokens and meets WCAG AA contrast. Components stay server components; no manifest, fetch, or API changes. Kebab-case files, PascalCase components.

**Never:** No separate public community-verified count. No badge shape, icon, or color change. No change to flag overlay behavior. No new client island. No content file edits. Do not reword stale, flagged, or deprecated badges.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Verified badge | `variant="verified"`, `patch="1.2"` | Visible `PATCH-VERIFIED · 1.2`; aria `Patch-verified as of patch 1.2` | N/A |
| Verified, no patch | `variant="verified"`, no patch | Visible `PATCH-VERIFIED`; aria `Patch-verified` | N/A |
| Other states | `stale` / `flagged` / `deprecated` | Labels, icons, colors, aria unchanged | N/A |
| Deprecated card | `deprecated: true` plus latest history row | Rose callout below record body with label, patch, note; badge still `DEPRECATED` | N/A |
| Deprecated detail | `deprecated: true` plus latest history row | Same callout after Conditions, before badge row | N/A |
| Deprecated, empty history | `deprecated: true`, `patchHistory: []` | Build fails at content load | `ContentError` names `patchHistory` |
| Non-deprecated, empty history | `deprecated` absent, `patchHistory: []` | Allowed; no callout | N/A |

</frozen-after-approval>

## Code Map

- `components/badge.tsx` -- `STATE.verified.label` is `VERIFIED`; `PATCH_PHRASE` builds aria. Change only verified to `PATCH-VERIFIED` and `Patch-verified as of patch X.Y`; leave the other variants intact.
- `lib/schema/index.ts` -- `entrySchema.superRefine` already checks effects and patch ordering. Add `deprecated: true` requires non-empty `patchHistory`. AD-2 documents this but it is not enforced today.
- `lib/badges/index.ts` -- owns trust derivation. Add `latestPatchHistory(entry)` returning the highest `patchHistory` row via `comparePatches`.
- `components/deprecated-callout.tsx` -- new server component: label `Deprecated Tech / Patch Note`, mono patch number, note.
- `components/entry-card.tsx` -- add optional `deprecatedCallout` prop; render below the condition `<p>`, above `<footer>`, only when `badgeVariant === "deprecated"`.
- `app/page.tsx`, `app/heroes/[slug]/page.tsx` -- pass the latest history row to each `EntryCard`.
- `app/interactions/[slug]/page.tsx`, `app/matchups/[slug]/page.tsx` -- render the callout below the Conditions block, before the badge/copy-link row.
- `app/archetypes/page.tsx` -- custom card is an entry surface; render the callout after the conditions `<p>`.
- `app/globals.css` -- add `--deprecated-callout-*` custom properties and `@theme inline` color/spacing mappings (UX-DR22).
- `components/index.ts` -- export `DeprecatedCallout`.
- `scripts/test-trust-signals.ts`, `package.json` -- new `test:trust-signals` suite and script.
- Do not change: flag overlay logic, `patch-history.tsx`, `copy-link.tsx`, media row, manifest, assets.

## Tasks & Acceptance

**Execution:**
- [x] `components/badge.tsx` -- verified label/aria only -- UX-DR20
- [x] `lib/schema/index.ts` -- enforce deprecated requires history -- AD-2
- [x] `lib/badges/index.ts` -- `latestPatchHistory` helper -- single latest-row source
- [x] `app/globals.css` -- `deprecated-callout` spec tokens -- UX-DR22
- [x] `components/deprecated-callout.tsx` -- rose callout component -- UX-DR21
- [x] `components/entry-card.tsx` -- optional callout prop -- card surface
- [x] `app/page.tsx`, `app/heroes/[slug]/page.tsx` -- pass latest row -- list surfaces
- [x] `app/interactions/[slug]/page.tsx`, `app/matchups/[slug]/page.tsx`, `app/archetypes/page.tsx` -- render callout -- detail + archetype surfaces
- [x] `components/index.ts` -- barrel export -- consistency
- [x] `scripts/test-trust-signals.ts`, `package.json` -- suite + script -- verification

**Acceptance Criteria:**
- Given any entry surface rendering the verified base badge, when it renders, then the visible label is `PATCH-VERIFIED · X.Y` and the accessible name is "Patch-verified as of patch X.Y".
- Given a stale, flagged, or deprecated base badge, when it renders, then its label, aria phrase, icon, and color are unchanged.
- Given an entry with `deprecated: true`, when its card or detail renders, then a distinct rose callout appears below the record body with the label, the latest patch number, and the latest note, and `badge-deprecated` still renders with all content visible.
- Given `deprecated: true` with empty `patchHistory`, when content loads, then validation fails with a clear error naming `patchHistory`.
- Given a non-deprecated entry, when it renders, then no callout appears.
- Given the default build, when it runs, then no new client island is introduced and no community-verified count is rendered.

## Implementation Notes

- Verified badge: `STATE.verified.label` is `PATCH-VERIFIED`; a dedicated `accessibleName` branch emits `Patch-verified` (no patch) or `Patch-verified as of patch X.Y` (with patch). Other variants keep `${label}${patchPhrase}` untouched.
- `entrySchema.superRefine` now rejects `deprecated: true` with empty `patchHistory` at path `["patchHistory"]`. This closes the AD-2 gap the spec flagged.
- `latestPatchHistory` reduces by `comparePatches` and returns `undefined` for empty history.
- Callout tokens: `--deprecated-callout-background/border/foreground/padding`, mapped in `@theme inline` to color and spacing utilities used by the component.
- Callout renders on home featured cards, hero-page cards, the archetypes custom card, and both detail pages (after Conditions, before the badge row).
- Test harness was made async-capable to render the deprecated interaction detail page directly, covering the detail matrix row.

## Spec Change Log

## Review Triage Log

## Design Notes

Latest row is the max by `comparePatches`, not the array's last element (history is ascending, but do not assume). For the deprecated seed entry the latest row is `0.9` while `verifiedPatch` is `0.8`, so the callout must show `0.9` and the badge stamp stays `0.8`. Callout markup uses a `role="note"` aside with a mono patch label; colors map to the `status-deprecated` family.

## Verification

**Commands:**
- `npm run test:trust-signals` -- expected: all checks PASS.
- `npm run test:content` -- expected: all PASS (deprecated fixture still valid).
- `npm run test:flag-overlay` -- expected: all PASS (deprecated overlay unchanged).
- `npm run test:heroes` -- expected: all PASS.
- `npm run test:asset-media` -- expected: all PASS.
- `npm run lint` -- expected: no errors.
- `npm run build` -- expected: green; no new dynamic routes.

**Manual checks (if no CLI):**
- Verified badge reads `PATCH-VERIFIED · X.Y`; screen reader text is "Patch-verified as of patch X.Y".
- `/interactions/apollo-riposte-vs-seven-storm-cloud` shows the rose callout with patch `0.9` and its note, with `DEPRECATED` badge and full record intact.
- No community-verified count appears anywhere.
