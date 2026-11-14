# Spine Pair Review — Counterlock

- **DESIGN.md:** `_bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/DESIGN.md`
- **EXPERIENCE.md:** `_bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/EXPERIENCE.md`
- **Cross-checked against:** PRD `prd-deadlock-counter-lock-2026-11-14/prd.md`, `references/design-md-spec.md`, `references/validate.md` Pass 1–2
- **Run at:** 2026-11-14

## Overall verdict

**PASS WITH FINDINGS.** Both spines are structurally sound: canonical section order is intact, all 3 UJs and all 12 FRs are traceable, every `{path.to.token}` reference resolves to a real frontmatter token, and no critical or high severity gaps exist. The findings are concentrated in two component/state coverage holes (Patch History visual spec, detail-page cold-load) and one dangling cross-document claim (error styling), all fixable without restructuring.

**Finding counts:** 0 critical · 0 high · 3 medium · 8 low

## 1. Flow coverage — strong

Checked: `sources` frontmatter → PRD §2.3 UJs and §4 FRs; verified each has flow-level or pattern-level coverage in EXPERIENCE.md.

- **UJ-1** (EXPERIENCE.md:100–108) — named protagonist (Marcus), 6 numbered steps, climax beat ("badge reads verified as of patch X.Y… one page, one truth"), edge/degradation path (flagged badge → suspect/skip). Matches PRD UJ-1 including its edge case.
- **UJ-2** (EXPERIENCE.md:110–118) — Priya, numbered steps, climax (in-place confirmation, no account), failure paths: dedupe edge (:118) plus dedicated error/dedupe/rate-limit states in State Patterns (:75–77). Matches PRD UJ-2.
- **UJ-3** (EXPERIENCE.md:120–125) — Editor, numbered steps, climax (zero stale badges). No failure path — PRD UJ-3 defines none either; N/A.
- **FR-1…FR-12** — all 12 referenced in EXPERIENCE.md (grep: FR-1×3, FR-2×5, FR-3×3, FR-4×3, FR-5×4, FR-6×3, FR-7×4, FR-8×4, FR-9×7, FR-10×7, FR-11×2, FR-12×3), distributed across IA table (:22–30), Component Patterns (:57–64), State Patterns (:70–78), and Interaction Primitives (:82–86). DESIGN.md cites load-bearing FRs (FR-1,2,3,4,7,8,9,10) where visual rules depend on them. SM-3 inherited and explicitly not restated (Foundation:16) — correct inheritance discipline.

### Findings
- **low** UJ heading titles paraphrase PRD §2.3 names ("Marcus's 30-second pre-game check" vs PRD "Marcus checks the matchup 30 seconds before hero select locks in") — identifiers `UJ-1/2/3` are verbatim so traceability holds (EXPERIENCE.md:100,110,120 vs PRD §2.3). *Fix:* optional copy-pass alignment to PRD wording.

## 2. Token completeness — strong

Checked: every frontmatter token against `design-md-spec.md` type rules; every `{path.to.token}` in both files (34 unique in DESIGN.md, 11 in EXPERIENCE.md).

- All `colors` values are hex strings ✓; all `typography` entries are objects with the allowed keys ✓; `rounded`/`spacing` scales well-formed ✓; `components` entries map to values or `{path.to.token}` refs ✓.
- Dark-only (no light/dark pair) is a recorded memlog decision (DESIGN.md:9,142) — spec permits single-mode files; not a miss.
- **All cross-references resolve:** every `{colors.*}`, `{typography.*}`, `{rounded.*}`, `{spacing.*}` used in either file exists in DESIGN.md frontmatter, including EXPERIENCE's `{colors.accent-dim}` (:57), `{typography.headline}` (:71), `{spacing.max-content}` (:142).
- Contrast targets stated for load-bearing combinations (DESIGN.md:149 body ≥7:1; :151 badge AA; EXPERIENCE.md:96 floor).

### Findings
- **medium** **Dangling error-treatment claim.** DESIGN.md:154 says "errors are text + border per State Patterns," but State Patterns (EXPERIENCE.md:77–78) specifies copy only — no error color token exists in frontmatter and no text/border color is named anywhere. A downstream consumer must invent error styling (and could pick a red fill that DESIGN itself bans). *Fix:* name the treatment explicitly (e.g., `{colors.text-secondary}` text + `{colors.border-strong}` border) or add a `status-error` token pair.
- **low** Unbraced token mentions in prose won't resolve for a mechanical extractor: DESIGN.md:160–162 (`label`, `caption`, `headline`, `mono-sm` bare next to braced siblings) and EXPERIENCE.md:32 (`typography.mono` bare). *Fix:* wrap all in `{}`.
- **low** EXPERIENCE.md:96 attributes "badge foregrounds ≥4.5:1 on their tinted surfaces" verification to DESIGN.md, but DESIGN.md:151 only claims AA on `background`/`surface`. (Numbers do pass on tints — 8.8 / 9.5 / 6.8 — but the stated claim isn't where EXPERIENCE says it is.) *Fix:* state tinted-surface contrast in DESIGN Colors.
- **low** `'{q}'` in copy template "No matches for '{q}'" (EXPERIENCE.md:72) matches `{path.to.token}` syntax and will surface as an unresolved reference to any resolver scanning both files. *Fix:* use a different placeholder delimiter in the string template.

## 3. Component coverage — adequate

Checked: every component name used in either spine against DESIGN.md Components (visual) and EXPERIENCE.md Component Patterns (behavioral).

| Component (EXPERIENCE behavior) | DESIGN visual spec | Verdict |
|---|---|---|
| Hero-first browse / Roster grid | `components.hero-roster-tile` + prose (:185) | ✓ |
| Free-text search | `components.search-field` + prose (:184) | ✓ |
| Entry card | `components.entry-card` + prose (:182) | ✓ |
| Badge states (3) | `components.badge*` + prose (:183) | ✓ |
| Patch History block (EXPERIENCE.md:61) | **no Components row, no `components.*` entry** — only incidental `surface-sunken` mention (DESIGN.md:148) | ✗ |
| Flag control | `components.flag-control` + prose (:186) | ✓ |
| Navigation (+ mobile menu sheet) | `components.navigation` + prose (:187); sheet has behavior (EXPERIENCE.md:92) but no visual spec | partial |
| Site-wide current-Patch stamp (EXPERIENCE.md:32, FR-8) | none — inline `text-muted` + `typography.mono` only | ✗ |

### Findings
- **medium** **Patch History block has no visual spec.** Full behavioral contract exists (ordered ascending, `surface-sunken` well, mono rows, explicit "no recorded changes", deprecated rows kept visible) but DESIGN.md.Components gives it no row and frontmatter no `components.patch-history` entry — row dividers, well padding, header treatment, and the empty-history styling are all unsourced. *Fix:* add a `components.patch-history` frontmatter entry + Components bullet.
- **low** Component name drift across spines: DESIGN "Badge / chip" (:183) vs EXPERIENCE "Badge states" (:60); DESIGN "Search field" vs EXPERIENCE "Free-text search"; DESIGN "Hero roster grid" vs EXPERIENCE "Hero-first browse"/"Roster grid". *Fix:* one canonical name per component, used in both files.
- **low** Mobile menu sheet appears in both spines (DESIGN.md:187 "single-level sheet"; EXPERIENCE.md:92 "Esc closes") with zero visual spec (background, radius, animation/reduced-motion behavior). *Fix:* sub-spec under `components.navigation` or its own entry.
- **low** Site-wide current-Patch stamp (IA:32 — load-bearing for FR-8 and for FR-4's old-vs-current distinguishability) has no component row. *Fix:* add `components.patch-stamp` (or note it's `typography.mono` + `{colors.text-muted}` in Components).

## 4. State coverage — adequate

Walked all 9 IA surfaces (IA table :20–30) against applicable states (cold-load, empty, focus, error, offline, permission-denied).

- **Covered:** loading/skeleton for roster, home/search, hero page (:70); empty — zero-entry hero (:71), zero search matches (:72); flag lifecycle — confirmation, deduped, rate-limited, submit error (:73–77); deprecated (:74); flagged-pending (:73); page/route error (:78, "any route"); focus (Accessibility Floor :92) + hover (DESIGN Elevation/Components); missing Patch History (:61).
- **N/A with cause:** offline (static/SSR site, browser-level) and permission-denied (no auth layer anywhere — PRD §5) — correctly absent, not missed.

### Findings
- **medium** **Detail pages have no cold-load state.** State Patterns:70 scopes loading to "Roster, hero page, search" — interaction/guidance detail (IA:25–26) is excluded, yet it is UJ-1's climax surface (EXPERIENCE.md:105) and carries the most content (badge, conditions, history, flag control). *Fix:* add detail pages to the Loading row (skeleton: badge → conditions → history → flag).
- **low** `/archetypes` index (IA:27) has no surface-specific state row; loading/error are only implicitly inherited. *Fix:* one-line note "shared loading/error" or fold into the Loading row.

## 5. Visual reference coverage — strong (nothing to cover)

- `mockups/` and `wireframes/` do not exist; `imports/` exists but is **empty** (0 files). Zero orphans, zero unspecific references, no spines-win-on-conflict statement needed (nothing to conflict with).

### Findings
- **low** Empty `imports/` directory is a dead artifact in the doc workspace. *Fix:* remove it, or populate at copy pass and link inline per spec.

## 6. Bloat & overspecification — strong

EXPERIENCE.md is table-first (IA, Component Patterns, State Patterns, Responsive all tables); prose appears only in Foundation, Voice (a Do/Don't table), and UJ narratives — appropriate. DESIGN.md carries editorial voice as the spec permits, but every decorative sentence ties to a decision (edgelord-rejection → anti-pattern, mono-as-fact → typography rule). No pixel specs outside frontmatter tokens (the `2px solid` focus ring at DESIGN.md:174 is load-bearing, not overspec). No persona/FR/scope restatement — PRD §6.1/§5/SM-3 are cited as inherited, not re-narrated (Foundation:16). UJ-3 is brief and editor-scoped, matching PRD. No sections a downstream consumer would skip.

## 7. Inheritance discipline — strong

- `sources` frontmatter resolves: PRD path ✓ (file exists), brief path ✓ (`briefs/brief-deadlock-counter-lock-2026-11-13/brief.md` exists; sibling `addendum.md` not cited — fine).
- UJ identifiers `UJ-1/2/3` and FR ids `FR-1`…`FR-12` verbatim from PRD ✓; memlog decisions cited ("memlog") match `.memlog.md` entries (form factor, Tailwind-4-no-library, dark-first deferral, AA floor, `/archetypes` gap-fix, patch stamp) ✓.
- Glossary consistent across both spines and PRD: Interaction Record, Matchup Guidance, Archetype Warning, Entry, Patch Verification Badge, Patch History / Deprecated Tech, Flag, Flag Backlog, Verification Sweep, Patch Cycle — no drift found.
- All 11 EXPERIENCE token references resolve to DESIGN.md tokens by name ✓ (see finding under §2 for the unbraced/bare mentions).

### Findings
- **low** Component-name drift (§3) is the only inheritance blemish; unbraced refs (§2) are the only mechanical cross-ref blemish — both listed above, not duplicated.

## 8. Shape fit — strong

- **DESIGN.md:** all 8 canonical sections present in exact order — Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts ✓. Frontmatter has required `name` + `description` ✓.
- **EXPERIENCE.md:** all 8 required defaults present — Foundation, Information Architecture, Voice and Tone, Component Patterns, State Patterns, Interaction Primitives, Accessibility Floor, Key Flows ✓. Required-when-applicable: Inspiration & Anti-patterns ✓ (earned — sources show Tracklock/wiki/edgelord rejections); Responsive & Platform ✓ (multi-breakpoint, mobile-first UJ). No invented sections; no dropped defaults.
- No Mermaid anywhere (nothing to syntax-check).

### Findings
- **low** Both files carry `status: draft` — expected at a finalize-gate input, noted only so the gate flips it deliberately post-acceptance.

## Mechanical notes

- Frontmatter completeness: DESIGN.md (title/status/created/updated/name/description) ✓; EXPERIENCE.md (title/status/created/updated/name/sources) ✓ — DESIGN.md has no `sources` key (spec doesn't require it; optional improvement for traceability of memlog-derived decisions).
- Non-token `{...}` matches in EXPERIENCE.md: `{planning_artifacts}` (intentional workspace placeholder ✓) and `{q}` (copy template — flagged in §2).
- DESIGN.md:182,184 etc. reference `components.entry-card` as backticked dotted paths without `{}` — acceptable pointer-to-component convention, but inconsistent with the `{path}` token syntax; a strict extractor treats them as plain text (harmless).
- Grep-verified: all 12 FR ids present in EXPERIENCE.md; 8 of 12 cited in DESIGN.md (only where visual rules bind to requirements) — appropriate, not a miss.
- No broken cross-references, no name collisions between the two files' frontmatter, no duplicate YAML keys.

---

**Summary:** overall PASS WITH FINDINGS — §1 strong, §2 strong, §3 adequate, §4 adequate, §5 strong, §6 strong, §7 strong, §8 strong; 0 critical, 0 high, 3 medium, 8 low.
