# PRD Quality Review: Counterlock (prd-deadlock-counter-lock-2026-11-14)

Reviewed against `.agents/skills/bmad-prd/assets/prd-validation-checklist.md`, walking `prd.md` + `addendum.md`. Calibrated to hobby/solo stakes, chain-top position (feeds UX → architecture → epics/stories → sprint planning).

## Overall verdict

**PASS WITH FINDINGS.** The PRD has a real thesis (per-patch verified counterplay truth), states its decisions as decisions with named trade-offs (git-as-CMS, curated+flags vs. wiki, rejected alternatives in the addendum), carries a clean FR/UJ/SM ID system with resolvable cross-references, and pairs its success metrics with genuine counter-metrics, well above the bar for a hobby PRD. What's at risk for downstream is done-ness at the edges: FR-12/SM-2's acceptability quietly depends on an architecture decision where one listed option cannot satisfy it, View 2 (FR-6) has navigation-only acceptance with no corpus commitment, and the performance bound is scoped narrowly enough to miss the product's core "in seconds" promise.

## Decision-readiness: strong

Decisions are stated as decisions, not buried: git-as-CMS (§4.5 FR-11), manual Verification Sweep by design (§6.2, addendum), flag transport deferred with an explicit preference (§4.4 FR-9, addendum "Preference: API route → simple store"). Trade-offs are named with what was given up, the addendum's "Rejected Alternatives" section gives real rationale for dropping CMS, open submissions, stat overlays, and automated patch ingestion, including the honest "manual sweep is the product promise" framing. Open Questions (§8) are genuinely open, all three marked non-blocker with defaults ("default manual"), and none are rhetorical. The one `[NOTE FOR PM]` (§6.2, monetization) sits at a deferred-decision checkpoint, which is appropriate rather than safe. The one soft spot is that a *preference* is doing the work of a *constraint* (see high finding below).

### Findings
- **high**: FR-12/SM-2 acceptability contingent on undecided flag mechanism (§4.4 FR-9, §4.5 FR-12 Notes, §7 SM-2; addendum "Flag Mechanism Options"), SM-2 ("zero Flags older than one Patch cycle unreviewed") and FR-12's testable consequence require an auditable, queryable flag backlog, but the PRD only *prefers* the API-route option. The Discord webhook option, attractive for a hobby project (free, community-native), is acknowledged in the addendum as "hard to audit/age flags," i.e, structurally unable to satisfy a Primary success metric, yet nothing in `prd.md` disqualifies it. Downstream architecture could pick it and silently break SM-2. *Fix:* promote the preference to a constraint in FR-12 ("flag store must support querying flag age/ordering") or drop Discord from the option set; one sentence.

## Substance over theater: strong

No persona theater: Marcus, Priya, and the editor each drive concrete FRs (UJ-1→FR-1/2/3, UJ-2→FR-9, UJ-3→FR-11/12), and all three have entry states, climax, and edge cases. Vision (§1) is specific and category-bound, "is this still true *this patch*?", not swappable boilerplate; the differentiation claim is narrow and tied to the brief's market scan. NFR content is minimal and product-specific (100ms warm-load render bound, WCAG 2.1 AA, kebab-case constraints in §6.1) rather than scalable/secure/reliable boilerplate. The addendum's rejected-alternatives rationale reads as earned, not templated. No findings.

## Strategic coherence: strong

The thesis is stated (§1: own the question of patch-current counterplay truth) and the feature arc follows from it: View 1 lookup, View 2 guidance, and the Trust & Freshness system (§4.4, explicitly "the differentiator") all serve that thesis; the non-goals (§5) are precisely the adjacent features that would dilute it. Success metrics validate the thesis rather than pure activity: SM-1 corpus, SM-2 sweep completion, SM-3 task speed, and counter-metrics SM-C1 (corpus vs. freshness) and SM-C2 (flag volume vs. trust) are real "do not optimize" guards with named counterparts, which is rare at any stakes. SM-4 ("returning players across at least two Patch cycles") is the weakest SM, activity-flavored and unquantified, but it is honestly assumption-indexed as deferred until post-launch data. MVP scope kind is coherent: an experience/problem-solving MVP with a light platform tail (repo content pipeline), matching the solo-builder shape.

### Findings
- **low**: SM-4 lacks a concrete shape (§7 Secondary), "returning players across at least two Patch cycles [ASSUMPTION]" gives story/test authors nothing to check even post-launch. *Fix:* add a placeholder threshold format now ("N returning players, target set post-launch") or explicitly mark SM-4 as observational, not gateable.

## Done-ness clarity: adequate

This is the dimension downstream story creation leans on hardest, so holding it to the unforgiving standard: all twelve FRs have explicit "Consequences (testable)" blocks, a structural win, and most are genuinely verifiable (FR-1's record-render condition, FR-3's "no recorded changes" state, FR-7's "no entries yet, not 404", FR-8's badge pattern, FR-10's deprecated retrievability). The gaps are at the edges: FR-6's only consequence is navigation depth ("reachable within two navigations") with no content existence bound; FR-12's consequences are editorial behavior, not software behavior, and lean on an undefined unit ("one Patch cycle"); FR-9's acceptance is disjunctive and soft; and FR-1's latency bound is scoped to warm loads *after* data availability, which can mask the cold-load experience the JTBD ("in seconds," 30 seconds before hero select) actually depends on.

### Findings
- **medium**: Performance bound misses the core promise (§2.1 JTBD vs. §4.1 FR-1), "within 100ms of page data being available on a warm load" is testable but excludes cold load, route navigation, and data fetch; a site could pass FR-1 while failing the "in seconds" job. *Fix:* add one end-to-end bound (e.g, cold-load LCP or hero-page interactive < X s on a mid-tier connection) to FR-1 or FR-2.
- **medium**: FR-6 has navigation-only acceptance and no corpus commitment (§4.2 FR-6, §7 SM-1), "reachable within two navigations" verifies the link graph, not that lane matchup guidance exists. SM-1's launch corpus ("25–40 badged Interaction Records + Archetype Warnings") omits lane guidance entirely, so View 2's second feature could ship empty while SM-1 still passes. *Fix:* add an FR-6 consequence ("seeded heroes render at least one lane guidance entry, or an explicit 'no guidance yet' state") and/or include lane guidance in SM-1's count.
- **medium**: FR-12 acceptance is editorial, not software, and "one Patch cycle" is undefined (§4.5 FR-12, §3 Glossary "Patch"), an engineer cannot verify "no Flag older than one Patch cycle remains unreviewed" without tooling the PRD doesn't require, and the Glossary defines Patch as a version, not a duration. *Fix:* define the cycle (e.g, "the interval between official Deadlock patches") and, if the criterion is to be testable, require a flag-age indicator in the backlog view (ties to the high finding above).
- **medium**: FR-9 acceptance is disjunctive and soft (§4.4 FR-9), "rate-limited **or** deduped" lets either count as done, and "reliably reach the Flag Backlog" has no bound; "transport/storage mechanism is deferred" is fine, but the outcome guarantee shouldn't be. *Fix:* specify the outcome invariant independent of mechanism (e.g, "a second identical flag from the same entry within N minutes does not create a second backlog item; every accepted flag is visible in the backlog within one deploy cycle").
- **low**: FR-2 zero-result and ambiguity behavior unspecified (§4.1 FR-2), the consequence names one happy-path query ("Knockdown") but not what happens for no matches or ambiguous terms (hero vs. ability vs. item). *Fix:* one consequence line: "zero-result queries render a designed empty state suggesting related heroes/abilities."

## Scope honesty: strong

The Non-Goals section (§5) does real work, seven bullets that each defend against a specific feature someone would otherwise assume, and §6.2 mirrors them as MVP exclusions with rationale ("Tracklock's turf, "repo files suffice at 25–40 records"). Inline `[ASSUMPTION]` tags appear at every genuine inference (FR-9, FR-11 ×2, FR-12, SM-3, SM-4) and all are indexed in §9. Open-items density is low and proportionate: 3 open questions, all explicitly non-blocking, on a hobby green-light-to-build, appropriate, not a blocker. De-scoping (automated patch ingestion, admin UI) is proposed honestly with revisit triggers ("reassess if editorial load grows, "corpus exceeds ~100 records") rather than done silently. One structural note: the working title is still flagged "*confirm*" in the title line, an unclosed minor decision.

### Findings
- **low**: Assumptions Index roundtrip drift (§9): 5 of 9 index entries have no inline `[ASSUMPTION]` tag in the body (hero-first entry point, mid-core beachhead audience, §6.2 exclusions, brief secondary audiences), and the hero-first entry even says "now confirmed as requirement," making its index presence stale. Conversely, every inline tag *is* indexed (good direction). *Fix:* either tag those inferences inline or relabel §9 entries as "carried from brief (confirmed/standing decision)" so the index doesn't over-claim.
- **low**: Working title unconfirmed (title, line "*Working title, confirm.*"), a `[NOTE FOR PM]`-worthy open item left implicit. *Fix:* confirm or replace before finalize.

## Downstream usability: strong

Chain-top PRD, so this matters, and it holds up. Glossary (§3) has 11 terms, and every domain noun (Interaction Record, Matchup Guidance, Archetype Warning, Entry, Flag, Flag Backlog, Verification Sweep, Patch Verification Badge, Patch History / Deprecated Tech) is used identically across FRs, UJs, and SM definitions, no drift found. IDs are contiguous and unique: FR-1..12, UJ-1..3, SM-1..5, SM-C1/C2. All SM→FR cross-references resolve (SM-1→FR-1/5/7/8, SM-2→FR-9/12, SM-3→FR-1/2, SM-4→FR-4, SM-5→FR-9), and UJ realization tags land at section or FR level (§4.1→UJ-1, FR-9→UJ-2, §4.5→UJ-3). Each section is extractable standalone, FRs carry their own consequence blocks, and the addendum gives architecture (content model, flag options) and UX (trust-signal visual language, "no entries yet" states) handoff notes without requiring PRD re-reads. Not every FR traces to a UJ (FR-4, FR-8, FR-10 support UJ-1's climax implicitly but aren't tagged), minor, and SM coverage compensates.

### Findings
- **low**: UJ-3 protagonist is a role, not a name (§2.3 UJ-3): Marcus and Priya are named; "the editor" is role-only, breaking the pattern slightly. Acceptable for a solo-builder journey, but downstream UX may want a name for consistency. *Fix:* name the editor persona or note the deliberate exception.
- **low**: FR-4 and FR-8 lack UJ realization tags (§4.4), both are load-bearing for UJ-1's climax ("badge says verified as of patch X.Y"). *Fix:* add "Realizes UJ-1 (climax)" for traceability.

## Shape fit: strong

Hobby/solo + consumer lookup tool + chain-top: the shape is right. Three UJs with named protagonists is proportional (not over-formalized for a solo project, not absent for a user-facing product). SMs mix operational (SM-1, SM-2, builder-verifiable) and user-facing (SM-3, task-time), which matches the product. The capability-spec extras a solo tool needs (constraints locked in §6.1, editorial workflow as a first-class feature in §4.5) are present; there's no enterprise overhead (no NFR theater sections, no compliance traceability). Greenfield, so no brownfield UJ-distinction burden; the brief is correctly positioned as upstream input rather than re-derived. Addendum exists and is aimed at exactly the right consumers (architecture content model, UX handoff). No findings.

## Mechanical notes

- **Glossary drift:** none found, terms used consistently across §2, §4, §7.
- **ID continuity:** FR-1..12, UJ-1..3, SM-1..5/SM-C1..C2 all contiguous, unique; every SM→FR and section→UJ cross-reference resolves.
- **Assumptions Index roundtrip:** all inline `[ASSUMPTION]` tags (FR-9, FR-11 ×2, FR-12, SM-3, SM-4) are indexed; 5 index entries lack inline counterparts (see Scope honesty finding), partial drift, low.
- **UJ protagonist naming:** UJ-1 Marcus ✓, UJ-2 Priya ✓, UJ-3 role-only ("the editor"), minor.
- **Required sections present:** Vision, Target User (JTBD, non-users, UJs), Glossary, Features with testable consequences, Non-Goals, MVP Scope, Success Metrics with counter-metrics, Open Questions, Assumptions Index, all present and proportionate to stakes.
- **Minor copy:** §2.3 UJ-1 path "browses/bests vs. enemy archetypes", phrasing unclear (likely typo for "browses bests-vs" or "browses matchups vs"); clarify for UX handoff.
- **Status:** frontmatter still `status: draft`, finalize pass should flip this.

## Dimension verdicts summary

| Dimension | Verdict |
|---|---|
| Decision-readiness | strong |
| Substance over theater | strong |
| Strategic coherence | strong |
| Done-ness clarity | adequate |
| Scope honesty | strong |
| Downstream usability | strong |
| Shape fit | strong |

**Findings by severity:** critical 0 · high 1 · medium 4 · low 6
