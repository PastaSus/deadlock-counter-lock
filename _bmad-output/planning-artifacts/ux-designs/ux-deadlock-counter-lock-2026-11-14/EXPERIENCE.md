---
title: "EXPERIENCE.md: Counterlock"
status: final
created: 2026-11-14
updated: 2026-11-14
name: Counterlock
sources:
  - {planning_artifacts}/prds/prd-deadlock-counter-lock-2026-11-14/prd.md
  - {planning_artifacts}/briefs/brief-deadlock-counter-lock-2026-11-13/brief.md
---

# Counterlock: Experience Spine

## Foundation

Responsive web, mobile-first breakpoints, no separate app (memlog). Next.js 16 App Router + Tailwind CSS 4 custom components, no component library (memlog); `DESIGN.md` is the visual identity reference and owns all tokens; this spine owns behavior. Dark-first "precision-tool" aesthetic; light mode deferred (memlog). SEO-first static/SSR routes and the ~10s lookup target (SM-3) are inherited from PRD §6.1, not restated here. Content is curated repo files (FR-11); there is no account layer anywhere in the experience (PRD §5).

## Information Architecture

| Surface | Route | Reached from | Purpose |
|---|---|---|---|
| Home / lookup | `/` | Direct, Discord, search | Hero-first browse entry + free-text search co-equal above the fold (FR-1, FR-2) |
| Hero roster | `/heroes` | Nav, home | Full grid of every hero incl. zero-entry tiles (FR-7) |
| Hero page | `/heroes/[slug]` | Roster, home, search | That hero's Interaction Records + Matchup Guidance, counterpart-filterable (FR-1, FR-5, FR-6) |
| Interaction detail | `/interactions/[slug]` | Hero page, search, browse | Full record: source, target, effect, conditions, badge, Patch History, flag control (FR-3, FR-4, FR-8, FR-10) |
| Guidance detail | `/matchups/[slug]` | Hero page, browse | Archetype Warnings and lane matchup guidance with the same trust signals (FR-5, FR-6) |
| Archetype index | `/archetypes` | Footer, home | Thin list of archetype warnings grouped by archetype (FR-5 "by archetype" axis); each item links to its guidance detail |
| Search results | home with `?q=` [ASSUMPTION: query-param on home rather than a dedicated `/search` route] | Search field, `Enter` | Mixed results across Interaction Records and Matchup Guidance (FR-2) |
| Flag feedback | Inline on detail pages | Flag control | Confirmation / dedupe / rate-limit states in place (FR-9) |
| Empty states | Embedded in roster/hero/search surfaces | | "No entries yet" (FR-7), zero search matches, flagged-pending |

Deprecation does not get its own route: deprecated entries stay at their canonical URL and in search, labeled (FR-10). Navigation depth: any Interaction Record reachable from home within two navigations (FR-6 consequence pattern applies site-wide). Site-wide current-Patch stamp (mono, `{colors.text-muted}` with `{typography.mono}` role) sits in the header/footer on every route so visitors always know which patch the corpus is verified against (FR-8); it links to `/archetypes` for context, or to a footer note explaining badge freshness [ASSUMPTION: single stamp location; header on desktop, footer on mobile].

## Voice and Tone

Microcopy. Brand posture lives in `DESIGN.md` (Brand & Style). Counterlock talks like a trusted scout: plain, specific, patch-stamped, gamer-fluent without try-hype. It never hypes its own accuracy, the badge does that.

| Do | Don't |
|---|---|
| "verified as of patch X.Y" |"✅ VERIFIED & TRUSTED! 🎯" |
| "Community-flagged outdated, in review" | "This might be wrong (maybe)" |
| "Deprecated: see patch history" | "OUTDATED!!! don't use this" |
| "Flagged. Thanks, it's in the review queue." | "Flag submitted successfully! Account? 📧" |
| "No entries yet for Solomon." | "404: nothing here 😢" / "Coming soon!" |
| "Still correct" / "Outdated" (flag buttons) | "Report this entry for moderation review" |
| "Slow down, you've already flagged this recently." | "Error 429: rate limit exceeded" |
| Effect chips: `INTERRUPT` `GROUND` `SILENCE` | Sentence-case paragraphs for effect type |

[ASSUMPTION: exact strings above are provisional; tone is binding, wording is editable at copy pass.]

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md · Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Hero-first browse | Home, `/heroes` | Pick a hero (tile → hero page) is path #1; search is path #2, never demoted below fold (FR-1, FR-2). Selected tile uses `accent-dim` + accent border ({colors.accent-dim}). No modal hero picker, browsing is the navigation. |
| Free-text search | Home, nav (field: {components.search-field}) | Matches heroes, abilities, items, effect terms across Interaction Records *and* Matchup Guidance (FR-2). `aria-live` result count. Deprecated entries appear in results, labeled (FR-10). |
| Entry card | Hero page, search results | Whole card taps through to detail. Badge footer always visible, freshness is never behind a click (FR-4). Conditions preview truncates at sentence end only. |
| Badge / chip (badge states) | Every entry surface | `badge-verified` / `badge-stale` / `badge-flagged` / `badge-deprecated` ({colors.status-verified}, {colors.status-flagged}, {colors.status-deprecated}) with icon + word + color. Text pattern "verified as of patch X.Y" on detail (FR-8); compact mono stamp on cards. Verified patch older than the site's current Patch renders `badge-stale`, dashed border + `· STALE` suffix, so old-patch vs current-patch is distinguishable at a glance, not by reading digits (FR-4). |
| Patch History block | Entry detail, below conditions | Ordered by Patch ascending (FR-10). Renders per {components.patch-history}, rows in {typography.mono}. Missing history renders explicit "No recorded changes", never blank (FR-3 consequence). Deprecated rows keep the record visible. |
| Flag control | Entry detail | Two verdicts, "Still correct" / "Outdated" (FR-9), optional one-line note after activate, submit without auth. In-place confirmation swap; no modal, no redirect. Duplicate within window dedupes silently to a notice; sustained attempts rate-limit with plain-language notice. Accepted "outdated" flips the entry to `badge-flagged` (pending review) for other visitors (FR-9 consequence). 44px min-height per {components.flag-control}. |
| Copy link | Entry detail, beside flag control | Copies canonical URL; label swaps to patch-stamped citation ("Counterlock · <title> · verified as of patch X.Y") for creators (PRD §2.1). Announced via `aria-live`. Per {components.copy-link}. |
| Roster grid ({components.hero-roster-tile}) | `/heroes` | Every current hero present (FR-7). Zero-entry heroes render full tiles with "no entries yet", valid state, not 404. Count must match tracked roster. |
| Navigation | Global | Flat top bar: Heroes, Interactions, Matchups, search. Back navigation preserves prior browse state (hero filter, scroll) via normal history, no app-shell reset. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Loading | Roster, hero page, search, **entry detail** | Skeleton rows/tiles matching final layout ({colors.surface-raised} blocks); no spinner-only screens. Detail pages, UJ-1's climax surface, skeleton badge row → conditions block → history rows, so first paint never flashes empty content. Search debounced ~200ms [ASSUMPTION]. |
| Empty (hero, zero entries) | Hero page, roster tile | `{typography.headline}`: "No entries yet." Body: plain line that the hero is tracked but uncurated (FR-7). Link home to search. No illustration, no "coming soon". |
| Empty (search no matches) | Search well | "No matches for '{q}'." + hint listing what does match (hero names, abilities, effects). Keep query in field for editing. |
| Flagged-outdated pending review | Entry detail, cards | `badge-flagged`: "Community-flagged outdated, in review." Entry stays fully readable; Patch History unchanged until editor sweep (FR-9 → FR-12). Visitor's own submit shows confirmation line, not the badge again. |
| Deprecated | Entry detail, cards, search | `badge-deprecated` + "See patch history." Content fully rendered, never collapsed (FR-10). |
| Flag deduped | Flag control | Control replaced by: "Already counted, thanks." [ASSUMPTION] |
| Flag rate-limited | Flag control | "Slow down, you've already flagged this recently." [ASSUMPTION] No account prompt ever. |
| Error (flag submit) | Flag control | "Couldn't send. Try again." in {colors.error} (text + border only, never a fill). Control stays enabled for retry (FR-9: accepted flags must reliably reach the backlog, failures never silently succeed). |
| Error (page/data) | Any route | Plain-language error surface in {colors.error} + link home; no stack traces. [ASSUMPTION: standard Next.js error boundary copy] |

## Interaction Primitives

- **Tap targets:** all controls ≥44×44px on touch, roster tiles, flag buttons, badge-linked history rows (mobile-first, UJ-1 entry is a phone).
- **Keyboard search:** `/` or clicking focuses search; `Enter` submits/navigates to results; `Esc` clears the query; `↓`/`↑` walk results [ASSUMPTION: arrow-walk optional at MVP; `Enter` is required, arrows nice-to-have]. Full site operable by Tab only.
- **Back nav:** browser/OS back is the primary reverse path (UJ-1 loop: detail → hero → home). No custom back that breaks history; detail pages never trap focus.
- **Deep links:** every hero, interaction, and guidance record has a canonical static/SSR URL (PRD §6.1), shareable from Discord, indexable, and the reason deprecated records stay retrievable by direct link (FR-10). Search results serialize to `?q=` so a query is shareable/reloadable. Copy-link control on detail gives creators the patch-stamped citation (PRD §2.1).
- **Icon-only controls:** every glyph button (search, menu, copy-link) has an accessible name (`aria-label`: "Search", "Menu", "Copy link"); badge glyphs render `aria-hidden` so SR users hear only the badge phrase.
- **Banned:** hover-only affordances on touch, auto-play motion, modal stacks >1 deep, infinite scroll on roster/search (grid renders complete; corpus fits client-side, FR-2).

## Accessibility Floor

Behavioral. Contrast/token compliance lives in `DESIGN.md` (WCAG 2.1 AA, memlog).

- **Focus order:** follows reading order on every surface, nav → search → browse grid → cards; on detail: badge/conditions → history → flag control. Focus ring is {colors.accent}, visible on all surfaces; `Esc` closes the mobile menu sheet.
- **Screen-reader status:** badges announce as complete phrases ("Verified as of patch 7.2"), not icon+color fragments; flag confirmation and search result counts announce via `aria-live="polite"`; "flagged outdated, in review" state change is announced when it lands on an entry.
- **Non-color status:** every badge state carries icon + word ({typography.mono-sm} label), grayscale test must still distinguish verified / stale / flagged / deprecated (memlog lock). Badge glyphs are `aria-hidden`; the phrase is what announces.
- **Reduced motion:** honor `prefers-reduced-motion`, skeleton shimmers, badge transitions, and sheet animations collapse to instant state changes. No motion carries meaning.
- Contrast floor: body ≥7:1, all badge foregrounds ≥4.5:1 on their tinted surfaces (verified in `DESIGN.md` Colors).

## Key Flows

### UJ-1: Marcus's 30-second pre-game check (mobile, from Discord)

1. Marcus taps the Counterlock link on his phone, landing on `/`, hero grid and search both above the fold.
2. He taps **Solomon** (roster tile) → hero page shows Solomon's Interaction Records and Matchup Guidance, filterable by counterpart.
3. He scans past cards, each footer already stamped with its badge; he spots the Archetype Warning "avoid flier comps" (FR-5) with a green `badge-verified`.
4. He taps the **Knockdown vs. flyers** interaction → detail: effect, exact conditions, badge, Patch History.
5. **Climax:** badge reads "verified as of patch X.Y" and the Patch History row confirms Knockdown's cast-time nerf, one page, one truth, no second source (UJ-1 climax; FR-3, FR-8, FR-10).
6. Resolution: back ×2 to home, tab closed, decision made.
   - Edge: if the card had shown `badge-flagged`, he treats it as suspect, checks history, or skips the trick, the state reads without color thanks to the word+icon stamp.

### UJ-2: Priya flags an outdated interaction (one tap, no account)

1. Priya opens Apollo's Riposte → Seven's ult record directly from search ("Riposte").
2. She reads the claim, it's wrong (Riposte no longer cancels the ult).
3. She taps **Outdated** on the flag control; an optional one-line note appears; she types a note and submits.
4. **Climax:** confirmation swaps in place: "Flagged. Thanks, it's in the review queue." No account, no modal, no friction (UJ-2 climax; FR-9).
5. The entry now carries `badge-flagged` "community-flagged outdated, in review" for the next visitor (FR-9 consequence).
6. Resolution: The flag lands in the Flag Backlog for the next Verification Sweep (FR-12).
   - Edge: duplicate tap → "Already counted, thanks."; spam → "Slow down, you've already flagged this recently."; never an auth wall.

### UJ-3: Editor's post-patch Verification Sweep (brief)

1. Editor reviews the Flag Backlog and badge-old entries in repo content files (FR-11, FR-12).
2. Re-verifies, updates badges, Patch History, and deprecated states; ships via build.
3. **Climax:** every stale badge is refreshed or explicitly marked deprecated, no flag older than one Patch Cycle unreviewed (UJ-3 climax). Badges on the live site now read the new patch.
4. Resolution: trust signals current for the Patch Cycle; no user-facing change beyond the stamps.

## Inspiration & Anti-patterns

- **Pro, freshness-first:** the badge and Patch History are the front door; every layout decision asks "can he see the stamp without clicking?" (PRD vision).
- **Pro, scan-friendly:** cards with mono effect chips, one-line conditions, footer stamps; a lookup that beats a wiki page on speed (SM-3).
- **Rejected, stat-tracker dashboards:** no charts, win rates, tier lists, or KPI tiles (PRD §5 non-goals). If it looks like Tracklock, it's wrong.
- **Rejected, wiki walls of text:** no long-form prose pages, no unbadged paragraphs of trivia (editorial policy: if it doesn't change in-match play, it doesn't ship).
- **Rejected, edgelord gamer chrome:** neon gradients, glitch art, aggressive display type. Precision instrument, not a clan banner.
- **Rejected, account nags:** no login prompts after flags, no "save your favorites" walls (PRD §5).

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| `< 640px` (mobile, UJ-1 default) | Single column. Roster grid 2-col; search full-width above fold; nav collapses to search + menu sheet; detail pages stack badge → conditions → history → flag. |
| `640–1023px` | Roster 3-col; cards 2-col on hero page; nav links visible alongside search. |
| `≥ 1024px` (desktop) | `max-content` 1120px centered ({spacing.max-content}); roster 4–6 col; hero page may split two-column (records left, guidance right) [ASSUMPTION: desktop two-pane split on hero page is optional polish, stacked is acceptable MVP]; full nav bar. |

Responsive web only, no app shell, no install prompt, no offline mode. The phone is a first-class lookup surface (UJ-1), not a degraded desktop; desktop adds grid density, not extra features.
