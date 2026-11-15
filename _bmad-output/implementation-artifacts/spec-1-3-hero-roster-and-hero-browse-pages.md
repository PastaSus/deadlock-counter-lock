---
title: 'Story 1.3: Hero roster and hero browse pages'
type: 'feature'
created: '2026-11-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '555fc694061849ea9c296718ddf03e9a4dc6903b'
context: []
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The hero-first lookup path (FR-1, FR-7) has no routes: `/heroes` and `/heroes/[slug]` do not exist, and the top navigation is built but never mounted, so a visitor cannot start from a hero.

**Approach:** Add statically prerendered `/heroes` (full registry roster) and `/heroes/[slug]` (that hero's Interaction Records, Matchup Guidance, and Archetype Warnings). Reuse Navigation, HeroRosterTile, EntryCard, and Badge; derive each entry's build-time base badge in a single new `lib/badges` owner; resolve hero participation through the entry's source/target refs, including that hero's ability slugs.

**Decisions (agent):** Mount Navigation once in `app/layout.tsx` with the patch from `loadConfig`; include Archetype Warnings as a third section (FR-5 "by hero", UJ-1); extend Badge with per-variant tint classes from existing status tokens (story 1.2 left coloring to callers); card links point at `/interactions/[slug]` or `/matchups/[slug]` even though those routes land in 1.4/1.5.

**Decision (human):** Counterpart filtering is static: within each kind section, entries are grouped into counterpart subsections with an in-page anchor jump list at the top. No client island, no AD-6 change.

## Boundaries & Constraints

**Always:** Roster and hero pages enumerate `content/heroes/` (AD-13), never the entry set. Routes read through `lib/loaders` only and stay server components: `generateStaticParams` from hero slugs (at least one), awaited `params`, no `dynamicParams`, no runtime APIs. Badge base state derives only in `lib/badges` (AD-7) from `verifiedPatch` vs `currentPatch` plus `deprecated`. Badge state always renders word + icon + color. Copy uses no em dashes. Reuse tokens and existing components; touch targets >= 44px; zero-entry tiles keep full opacity.

**Never:** No `/interactions`, `/matchups`, `/archetypes`, search, flags, API routes, or new `"use client"` island (AD-6). No content, schema, or corpus changes; no persisted badge/status fields. Do not restyle or delete the home scaffold.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Roster | 13 heroes incl. doorman | 13 tiles each linking `/heroes/<slug>`; doorman tile full opacity with "No entries yet" | N/A |
| Hero with entries | e.g. solomon | name headline; every entry involving the hero as source or target, each card showing badge + patch | N/A |
| Ability ref | sourceRef/targetRef is one of the hero's abilities | entry included; counterpart renders the ability name | N/A |
| Zero-entry hero | doorman | "No entries yet." headline, tracked-but-uncurated line, link home | not a 404 |
| Unknown slug | `/heroes/not-a-hero` | 404 page | `notFound()` |
| Deprecated entry | `deprecated: true` | `badge-deprecated`; card stays visible | N/A |
| Stale entry | `verifiedPatch` older than `currentPatch` | `badge-stale` with dashed border | N/A |
| Current entry | `verifiedPatch` equals `currentPatch` | `badge-verified` | N/A |

</frozen-after-approval>

## Code Map

- `app/layout.tsx` - renders only `{children}`; needs Navigation mounted above content; metadata description contains an em dash to fix.
- `app/heroes/page.tsx` - new roster route; no file exists.
- `app/heroes/[slug]/page.tsx` - new hero route; no file exists.
- `lib/badges/index.ts` - new module; architecture names `lib/badges/` as the AD-7 owner.
- `components/badge.tsx` - `Badge({ variant, patch?, className? })`, variant union `verified|stale|flagged|deprecated`; applies no colors, caller must pass classes; renders icon + label + optional ` · patch`.
- `components/entry-card.tsx` - `EntryCard({ href, effectChip, source, target, condition, badgeVariant, patch?, className? })`; whole-card stretched link.
- `components/hero-roster-tile.tsx` - `HeroRosterTile({ href, name, entryCount?, selected?, className? })`; shows "No entries yet" when count is 0.
- `components/navigation.tsx` - `Navigation({ currentPatch?, className? })`; server component, links `/heroes`, `/interactions`, `/matchups`.
- `lib/loaders/index.ts` - `loadHeroes(contentRoot?)`, `loadAllContent(contentRoot?)`, `buildRegistry`; `ContentRegistry` maps slug to `{ slug, kind, name, heroSlug? }` over heroes, abilities, items, archetypes. No grouping helper exists.
- `lib/schema/index.ts` - `Entry` = `{ slug, kind, title, sourceRef, targetRef, effects[], conditions, verifiedPatch, patchHistory[], deprecated? }`; `comparePatches` exported.
- `app/globals.css` - tokens for surfaces, borders, text, accent, status tints (`status-verified|flagged|deprecated` plus `-surface`), spacing, radii; fonts via `@theme`.
- `next.config.mjs` - `cacheComponents: true`, `partialPrefetching: true`; do not change.
- `tsconfig.json` - `strict: false`, no path aliases; use relative imports.

## Tasks & Acceptance

**Execution:**
- [x] `lib/badges/index.ts` -- export `deriveBadgeState(entry, currentPatch): "verified" | "stale" | "deprecated"` (deprecated wins, else numeric patch compare; reuse `comparePatches`) -- single build-time owner per AD-7.
- [x] `components/badge.tsx` -- apply per-variant tint/border classes from the `status-*` tokens (stale uses the verified tint plus dashed border), keeping icon + word and letting `className` override -- coloring was left to callers in 1.2.
- [x] `app/layout.tsx` -- render `<Navigation currentPatch={loadConfig().currentPatch} />` above `{children}` and replace the em dash in the metadata description -- completes the 1.2 app-shell AC and honors the style rule.
- [x] `app/heroes/page.tsx` -- new server page: `loadAllContent`, count entries per hero, render page title + responsive roster grid (2 / 3 / 4 to 6 columns) of `HeroRosterTile` -- FR-7.
- [x] `app/heroes/[slug]/page.tsx` -- new server page: `generateStaticParams` over `loadHeroes`, awaited `params`, `notFound()` for unknown slugs, per-hero `generateMetadata`; split entries by `kind` into Interaction Records, Matchup Guidance, and Archetype Warnings, omitting empty sections; map each to `EntryCard` with resolved names, condition, derived badge, `patch={verifiedPatch}`, kind-based href, and `effectChip` = effects joined (kind label when empty) -- FR-1, FR-4, FR-6.
- [x] `app/heroes/[slug]/page.tsx` -- group each kind section by counterpart name with an in-page anchor jump list, keeping entries unique when both sides resolve to the same entity -- FR-1.

**Acceptance Criteria:**
- Given the hero registry, when `/heroes` is built, then one tile exists per hero and zero-entry heroes render full-opacity with "No entries yet".
- Given a hero page, when built, then every entry where the hero is source or target (directly or via its abilities) appears exactly once, with badge and patch visible without interaction.
- Given a zero-entry hero, then the page renders the empty state with a 200 status, not a 404.
- Given `npm run build`, then `/heroes` and all 13 `/heroes/[slug]` routes prerender as static HTML and Cache Components validation passes.
- Given any page, then the top Navigation renders with the current-patch stamp.
- Given an unknown hero slug, then the 404 page renders.
- Given a hero page, then each kind section groups entries by counterpart name and a jump list at the top anchors to each group.

## Implementation Notes

- Added `lib/hero-entries/index.ts` (not in the Code Map) so participation, counterpart resolution, and grouping stay pure and shared by the roster and hero pages.
- `EntryCard.effectChip` renders effects joined with ` + ` and uppercased; falls back to the kind label (`INTERACTION` / `MATCHUP` / `ARCHETYPE WARNING`) when effects are empty.
- Empty kind sections are omitted; a hero with no entries at all gets the empty-state block instead.
- `generateMetadata` awaits `params` and reads content; the build accepts it with `generateStaticParams`, all 13 hero pages emit static HTML, and the dynamic segment keeps a partial-prerender fallback.
- Known limitation: an unknown slug renders the 404 UI but responds HTTP 200, because the fallback shell streams after headers. Fixing the status needs middleware or an architecture change; deferred per the approved spec note.
- Conditional links to `/interactions/[slug]` and `/matchups/[slug]` 404 until stories 1.4 and 1.5 land.
- Verification run: `npm run test:content` 8/8 PASS; `npm run test:heroes` 7/7 PASS; `npm run lint` clean; `npm run build` green (19 static pages, all 13 hero pages emitted as static HTML). Matrix checks: roster HTML has 13 hero links; doorman tile and page expose the no-entries state (accessible name "Doorman, no entries yet"); apollo shows `DEPRECATED` with "last checked against patch 0.8", haze shows `STALE` + dashed border, abrams shows `VERIFIED`; all 13 prerendered hero pages matched the loader-derived entry sets exactly (including ability refs); runtime `/heroes` and `/heroes/solomon` return 200; `/heroes/not-a-hero` renders the 404 UI.
- Review patches: variant-aware badge announcements, count-aware roster tile names, a named EntryCard link, an always-visible patch stamp, and the new `scripts/test-heroes.ts` suite. Build and all checks re-ran green afterward.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Spec `in-review` vs sprint `in-progress` | false | rejected | Step-05 syncs the sprint entry to `review`; `in-progress` is the correct build-stage value while review runs. |
| Implementation note's "13 links / 2 mentions" is misleading | false | rejected | The note reports raw counts, not tile states; the second string is the duplicated RSC payload. Only the spec text would change. |
| Manual check cites Solomon for ability refs | low | rejected | Solomon's two entries are direct refs; ability-ref cover comes from haze, apollo, and others. Spec-text fix only. |
| Unknown slug returns 200 with 404 UI | low | rejected | Runtime confirmed 200 plus the 404 UI, but the approved intent explicitly allows the partial fallback, no page links to unknown slugs, and a status fix needs middleware or an architecture change. |
| New pure logic has no runnable tests | medium | patch | Applied `scripts/test-heroes.ts` (7 checks) and `test:heroes`; all pass. |
| I/O matrix omits item/archetype counterparts, newer patch, same-name and both-sides cases | low | rejected | Grouping tests cover item counterparts; future-patch behavior is triaged below. Spec-only fix. |
| Code Map omits `lib/hero-entries` | low | rejected | Implementation Notes record the addition. Spec-only fix. |
| Spec uses em dashes | low | patch | Replaced separators in the agent-owned Code Map; the frozen marker attribute was left as-is. |
| Acceptance hardcodes 13 routes | low | rejected | 13 is the current exhaustive registry and the AC is a one-time gate. Spec-only fix. |
| Entry cards link to routes that do not exist yet | medium | rejected (out of scope) | Intent's Never excludes detail routes; stories 1.4 and 1.5 deliver them and the spec records the temporary dead links. |
| `entryHref` assumes warnings live under `/matchups` | false | rejected | EXPERIENCE.md IA assigns guidance detail, including archetype warnings, to `/matchups/[slug]`. |
| Navigation hides the patch stamp below md | medium | patch | Applied: stamp now renders at every breakpoint; verified in static HTML. |
| Navigation's mobile menu/search are inert and links are hidden below md | medium | defer | Pre-existing 1.2 gap; fixing it needs the mobile-menu/search island. Added to deferred-work. |
| Empty-state and logo links hit the scaffold home | low | rejected | Intent forbids touching home and story 1.6 replaces it; the empty-state link is spec-approved. |
| Badge announces "verified as of patch X" for deprecated/stale | medium | patch | Applied variant-aware phrases; static HTML now reads "DEPRECATED, last checked against patch 0.8". |
| Stale reuses the verified green tint | false | rejected | DESIGN.md explicitly specifies the same green tint plus a dashed border so freshness reads as an axis, not correctness. |
| Badge `className` override is not guaranteed | low | rejected | No caller passes a conflicting className; a real override needs twMerge or a color prop, beyond a direct correction. |
| Roster tile aria-label hides the zero-entry text | medium | patch | Applied: accessible name now reads "Doorman, no entries yet" or "N entries". |
| Jump targets lack `tabIndex` | low | rejected | Native fragment navigation sets the sequential focus starting point; no demonstrated user failure. |
| EntryCard's only link is aria-hidden and unnamed | medium | patch | Applied: removed aria-hidden and added a descriptive accessible name; verified in static HTML. |
| `effectChip` prefers effects over the kind label | low | rejected | The spec decision defines effects joined with a kind fallback, and no matchup or warning entry currently has effects. |
| Future `verifiedPatch` is badged verified | low | rejected | A patch newer than currentPatch reads as fresh verification; a policy fix belongs to content validation. `test:heroes` now pins numeric ordering. |
| Uniqueness guard is unreachable | low | rejected | The guard keeps grouping idempotent for duplicate input; removal is cosmetic. |
| `loadAllContent` is called repeatedly | low | rejected | Build-time sync reads; caching adds complexity for no user-visible gain. |
| Verification gap: badge derivation untested | medium | patch | Same fix as row 5; numeric ordering and deprecated precedence are asserted. |
| Verification gap: ability participation untested | medium | patch | Same fix as row 5; ability source and target refs are asserted. |
| Verification gap: counterpart grouping untested | medium | patch | Same fix as row 5; source/target names and shared groups are asserted. |
| Verification gap: roster and zero-entry rendering untested | low | defer | Needs an HTTP/render harness; pure logic is now covered and build output was inspected. Added to deferred-work. |
| Verification gap other: unknown slug 200 | low | rejected | Duplicate of the unknown-slug row; same reasoning. |
| Verification gap other: unnamed EntryCard link | medium | patch | Duplicate of the EntryCard row; fixed with it. |
| Verification gap other: roster tile aria-label | medium | patch | Duplicate of the roster tile row; fixed with it. |

## Verification

**Commands:**
- `npm run test:content` -- expected: all checks PASS (content untouched).
- `npm run build` -- expected: green; output lists `/heroes` and the 13 `/heroes/[slug]` param routes as static (the unknown-slug fallback may show as partial prerender).
- `npm run lint` -- expected: no errors.

**Manual checks:**
- Open `/heroes`: tile count equals the registry, doorman shows "No entries yet" at full opacity.
- Open `/heroes/solomon`: all three sections render where content exists; each card shows its badge and patch; hero appears via direct refs and ability refs; counterpart groups and their jump links work.
