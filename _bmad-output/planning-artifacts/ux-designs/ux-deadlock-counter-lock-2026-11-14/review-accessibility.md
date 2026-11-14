# Accessibility Review (WCAG 2.1 AA) — Counterlock

- **Targets:** `DESIGN.md` (tokens) + `EXPERIENCE.md` (behavior), same folder
- **Standard:** WCAG 2.1 Level AA (locked constraint — PRD §6.1, memlog "Accessibility floor" decision)
- **Method:** behavioral audit of EXPERIENCE.md specs + computed contrast ratios of every DESIGN.md frontmatter color pair (sRGB relative luminance)
- **Run at:** 2026-11-14

## Verdict

**PASS WITH FINDINGS.** The behavioral floor is genuinely strong — non-color badge status, reduced motion, focus ring, keyboard map, and screen-reader announcement rules are all committed — but one explicit token pairing fails AA contrast (1.4.3) on the product's primary input, and three spec-level gaps (control boundaries, icon-button names, tap-target reconciliation) would each fail or weaken an audit. All are fixable at the token/spec level without redesign.

**Counts:** 0 critical · 1 high · 4 medium · 6 low

## Contrast results (computed)

| Foreground | Background | Ratio | AA (4.5:1 text) |
|---|---|---|---|
| `text` #E9ECF4 | `background` / `surface` | 16.34 / 15.31 | pass (≥7:1 claim ✓) |
| `text-secondary` #A0A8BC | `background` / `surface` / `surface-raised` | 8.11 / 7.60 / 6.82 | pass |
| **`text-muted` #737C91** | **`surface`** | **4.33** | **FAIL** |
| **`text-muted` #737C91** | **`surface-raised`** | **3.88** | **FAIL** |
| **`text-muted` #737C91** | **`accent-dim`** | **3.64** | **FAIL** |
| `text-muted` #737C91 | `background` / `surface-sunken` | 4.62 / 4.76 | pass (marginal) |
| `accent` #4CC2FF (focus ring) | `background` / `surface` / `surface-raised` | 9.63 / 9.02 / 8.09 | pass 3:1 non-text ✓ |
| `accent-foreground` on `accent` | — | 9.56 | pass |
| `status-verified` on its tint | `#0E2A1C` | 8.82 | pass |
| `status-flagged` on its tint | `#2B2109` | 9.50 | pass |
| `status-deprecated` on its tint | `#2A1518` | 6.84 | pass |
| status fg on `background`/`surface` | — | 7.66–11.57 | pass (DESIGN:151 claim ✓) |
| **`border` #252C3B** | `background` / `surface` | **1.38 / 1.29** | **FAIL 3:1 (1.4.11)** |
| **`border-strong` #39435A** | `background` / `surface` | **1.95 / 1.83** | **FAIL 3:1 (1.4.11)** |
| `surface` fill vs page | `background` | ~1.07 | input fill indistinguishable from page |

## Findings

### High

- **[high] `text-muted` fails 1.4.3 AA on `surface` (4.33:1) — and it's specced onto the primary input's placeholder.** `components.search-field` sets placeholder in `text-muted` on `surface` (DESIGN.md:184); roster tiles put the FR-7 "no entries yet" line in `text-muted` on `surface` (DESIGN.md:185); `text-muted` on `surface-raised` (hover) is 3.88 and on `accent-dim` (selected) 3.64. DESIGN.md:149's carve-out — "permitted only for non-essential helper text at caption size" — has no basis in WCAG: placeholder text and status helper text are text, and size doesn't exempt them. The site claims AA as a locked constraint, so this is a conformance break, not a taste call. *Fix:* lighten `text-muted` to ≥4.5:1 on the worst specced pairing (needs ≈#8A93A8+ against `surface`), or restrict `text-muted` usage to `background`/`surface-sunken` only and move placeholder + "no entries yet" to `text-secondary`.

### Medium

- **[medium] Control boundaries fail 1.4.11 non-text contrast (3:1).** `border` is 1.38:1 and `border-strong` 1.95:1 against both `background` and `surface`; the search field's `surface` fill sits at ~1.07:1 against the page, so the field is identified almost entirely by its sub-3:1 border (DESIGN.md:184 reserves `border-strong` "for focus-adjacent or input edges" — but its value fails). Focus rings and the accent border are fine (9:1+); it's the passive component/state boundaries that fall short. *Fix:* raise `border-strong` to ≥3:1 vs `background` and `surface` for input/control edges (keep `border` as the decorative card hairline if desired, but inputs need the compliant edge).
- **[medium] Icon-only controls have no specified accessible names.** Mobile nav renders "search + menu glyphs" (DESIGN.md:187) with no `aria-label`/visually-hidden text anywhere in either spine; badge glyphs (✓ / ! / ✕, DESIGN.md:183) have no stated SR handling — EXPERIENCE.md:93 says badges "announce as complete phrases," which implies the glyph must be `aria-hidden` or the phrase composed, but the mechanism is unstated. *Fix:* add to Accessibility Floor: icon buttons carry `aria-label` ("Search", "Menu"); badge glyphs are decorative (`aria-hidden="true"`), announcement comes from the word + patch text.
- **[medium] Tap-target specs conflict across the two documents.** EXPERIENCE.md:82 promises "all controls ≥44×44px on touch — roster tiles, flag buttons, badge-linked history rows," but DESIGN.md gives `badge` padding `4px 10px` with `mono-sm` at 11px/1.3 → ≈22px tall, and `flag-control` has no padding or min-height at all (DESIGN.md:125–129) → renders at text height ≈18–24px. The spine currently lets an implementer satisfy DESIGN and violate EXPERIENCE. (44px exceeds WCAG 2.1's own bar — the target-size requirement is AAA in 2.1 — but it's the committed floor, so the specs must agree.) *Fix:* give `flag-control` a min-height (e.g., `{spacing.7}`/48px hit area) and state that interactive badge/history rows expand to ≥44px independent of the badge's visual padding.
- **[medium] No bypass/landmark mechanism specified (2.4.1).** Focus order is defined (EXPERIENCE.md:92: nav → search → browse grid) but nothing addresses skipping the repeated nav block, and no `nav`/`main`/`footer` landmark roles are named anywhere. With a 3-destination bar the Tab cost is small, but the repeated block exists on every route and AA audits check this. *Fix:* add a skip-to-content link + landmark roles to the Accessibility Floor.

### Low

- **[low] Loading skeletons have no screen-reader treatment.** State Patterns:70 specifies visual skeletons (`surface-raised` blocks) but no `aria-busy`, `role="status"`, or "Loading" announcement — SR users get silence on roster/hero/search loads. *Fix:* one line in Accessibility Floor covering skeleton announcement.
- **[low] `aria-live` coverage is narrower than the state set.** EXPERIENCE.md:93 announces flag *confirmation* and search counts, but the dedupe notice, rate-limit notice, and submit-error swap (State Patterns:75–77 — all in-place control replacements) are not named. *Fix:* extend the rule to "all flag-control state swaps announce via `aria-live="polite"`."
- **[low] FR-4 old-vs-current patch distinction relies on numeric comparison alone.** EXPERIENCE.md:60 commits to "same green, patch number does the work" — distinguishable in principle (plus the site-wide current-patch stamp), but nothing non-numeric (a word like "stale," a mono suffix) cues a user that a green badge is from an older patch; easy to miss under time pressure, and the stamp location is itself an assumption (header desktop / footer mobile, EXPERIENCE.md:32). *Fix:* consider a pattern like `✓ VERIFIED · 7.1 (current 7.2)` or an explicit stale marker at copy pass.
- **[low] Selected-state indication is color+tint only.** Selected roster/counterpart tiles use `accent-dim` + accent border (EXPERIENCE.md:57); tint vs `surface` is ≈1.19:1 and no `aria-selected`/`aria-pressed` or check glyph is specified — 1.4.1 wants a non-color cue for state. *Fix:* pair selection with `aria-pressed`/`aria-current` and a non-color marker (e.g., accent underline, matching the nav pattern at DESIGN.md:187).
- **[low] EXPERIENCE.md:96 attributes badge-on-tinted-surface contrast verification to DESIGN.md, which doesn't state those numbers** (DESIGN.md:151 claims background/surface only). The tinted-surface ratios do pass (8.8/9.5/6.8) — the finding is claim provenance, not failure. *Fix:* state the tinted-surface contrast in DESIGN Colors.
- **[low] No explicit reflow statement (1.4.10).** Single-column mobile-first + "nothing bleeds to the device edge" (DESIGN.md:170) implies 320px reflow, but no breakpoint floor or horizontal-scroll prohibition is written down for the responsive table (EXPERIENCE.md:138–142). *Fix:* one line: "no horizontal scroll at 320px CSS width."

## What's working (verified, not assumed)

- **Non-color status (1.4.1):** every badge = icon + word + color (DESIGN.md:151,183; EXPERIENCE.md:94 with grayscale-test lock) — words differ ("VERIFIED" / "FLAGGED OUTDATED" / "DEPRECATED"), glyphs differ (✓/!/✕). Grayscale-distinguishable ✓.
- **Focus visibility (1.4.11 / 2.4.7):** `2px solid {colors.accent}` + 2px offset (DESIGN.md:174), 9.0–9.6:1 against all surfaces, specified as visible on all surfaces (EXPERIENCE.md:92), never shadow-based ✓.
- **Keyboard (2.1.1):** `/` focus, `Enter` submit, `Esc` clear-query + close menu sheet, optional arrow-walk explicitly assumption-tagged as non-blocking, "full site operable by Tab only," no focus trap on detail pages, no focus order violations in declared order (EXPERIENCE.md:83–84,92) ✓.
- **Screen readers (4.1.3):** badges announce as complete phrases; flag confirmation + result counts + flagged-state change on `aria-live="polite"` (EXPERIENCE.md:93) ✓.
- **Reduced motion (2.3.3 AAA / animation):** `prefers-reduced-motion` collapses skeleton shimmers, badge transitions, sheet animations; "no motion carries meaning" (EXPERIENCE.md:95); autoplay motion and hover-only touch affordances banned (:86) ✓.
- **Contrast claims that were checked are accurate:** body ≥7:1 (actual 15.3+), badge AA on background/surface (actual 7.7–11.6), badge fg ≥4.5 on tints (actual 6.8–9.5) ✓ — the only inaccurate/understated claim is the `text-muted` exemption.
- **Error identification (3.3.1):** plain-language error copy for flag submit and page errors, no jargon/stack traces (EXPERIENCE.md:77–78) — though color treatment is unspecified (see rubric §2 finding).
