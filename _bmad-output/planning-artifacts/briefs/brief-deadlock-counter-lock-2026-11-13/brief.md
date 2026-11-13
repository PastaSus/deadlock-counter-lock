---
title: "Product Brief: Counterlock (deadlock-counter-lock)"
status: final
created: 2026-11-13
updated: 2026-11-13
---

# Product Brief: Counterlock

## Executive Summary

Counterlock is a community-driven web database and pre-game lookup tool for Valve's Deadlock, strictly focused on **actionable counterplay** — not another win-rate tracker, not an item builder, not a trivia wiki. It answers one question before every match: *what actually counters what, right now, in this patch?*

It ships two core views: granular **ability/item-to-ability interaction records** and **lane/team-comp matchup guidance** (e.g., archetype warnings like avoiding flier matchups as Solomon). Every entry carries a patch verification badge, community verified/outdated flags, and a Patch History / Deprecated Tech field — so when Apollo's Riposte stops canceling Seven's ult, the record says so instead of silently rotting.

The window is now: Deadlock's live-service patch cadence keeps invalidating counterplay advice that lives in buried videos, messy spreadsheets, and undated wiki edits — while every existing tool is either stat-correlational or prose-deep. Counterlock stakes its identity on the one thing nobody does: per-patch verification of interaction truth.

## The Problem

Counterplay knowledge in Deadlock decays faster than any tool tracks it: when a patch silently changes a cast time or cancels an interaction, players keep following advice that no longer works — and lose lanes and games because of it:

- Players discovered mid-patch that **Knockdown no longer really counters flyers** after cast-time changes (326 upvotes on r/DeadlockTheGame, Jul 2026), and undocumented interaction flips like **Doorman's ult vs. Counterspell** surfaced only on YouTube and forums.
- The top complaint of 2026 (3.1k upvotes): *"Counter items how people describe them VS how they actually work."*
- Today's coping mechanisms: stat trackers (Tracklock, Deadlock Guru, Deadlock Labs) show *correlations* — win rates, head-to-heads — but never say whether a specific interaction *works*; the community wiki has rich interaction notes but freshness is implicit in edit history; prose tip sites (getcounterlock.com, DenyPick) stay generic and go stale between patches.

**Cost of the status quo:** no player can answer "is this interaction still true this patch?" in seconds. Verification falls to individual YouTubers and Discord threads, re-discovering the same changes over and over.

## The Solution

A fast, searchable web database built around two core views:

1. **Interaction lookup** — granular, first-class records for ability/item-to-ability and ability/item-to-hero interactions: what interrupts, grounds, extends, silences, or blocks what, with exact conditions (mid-air states, channel breakpoints, fire-rate scaling) — e.g., early Slowing Hex grounding Deadman Danny mid-crash.
2. **Lane/team-comp matchup guidance** — archetype-level warnings and lane matchups (e.g., "don't pick Solomon into flier comps"), scoped to what changes how you play, not generic hero trivia.

**Every entry** carries three trust signals:

- **Patch verification badge** — "verified as of patch X.Y," updated by a manual re-verification sweep after each Deadlock patch.
- **Community verified/outdated flags** — lightweight player reports when an interaction no longer behaves as documented.
- **Patch History / Deprecated Tech** — a standing field recording how the interaction changed across updates, so deprecated tech stays visible instead of deleted.

Lookup is pre-game-speed: pick your hero, pick theirs, get the counterplay truth with its freshness stamp. [ASSUMPTION: primary UX is hero-first search/browse; exact interaction UI to be confirmed in PRD]

## What Makes This Different

- **The counterplay-only filter is the brand.** Strictly actionable interaction and matchup knowledge; general hero trivia is excluded by editorial policy, not by accident. If it doesn't change what you do in a match, it doesn't ship.
- **Per-patch verification nobody else has.** No tool indexes ability→ability pairs as queryable records with verified/changed/deprecated states per patch (market scan, Nov 2026). Counterlock owns the question "is this still true *this patch*?"
- **Honest about its own decay.** The Patch History / Deprecated Tech field turns knowledge rot into a feature: a deprecated interaction is still useful information.
- **Honest moat:** execution and community trust [ASSUMPTION — passion-project stakes; no fabricated technical moats]. A naming collision exists at getcounterlock.com; we keep the name and differentiate on interaction records + verification badges.

## Who This Serves

**Primary:** engaged Deadlock players in the pre-game moment — hero select and loadout prep — who want to know how their hero interacts with the enemy comp *right now*. They are tired of patch-stale advice and value a freshness stamp over depth of trivia. [ASSUMPTION: mid-core players who theorycraft are the beachhead; casuals follow later]

**Secondary:** [ASSUMPTION] newer players learning counterplay through browsable interactions, and content creators who need citable, patch-stamped sources.

**Success for them:** open Counterlock, find the interaction in under ~10 seconds [ASSUMPTION], and trust the badge enough to act on it without checking a second source.

## Success Criteria

Right-sized for a passion/community project:

- **Launch:** ~25–40 hand-verified high-value interaction records + archetype matchup warnings live, all badged, across a browsable full hero roster.
- **Trust:** first post-launch patch completes a full re-verification sweep; no community outdated-flag older than one patch cycle goes unreviewed [ASSUMPTION].
- **Usage:** returning players across at least two patch cycles [ASSUMPTION: concrete traffic targets deferred until post-launch data exists].
- **Signal of fit:** community flags and requested interactions become the primary backlog input — the audience tells us which pairs to add next.

## Scope

**In for MVP:**

- View 1: granular ability/item-to-ability interaction database (curated seed, ~25–40 records)
- View 2: lane/team-comp matchup guidance (archetype warnings)
- Full browsable hero roster structure (all heroes present; interaction depth curated)
- Patch verification badge + community verified/outdated flag mechanism (lightweight report, no accounts) [ASSUMPTION: flagging is accountless]
- Patch History / Deprecated Tech field on every entry
- SEO-first static/SSR routes for heroes and matchups; fast pre-game lookup
- Technical constraints locked from day one: Next.js (TypeScript), Tailwind CSS, strict kebab-case file/folder naming, WCAG 2.1 AA

**Explicitly out of MVP:**

- Win-rate stats, tier lists, match history, MMR tracking (Tracklock's turf)
- Item builders / build recommendations
- Open community submissions or wiki-style editing (curated + flags only)
- Accounts, auth, profiles [ASSUMPTION]
- Mobile app; monetization [ASSUMPTION]
- API for third parties [ASSUMPTION]

**Post-MVP path:** growth driven by community flags → add requested interactions → possibly widen to open submissions with review if the curated model can't keep pace.

## Vision

In 2–3 years, Counterlock is the canonical freshness layer for Deadlock counterplay — the site players check after every patch and content creators cite when they claim "this interaction changed." It becomes the record of how the game's counterplay meta evolved, patch by patch, with a community that flags rot faster than any editor could — and deprecated interactions preserved as history rather than quietly deleted. If Deadlock grows, the same verified-interaction model extends to whatever Valve ships next.
