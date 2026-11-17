---
title: "Reconcile Review: EXPERIENCE.md vs Architecture Spine"
type: reconcile-review
purpose: check EXPERIENCE.md load-bearing requirements against ARCHITECTURE-SPINE.md (post AD-16/AD-17/AD-6 amendment), report what did not land
status: final
created: 2026-11-16
updated: 2026-11-16
inputs:
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/EXPERIENCE.md
corroboration_read_only:
  - _bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/DESIGN.md
---

# Reconcile Review: EXPERIENCE.md against ARCHITECTURE-SPINE.md (Counterlock)

Read-only against both source docs; this file is the only write.

## 1. Verdict

**2 gaps.** All of the recently added asset material landed except one item: ability icons on entry cards have no sync source and no asset-join fields in the spine (Gap 1). One quiet, non-asset requirement is dropped entirely: the counterpart filter on the hero page has no spine home and runs into the closed client-island list (Gap 2). Everything else in EXPERIENCE.md either has an AD/convention/seed/deferral landing spot or is purely behavioral detail owned by EXPERIENCE.md with a single implementation point (no cross-story incompatibility risk).

## 2. Method

- Read the spine in full (236 lines) and EXPERIENCE.md in full (164 lines).
- For each load-bearing EXPERIENCE requirement asked: does the spine give it a landing spot, where the landing spot is one of: an AD rule, a Consistency Conventions row, the Structural Seed, the Capability map, or an explicit Deferred entry?
- Applied the materiality test from the task: purely behavioral/interaction detail owned by EXPERIENCE.md needs no spine landing spot unless two independently-built stories could implement it incompatibly (who fetches assets, who owns the join, is a client island allowed, does the build fail or degrade).
- Focus pass over the recently added/changed material (Foundation asset line, Official Assets & Media, the three new State Patterns rows, the two Interaction Primitives additions), then a sweep for any other quiet load-bearing requirement dropped entirely (material ones only).
- DESIGN.md and PRD/epics were consulted read-only only to verify that a spine pointer resolves (e.g. "the DESIGN placeholder") or that a requirement is genuinely FR-level; they are not review targets here.

## 3. Focus-area checklist (recently added/changed material)

| # | EXPERIENCE requirement | Spine landing spot | Result |
| --- | --- | --- | --- |
| 1 | Foundation: artwork synced at build time or local script, stored with repo, served statically, browser never calls the Deadlock Assets API (EXPERIENCE:16) | Paradigm line "no page ever calls the Deadlock Assets API" (spine:23); AD-16 manual `npm run sync:assets` or env-gated prebuild, images + manifest committed, build reads only local files, no asset route handler (spine:142) | Landed |
| 2 | Hero artwork: official card/background on roster tiles and hero-page headers; fail → neutral surface with initial, never broken image (EXPERIENCE:73) | AD-16 manifest-miss degrades to the DESIGN placeholder, never a broken image, never a runtime fetch (spine:142); AD-17 loaders hand resolved paths (spine:148); placeholder itself resolves in DESIGN.md:220; contrast floor AD-11 (spine:108) | Landed (see Minor obs. 1) |
| 3 | Counter card media: source/target portraits plus ability and shop-item icons the entry references (EXPERIENCE:74, 59) | Portraits and shop items: AD-17 join fields on hero and item records, join owned by `lib/loaders` (spine:148). **Ability icons: AD-16 endpoint list and AD-17 join-field enumeration cover heroes and items only; seed promises `public/assets/abilities/` (spine:194) with no producer or join rule** | **Gap 1** |
| 4 | Tooltips: hover or focus, persist while hovered/focused, `Esc` dismiss, `aria-describedby`, touch users focus the icon, content is build-time data (EXPERIENCE:75, 65, 94, 104) | AD-6 closed island list names the asset tooltip with "WCAG 1.4.13 dismissal" (spine:82, 197); AD-17 loaders hand tooltip metadata as props (spine:148); AD-11 WCAG 2.1 AA (spine:108) | Landed (single island = single implementation; interaction specifics are EXPERIENCE-owned) |
| 5 | Patch-Verified badge phrase: visible `PATCH-VERIFIED · X.Y`, SR hears "Patch-verified as of patch X.Y" (EXPERIENCE:76, 95) | AD-7 single owner of badge state derivation (spine:84); AD-11 a11y floor; EXPERIENCE is a cited source (spine:15) and owns copy | Landed (state in AD-7, phrase is EXPERIENCE copy; see Minor obs. 4) |
| 6 | Community flags: pending outdated flags upgrade to `badge-flagged` via overlay; no public verified count at MVP (EXPERIENCE:77) | AD-12 overlay island upgrades `verified\|stale` → `flagged` post-hydration (spine:118); AD-3 fixes the route contract to POST/backlog/overlay only, so no count endpoint can exist without a spine change (spine:64) | Landed |
| 7 | Deprecated Tech / Patch Note callout: supplements `badge-deprecated`, never replaces it; content fully rendered (EXPERIENCE:78, 66) | AD-7 single badge owner incl. `deprecated` from content (spine:84); AD-1/AD-2 keep note/history in entry files (spine:52, 58); AD-14 keeps deprecated in the index (spine:130) | Landed (callout itself is presentational, EXPERIENCE-owned) |
| 8 | State row "Asset missing": neutral placeholder with initial and name, never broken image, tooltip still opens with text (EXPERIENCE:93) | AD-16 degrade path (spine:142); AD-17 "A join miss renders the DESIGN placeholder with tooltip text intact" (spine:148) | Landed (explicitly) |
| 9 | State row "Tooltip" (EXPERIENCE:94) | AD-6 island + WCAG 1.4.13 reference (spine:82) | Landed |
| 10 | State row "Patch-Verified" (EXPERIENCE:95) | AD-7 badge state owner (spine:84) + EXPERIENCE copy | Landed |
| 11 | Primitive "Asset icons and tooltips": decorative when adjacent text names the entity, real button trigger, no hover-only affordance (EXPERIENCE:104) | AD-6 island list; AD-11 AA (decorative/accessible-name rules); AD-17 components never import the manifest (spine:148) | Landed |
| 12 | Primitive "Text over artwork": scrim + text shadow, overlay text ≥4.5:1 on the busiest portrait (EXPERIENCE:105) | AD-11 WCAG 2.1 AA contrast floor (spine:108); AD-15 token delivery from DESIGN.md (spine:136); scrim/shadow recipe is DESIGN-owned | Landed |

Task's structural questions, answered by the spine:

- **Who fetches assets:** only `scripts/sync-assets` (AD-16). Landed.
- **Who owns the join:** `lib/loaders`, slug → official id → manifest (AD-17). Landed for heroes and items; abilities missing (Gap 1).
- **Is a client island allowed:** closed list in AD-6 covers the asset tooltip, badge-flag overlay fetcher, copy-link, search, flag form, mobile menu (spine:82). Answered for assets; not answered for the counterpart filter (Gap 2).
- **Does the build fail or degrade:** explicit in AD-16: missing manifest fails the build; per-entity manifest miss degrades to placeholder (spine:142). Landed.

## 4. Other EXPERIENCE material checked (non-asset), landed

| Requirement | Spine home |
| --- | --- |
| Routes: home `?q=`, heroes, `[slug]` details, matchups, archetypes index (EXPERIENCE:20–32) | Structural Seed (spine:195), AD-4 `generateStaticParams` (spine:70), AD-8 route/slug mirroring (spine:94) |
| Deprecated stays at canonical URL, in search, labeled; no separate route (EXPERIENCE:32) | AD-14 index includes every entry (spine:130); seed has no deprecated route |
| Skeletons, reduced motion (EXPERIENCE:84, 115) | AD-15 "Skeletons and `prefers-reduced-motion` follow EXPERIENCE.md" (spine:136) |
| Empty/error copy ("No recorded changes", "No entries yet", plain-language errors) (EXPERIENCE:61, 85, 91–92) | AD-11 "error/empty copy follows EXPERIENCE.md" (spine:112); convention row (spine:172) |
| Search scope: heroes/abilities/items/effect terms across records AND matchup guidance, deprecated labeled (EXPERIENCE:58) | AD-5 client index from `content/` (spine:76); AD-14 single-sourced, every entry incl. matchup/archetype kinds (spine:130; kind vocabulary AD-2 spine:58) |
| Flag contract: verdicts, note, dedupe, rate-limit, in-place confirmation, overlay flip (EXPERIENCE:62, 87, 89–91) | AD-3 record shape/routes (spine:64), AD-9 envelope (spine:100), AD-12 overlay (spine:118) |
| Copy-link island, mobile menu island, search island (EXPERIENCE:63, 67, 100, 112) | AD-6 closed list (spine:82) |
| Roster exhaustive, zero-entry tiles, count matches registry (EXPERIENCE:64) | AD-13 (spine:124) |
| Patch History ascending, may be empty (EXPERIENCE:61) | AD-2 required fields (spine:58) |
| No component library, dark-only, tokens from DESIGN, fonts (EXPERIENCE:16) | AD-15 (spine:136) |
| No account layer anywhere (EXPERIENCE:16) | Convention "no auth anywhere" (spine:172); AD-3 prevents client-writable persistence |
| Badge state model verified/stale/flagged/deprecated, stale vs current distinguishable (EXPERIENCE:60) | AD-7 base derivation + AD-12 flagged layering (spine:84, 118) |
| Deep links, shareable `?q=`, deprecated retrievable (EXPERIENCE:102) | AD-4 static params + `?q=` on home (spine:70); AD-14 |

## 5. Gap register

### Gap 1: Ability icons on entry cards have no sync source and no asset-join fields [material, focus area]

- **EXPERIENCE binding:** "every entry card shows the source and target hero portraits plus the **ability** and shop-item icons that the entry references" (EXPERIENCE:74); the entry card media row shows "the official hero portrait and ability/shop-item icons" (EXPERIENCE:59); the asset tooltip carries "name, type or tier, and a one-line effect" for those icons as build-time data (EXPERIENCE:75, 65).
- **Spine says:**
  - AD-16 sync endpoints are `/v1/assets/heroes`, `/v1/assets/items`, `/v1/assets/items/by-hero-id/<hero id>` (spine:142). No ability source is named, yet the seed lists `public/assets/ # synced official artwork: heroes/, items/, abilities/` (spine:194), so the seed promises a directory nothing produces.
  - AD-17: "**hero and item records** carry the official API `id` and `class_name` as asset-join fields, required by the AD-2 build schemas" (spine:148). Ability records are not enumerated, even though AD-2 makes `sourceRef`/`targetRef` resolve against "the hero/**ability** registry" (spine:58), so abilities are first-class registry entities with slugs that must join to artwork.
- **Did not land:** the ability-asset path. Three independently-built units can diverge incompatibly while obeying every AD: (a) the sync-pipeline story implements AD-16's endpoint list literally and ships no ability assets; (b) the schema story (AD-2/AD-17) requires join fields only on hero and item records, so ability records have no mandated `id`/`class_name`; (c) the entry-card/tooltip story needs ability icons and tooltip text and either renders placeholder-only abilities everywhere or reaches outside the pipeline (hand-downloaded files or a client fetch, both prevented by AD-16's "Prevents" clause). This is exactly the "who fetches assets / who owns the join" failure mode.
- **Where it should land:**
  - **AD-16:** name the ability-asset source (a fourth endpoint, or an explicit statement that ability icons are extracted from `/v1/assets/heroes` and how they are keyed in the manifest).
  - **AD-17:** extend the join-field rule to ability records (or state the ability-icon resolution path, e.g. ability → hero → manifest), so the loaders' single join covers everything the card media row renders.
  - One-line seed/AD-2 follow-through if ability records are content files: AD-2's entity→directory mapping (spine:58) currently lists only heroes, entries, and config.

### Gap 2: Counterpart filter on the hero page has no spine home; the island question is unanswered [material, quiet, non-asset]

- **EXPERIENCE binding:** the hero page shows "That hero's Interaction Records + Matchup Guidance, **counterpart-filterable** (FR-1, FR-5, FR-6)" (EXPERIENCE:24); UJ-1 step 2 "filterable by counterpart" (EXPERIENCE:123); "Back navigation preserves prior browse state (**hero filter**, scroll) via normal history, no app-shell reset" (EXPERIENCE:67). Corroborated as FR-level material: PRD FR-1 "filtered/scannable by counterpart hero or ability/item" (prd:86) and an existing story AC (epics:158).
- **Spine says:** nothing. No AD rule, no convention row, no seed entry, no deferral mentions filtering or counterpart anywhere in AD-1 through AD-17, the Consistency table, the seed, the Capability map, or Deferred.
- **Why it is load-bearing, not just behavioral:** the implementation fork is architectural. The hero route is static (AD-4, `cacheComponents: true`, spine:70), so interactive filtering or a `?counterpart=` read requires a client island; AD-6's closed list does not include one and states "Any other `\"use client\"` boundary needs a spine update" (spine:82). Server-side `searchParams` filtering would break AD-4. As written, the requirement has no compliant implementation path without a spine edit, and two stories touching the hero page (records list vs guidance list, FR-1 vs FR-6) could each invent a different mechanism (island, URL-param read, CSS-only hack that fails the back-nav promise in EXPERIENCE:67).
- **Where it should land:** either **AD-6**, add the counterpart filter to the closed client-island list (and note whether its state serializes to the URL so browser back restores it, per EXPERIENCE:67), or **AD-4/seed**, an explicit non-client rule fixing the approach (e.g. static per-counterpart paths, or a named `?counterpart=` client read alongside the `?q=` precedent at spine:70).

## 6. Minor observations (not material gaps)

1. **Placeholder wording drift:** the spine points at "the DESIGN placeholder" (spine:142, 148); DESIGN.md:220 says "neutral placeholder with the entity initial", while EXPERIENCE:93 requires "initial **and name**". One word; align DESIGN or the spine pointer at copy pass so both placeholder stories (roster tile, card media) render the same thing.
2. **AD-17's join-miss sentence implies a non-manifest tooltip-text source** ("tooltip text intact", spine:148), but AD-2's directory mapping (spine:58) has no home for item or ability records that would hold name/tier/effect text. EXPERIENCE's build-time tooltip requirement still has a landing spot (AD-17 hands metadata as props), but the source should be named explicitly when Gap 1's ability records are added.
3. **Site-wide current-Patch stamp** (EXPERIENCE:32): data lands (AD-7 `currentPatch` single constant, spine:88); header/footer placement has no component home. Acceptable at spine altitude, consistent with `reconcile-inputs.md` §4.
4. **EXPERIENCE-internal badge phrase variance:** Component Patterns give "verified as of patch X.Y" on detail (EXPERIENCE:60) while Official Assets/State Patterns give `PATCH-VERIFIED · X.Y` (EXPERIENCE:76, 95), with the voice table marking strings provisional (EXPERIENCE:49). Copy-pass item for EXPERIENCE, not a spine gap; AD-7 keeps a single state owner either way.
5. **Downstream drift:** `epics.md:54` records the AD-6 island list without the asset tooltip added by this spine update (spine:82). Out of scope for this review, but the epics snapshot should be refreshed when the spine amendment is committed.

## 7. Coverage scorecard

| EXPERIENCE area | Landed | Gap |
| --- | --- | --- |
| Foundation asset line (build/local sync, static serving, no client API call) | full (paradigm + AD-16) | |
| Official Assets & Media (hero artwork, tooltips, Patch-Verified phrase, community flags, deprecated callout) | full | |
| Official Assets & Media: counter card media | portraits, items, tier/tooltip path | ability icons (Gap 1) |
| State Patterns: asset missing / tooltip / patch-verified | full (AD-16/17, AD-6, AD-7) | |
| Interaction Primitives: asset icons+text, text over artwork | full (AD-6/11/17) | |
| All other EXPERIENCE material (IA, voice, component patterns, other state patterns, a11y floor, flows, responsive) | full at spine altitude; remainder is EXPERIENCE-owned behavior with single implementation points | counterpart filter (Gap 2) |

**Totals:** 2 material gaps (1 focus-area, 1 quiet non-asset). 5 minor observations.
