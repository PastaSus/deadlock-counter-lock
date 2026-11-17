---
title: "Reconcile Review: DESIGN.md vs Architecture Spine"
type: reconcile-review
purpose: check DESIGN.md load-bearing requirements against ARCHITECTURE-SPINE.md (post AD-16/AD-17/AD-6 amendment), report what did not land
status: final
created: 2026-11-17
updated: 2026-11-17
inputs:
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/DESIGN.md
corroboration_read_only:
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/EXPERIENCE.md
  - _bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/reviews/review-reconcile-experience.md
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/.memlog.md
---

# Reconcile Review: DESIGN.md against ARCHITECTURE-SPINE.md (Counterlock)

Read-only against both source docs; this file is the only write.

## 1. Verdict

**3 gaps.** Nearly all of the recently added asset material landed: the pipeline, the join, the island, and the fail-vs-degrade contract are all fixed in AD-16/AD-17/AD-6, and every pure design-token concern (tier colors, media-scrim, hero-artwork-tile, the `PATCH-VERIFIED` label) is DESIGN-owned with a single implementation point. The three misses are data-model contracts the token rule does not cover: the entry-card media row's reference/record model (Gap 1), the deprecated callout's content fields (Gap 2), and the manifest entry/attribution contract (Gap 3). No other quiet, non-asset DESIGN requirement is dropped entirely by the AD structure.

## 2. Method

- Read the spine in full (236 lines) and DESIGN.md in full (276 lines).
- For each load-bearing DESIGN requirement asked: does the spine give it a landing spot, where a landing spot is one of: an AD rule, a Consistency Conventions row, the Structural Seed, the Capability map, or an explicit Deferred entry.
- Applied the task's materiality test: a design detail owned purely by DESIGN.md (token values, component recipes, copy, usage rules) needs no spine landing spot unless two independently-built stories could implement it incompatibly (who fetches assets, who owns the join, is a client island allowed, does the build fail or degrade).
- Focus pass over the recently added/changed material: the Official Assets & Media section, the new components (`hero-artwork-tile`, `asset-tooltip`, `deprecated-callout`), tier colors, media-scrim tokens, the `badge-verified` label change to `PATCH-VERIFIED`, the entry-card media row, and the roster-tile artwork changes. Then a sweep for any other quiet load-bearing requirement dropped entirely (material ones only).
- EXPERIENCE.md, PRD, the sibling `review-reconcile-experience.md`, and the architecture `.memlog.md` were consulted read-only only to corroborate that a requirement is real, that a spine pointer resolves, or that a decision was intended but not carried into the spine text; they are not review targets here.

## 3. Focus-area checklist (recently added/changed material)

| # | DESIGN requirement | Spine landing spot | Result |
| --- | --- | --- | --- |
| 1 | Official Assets & Media: assets synced at build time or by local script, stored with the repo, served statically; the browser never calls the assets API (DESIGN:210–212) | Paradigm line "no page ever calls the Deadlock Assets API" (spine:23); AD-16 manual `npm run sync:assets` or env-gated prebuild, images + manifest committed, build reads only local files, no asset route handler (spine:142); capability-map row "Official assets" (spine:227) | Landed |
| 2 | Hero artwork tiles: official card/background as tile background, scrim + text-shadow, overlay text ≥4.5:1, scrim is the only permitted gradient (DESIGN:214, 273) | AD-15 ships frontmatter tokens incl. `media-scrim-*` and `hero-artwork-tile` as CSS custom properties (spine:136); AD-11 WCAG 2.1 AA contrast floor (spine:108); artwork via AD-16/AD-17 (spine:142, 148) | Landed (scrim recipe and "only gradient" rule are DESIGN-owned; one `globals.css`, no two-story fork) |
| 3 | Counter card media row: 32px hero portrait, 24px ability and shop-item icons, 2px tier-colored item borders, tooltip always states tier in words (DESIGN:215, 248) | Icon paths/join: AD-17 loaders hand resolved asset paths/metadata as props (spine:148); icon sources: AD-16 writes `public/assets/{heroes,abilities,items}/`, by-hero-id payload carries items and abilities (spine:142); tier color tokens: AD-15 (spine:136); tooltip island: AD-6 (spine:82). **Missing: AD-2's registry is "hero/ability" only (items excluded), no entry field names the referenced shop-item/ability icons, and item `tier` / effect-summary text have no record home** | **Gap 1** |
| 4 | Asset tooltips: hover/focus, Esc dismissal, persistent, content is build-time data, the one new client island (DESIGN:216, 254) | AD-6 closed island list names "asset tooltip (WCAG 1.4.13 dismissal, per DESIGN)" (spine:82, 172, 197); AD-17 components never import the manifest, content stays build-time via loader props (spine:148); AD-11 (spine:108) | Landed |
| 5 | Patch-Verified badge: visible label `PATCH-VERIFIED · X.Y`, accessible phrase "Patch-verified as of patch X.Y" (DESIGN:119–123, 217, 249) | AD-7 single owner of badge state derivation (spine:88); AD-15 ships DESIGN frontmatter (spine:136); copy mirrored in EXPERIENCE:76/95, a cited spine source (spine:15); one badge component, so no second implementation point | Landed (design-owned copy; state, not label text, is what the spine must fix, and AD-7 does) |
| 6 | Community flags: pending outdated flags upgrade to `badge-flagged` via the overlay; no second public verified count at MVP (DESIGN:218) | AD-12 overlay island upgrades `verified\|stale` → `flagged` post-hydration (spine:118); AD-3 fixes the overlay shape to `{flaggedSlugs}` and guards the backlog with `EDITOR_SECRET` (spine:64), so no public count endpoint can exist without a spine change | Landed |
| 7 | Deprecated Tech / Patch Note callout: label + patch number + note, distinct block below the record body, supplements the badge, also on the deprecated entry-card variant (DESIGN:219, 248, 255) | Presentational side: AD-7 `deprecated` base state (spine:88), FR-10 capability row (spine:224), AD-14 keeps deprecated in the index (spine:130). **Data side: AD-2's "vocabulary is fixed, not per-story" list (spine:58) names no deprecation field and no patch/note sub-fields, though AD-7 reads "deprecated from content"** | **Gap 2** |
| 8 | Fallbacks: missing asset renders a neutral placeholder with the entity initial, never a broken image (DESIGN:220) | AD-16 manifest miss degrades to "the DESIGN placeholder (never a broken image, never a runtime fetch)" (spine:142); AD-17 "A join miss renders the DESIGN placeholder with tooltip text intact" (spine:148) | Landed (wording drift noted in minor obs. 4) |
| 9 | Attribution: "The generated manifest records the source URL, fetch date, and attribution or license note for each asset family" (DESIGN:220) | **Nothing in the spine.** AD-16 says sync "regenerates `lib/assets/manifest.json`" but fixes no fields (spine:142); Deferred has no manifest-shape or attribution entry (spine:231–237). The intent exists only in `.memlog.md:31` (attribution recorded per family) and `.memlog.md:32` (exact shape deferred to code), neither carried into spine text | **Gap 3** |
| 10 | `hero-artwork-tile` component: scrim, text-shadow, min-height tokens (DESIGN:146–152) | AD-15 frontmatter → CSS custom properties (spine:136); roster grid is FR-7 under AD-13/AD-16/AD-17 | Landed |
| 11 | `asset-tooltip` component tokens (DESIGN:153–158) | AD-6 island + AD-15 tokens | Landed |
| 12 | Tier colors `tier-1..4` + usage rule "only on item icon borders, never on badges, text, or status" (DESIGN:33–36, 215, 274) | Tokens: AD-15 (spine:136). Usage rule is DESIGN-owned (one design source, no second consumer) | Landed (tier **value** provenance: Gap 1) |
| 13 | Media-scrim tokens, "the only permitted gradient" (DESIGN:37–39, 150) | AD-15 (spine:136) | Landed (gradient ban is a DESIGN rule with a single `globals.css`; no cross-story fork) |
| 14 | `deprecated-callout` component tokens (DESIGN:160–166) | Tokens: AD-15. Rendering: DESIGN-owned, server-rendered (no island needed) | Tokens landed; data contract → Gap 2 |
| 15 | Entry card media row anatomy leading the card (DESIGN:248) | Loader-props path (AD-17), tooltip island (AD-6), tier tokens (AD-15) | Partial → Gap 1 |
| 16 | Roster-tile artwork changes: artwork background, scrim, name with text shadow, hover/selected states, "no entries yet" line for zero-entry heroes (DESIGN:253) | AD-16/AD-17 artwork + join (spine:142, 148); AD-13 exhaustive registry with empty state, never a 404 (spine:124); AD-15 tokens (spine:136); selected state rides the AD-6 hero counterpart filter island (spine:82) | Landed |

Task's structural questions, answered by the spine:

- **Who fetches assets:** only `scripts/sync-assets` (AD-16, spine:142). Landed.
- **Who owns the join:** `lib/loaders`, slug → official id → manifest entry; components never import the manifest (AD-17, spine:148). Landed for heroes, abilities, and items (post-tightening: AD-16 writes all three directories and the by-hero-id payload discriminates items vs abilities by `type`, spine:142; AD-17 enumerates all three record types, spine:148).
- **Is a client island allowed:** closed list in AD-6 names the asset tooltip (spine:82). Landed.
- **Does the build fail or degrade:** explicit in AD-16: missing manifest fails the build with a clear error; per-entity manifest miss degrades to the DESIGN placeholder (spine:142). Landed.
- **Where do the records/fields the join and tooltips read live:** not answered (Gaps 1 and 3).

## 4. Other DESIGN material checked (non-asset), landed

| Requirement | Spine home |
| --- | --- |
| Frontmatter token system (colors, typography, spacing, radii, component recipes), dark-only, fonts, no component library (DESIGN:8–190, 165) | AD-15 (spine:136); reconcile-inputs Gap 5, closed |
| Search field full-width on home, `?q=` read client-side, results well with `aria-live` count (DESIGN:252) | AD-4 `?q=` on static home (spine:70); AD-5 client index (spine:76); AD-6 search island (spine:82); AD-11 (spine:112) |
| Flag control: ghost pair, note field, in-place confirmation, rate-limit notice, no modal/account wall (DESIGN:256) | AD-3 flag record/routes incl. `note?` (spine:64); AD-9 envelope (spine:100); AD-6 flag-form island (spine:82) |
| Copy link: island, citation line, 44px (DESIGN:251) | AD-6 closed list (spine:82) |
| Navigation mobile sheet, flat bar (DESIGN:257) | AD-6 mobile-menu island (spine:82); sticky/scroll elevation is CSS-only |
| Hero roster grid exhaustive, zero-entry tiles "no entries yet", no dimming (DESIGN:253) | AD-13 (spine:124); empty copy via AD-11/EXPERIENCE (spine:112) |
| Badge states model (verified/stale/flagged/deprecated), icon+word+color, mono stamps (DESIGN:249) | AD-7 base derivation (spine:88); AD-12 flagged layering (spine:118) |
| Patch History block, ascending, empty state (DESIGN:250) | AD-2 required `patchHistory[]`, may be empty (spine:58) |
| Error styling as text/border only, error copy (DESIGN:40–41, 208) | AD-11 error copy follows EXPERIENCE (spine:112); convention row (spine:172) |
| Contrast floors (7:1 body, 4.5:1 overlay text, 3:1 input border) (DESIGN:203, 206) | AD-11 WCAG 2.1 AA (spine:108) |
| Selected-state tint / hero picked (DESIGN:204) | AD-6 hero counterpart filter island, state serializes to route query (spine:82) |
| Kebab files/slugs, PascalCase components, types in `lib/schema` (AD-10, spine:106) | Convention row (spine:169) |
| No auth anywhere (DESIGN flag control "no account wall") | Convention row (spine:172); AD-3 prevents client-writable persistence |
| Community verified count absent at MVP | AD-3 fixed overlay shape (spine:64); see checklist row 6 |

## 5. Gap register

### Gap 1: Counter card media row has no entry-to-icon reference model and no home for item/ability record fields (tier, tooltip text) [material, focus area]

- **DESIGN binding:** the counter card media row is "a 32px hero portrait, then 24px ability and shop-item icons. Each item icon carries a 2px border in its tier color … The tooltip always states the tier in words" (DESIGN:215); the entry-card anatomy leads with that media row (DESIGN:248); the asset tooltip must show "the entity name, type or tier, and a one-line effect summary" as build-time data (DESIGN:216, 254). Corroborated: EXPERIENCE:74 "the ability and shop-item icons **that the entry references**"; PRD:65 pairs source with target as "(ability/item/hero)".
- **Spine says:**
  - AD-16 writes image files for heroes, abilities, and items (spine:142) and AD-17 puts join fields on "hero, ability, and item records, required by the AD-2 build schemas", with loaders handing "resolved asset paths/metadata" as props (spine:148). The pipeline half landed, including the ability tightening recorded at `.memlog.md:34` (which also closes the sibling EXPERIENCE review's Gap 1).
  - But AD-2's fixed pieces contradict or omit the model AD-17 assumes: `sourceRef`/`targetRef` "must resolve against the **hero/ability** registry" (spine:58), so a PRD-legal item source/target fails validation or gets dropped, and no entry field names the additional shop-item/ability icons the row renders; AD-2's entity→directory mapping (spine:58) and the seed (spine:191–198) give ability and item records **no home** at all, though AD-17 requires them inside "the AD-2 build schemas"; and no rule anywhere fixes item `tier` (needed for both the 2px border color and the words-in-tooltip rule) or the tooltip's one-line effect text.
- **Why it is material, not just design detail:** three independently-built units can each obey their AD and still disagree: the schema story (AD-2) can reject item references or omit tier/effect fields; the sync story (AD-16) can persist only image paths, leaving nothing to join tooltip data from; the entry-card/tooltip story can then render placeholder-only icons or invent a parallel data source (both barred by AD-16/AD-17). This is the "who owns the join / divergent file shapes between story-builders" failure mode AD-2 itself lists under Prevents (spine:57).
- **Where it should land:**
  - **AD-2:** add items to the reference registry alongside heroes/abilities; name the fields the media row and tooltip consume (item/ability refs on entries, item `tier`, effect-summary text); extend the entity→directory mapping with a home for ability and item records (`content/abilities/`, `content/items/`, or an explicit "manifest-derived, not content" rule).
  - **Seed:** one line for whichever directory is chosen (spine:191–198 currently lists only heroes, entries, config under `content/`).
  - **Alternatively, if those fields ride the synced manifest instead:** **AD-16** must state that the sync persists tier/name/effect metadata per item/ability, and AD-17's "metadata" should enumerate the fields loaders hand down.

### Gap 2: Deprecated Tech / Patch Note callout has no fixed content field for its patch number and note [material, focus area]

- **DESIGN binding:** the callout "states 'Deprecated Tech / Patch Note', the patch number, and the note" (DESIGN:219) and repeats it as a distinct component below the record body (DESIGN:255); the deprecated entry-card variant shows the callout too (DESIGN:248), so the data must reach list rendering as well as the detail route.
- **Spine says:** AD-7 derives `deprecated` "from content" (spine:88), but AD-2's rule that the entry "vocabulary is fixed, not per-story" enumerates only `slug`, `kind`, `title`, `sourceRef`, `targetRef`, `effects[]`, `conditions`, `verifiedPatch`, `patchHistory[]` (spine:58). No field carries a deprecation flag, and none carries the callout's patch number and note (whether that should be `deprecated: { patch, note }`, a boolean plus a `patchHistory[]` row convention, or something else is unstated). The FR-10 capability row points only at content, detail route, and search index (spine:224).
- **Why it is material:** the content-schema story and the entry-card/detail story are separate build units; with no named field, each invents a shape, and AD-2 forbids exactly that per-story vocabulary drift. This also closes AD-7's own pre-existing hole, where "deprecated from content" references a field AD-2 never defines.
- **Where it should land:** **AD-2** entry vocabulary: name the deprecation field(s) including the patch number and note the callout renders, or state explicitly that deprecation is expressed as a fixed-shape `patchHistory[]` row (with its element shape) plus where the flag lives. The callout's presentation and rose tokens stay DESIGN-owned; only the data contract needs the spine.

### Gap 3: Manifest entry contract (image path/variant keys plus DESIGN-required attribution metadata) has no landing spot [material, focus area]

- **DESIGN binding:** "The generated manifest records the source URL, fetch date, and attribution or license note for each asset family" (DESIGN:220). The same section also implies variant choices the manifest must satisfy: hero tiles use "the official hero card **or** background image" (DESIGN:214) while the media row needs a 32px hero portrait (DESIGN:215), so which image variants sync persists, and under which keys, is part of the sync-to-UI contract.
- **Spine says:** AD-16 "regenerates `lib/assets/manifest.json`" but fixes no entry shape (spine:142); AD-17 fixes the join **key** (official id → manifest entry) but not the entry's fields (spine:148); the Deferred section lists image/CDN strategy but neither the manifest shape nor attribution (spine:235). The intent exists only in `.memlog.md:31` ("attribution/license note recorded per family in the manifest") and `.memlog.md:32` ("exact manifest JSON shape is seed, owned by code once written"), neither of which appears in spine text.
- **Why it is material:** the sync story (writer) and the loaders story (reader) are independently built; with no fixed field contract, divergent field names (`path` vs `file`, flat vs per-family attribution objects) silently degrade every card to placeholders, the exact "divergent file shapes between story-builders" class AD-2 Prevents (spine:57). DESIGN's attribution requirement would otherwise live only in a memlog decision that no story is guaranteed to read, and a memlog-only deferral is invisible to downstream builders auditing the spine.
- **Where it should land:** **AD-16** with one clause fixing the manifest entry shape: image path field plus variant keys (card/background/portrait), and the DESIGN-required `sourceUrl`, fetch date, attribution-or-license note per asset family. If the team wants the exact JSON left to code, then at minimum AD-16 should name the required fields and **Deferred** should carry an explicit line: "exact manifest JSON shape, deferred to code [ASSUMPTION]" (currently only `.memlog.md:32` says this).

## 6. Minor observations (not material gaps)

1. **Desktop search collapse-on-scroll has no named owner** (DESIGN:252: search "collapses into nav icon on scroll for desktop"). A compliant path exists inside the existing closed list, since AD-6 already covers "search input/results" (spine:82) and the collapsed affordance can be mounted as part of that island inside the server `navigation` component; a builder could instead naively put scroll JS in `navigation.tsx` with `"use client"`, which AD-6 would reject mid-build. One clarifying clause would remove the trap; not counted as a gap because a single story (FR-2) owns search and the island list already admits it.
2. **Badge hit-area cites WCAG 2.5.8** (DESIGN:118, 249), a WCAG 2.2 criterion, while AD-11 adopts 2.1 AA (spine:108). Single badge component plus a frontmatter rule, so no divergence risk; note for QA so "meets AD-11" is not read as "44px not required".
3. **Mockup drift:** `mockups/home-lookup.html` still renders "VERIFIED · 7.2" (lines 505, 539) while DESIGN and EXPERIENCE both specify `PATCH-VERIFIED · X.Y`. Copy-pass item; no edit made here.
4. **Placeholder wording drift:** DESIGN:220 says "entity initial", EXPERIENCE:93 says "initial **and name**" (already logged as minor obs. 1 in `review-reconcile-experience.md`). The spine points at "the DESIGN placeholder" (spine:142, 148), so aligning DESIGN or EXPERIENCE at copy pass keeps roster-tile and card-media placeholders identical.
5. **Attribution was intentionally decided but not carried into the spine:** `.memlog.md:31` records it as a constraint of this update; Gap 3 is the spine-text fix, not a new decision.

## 7. Coverage scorecard

| DESIGN area | Landed | Gap |
| --- | --- | --- |
| Official Assets & Media: pipeline, static serving, no client API call | full (paradigm + AD-16) | |
| Official Assets & Media: hero artwork tiles, tooltips, Patch-Verified label, community flags, fallback placeholder | full (AD-15/11/6/7/12/16/17) | |
| Official Assets & Media: counter card media row | paths, join, island, tier tokens | entry references + item/ability record fields incl. tier (Gap 1) |
| Official Assets & Media: deprecated callout | presentational side (AD-7/10/14 + DESIGN tokens) | deprecation patch/note field (Gap 2) |
| Official Assets & Media: attribution / manifest | join key only (AD-17) | entry shape + attribution fields (Gap 3) |
| New components: `hero-artwork-tile`, `asset-tooltip`, `deprecated-callout` tokens | full (AD-15, AD-6) | callout data (Gap 2) |
| Tier colors, media-scrim tokens, badge label `PATCH-VERIFIED` | full (AD-15, AD-7; DESIGN-owned copy/rules with single implementation points) | |
| Components: entry-card media row, roster-tile artwork | roster full (AD-13/15/16/17); card anatomy + tooltip path | media-row data model (Gap 1) |
| Frontmatter tokens, typography, layout, elevation, shapes, Do's/Don'ts | full at spine altitude (AD-15, AD-11) | |
| Non-asset component behaviors (search, flags, copy-link, navigation, badges, patch history, roster) | full (AD-3/4/5/6/7/9/11/12/13/14) | none material |

**Totals:** 3 material gaps (all in the recently added focus material), 0 material quiet non-asset gaps, 5 minor observations.
