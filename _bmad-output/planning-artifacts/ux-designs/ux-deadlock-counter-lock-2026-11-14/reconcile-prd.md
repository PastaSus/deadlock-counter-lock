# Reconciliation: PRD → UX Spines

- **Input:** `_bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md` (+ `addendum.md` glance)
- **Spines:** `DESIGN.md`, `EXPERIENCE.md` (same-folder `ux-deadlock-counter-lock-2026-11-14`)
- **Date:** 2026-11-14
- **Verdict:** Strong overall coverage. 3 material gaps (FR-4/FR-8 stale marking, content-creator citation, editor sweep surface), 1 minor note (FR-11 depth is intentionally thin). Accessibility: fully covered.

## 1. User Journeys

| Item | Status | Evidence |
|---|---|---|
| UJ-1 Marcus 30s pre-game check | **Covered** | EXPERIENCE · Key Flows UJ-1 walks the full path incl. mobile/Discord entry, Archetype Warning + badge, Knockdown detail, climax (badge + Patch History), flagged-outdated edge. Responsive `<640px` row names UJ-1 default. |
| UJ-2 Priya one-tap flag | **Covered** | EXPERIENCE · Key Flows UJ-2: search → detail → Outdated → optional note → in-place confirmation, no account; dedupe/rate-limit edges; badge-flagged consequence; backlog handoff (FR-12). |
| UJ-3 Editor Verification Sweep | **Covered (thin by design)** | EXPERIENCE · Key Flows UJ-3 (4 steps): backlog review in repo files, re-verify, ship, climax = no flag older than one Patch Cycle. No designed surface — consistent with PRD assumption that sweep tooling/backlog viewing is architecture-dependent (FR-11/FR-12 notes, addendum). |

## 2. Functional Requirements

| Item | Status | Evidence / gap |
|---|---|---|
| FR-1 Hero-first browse | **Covered** | IA `/`, `/heroes`, `/heroes/[slug]`; Component Patterns "Hero-first browse" (path #1, no modal picker); DESIGN search-field above fold co-equal with browse. |
| FR-2 Free-text search | **Covered** | IA `?q=` on home; Component Patterns search matches records **and** Matchup Guidance; `aria-live` count; deprecated in results; client-side grid (Interaction Primitives). |
| FR-3 Interaction detail fields | **Covered** | IA interaction detail row (source/target/effect/conditions/badge/history/flag); missing history → explicit "no recorded changes" (State Patterns + Patch History block); conditions never truncated (DESIGN Typography/Do's). |
| FR-4 Patch-aware freshness signals | **Partial** | Three badge states covered everywhere; **old-patch vs current-patch verified** resolved in EXPERIENCE Badge states as "patch number does the work, same green" — satisfies literal distinguishability only by reading fine print, and no aged/stale visual treatment is defined (see Gap 1). |
| FR-5 Archetype warnings | **Covered** | IA `/archetypes` index (by-archetype axis) + guidance detail; same badge/history trust signals (UJ-1 step 3, Component Patterns). |
| FR-6 Lane matchup guidance | **Covered** | IA guidance detail route; navigation-depth rule ("any Interaction Record reachable from home within two navigations… FR-6 pattern applies site-wide"). |
| FR-7 Complete roster | **Covered** | IA `/heroes`; "no entries yet" tile state in Component Patterns, State Patterns, DESIGN hero-roster-tile, Do's table (no 404s, no dimming). Addendum UX handoff note honored. |
| FR-8 Patch Verification Badge | **Covered (stale-marking sub-claim partial)** | Badge text pattern "verified as of patch X.Y" (Badge states); site-wide current-Patch header/footer stamp (IA closing paragraph). PRD consequence "entries not yet re-verified… marked stale relative to current Patch" is **not** given a distinct state — spines fold it into the patch number on the same green badge (Gap 1). |
| FR-9 Accountless flags | **Covered** | Flag control component (DESIGN): "Still correct" / "Outdated", one-line note, in-place confirmation, no modal/account; dedupe + rate-limit states; accepted outdated → `badge-flagged` pending review; error state never silently succeeds. Both verdicts present (PRD allows "verified" or "outdated"). |
| FR-10 Patch History / Deprecated Tech | **Covered** | Patch History block ordered ascending, `surface-sunken` well; deprecated = badge + full content, canonical URL, in search, never hidden (IA deprecation note, State Patterns, DESIGN Do's). |
| FR-11 Curated content authoring | **Covered (intentionally thin)** | Named in Foundation ("Content is curated repo files (FR-11)") and UJ-3 step 1. No editor-facing UI designed — matches PRD [ASSUMPTION: git is the CMS, no admin UI]. Schema-validation/build-failure behavior is architecture, not UX. |
| FR-12 Verification Sweep support | **Partial** | UJ-3 flow covers the sweep outcomes (badges refreshed, no flag older than one Patch Cycle). **No designed surface** for flag-age audit/backlog viewing (explicitly deferred: "depends on the FR-9 mechanism chosen in architecture") — Gap 3. |

## 3. Qualitative brand / trust promises (IA-table-silent items)

| Promise (PRD source) | Status | Evidence / gap |
|---|---|---|
| Freshness-first: "badge is the product," stamp visible without clicking (§1 vision, §4.4) | **Covered** | DESIGN Brand & Style ("Nothing decorative competes with the freshness badge"); Inspiration "freshness-first… can he see the stamp without clicking?"; entry-card footer badge always visible (Component Patterns). |
| Trust signals consistent across View 1 and View 2 (addendum UX Handoff) | **Covered** | Single `badge-verified/flagged/deprecated` component set applied on cards, interaction detail, and guidance detail (IA + Component Patterns). |
| Honest, non-hyped voice: "trusted scout," never self-hypes accuracy (§1, §2.1 emotional JTBD) | **Covered** | EXPERIENCE Voice & Tone table (do/don't strings, "the badge does that"); anti-pattern "account nags" and hype rejects. |
| Tone: gamer-fluent without try-hype; precision-instrument, anti-edgelord (brief brand) | **Covered** | DESIGN Brand & Style ("gaming peripheral config panel," rejects neon/glitch); Inspiration anti-patterns ("edgelord gamer chrome"). |
| Scannable in ~10s under time pressure, phone-first (SM-3, §2.1) | **Covered** | DESIGN Brand & Style + Layout ("scannable in under ten seconds: cards over prose"); EXPERIENCE Foundation inherits SM-3; Responsive table "phone is a first-class lookup surface." |
| Emotional JTBD: act without second-guessing staleness | **Covered** | Badge-on-card always visible; flagged/deprecated states readable without color (UJ-1 edge). |
| **Social JTBD / vision: content creators cite a patch-stamped source (§2.1 Social, §1)** | **Partial** | Only canonical deep links + `?q=` shareability (Interaction Primitives: "shareable from Discord"). **No designed citation affordance** — no copy-link/copy-cite control, no patch-stamped snippet card for embedding/quoting (Gap 2). |
| Deprecated interactions stay visible as history (§1 vision) | **Covered** | FR-10 treatment throughout both spines. |
| "Hand-verified" manual verification is the product promise (addendum) | **Covered** | Voice table + badge language; no automated-ingestion UI implied anywhere (consistent with PRD rejection). |
| Non-goals discipline: no stats/builds/wiki/accounts (§5) | **Covered** | Inspiration & Anti-patterns explicitly rejects stat dashboards, wiki walls, account nags; no such surfaces in IA. |
| Secondary audiences served, not optimized (§9) | **Covered (n/a)** | No conflict; nothing in spines optimizes for them at the expense of beachhead. |

## 4. Accessibility constraint — WCAG 2.1 AA

| Aspect | Status | Evidence |
|---|---|---|
| AA as binding floor | **Covered** | EXPERIENCE Accessibility Floor ("WCAG 2.1 AA, memlog"); DESIGN tokens marked AA. |
| Contrast | **Covered** | Body ≥7:1, badge foregrounds ≥4.5:1 on tints; `text-muted` restricted to non-essential caption helper text (DESIGN Colors; Do's table). |
| Non-color status | **Covered** | Icon + word + color on every badge; grayscale test lock (Accessibility Floor, DESIGN Do's, memlog). |
| Screen readers | **Covered** | Badges announce full phrases; `aria-live` for search counts, flag confirmation, flagged-state change. |
| Keyboard / focus | **Covered** | Focus order per surface, accent focus ring, `/` `Enter` `Esc` search keys, Tab-only operability, Esc closes sheet, no focus traps (Interaction Primitives, Accessibility Floor). |
| Reduced motion | **Covered** | `prefers-reduced-motion` collapses skeletons/badge/sheet animations; no motion carries meaning. |
| Touch targets | **Covered** | ≥44×44px on all controls (mobile-first, UJ-1 phone entry). |

No WCAG 2.1 AA gaps found.

## 5. Gaps (for finalize)

1. **Gap 1 — FR-4 / FR-8 "stale relative to current Patch" has no designed state (partial).** PRD requires records verified under an older patch be *visually distinguishable* and *marked stale*; spines resolve this with the identical green badge where only the mono patch number differs ("patch number does the work, same green" — EXPERIENCE Badge states). At glance-speed (the product's core promise) an old-patch record reads as verified. Needs either an aged/`stale` badge treatment, a current-vs-not indicator, or an explicit PRD-accepted rationale recorded.
2. **Gap 2 — Content-creator citation promise (§2.1 Social JTBD, §1 vision) is only partially served (partial).** Coverage stops at shareable canonical URLs; no copy-cite/copy-link control or patch-stamped snippet designed, so the "cite a patch-stamped source" job has no first-class affordance.
3. **Gap 3 — FR-12 flag-age auditability / Flag Backlog surface is undesigned (partial).** UJ-3 states the climax but the spine has no surface (even a repo/file-oriented sketch) where flag age and backlog are visible; PRD defers this to the FR-9 architecture choice, but UX currently carries zero coverage of the auditability promise SM-2 depends on.
4. **Note (non-gap) — FR-11 depth is intentionally thin** (git-as-CMS, no admin UI per PRD assumption); acceptable, but worth an explicit one-line acknowledgment at finalize so it isn't read as an omission.

## 6. Input → spine coverage tally

- UJs: 3/3 covered (UJ-3 thin-by-design).
- FRs: 9/12 covered, 3 partial (FR-4, FR-8 stale sub-claim, FR-12), 0 dropped.
- Qualitative promises: 10 covered, 1 partial (creator citation), 0 dropped.
- Accessibility (WCAG 2.1 AA): fully covered, 0 gaps.
