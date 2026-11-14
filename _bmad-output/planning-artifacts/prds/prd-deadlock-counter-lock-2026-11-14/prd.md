---
title: "PRD: Counterlock"
status: final
created: 2026-11-14
updated: 2026-11-14
---

# PRD: Counterlock

## 0. Document Purpose

This PRD is for the PM (solo builder) and downstream workflow owners — UX (`bmad-ux`), architecture (`bmad-architecture`), epics/stories (`bmad-create-epics-and-stories`), and sprint planning. It is structured around a Glossary-anchored vocabulary, features grouped with globally numbered FRs, and inline `[ASSUMPTION]` tags indexed in §9. It builds on the final product brief (2026-11-13) at `_bmad-output/planning-artifacts/briefs/brief-deadlock-counter-lock-2026-11-13/` — problem, market scan, and scope live there; this PRD adds requirements granularity. UX design/experience docs will be produced next and will own interaction/UI detail.

## 1. Vision

Counterlock is a community-driven web database and pre-game lookup tool for Valve's Deadlock, strictly focused on actionable counterplay. It answers one question before every match: *what actually counters what, right now, in this patch?* Every entry carries a patch verification badge, community verified/outdated flags, and a Patch History / Deprecated Tech field — so when an interaction stops working, the record says so instead of silently rotting.

No existing tool indexes ability→ability pairs as queryable records with per-patch verified/changed/deprecated states. Stat trackers show correlations; wikis rely on implicit edit freshness; prose tip sites go stale. Counterlock owns the question "is this still true *this patch*?"

Success is a passion/community project: a trusted, fast lookup that players check after every patch and content creators cite — and whose deprecated interactions stay visible as history. Over 2–3 years it becomes the record of how Deadlock's counterplay meta evolved patch by patch, and the verified-interaction model extends to whatever Valve ships next. Honest moat: execution and community trust — no fabricated technical moats [ASSUMPTION — passion-project stakes].

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** Before/during hero select, know how my hero interacts with the enemy comp *this patch* — what counters my ult, what grounds me, what I can interrupt — in seconds.
- **Functional:** After a patch drops, know which of my go-to counterplay tricks still work.
- **Emotional:** Act on counterplay advice without second-guessing whether it's already stale.
- **Social:** As a content creator, cite a patch-stamped source when claiming "this interaction changed."
- **Contextual (builder):** Keep a curated interaction corpus maintained through patch cycles without rotting.

### 2.2 Non-Users (v1)

- Players seeking win rates, tier lists, match history, or MMR tracking (explicit non-goals).
- Players wanting item builders or full build recommendations.
- Wiki-style editors seeking open contribution (v1 is curated + flags only).

### 2.3 Key User Journeys

- **UJ-1. Marcus checks the matchup 30 seconds before hero select locks in.**
  - **Persona + context:** mid-core Deadlock player, theorycrafts picks; enemy hovering fliers.
  - **Entry state:** unauthenticated, mobile browser, coming from Discord.
  - **Path:** opens Counterlock → picks his hero (Solomon) → browses matchups vs. enemy archetypes → sees an Archetype Warning "avoid flier comps" with a Patch Verification Badge → taps one interaction (Knockdown vs. flyers) → reads current state + Patch History noting the cast-time change.
  - **Climax:** badge says "verified as of patch X.Y" and the Patch History confirms Knockdown's nerf — he trusts it without a second source.
  - **Resolution:** closes the tab with a decision made; may return next patch.
  - **Edge case:** entry shows "community-flagged outdated" → he treats it as suspect and checks Patch History or avoids the trick.

- **UJ-2. Priya spots a wrong interaction and flags it in one tap.**
  - **Persona + context:** engaged player; Apollo's Riposte no longer cancels Seven's ult but the page still says it does.
  - **Entry state:** unauthenticated, on the interaction page.
  - **Path:** reads the entry → taps "outdated" flag → confirms with optional one-line note → receives instant confirmation.
  - **Climax:** flag submitted with no account, no friction; the entry now carries an outdated indicator for others.
  - **Resolution:** the Flag Backlog receives the Flag; the next Verification Sweep reviews it.
  - **Edge case:** spam/duplicate flag → rate-limited or deduped, no user-facing account wall.

- **UJ-3. The editor runs the post-patch Verification Sweep.**
  - **Persona + context:** the solo builder, days after a Deadlock patch.
  - **Entry state:** repo access; structured content files + Flag Backlog.
  - **Path:** reviews the Flag Backlog → re-verifies flagged and badge-old entries → updates records (badges, Patch History, deprecated states) → ships content changes → badges now reflect the new Patch.
  - **Climax:** every stale badge is refreshed or explicitly marked deprecated; no outdated Flag older than one Patch Cycle goes unreviewed.
  - **Resolution:** site trust signals are current for the new Patch Cycle.

## 3. Glossary

- **Interaction Record** — first-class entry pairing a source (ability/item/hero) with a target (ability/item/hero): what it interrupts, grounds, extends, silences, or blocks, with exact conditions. Cardinality: many per hero pair.
- **Matchup Guidance** — entry-level advice for lane/team-comp scenarios, including Archetype Warnings (e.g., "don't pick Solomon into flier comps"). Scoped to what changes in-match play.
- **Archetype Warning** — subset of Matchup Guidance keyed to enemy-comp archetypes (e.g., fliers).
- **Hero** — playable Deadlock character; the primary browse axis.
- **Patch** — Deadlock game version (e.g., X.Y); the freshness unit for all trust signals.
- **Patch Verification Badge** — on-entry stamp "verified as of patch X.Y," refreshed by a Verification Sweep.
- **Patch History / Deprecated Tech** — standing per-entry field recording how the interaction changed across Patches; deprecated interactions remain visible.
- **Flag** — accountless community report on an Entry: "verified" or "outdated," with optional one-line note. Feeds the Flag Backlog.
- **Patch Cycle** — the interval between two consecutive Patches; the maximum age a Flag may reach before it must be reviewed.
- **Flag Backlog** — collection of pending Flags awaiting editorial review.
- **Verification Sweep** — editorial pass after each Patch that re-verifies entries and refreshes badges.
- **Entry** — umbrella term for Interaction Record or Matchup Guidance.

## 4. Features

### 4.1 Interaction Lookup (View 1)
**Description:** The core database view: granular Interaction Records queryable hero-first and via free-text search. A player picks their hero and the enemy's (or types a keyword like "Knockdown") and gets counterplay truth with freshness stamps. Realizes UJ-1. Seed corpus expands the brief's example set: Haze's Sleep Dagger / Paradox's Swap interrupting Lash's ult, early Slowing Hex grounding Deadman Danny mid-crash, Knockdown extending stuns on airborne targets, Disarm vs. Silver, Suppressor vs. high fire-rate M1 heroes, Apollo's Riposte no longer canceling Seven's ult (deprecated-tech example).

**Functional Requirements:**

#### FR-1: Hero-first browse
A visitor can select a hero and browse Interaction Records involving that hero (as source or target), filtered/scannable by counterpart hero or ability/item. Realizes UJ-1.

**Consequences (testable):**
- Selecting a hero renders all Interaction Records where that hero participates within 100ms of page data being available on a warm load.
- Total time from site open to reading a specific interaction's effect and badge stays within the ~10s lookup target for a returning user (SM-3).
- Records display source, target, effect (interrupt/ground/silence/block/extend), and conditions without truncating critical condition text.

#### FR-2: Free-text search
A visitor can search by keyword (hero, ability, item, effect term) and receive matching Interaction Records and Entries. Realizes UJ-1.

**Consequences (testable):**
- Typing "Knockdown" surfaces Knockdown-related Interaction Records and any Matchup Guidance mentioning it.
- Search works without an account, and the curated corpus fits within client-side data limits.

#### FR-3: Interaction Record detail
Each Interaction Record detail page shows: source, target, effect, exact conditions (mid-air states, channel breakpoints, etc.), Patch Verification Badge, Patch History / Deprecated Tech, and current flag state. Realizes UJ-1.

**Consequences (testable):**
- Detail page renders all required fields for every record; missing Patch History renders an explicit "no recorded changes" state, not blank.

#### FR-4: Patch-aware freshness signals
Every Entry displays its Patch Verification Badge and current verification state (current / community-flagged outdated / deprecated). Realizes UJ-1.

**Consequences (testable):**
- A record verified under an older Patch is visually distinguishable from one verified under the latest Patch the site tracks.

**Out of Scope:** win-rate or statistical correlation overlays; user accounts on any page.

### 4.2 Matchup Guidance (View 2)
**Description:** Lane/team-comp guidance — Archetype Warnings and lane matchups — browsable alongside interactions, scoped to actionable in-match decisions. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Archetype warnings
A visitor can browse Archetype Warnings (e.g., "avoid flier comps as Solomon") by hero and by archetype, each carrying the same trust signals as Interaction Records. Realizes UJ-1.

**Consequences (testable):**
- Every warning displays Patch Verification Badge and supports Patch History.

#### FR-6: Lane matchup guidance
A visitor can view lane matchup guidance for a selected hero vs. counterpart heroes. Realizes UJ-1.

**Consequences (testable):**
- Guidance pages are reachable from the hero browse path within two navigations.

### 4.3 Hero Roster
**Description:** Full browsable hero roster — every hero present as a navigation surface, even where interaction depth is curated/seed-thin.

**Functional Requirements:**

#### FR-7: Complete roster
The site exposes all current heroes as browsable entities; each hero page links to its Interaction Records and Matchup Guidance. Realizes UJ-1.

**Consequences (testable):**
- Roster count matches the tracked hero list for the current Patch; a hero with zero curated entries renders a valid "no entries yet" state, not a 404.

### 4.4 Trust & Freshness System
**Description:** The differentiator: per-Patch verification, community flags, and visible deprecation history.

**Functional Requirements:**

#### FR-8: Patch Verification Badge
Every Entry carries a badge stating the Patch on which it was last verified; site tracks a "current Patch" value. Realizes UJ-1.

**Consequences (testable):**
- Badge text follows the pattern "verified as of patch X.Y"; entries not yet re-verified after a Patch change are marked stale relative to the current Patch.

#### FR-9: Community flags (accountless)
A visitor can submit a Flag ("verified" or "outdated," optional one-line note) on any Entry without an account; the Flag enters the Flag Backlog. Realizes UJ-2.

**Consequences (testable):**
- Flag submission succeeds without auth.
- Duplicate submissions from the same visitor within a short window are deduped, and sustained submission attempts are rate-limited.
- Every accepted submission appears in the Flag Backlog and sets a visible "community-flagged outdated" indicator on the Entry (pending review).
- Transport/storage mechanism is deferred to architecture; the requirement is only that accepted Flags reliably reach the Flag Backlog with enough metadata (Entry, verdict, timestamp) to audit flag age. [ASSUMPTION: simple backend path preferred over third-party form so flags are queryable]

#### FR-10: Patch History / Deprecated Tech
Every Entry supports a Patch History field; deprecated interactions remain published with an explicit deprecated state rather than being deleted. Realizes UJ-1.

**Consequences (testable):**
- Deprecated entries remain retrievable by direct link and search, labeled deprecated.
- History entries are ordered by Patch.

### 4.5 Editorial Workflow
**Description:** The builder's side: curated content lives as structured files in the repo [ASSUMPTION: MD/JSON edited via PRs — git is the CMS; no admin UI for MVP], and the Verification Sweep keeps trust signals honest. Realizes UJ-3.

**Functional Requirements:**

#### FR-11: Curated content authoring
The editor can add/edit Entries by editing structured content files in the repository and shipping changes through the normal build/deploy pipeline. Realizes UJ-3.

**Consequences (testable):**
- A content-only change (new Interaction Record) requires no database migration and renders after deploy.
- Content files validate against a schema; malformed entries fail the build with a clear error. [ASSUMPTION: schema validation at build time]

#### FR-12: Verification Sweep support
The editor can review the Flag Backlog and re-verify Entries per Patch, updating badges, verification state, and Patch History. Realizes UJ-3.

**Consequences (testable):**
- After a Verification Sweep, no Entry retains a badge older than the current Patch without an explicit stale/deprecated marker.
- No Flag older than one Patch Cycle remains unreviewed, regardless of flag transport mechanism; the backlog must expose flag age so this is auditable. [ASSUMPTION: backlog review is a manual editorial process; tooling beyond file editing is out of MVP scope]

**Notes:** Flag Backlog surfacing (how the editor sees pending flags) depends on the FR-9 mechanism chosen in architecture — if a third-party form is chosen, backlog viewing happens in that tool.

## 5. Non-Goals (Explicit)

- We are **not** a stat tracker: no win rates, tier lists, match history, MMR.
- We are **not** an item builder or build recommender.
- We are **not** a wiki: no open submissions or community editing in v1 (curated + flags only).
- We are **not** account-based: no auth, profiles, or personalized state.
- We are **not** a mobile app and will not monetize in v1.
- We are **not** a third-party API in v1.
- We are **not** a general hero trivia source — editorial policy excludes anything that doesn't change in-match play.

## 6. MVP Scope

### 6.1 In Scope

- View 1: Interaction Record database (curated seed ~25–40 records) with hero-first browse + free-text search
- View 2: Matchup Guidance incl. Archetype Warnings and lane matchup guidance
- Full browsable hero roster (complete structure, curated depth)
- Patch Verification Badge + accountless community flagging (verified/outdated)
- Patch History / Deprecated Tech on every Entry
- Editorial workflow via repo structured files + post-patch Verification Sweep
- SEO-first static/SSR routes; fast pre-game lookup
- Constraints locked: Next.js 16 (TypeScript), App Router, Tailwind CSS 4, kebab-case naming, WCAG 2.1 AA; scaffold already builds green at project root

### 6.2 Out of Scope for MVP

- Win rates, tier lists, match history, MMR — Tracklock's turf; we differentiate by design
- Item builders / build recommendations — adjacent but dilutes counterplay-only brand
- Open community submissions / wiki editing — deferred; revisit if curated model can't keep pace
- Accounts, auth, profiles — unnecessary for lookup + flagging
- Mobile app; monetization — [NOTE FOR PM: revisit only if usage proves durable across patch cycles]
- Third-party API — post-MVP if demand appears
- Admin UI / CMS for content — repo files suffice at 25–40 records; reassess if editorial load grows
- Automated patch ingestion from game files — verification is a manual editorial act by design

## 7. Success Metrics

**Primary**
- **SM-1**: Launch corpus live — 25–40 badged Interaction Records, Archetype Warnings, and lane matchup guidance entries across a complete hero roster. Validates FR-1, FR-3, FR-5, FR-6, FR-7, FR-8, FR-11.
- **SM-2**: After the first post-launch Patch, a full Verification Sweep completes with zero Flags older than one Patch Cycle unreviewed. Validates FR-9, FR-10, FR-12.
- **SM-3**: Lookup speed — a player finds a target interaction in under ~10 seconds [ASSUMPTION]. Validates FR-1, FR-2.

**Secondary**
- **SM-4**: Returning players across at least two Patch cycles [ASSUMPTION: concrete traffic targets deferred until post-launch data exists]. Validates FR-4.
- **SM-5**: Community Flags (with optional one-line notes) become the primary backlog input. Validates FR-9.

**Counter-metrics (do not optimize)**
- **SM-C1**: Corpus size vs. freshness — do not optimize record count at the cost of badge accuracy; a smaller fully-verified corpus beats a large stale one. Counterbalances SM-1.
- **SM-C2**: Flag volume vs. trust — do not optimize flag count; a flag that never changes an entry is noise. Counterbalances SM-5.

## 8. Open Questions

1. Flag transport/store mechanism (API route → store vs. third-party form vs. Discord webhook) — architecture decision; affects only how the editor views the Flag Backlog. Note: a Discord-webhook-only design cannot satisfy FR-12's flag-age auditability without extra tooling — see addendum options matrix. (Non-blocker for UX/architecture start.)
2. Current-Patch tracking source: how the site learns the live Deadlock patch version (manual constant vs. automated). (Non-blocker; default manual.)
3. Search scope: client-side over curated corpus vs. hosted search — trivial at MVP scale; architecture call.

## 9. Assumptions Index

- §4.4 FR-9 — flag transport deferred to architecture; simple backend path preferred over third-party form.
- §4.5 FR-11 — content authored as structured files in repo (MD/JSON) via PRs; git is the CMS; build-time schema validation.
- §4.5 FR-12 — Verification Sweep backlog review is manual; no sweep tooling beyond file editing in MVP.
- §2.3 / §4 — primary UX is hero-first search/browse with free-text search as first-class entry (carried from brief, now confirmed as requirement).
- §2.1 / brief — mid-core theorycrafters are the beachhead audience; casuals follow later.
- §7 SM-3 — "under ~10 seconds" target is aspirational until measured.
- §7 SM-4 — concrete traffic targets deferred until post-launch data exists.
- §1 — honest moat is execution + community trust; no fabricated technical moats (passion-project stakes).
- §6.2 — no accounts, no monetization, no mobile app, no API in MVP.
- brief §Who This Serves — secondary audiences (newer players, content creators) served but not optimized for in v1.
- Naming — product name is "Counterlock," kept despite getcounterlock.com collision; revisit only if confusion becomes a real acquisition problem (brief naming decision, carried forward).
