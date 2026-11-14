# Brief → PRD Reconciliation (input-reconciliation subagent, finalize step)

**Inputs reconciled:**
- Brief: `_bmad-output/planning-artifacts/briefs/brief-deadlock-counter-lock-2026-11-13/brief.md` (status: final, 2026-11-13)
- Brief addendum: `.../brief-deadlock-counter-lock-2026-11-13/addendum.md` (2026-11-13)

**Checked against:**
- PRD: `_bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md` (status: draft, 2026-11-14)
- PRD addendum: `.../prd-deadlock-counter-lock-2026-11-14/addendum.md` (2026-11-14)

**Method:** every substantive requirement, constraint, metric, audience claim, scope decision, and qualitative/tone/brand idea was extracted from the brief inputs and classified `covered` / `partially covered` / `dropped` against the PRD pair. Delegation counts as covered only where the PRD explicitly points back to the brief (PRD §0: "problem, market scan, and scope live there").

---

## A. Extract from brief.md — Executive Summary & positioning

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| E1 | Community-driven web database + pre-game lookup tool for Deadlock, strictly actionable counterplay | covered | PRD §1 Vision (near-verbatim) |
| E2 | Not a win-rate tracker, not an item builder, not a trivia wiki | covered | PRD §5 Non-Goals |
| E3 | Core question: "what actually counters what, right now, in this patch?" | covered | PRD §1 |
| E4 | View 1: granular ability/item-to-ability interaction records | covered | §4.1 FR-1–FR-3 |
| E5 | View 2: lane/team-comp matchup guidance incl. archetype warnings (e.g. Solomon into fliers) | covered | §4.2 FR-5, FR-6; Glossary |
| E6 | Trust signal: patch verification badge on every entry | covered | FR-8 |
| E7 | Trust signal: community verified/outdated flags | covered | FR-9 |
| E8 | Trust signal: Patch History / Deprecated Tech — record says so "instead of silently rotting" | covered | FR-10; §1 |
| E9 | "The window is now" — live-service patch cadence invalidates advice in buried videos / messy spreadsheets / undated wiki edits | partially covered | §1 restates the competitive-gap half (stat trackers / wikis / prose sites); the urgency framing and the videos/spreadsheets pain evidence stay in the brief (explicitly delegated by §0) |

## B. Extract from brief.md — The Problem

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| P1 | Knockdown no longer really counters flyers (326 upvotes, Jul 2026); cast-time change | covered | UJ-1 path uses Knockdown vs. flyers + Patch History cast-time change |
| P2 | Doorman's ult vs. Counterspell — undocumented interaction flips surfacing only on YouTube/forums | dropped | no occurrence in PRD pair (example only; no requirement depends on it) |
| P3 | Top 2026 complaint quote (3.1k upvotes): "Counter items how people describe them VS how they actually work." | partially covered | pain evidence lives in brief addendum market digest; PRD §0 delegates market scan to brief; quote not restated |
| P4 | Competitor/coping set: Tracklock, Deadlock Guru, Deadlock Labs (correlations only); wiki implicit freshness; getcounterlock.com + DenyPick prose staleness | partially covered | Tracklock named in §6.2; §1 compresses the three-category critique; full named set delegated to brief per §0; **getcounterlock.com appears nowhere in PRD** (see Naming gap, §F) |
| P5 | Cost of status quo: nobody can answer "is this still true this patch?" in seconds | covered | SM-3 (under ~10s lookup) + §1 |
| P6 | Verification currently falls to individual YouTubers / Discord threads, re-discovering changes repeatedly | dropped | narrative color; superseded by UJ-3 editorial sweep framing |

## C. Extract from brief.md — The Solution

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| S1 | Fast, searchable web database | covered | FR-1, FR-2, §6.1 |
| S2 | Exact conditions in records: mid-air states, channel breakpoints, **fire-rate scaling** | partially covered | FR-3 enumerates "mid-air states, channel breakpoints, etc." — the "etc." absorbs fire-rate scaling, but the fire-rate example (Suppressor vs. high fire-rate M1) never appears (see seed gap, §F) |
| S3 | Example: early Slowing Hex grounding Deadman Danny mid-crash | dropped | not carried into PRD (brief addendum seed item; see §F) |
| S4 | Badge wording "verified as of patch X.Y"; updated by **manual** re-verification sweep after each Deadlock patch | covered | FR-8 consequence (exact pattern), FR-12; PRD addendum "hand-verified" rationale |
| S5 | Lightweight player reports when an interaction no longer behaves as documented | covered | FR-9 (verified/outdated + optional note) |
| S6 | Patch History keeps deprecated tech **visible instead of deleted** | covered | FR-10 consequences (retrievable, labeled deprecated, ordered by patch) |
| S7 | Pre-game-speed lookup: pick your hero, pick theirs, get counterplay truth + freshness stamp | covered | FR-1 hero-first browse; FR-3 detail fields; SM-3 |
| S8 | `[ASSUMPTION]` primary UX is hero-first search/browse; exact interaction UI to be confirmed in PRD | covered | §9 index confirms it as a requirement (FR-1, FR-2); PRD §0 delegates interaction/UI detail to `bmad-ux` — explicitly noted as downstream ownership, not dropped |

## D. Extract from brief.md — "What Makes This Different" (qualitative/brand)

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| D1 | **The counterplay-only filter is the brand.** Trivia excluded by editorial policy; "If it doesn't change what you do in a match, it doesn't ship." | covered | §5 final bullet preserves the policy wording; note: it is a policy statement with no FR (acceptable — editorial, not testable) |
| D2 | Per-patch verification nobody else has: no tool indexes ability→ability pairs as queryable records with verified/changed/deprecated states (market scan, Nov 2026) | covered | §1 second paragraph (near-verbatim) |
| D3 | **Honest about its own decay:** Patch History "turns knowledge rot into a feature"; a deprecated interaction is still useful information | partially covered | mechanism fully covered (FR-10); the brand framing ("knowledge rot into a feature", "deprecated = useful information") survives only as an implication of §1's "deprecated interactions stay visible as history" |
| D4 | `[ASSUMPTION]` **Honest moat: execution and community trust; passion-project stakes; no fabricated technical moats** | dropped | passion-project register appears once in §1 ("Success is a passion/community project"); the moat claim and its `[ASSUMPTION]` tag are absent from the PRD and **absent from §9 Assumptions Index** |
| D5 | Naming collision with getcounterlock.com; **keep the name**; differentiate on interaction records + verification badges | dropped | no mention anywhere in PRD pair; PRD title instead carries "*Working title — confirm.*", which re-opens a decision the brief already settled |

## E. Extract from brief.md — Who This Serves / Success Criteria

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| W1 | Primary: engaged players in the pre-game moment (hero select, loadout prep); tired of patch-stale advice; value freshness stamp over trivia depth | covered | §2.1 Functional + Emotional JTBD; UJ-1 |
| W2 | `[ASSUMPTION]` mid-core theorycrafters are the beachhead; casuals follow later | covered | §9 (indexed) |
| W3 | `[ASSUMPTION]` Secondary: newer players learning via browsable interactions; content creators needing citable, patch-stamped sources | covered | §9 final bullet ("served but not optimized for v1"); content-creator JTBD also in §2.1 Social |
| W4 | Success: find the interaction in under ~10 seconds `[ASSUMPTION]` | covered | SM-3 + §9 ("aspirational until measured") |
| W5 | Trust the badge enough to act without checking a second source | covered | UJ-1 Climax ("trusts it without a second source") |
| SC1 | Launch: ~25–40 **hand-verified** high-value records + archetype warnings, all badged, full browsable roster | covered | SM-1; "hand-verified" echoed in PRD addendum Rejected Alternatives |
| SC2 | First post-launch patch completes a full re-verification sweep | covered | SM-2 |
| SC3 | No community outdated-flag older than one patch cycle goes unreviewed `[ASSUMPTION]` | covered | FR-12 + SM-2; assumption reframed in FR-12 as manual editorial process |
| SC4 | Usage: returning players across ≥2 patch cycles `[ASSUMPTION: traffic targets deferred]` | covered | SM-4 + §9 (same wording) |
| SC5 | Signal of fit: community flags + requested interactions become the primary backlog input | covered | SM-5 |

## F. Extract from brief.md — Scope

### In for MVP

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| M1 | View 1: granular ability/item-to-ability database, curated seed ~25–40 | covered | §6.1; SM-1 |
| M2 | View 2: lane/team-comp matchup guidance (archetype warnings) | covered | §6.1; FR-5, FR-6 |
| M3 | Full browsable hero roster (all heroes present; depth curated) | covered | FR-7 + §6.1 |
| M4 | Patch verification badge + accountless community flag mechanism `[ASSUMPTION: flagging is accountless]` | covered | FR-9 (accountless promoted from assumption to requirement; §9 lists it under §6.2) |
| M5 | Patch History / Deprecated Tech on every entry | covered | FR-10; §6.1 |
| M6 | SEO-first static/SSR routes for heroes and matchups; fast pre-game lookup | covered | §6.1; PRD addendum Search Scope Note |
| M7 | Constraints locked day one: Next.js (TypeScript), Tailwind CSS, strict kebab-case, WCAG 2.1 AA | covered | §6.1 — but see §H for version-level detail from the addendum |

### Explicitly out of MVP

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| X1 | Win-rate stats, tier lists, match history, MMR (Tracklock's turf) | covered | §5; §6.2 |
| X2 | Item builders / build recommendations | covered | §5; §6.2 |
| X3 | Open community submissions / wiki-style editing (curated + flags only) | covered | §5; §6.2; PRD addendum Rejected Alternatives |
| X4 | Accounts, auth, profiles `[ASSUMPTION]` | covered | §5; §6.2; §9 |
| X5 | Mobile app; monetization `[ASSUMPTION]` | covered | §6.2 (+ PM revisit note) |
| X6 | API for third parties `[ASSUMPTION]` | covered | §6.2 |
| X7 | Post-MVP path: flags → requested interactions → widen coverage; open submissions only if curated model can't keep pace | covered | §6.2; SM-5 |

### Vision (2–3 years)

| # | Brief item | Verdict | Evidence / note |
|---|---|---|---|
| V1 | Canonical freshness layer; the site players check after every patch; creators cite when they claim "this interaction changed" | covered | §1 final paragraph (compressed) |
| V2 | The record of how the game's counterplay meta evolved, patch by patch | dropped | no equivalent phrase in PRD pair |
| V3 | A community that flags rot faster than any editor could | partially covered | implied by FR-9/SM-5 but the "faster than any editor" claim is not stated |
| V4 | Deprecated interactions preserved as history rather than quietly deleted | covered | FR-10; §1 |
| V5 | If Deadlock grows, the same verified-interaction model extends to whatever Valve ships next | dropped | no extensibility/horizon statement in PRD pair |

## G. Extract from brief addendum.md

| # | Brief-addendum item | Verdict | Evidence / note |
|---|---|---|---|
| A1 | **Stack: Next.js 16 (TypeScript, supersedes initial JSX), App Router, Tailwind CSS** | partially covered | §6.1 says only "Next.js (TypeScript), Tailwind CSS" — **version 16 and App Router are not in the locked-constraints list**; the TS-supersedes-JSX history is irrelevant downstream |
| A2 | Rendering: SEO-first; fast static/SSR for hero and matchup routes | covered | §6.1; PRD addendum Search Scope Note |
| A3 | Naming: strict kebab-case for all files/folders | covered | §6.1 |
| A4 | Accessibility: WCAG 2.1 AA | covered | §6.1 |
| A5 | Scaffold status: Next.js 16.4.6 + Tailwind 4 + ESLint + TS scaffolded at root; `npm run build` passes with TS check | dropped | not in PRD pair — defensible (repo fact, not a product requirement) but it is the evidence that A1's pinned versions exist; recorded here so finalize can decide |
| A6 | Market landscape digest (stat trackers: Tracklock/Deadlock Guru/Deadlock Labs/Batru/deadlockmeta.dev; prose: getcounterlock.com/DenyPick/LockBlaze/deadlock-recommender; wiki ~1,250 pages, no per-interaction badges; 2026 Reddit pain evidence; confirmed gap) | covered by delegation | PRD §0 explicitly assigns market scan to the brief; §1 carries the three-category compression |
| A7 | **Naming Decision: keep "Counterlock" despite getcounterlock.com; differentiate on interaction records + badges; revisit only if confusion becomes a real acquisition problem** | dropped | absent from PRD pair; PRD's "*Working title — confirm.*" (line 9) actively re-litigates it |
| A8 | MVP content model: curated seed ~25–40 + archetype warnings; full roster browsable; manual re-verification sweep per patch; accountless verified/outdated flag feeds backlog; growth = flags → requested → widen | covered | SM-1, SM-2, FR-9, FR-12, §6.1–6.2 |
| A9 | **Example Interaction Seed — explicitly marked "to expand in PRD" (7 items)** | **dropped (not expanded)** | see breakdown below |

### A9 breakdown — Example Interaction Seed vs. PRD

Brief addendum: *"Example Interaction Seed (from user prompt — to expand in PRD)"*

| Seed example | In PRD? |
|---|---|
| Haze's Sleep Dagger / Paradox's Swap interrupting Lash's ult/slam | no |
| Early Slowing Hex grounding Deadman Danny mid-crash (explodes mid-air) | no |
| Knockdown extending stuns on airborne targets | partial — UJ-1 uses "Knockdown vs. flyers" (a different effect: counter-to-flyers, not stun-extension) |
| Disarm vs. Silver | no |
| Suppressor vs. high fire-rate M1 heroes | no (also the only concrete instance of FR-3's "fire-rate scaling" condition) |
| Apollo's Riposte no longer cancels Seven's ult (deprecated-tech example) | yes — UJ-2 persona/context |
| Solomon vs. flier comps (archetype warning example) | yes — Glossary, FR-5, UJ-1 |

Only 2 of 7 seeds carried through; 1 partially. The addendum's own instruction ("to expand in PRD") was not executed.

## H. `[ASSUMPTION]` audit (brief → PRD §9 / FR)

| Brief `[ASSUMPTION]` | PRD status |
|---|---|
| Primary UX hero-first search/browse; UI detail confirmed in PRD | covered — §9; confirmed as requirement; UI detail explicitly delegated to `bmad-ux` (§0) |
| Mid-core theorycrafters beachhead; casuals later | covered — §9 |
| Secondary audiences (newer players, creators) | covered — §9 final bullet |
| Find interaction in under ~10 seconds | covered — SM-3 + §9 |
| No outdated flag older than one patch cycle unreviewed | covered — FR-12/SM-2 (assumption recast as manual-process assumption) |
| Returning players ≥2 patch cycles; traffic targets deferred | covered — SM-4 + §9 |
| Flagging is accountless | covered — FR-9 promoted to requirement; §9 under §6.2 |
| No accounts / no monetization / no mobile / no API in MVP | covered — §6.2 + §9 |
| **Honest moat = execution + community trust; no fabricated technical moats** | **dropped — not in PRD, not in §9** |
| (Brief addendum) Next.js 16 / TS / App Router as locked stack | partially — §9/§6.1 omit version + App Router |

**§9 completeness:** the PRD's Assumptions Index faithfully carries 9 of the 10 brief-level assumptions. The missing one is the honest-moat assumption (D4).

## I. Qualitative ideas at risk of silent FR-drop (watchlist)

These survive only as brand/narrative, not as testable requirements — flagged so the finalize step can decide whether any needs an FR or an explicit non-requirement note:

1. **"Knowledge rot into a feature"** (D3) — FR-10 tests field presence/ordering, not the editorial stance that deprecated entries remain *useful*. Preserved in §1 prose only. *(partially covered)*
2. **"Honest moat: execution and community trust; no fabricated technical moats"** (D4) — dropped entirely; also unindexed in §9. *(dropped)*
3. **Counterplay-only editorial filter** (D1) — present in §5, but as a non-goal, not a standing editorial requirement; no FR can fail on it (acceptable, but it is the brand's stated core). *(covered as policy)*
4. **Vision: meta-evolution record + extension to future Valve titles** (V2, V5) — dropped; affects roadmap framing, not MVP. *(dropped)*
5. **Naming settled vs. "Working title — confirm"** (D5/A7) — the brief made a durable naming decision with a revisit trigger; the PRD re-opens it. *(dropped + contradiction)*
6. **"Community flags rot faster than any editor could"** (V3) — implied by SM-5, unstated. *(partially covered)*

## J. Gap list (ranked, for finalize triage)

| Rank | Gap | Type | Severity |
|---|---|---|---|
| 1 | **Naming decision dropped**: keep "Counterlock" despite getcounterlock.com, differentiate on records + badges, revisit only on real acquisition confusion — while PRD line 9 says "*Working title — confirm.*" | scope decision + contradiction | high |
| 2 | **Example Interaction Seed not expanded** as the brief addendum instructed ("to expand in PRD"): 4 of 7 seeds absent (Haze/Paradox→Lash, Slowing Hex/Danny, Knockdown stun-extension, Disarm vs. Silver, Suppressor vs. fire-rate M1) — and the absent "Suppressor/fire-rate" example is the only concrete instance of FR-3's fire-rate condition | content seed + qualitative detail | medium-high |
| 3 | **`[ASSUMPTION]` honest moat (execution + community trust; no fabricated technical moats) dropped** and unindexed in §9 | assumption coverage | medium |
| 4 | **Long-horizon vision dropped**: "record of how the counterplay meta evolved patch by patch" and "extends to whatever Valve ships next" (2–3 yr framing compressed away) | qualitative/vision | medium-low |
| 5 | **Stack pinning narrowed**: Next.js 16 + App Router (and scaffold status evidence) absent from the locked-constraints line; only "Next.js (TypeScript)" survives | constraint | low |

**Everything else in the brief inputs is covered** — all 10 remaining `[ASSUMPTION]`s, all MVP in/out scope decisions, all five success criteria, both core views, all three trust signals, the editorial counterplay-only policy, primary/secondary audience claims, the 10-second and two-patch-cycle metrics, and the post-MVP growth path.

---
*Generated by input-reconciliation subagent for PRD finalize. Research only; no source files modified.*
