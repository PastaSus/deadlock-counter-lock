---
title: "Rubric Walk Review: Architecture Spine"
type: rubric-review
purpose: judge ARCHITECTURE-SPINE.md against the good-spine checklist for feature-altitude downstream epic/story builders; weight AD-16/AD-17 and AD-2/AD-6 amendments
status: final
created: 2026-11-17
updated: 2026-11-17
inputs:
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/ARCHITECTURE-SPINE.md
corroboration_read_only:
  - _bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/EXPERIENCE.md
  - package.json, next.config.mjs, app/, components/, lib/, content/, scripts/ (scaffold reality)
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/.memlog.md
  - sibling reviews (reconcile-design, reconcile-experience, review-currency, review-adversary) for prior-gap context only
---

# Rubric Walk Review: ARCHITECTURE-SPINE.md (Counterlock)

Read-only against the spine; this file is the only write.

## 1. Verdict

**PASS WITH MATERIAL FINDINGS (not gate-clean).** The spine mostly fixes the real feature-altitude divergence points, ratifies the scaffold (Next 16 / cacheComponents / TS / Tailwind 4 / app-components-lib-content layout), and the AD-16/AD-17 asset work closes the Official Assets & Media contract that DESIGN/EXPERIENCE require (offline client, single join owner, fail-vs-degrade, attribution fields). AD-8 vs AD-17 is explicitly reconciled. But the **AD-2 amendment introduced a critical referential-integrity rule that contradicts PRD, the shipped corpus, and `lib/loaders`**, the **flag review lifecycle (status/`reviewed`/backlog clear) is still undecided**, and **AD-7's "never persist badge/status fields" still reads against AD-2's new `deprecated` content field** (plus `deprecated` shape drift vs code). Those three must be fixed before story builders implement from this spine.

**Counts:** 2 critical · 2 high · 3 medium · 3 low

## 2. Method

- Walked the eight good-spine checklist items in order; each item scored Pass / Pass-with-gap / Fail with line references.
- Weight pass on new/changed material: AD-16, AD-17, AD-2 vocabulary/`deprecated`/`abilityRef`/`itemRef`, AD-6 island additions (asset tooltip, hero counterpart filter).
- For every AD Rule, asked: can two compliant story units still ship incompatible artifacts?
- Cross-checked Named tech and scaffold ratification against `package.json`, `next.config.mjs`, and directories on disk (not against training data).
- Cross-checked source coverage against PRD FR-1..FR-12 and DESIGN/EXPERIENCE Official Assets & Media (including whether sibling reconcile gaps actually closed in the current spine text).
- AD-7 vs AD-2 and AD-8 vs AD-17 were tested as explicit contradiction pairs (checklist item 7).

## 3. Checklist walk

| # | Checklist item | Result | Notes |
| --- | --- | --- | --- |
| 1 | Fixes real divergence points for feature altitude; misses none | **Pass with critical gap** | Most story forks are closed (schema vocabulary, flag shapes, static surface, closed islands, badge owner, search single-source, asset pipeline/join). Miss: `sourceRef`/`targetRef` resolution rule is wrong (Finding R1); flag review write path undecided (R2); entity→directory map omits archetypes and disagrees with editorial `content/items` (R4). |
| 2 | Every AD Rule enforceable and prevents its stated divergence | **Pass with gaps** | AD-4/6/8/12/13/14/15/16/17 rules are review- and build-checkable. AD-2's hero-only ref rule is enforceable but prevents the *wrong* thing (fails legal content). AD-3 backlog/`status: reviewed` has no enforcement path (R2). `flaggedSlugs` does not pin "pending outdated only" (R5). |
| 3 | Nothing under Deferred lets two units diverge | **Pass** | KV provider deferred with contract fixed in AD-3/AD-9; ISR vs static already decided by AD-4; zod major fixed (`^4`). `next/image`/CDN deferral is presentational only (loader hands paths; AD-17 bars component-side manifest/fetch forks). No deferred line reopens a data-contract fork. |
| 4 | Named tech verified-current (or explicitly deferred) | **Pass** | Stack matches lockfile: next 16.4.6, react 19.3.0, TS ^6.0.3, tailwind 4.3.3, eslint ^9, zod ^4 (4.6.7 noted). `cacheComponents`+`partialPrefetching` recorded in AD-4 [ADOPTED]. Vercel KV correctly excluded; Upstash preferred and deferred. AD-16 API endpoints asserted verified live. |
| 5 | Ratifies scaffold/existing project rather than contradicts it | **Pass with gap** | Scaffold constraints ratified (App Router routes, cacheComponents, TS, Tailwind 4 `@theme`, dirs present). Gap: spine `deprecated: { patch, note }` vs shipped content/code `deprecated: true` boolean; spine says ability/item records never editorial while `content/items/items.json` and hero `abilities[]` are editorial (R3, R4). |
| 6 | Covers PRD FR-1..FR-12 and UX Official Assets & Media | **Pass with critical gap** | Capability map covers FR-1..FR-12. Official Assets: pipeline, no client API call, join owner, tooltip island, fail-vs-degrade, attribution, ability icons via by-hero-id `type` all landed (sibling reconcile gaps closed). Critical miss: media-row/source model broken by AD-2 hero-only refs (R1), so FR-3/FR-1 interaction records with ability/item ends cannot validate as written. |
| 7 | No new AD weakens/contradicts an existing one; AD IDs stable | **Pass with gaps** | IDs AD-1..AD-17 stable; no renumbering. **AD-8 vs AD-17: clean** — AD-17 Prevents names the AD-8 conflict, kebab slug remains entity/route id, official `id`/`class_name` are join-only. **AD-7 vs AD-2 `deprecated`: tension remains** — AD-7 forbids persisting "badge/status fields" while AD-2 requires a persisted `deprecated` content field and AD-7 also says "deprecated from content" (R3). Wording can be read both ways; shape also drifts vs code. |
| 8 | Every altitude dimension decided / deferred / open question (esp. ops/env) | **Pass with gaps** | Deployment/env largely covered: Vercel-compatible serverless [ASSUMPTION], env vars named, manual/env-gated sync, EDITOR_SECRET, no asset env vars. Undecided but load-bearing: flag review ownership (should be an explicit open question or AD rule, R2). Not enumerated: multi-env (preview/prod), KV backup/retention for FR-12 flag-age audit, rate-limit window values (single owner AD-3 so low divergence risk). |

## 4. Findings (severity-tagged)

### R1 [critical] AD-2 `sourceRef`/`targetRef` must resolve against the **hero** registry — contradicts PRD, corpus, loaders, and the media-row model the amendment was meant to fix

- **Spine (new material):** AD-2: "`sourceRef`/`targetRef` must resolve against the hero registry and `abilityRef`/`itemRef` against the generated ability/item registry … or the build fails" (spine:58). Memlog:37 records this as the intentional tightening.
- **Sources/corpus:**
  - PRD glossary: Interaction Record pairs "a source (ability/item/hero) with a target (ability/item/hero)" (prd:65).
  - Shipped entries use non-hero ends as first-class `sourceRef`/`targetRef`: `knockdown` (item) → `vindicta-flight` (ability); `apollo-riposte` → `seven-storm-cloud` (abilities); `solomon` → `flier-comps` (archetype); `disarm` (item) → `silver` (hero).
  - Code resolves both refs against a **full entity registry** (hero + nested ability + item + archetype) in `lib/loaders` `buildRegistry`/`assertReferences`.
  - DESIGN/EXPERIENCE card media: source/target portraits **plus** ability/item icons the entry references — not "two heroes plus optional side icons."
- **Why critical:** A story implementing AD-2 literally fails the build on the entire interaction corpus and cannot express PRD-legal records. A story implementing the corpus model violates AD-2. `abilityRef`/`itemRef` as optional media-only fields do not replace ability/item-as-source/target. This is exactly the "divergent file shapes / wrong referential integrity" class AD-2 claims to prevent.
- **Fix:** Resolve `sourceRef`/`targetRef` against the **full entity registry** (hero | ability | item | archetype), same as loaders; keep `abilityRef`/`itemRef` only if they are *additional* media-row refs beyond the ends (or drop them and derive media from the ends + nested hero abilities). Align entity→directory mapping with that registry.

### R2 [high] Flag review lifecycle still open: `status: "pending" | "reviewed"` and secret backlog exist, but nothing defines who writes `reviewed` or how the backlog clears (FR-12)

- **Spine:** AD-3 fixes record shape including `status`, `GET /api/flags/backlog` returns **pending** flags behind `EDITOR_SECRET` (spine:64); FR-12 capability row points at that backlog (spine:226). No route, script, or editorial rule marks a flag `reviewed` or removes it from pending.
- **Why high:** Two compliant units diverge: (a) API story adds `PATCH`/review endpoint; (b) sweep story assumes editorial-only review and never touches KV (PRD assumption: manual sweep, tooling out of MVP) so backlog grows forever and "no flag older than one Patch Cycle unreviewed" is unauditable; (c) a third clears overlay keys only, leaving records pending. Prior adversary ADV-7 asked for one exclusive owner; the amendment left the field without a lifecycle.
- **Fix:** Decide and write one rule in AD-3 (or a small AD-18): either review writes `status`/`reviewedAt` only through `/api/flags` and clears the overlay key, **or** review is editorial-only and backlog returns age + verdict with `status` dropped/ignored. Name backlog response fields needed for FR-12 age audit (`id`, `entrySlug`, `verdict`, `note`, `createdAt`, age).

### R3 [high] AD-7 "Content files never persist badge/status fields" vs AD-2's new persisted `deprecated` — contradiction risk plus shape drift vs code

- **Spine:** AD-7 base state includes "`deprecated` from content" and then "Content files never persist badge/status fields" (spine:88). AD-2 optional field `deprecated` (`{ patch, note }`) drives `badge-deprecated` + callout (spine:58).
- **Pair test:** A literalist schema story rejects `deprecated` (it is a "status" field). A literalist content story persists `stale: true` or `badge: "verified"` because AD-2's fixed vocabulary does not explicitly say "reject any field outside this list," and AD-7's ban is phrased as "status fields" without naming derived outputs.
- **Shape drift (checklist 5):** Spine requires object `{ patch, note }`; shipped content and `lib/schema` use boolean `deprecated`; callout patch/note then have no spine-defined home unless object form is real. Build on disk would reject spine-shaped content and accept spine-forbidden content.
- **Fix:** AD-7: "content may persist **inputs** (`verifiedPatch`, `deprecated`, `patchHistory`); derived badge fields (`badge`/`stale`/`flagged`/`deprecated` **label**) never persist; schemas are strict and reject unknown fields." AD-2: keep `deprecated` as input; either migrate content/code to `{ patch, note }` in the same change or keep boolean and state where callout patch/note come from (`patchHistory` row convention).

### R4 [medium] Entity→directory mapping incomplete relative to corpus and AD-17 "generated, never editorial"

- **AD-2 mapping (spine:58):** heroes → `content/heroes/`, entries → `content/entries/`, history inside entries, `currentPatch` → `content/config/`; ability/item "generated, never editorial." Seed mirrors only heroes/entries/config (spine:192).
- **Reality:** `content/archetypes/archetypes.json` and `content/items/items.json` exist and are required for ref resolution (`flier-comps`, `knockdown`); hero files carry editorial `abilities[]`. AD-17 puts ability/item records in the **manifest**, not content, so two stories can invent different homes for name/tier registries (manifest-only vs editorial JSON vs nested under heroes).
- **Fix:** One mapping line for archetypes (and items if editorial names stay); state that asset-join fields/tier live in the generated manifest while any *editorial* name registry (if kept) is a separate fixed file; seed must list every directory the loaders read.

### R5 [medium] `flaggedSlugs` does not pin "pending **outdated** verdict only"

- **AD-3:** overlay returns `{ flaggedSlugs: string[] }` (spine:64). **AD-12:** any slug in the list upgrades `verified|stale` → `flagged` (spine:118). DESIGN/EXPERIENCE: only pending **outdated** flags upgrade the badge; community **verified** flags add no public indicator.
- **Divergence:** One builder includes all pending verdicts (including `verified`) → false `badge-flagged`. Code currently sets overlay only for `verdict === "outdated"` but never clears on review (ties to R2). Spine rule does not encode the filter.
- **Fix:** AD-3: `flaggedSlugs` = slugs with at least one **pending `outdated`** flag; define clear-on-review behavior once R2 is decided.

### R6 [low] Operational envelope present but thin on environments and FR-12 durability

- Deployment paragraph (spine:201) + Deferred host assumption cover the main ops fork. Missing as explicit decided/deferred/OQ lines: single-environment vs preview deployments; KV retention/backup so flag age remains auditable across provider resets; fixed rate-limit/dedupe windows (code uses 30s/5/60s; spine leaves values open — acceptable if AD-3 is sole owner, but then say "values owned by the route implementation").
- **Fix:** One Deferred or Open Questions line each for environments and flag-store retention; optional one line that rate-limit numbers are route-owned constants.

### R7 [low] AD-16/AD-17 otherwise strong; residual wording only

- Offline-from-client, sole API caller, committed assets, missing-manifest = build fail, per-entity miss = DESIGN placeholder, by-hero-id carries items **and** abilities by `type`, manifest attribution per family, loaders-only join, components never import manifest — all landed and enforceable. Residual: "exact JSON shape is seed, owned by code" is fine **because** required fields (path, variants, sourceUrl, fetch date, attribution) are named; keep that clause so R4's registry story cannot invent a second hand-maintained metadata file.

### R8 [low] Scaffold ratification holds; minor stack silence

- AD-4 correctly adopts `cacheComponents`/`partialPrefetching` and bans per-request `dynamicParams`. Routes/seed match `app/` layout. Not in Stack but present in repo/AGENTS: `lucide-react` (icon choice is presentational; optional one stack line or convention row so icon-library forks are moot).

## 5. What the new/changed material got right (do not regress)

| Change | Rubric outcome |
| --- | --- |
| AD-16 sole sync client, env-gated prebuild or manual, committed `public/assets` + `lib/assets/manifest.json`, no asset route handler | Closes DESIGN/EXPERIENCE pipeline + rate-limit + build-network divergences |
| AD-16 fail (missing manifest / bad editorial ref) vs degrade (missing image → DESIGN placeholder) | Clear, story-safe taxonomy |
| AD-16 by-hero-id `type` discrimination → abilities + items | Closes prior ability-icon gap |
| AD-17 join owned by `lib/loaders`; components get props; prevents official ids leaking into routes/slugs | **AD-8 conflict explicitly resolved; IDs stay kebab** |
| AD-16/17 attribution fields (source URL, fetch date, license note) | Closes DESIGN manifest-attribution gap |
| AD-2 `deprecated` + `abilityRef`/`itemRef` *intent* | Right direction for callout/media row; execution wrong on ref registries (R1) and shape (R3) |
| AD-6 adds asset tooltip + hero counterpart filter (query-serialized) | Closes island-list gaps from EXPERIENCE reconcile |
| AD-4 Cache Components terms; zod `^4`; Vercel KV dropped / Upstash preferred | Checklist 4 pass |

## 6. Coverage scorecard

| Checklist item | Score | Blocking for gate? |
| --- | --- | --- |
| 1 Divergence points fixed, none missed | 7/8 — R1, R2, R4 | **Yes (R1)** |
| 2 Rules enforceable / prevent stated divergence | 7/8 — R1, R2, R5 | **Yes (R1, R2)** |
| 3 Deferred cannot cause divergence | 8/8 | No |
| 4 Named tech current or deferred | 8/8 | No |
| 5 Ratifies existing project | 6/8 — R3 shape, R4 editorial items | **Yes (R3)** |
| 6 Covers PRD + UX sources | 7/8 — R1 blocks FR-3/FR-1 record model | **Yes (R1)** |
| 7 No AD contradicts another | 6/8 — AD-7/AD-2 wording; AD-8/AD-17 clean | **Yes (R3)** |
| 8 Dimensions decided/deferred/OQ (ops/env) | 7/8 — R2, R6 | **Yes (R2)** |

**Gate recommendation:** do not mark spine final for epic/story handoff until **R1, R2, and R3** are amended in the spine (R4/R5 in the same edit pass preferred). AD-16/AD-17 and AD-6 may ship as-is; fix the AD-2/AD-3/AD-7 rules they depend on.
