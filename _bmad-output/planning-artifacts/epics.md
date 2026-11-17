---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/EXPERIENCE.md
---

# Counterlock - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Counterlock, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Hero-first browse. Visitor selects a hero and browses Interaction Records involving that hero, filterable by counterpart (PRD FR-1).
- FR2: Free-text search. Keyword search across heroes, abilities, items, and effect terms returning matching records (PRD FR-2).
- FR3: Interaction Record detail. Full record: source, target, effect, conditions, Patch Verification Badge, Patch History, flag state (PRD FR-3).
- FR4: Patch-aware freshness signals. Every Entry shows badge and current verification state (current / flagged outdated / deprecated); old-patch vs current-patch visually distinguishable (PRD FR-4).
- FR5: Archetype warnings. Browse Archetype Warnings by hero and by archetype, with full trust signals (PRD FR-5).
- FR6: Lane matchup guidance. Lane matchup guidance for selected hero vs counterparts, reachable within two navigations (PRD FR-6).
- FR7: Complete hero roster. All current heroes browsable; zero-entry heroes render "no entries yet" state, not 404 (PRD FR-7).
- FR8: Patch Verification Badge. Badge states "verified as of patch X.Y"; site tracks current Patch value (PRD FR-8).
- FR9: Community flags (accountless). Submit "verified" / "outdated" + optional note without auth; enters Flag Backlog; sets visible flagged indicator; rate-limited/deduped (PRD FR-9).
- FR10: Patch History / Deprecated Tech. Per-entry history ordered by Patch; deprecated entries stay published and labeled, never deleted (PRD FR-10).
- FR11: Curated content authoring. Editor adds/edits entries via structured repo files; content-only change needs no DB migration; malformed entries fail build (PRD FR-11).
- FR12: Verification Sweep support. Editor reviews Flag Backlog and re-verifies entries per Patch; no flag older than one Patch Cycle unreviewed; backlog exposes flag age (PRD FR-12).

### NonFunctional Requirements

- NFR1: SEO-first static/SSR routes for heroes and matchups; canonical shareable URLs per entry (PRD §6.1).
- NFR2: Fast pre-game lookup. Returning user reaches a specific interaction's effect + badge within ~10s; warm hero-browse data available promptly (PRD SM-3, FR-1).
- NFR3: WCAG 2.1 AA across all pages/components; status never color-only (PRD §6.1, AD-11).
- NFR4: Strict kebab-case file/folder naming (PRD §6.1, AD-10).
- NFR5: Stack lock. Next.js 16 (TypeScript), Tailwind CSS 4, App Router; scaffold builds green (PRD §6.1, AD stack).
- NFR6: No accounts/auth/profiles anywhere in visitor experience (PRD §5).
- NFR7: Content-only changes ship via build/deploy pipeline with no migration; build-time schema validation fails fast on malformed content (PRD FR-11, AD-2).
- NFR8: Flag endpoint security. Server-side rate limiting and dedupe; errors never report success; backlog requires secret (AD-3, AD-9).
- NFR9: Asset delivery constraint. All official artwork ships as static files committed to the repo (`public/assets/`); no page, component, or client island ever calls the Deadlock Assets API at build, render, or runtime, so client-side rate limits are impossible (prompt, AD-16).

### Additional Requirements

- Content-as-code SSOT: all editorial content in `content/`; no other store holds content (AD-1).
- zod v4 (`zod@^4`) build validation; fixed entry field vocabulary (`slug`, `kind`, `title`, `sourceRef`, `targetRef`, `effects[]`, `conditions`, `verifiedPatch`, `patchHistory[]`, optional boolean `deprecated` which requires non-empty `patchHistory` for the callout); refs resolve against the editorial registry (heroes + nested abilities, items, archetypes); all cross-file resolution runs in the `lib/loaders` build pass — one resolution site (AD-2).
- Static rendering of content routes via `generateStaticParams`; `cacheComponents: true` + `partialPrefetching: true` compliance; dynamic surface limited to `/api/flags/*` (AD-4).
- Flag API contract: `POST /api/flags` `{entrySlug, verdict, note?}`; `GET /api/flags/overlay` → `{flaggedSlugs[]}` public, built from pending `outdated` verdicts only; `GET /api/flags/backlog` secret-guarded returning `{id, entrySlug, verdict, note, createdAt, age}[]`; `POST /api/flags/review` `{id}` secret-guarded is the sole status write path (`pending` → `reviewed`); JSON envelope `{ok, data?, error?}`; Flag record shape fixed (AD-3, AD-9).
- Badge base state derived at build in `lib/badges` only; content persists only the optional `deprecated` boolean (the one content-held trust signal) — `verified`/`stale`/`flagged` never persist; runtime flagged overlay applied client-side; fetch failure degrades to base badge (AD-7, AD-12).
- Hero registry exhaustive: one `content/heroes/` file per hero regardless of entries (AD-13).
- Search index generated at build from the same loaders as pages; includes deprecated entries (AD-14).
- Closed client-island list: search input/results, flag form, mobile menu, badge-flag overlay fetcher, copy-link, asset tooltip, hero counterpart filter (`?vs=`) (AD-6).
- Asset sync pipeline: `scripts/sync-assets` is the sole caller of `api.deadlock-api.com` (`/v1/assets/heroes`, `/v1/assets/items`, `/v1/assets/items/by-hero-id/<hero id>` — endpoints live-verified, no auth); run manually via `npm run sync:assets`, default build network-free with an env-gated opt-in pre-sync as the only build-time API touch; images land in `public/assets/{heroes,abilities,items}/` plus generated `lib/assets/manifest.json`, all committed; manifest zod-validated against the shared schema in `lib/schema` (missing/invalid manifest = clear build error, never silent placeholders); a valid entity without an image renders the DESIGN placeholder; manifest carries per-family source URL, fetch date, attribution/license note (AD-16).
- Official id/class_name mapping: editorial records (heroes, nested abilities, items) carry optional `assetId`/`className` stamps upserted only by the sync script (git-diff reviewable); a stamp absent from the manifest fails the build; `lib/loaders` owns the single slug → stamp → manifest join and hands typed asset props (paths, name, type/tier, summary) to components; components never import the manifest and never match by display name; tooltip effect-line precedence: editorial `summary` → manifest description sentence → name + type/tier (AD-17).
- Search index embeds loader-resolved asset metadata so the client search island never imports the manifest (AD-14).
- Item tier renders from manifest `item_tier` (API exposes tiers 1–5; DESIGN defines `tier-1..4` tokens — tier-5 rendering is an open item deferred in the spine, revisit if a synced tier-5 shop item renders in a card) (AD-16, AD-17).
- Design tokens shipped as CSS custom properties + Tailwind 4 `@theme` in `app/globals.css`; fonts via `next/font`; no component library; dark-only (AD-15).
- Flag KV provider: Upstash Redis preferred (Vercel KV sunset, excluded); env vars for KV connection + `EDITOR_SECRET` (spine Deferred/Stack).
- Slug IDs mirrored in routes; no numeric IDs (AD-8).

### UX Design Requirements

- UX-DR1: Implement DESIGN.md frontmatter tokens (colors, typography, rounded, spacing) as CSS custom properties mapped into Tailwind 4 `@theme`; dark-only palette exactly as specced (AD-15).
- UX-DR2: Load fonts via `next/font`: Inter (UI/body), Space Grotesk (display/headline), JetBrains Mono (patches/badges/chips) with the specced roles.
- UX-DR3: Entry card component. Anatomy: mono effect chip → source → target → one-line condition preview (sentence-boundary truncation) → footer with badge + flag control; whole card links to detail; hover `border`→`border-strong`; deprecated variant never hidden.
- UX-DR4: Badge component with four states (`badge-verified`, `badge-stale` dashed + `· STALE`, `badge-flagged`, `badge-deprecated`), icon + word + color always; mono patch stamp; 44px hit area for linked badges.
- UX-DR5: Search field. `surface` fill, `border-input` 3:1, accent focus border, `text-muted` placeholder, `aria-live` result count, results in `surface-sunken` well; `?q=` serialization on home.
- UX-DR6: Hero roster tile. Equal tiles, hover `surface-raised`, selected `accent-dim` + accent border; zero-entry tiles show "no entries yet" in `text-muted`, full opacity.
- UX-DR7: Flag control. "Still correct" / "Outdated" ghost pair (44px min-height, `border-input`), optional one-line note on activate, in-place confirmation swap, dedupe notice "Already counted, thanks.", rate-limit notice "Slow down, you've already flagged this recently."; accepted outdated flips to flagged state via overlay.
- UX-DR8: Copy-link control on detail pages. Copies canonical URL, swaps label to patch-stamped citation line; `aria-live` announcement; 44px min-height.
- UX-DR9: Patch History block. `surface-sunken` inset well, rows in mono ordered ascending by patch, explicit "No recorded changes" empty state.
- UX-DR10: Navigation. Flat top bar (wordmark, Heroes/Interactions/Matchups, search, current-patch mono stamp); active link accent underline; mobile search + menu glyphs with sheet; icon-only controls carry `aria-label`.
- UX-DR11: Skeleton loading states for roster, hero page, search, and entry detail (badge → conditions → history blocks); no spinner-only screens; skeleton shimmer respects `prefers-reduced-motion`.
- UX-DR12: Empty states per Voice and Tone table. "No entries yet for {hero}." / "No matches for '{q}'." with hint; never 404 or "coming soon" for tracked-but-empty heroes.
- UX-DR13: Accessibility floor. Focus order per surface, accent focus ring, badge phrases announced complete with glyphs `aria-hidden`, `aria-live` for flag confirmations/result counts, ≥44×44 touch targets, reduced-motion support, grayscale-distinguishable badge states.
- UX-DR14: Responsive breakpoints. <640px single column (roster 2-col, stacked detail), 640–1023px (roster 3-col), ≥1024px (`max-content` 1120px, roster 4–6 col); mobile is first-class lookup surface.
- UX-DR15: Microcopy voice per EXPERIENCE Voice and Tone table. Trusted-scout tone; exact badge/flag/empty/error strings as specified (provisional wording, binding tone).
- UX-DR16: Home layout. Headline + full-width search and hero roster co-equal above the fold; featured entries + archetype warning card below.
- UX-DR17: Hero artwork tiles. Official hero card/background image as the tile background, overlaid with the `hero-artwork-tile` scrim (the only permitted gradient) and tile text shadow; hero name in `{colors.text}` verified at ≥4.5:1 on the busiest portrait area; missing artwork falls back to a neutral placeholder with the entity initial, never a broken image (DESIGN Official Assets & Media, hero-artwork-tile; EXPERIENCE).
- UX-DR18: Counter card media row. Every entry card renders a 32px source/target hero portrait followed by 24px ability and shop-item icons; item icons carry a 2px tier-colored border (`{colors.tier-1}`–`{colors.tier-4}`); the tier is always stated in words in the tooltip so tier is never color-only (DESIGN entry-card anatomy; EXPERIENCE counter card media).
- UX-DR19: Asset tooltip component. `surface-raised` + `border-strong`, `{rounded.md}`, caption type, 280px max width; opens on hover OR keyboard focus, persists while hovered/focused, dismisses with `Esc`, linked to its trigger via `aria-describedby` (WCAG 1.4.13); content = name, type or tier, one-line effect summary; this is the single new client island (DESIGN asset-tooltip; EXPERIENCE tooltips).
- UX-DR20: Patch-Verified badge wording. Visible label `PATCH-VERIFIED · X.Y`; screen readers hear "Patch-verified as of patch X.Y"; icon + word + color unchanged; no separate public community-verified count at MVP (DESIGN badge-verified; EXPERIENCE).
- UX-DR21: Deprecated Tech / Patch Note callout. Distinct rose `status-deprecated` block below the record body stating the label, patch number, and note; supplements `badge-deprecated`, never replaces it; record content stays fully rendered (DESIGN deprecated-callout; EXPERIENCE).
- UX-DR22: New tokens and states. Ship the `tier-1..4` and `media-scrim-strong/soft` color tokens plus the `hero-artwork-tile`, `asset-tooltip`, and `deprecated-callout` component specs into `app/globals.css` / Tailwind 4 `@theme` (extends UX-DR1, AD-15); asset-missing, tooltip, and Patch-Verified rows render per the EXPERIENCE State Patterns table.

### FR Coverage Map

FR1: Epic 1 - Hero-first browse
FR2: Epic 1 - Free-text search
FR3: Epic 1 - Interaction Record detail
FR4: Epic 1 - Patch-aware freshness signals
FR5: Epic 1 - Archetype warnings
FR6: Epic 1 - Lane matchup guidance
FR7: Epic 1 - Complete hero roster
FR8: Epic 1 - Patch Verification Badge
FR9: Epic 2 - Community flags (accountless)
FR10: Epic 1 - Patch History / Deprecated Tech
FR11: Epic 1 - Curated content authoring (schema, validation, seed content)
FR12: Epic 3 - Verification Sweep support

(Epics 4 adds no new FRs: its work serves FR1/FR3/FR7 as the asset/visual layer, tracked via NFR9 + UX-DR17–22.)

## Epic List

### Epic 1: Counterplay Lookup: the static site players use
Players browse the full hero roster, open hero pages, and read interaction/matchup/archetype detail with trust badges and Patch History, the core "is this counterplay still true this patch?" experience. Includes the content pipeline (schema, loaders, build validation, seed content), design tokens/fonts, core components, and free-text search (consolidated: search shares the home surface and loaders with browse).
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR10, FR11

### Epic 2: Community Flagging: visitors police freshness
Accountless "Still correct" / "Outdated" flags, rate-limited/deduped API, public overlay so static badges upgrade to `flagged`, and the secret-guarded backlog. Completes the visitor trust loop on top of Epic 1.
**FRs covered:** FR9

### Epic 3: Patch Verification Sweep: editor keeps trust honest
Post-patch editorial workflow: review the flag backlog, re-verify entries, refresh badges/deprecations, ship content updates; no flag older than one Patch Cycle unreviewed.
**FRs covered:** FR12

### Epic 4: Official Artwork & Recognition: players see the fight, not just text
Players recognize heroes, abilities, and shop items at a glance from official Deadlock artwork with tier cues and accessible detail tooltips, while the site never calls the assets API from the client and never renders a broken image. Appends the asset pipeline and media rendering on top of Epic 1's shipped components; consolidates into one epic because every story touches the same core files (`app/globals.css`, `lib/loaders`, card/tile components).
**FRs covered:** FR1, FR3, FR7 (asset/visual layer; primary coverage stays with Epic 1 — no new FR added by this change; carriers are NFR9 + UX-DR17–22)

## Epic 1: Counterplay Lookup: the static site players use

Give players a complete static lookup: curated content rendered into browsable roster, hero, detail, and matchup views with trust badges, plus free-text search, standing alone with zero backend.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR10, FR11 · **Relevant NFRs:** NFR1–NFR7 · **Relevant UX-DRs:** UX-DR1–6, UX-DR8–12, UX-DR14–16

### Story 1.1: Content pipeline and seed corpus

As a site builder,
I want content authored as validated repo files that the build turns into the data model,
So that editorial changes ship through the normal build with malformed content impossible to deploy.

**Acceptance Criteria:**

**Given** the repo at build time
**When** `npm run build` runs
**Then** every file under `content/` validates against zod v4 schemas (`slug`, `kind`, `title`, `sourceRef`, `targetRef`, `effects[]`, `conditions`, `verifiedPatch`, `patchHistory[]`) and a malformed file fails the build with a clear path-specific error (FR11, AD-2)
**And** `content/heroes/` contains one file per hero in the roster, including heroes with zero entries, and the roster enumerates this registry, never the entry set (FR7, AD-13)
**And** `sourceRef`/`targetRef` that do not resolve against the hero/ability registry fail the build (AD-2)
**And** a seed corpus of 25–40 high-value interaction records plus archetype/lane matchup guidance ships, including the brief's example set (Sleep Dagger/Swap vs Lash ult, Slowing Hex vs Danny, Knockdown stun extension, Disarm vs Silver, Suppressor vs fire-rate M1, Riposte vs Seven ult as deprecated, Solomon vs flier comps)
**And** `content/config/` holds the single `currentPatch` constant consumed by badge derivation (FR8, AD-7)

### Story 1.2: Design system foundation and core components

As a player,
I want the site to look and behave like the specced precision tool on every surface,
So that trust signals are legible and the experience is consistent and accessible.

**Acceptance Criteria:**

**Given** the app shell
**When** any page renders
**Then** DESIGN.md tokens ship as CSS custom properties mapped into Tailwind 4 `@theme` in `app/globals.css`, exact specced dark palette, no light theme (UX-DR1, AD-15)
**And** fonts load via `next/font`: Inter, Space Grotesk, JetBrains Mono in their specced roles (UX-DR2)
**And** the flat top navigation renders (wordmark, Heroes/Interactions/Matchups links, search affordance, current-patch mono stamp) with accent underline active state, and mobile collapses to search + menu glyphs opening a single-level sheet (UX-DR10)
**And** the Badge component renders four states, `badge-verified`, `badge-stale` (dashed border + `· STALE` suffix when `verifiedPatch` < `currentPatch`), `badge-flagged`, `badge-deprecated`, always icon + word + color, mono patch stamp, 44px hit area for linked badges (UX-DR4, FR4, FR8)
**And** the Entry card component renders the specced anatomy (mono effect chip → source → target → sentence-boundary condition preview → footer badge), links whole-card to detail, and shows deprecated entries unhidden (UX-DR3, FR10)
**And** empty-state and skeleton components exist per EXPERIENCE (roster/hero/search/detail skeletons, "No entries yet" / "No matches" copy, reduced-motion honored) (UX-DR11, UX-DR12)
**And** a WCAG 2.1 AA pass: focus rings, ≥44×44 targets, `text-muted` contrast ≥4.5:1, no color-only status (NFR3, UX-DR13, AD-11)

### Story 1.3: Hero roster and hero browse pages

As a player,
I want to open a full hero roster and pick my hero to see its counterplay,
So that I start the lookup hero-first in seconds.

**Acceptance Criteria:**

**Given** the site
**When** a visitor navigates to `/heroes`
**Then** every hero in `content/heroes/` renders as a tile (2-col mobile, 3-col md, 4–6-col desktop), zero-entry heroes render full-opacity with "no entries yet," never 404 or dimmed (FR7, UX-DR6, UX-DR14)
**And** tapping a tile navigates to `/heroes/[slug]` where that hero's Interaction Records and Matchup Guidance list with counterpart filtering (FR1, FR6)
**And** each listed entry shows its card footer badge, freshness visible without clicking (FR4)
**And** routes render statically via `generateStaticParams` with `cacheComponents` compliance (NFR1, AD-4)

### Story 1.4: Interaction detail with trust signals

As a player,
I want the full record, effect, exact conditions, verification badge, and patch history, on one page,
So that I can trust the counterplay without checking a second source.

**Acceptance Criteria:**

**Given** an interaction entry
**When** a visitor opens `/interactions/[slug]`
**Then** source, target, effect, and full conditions render untruncated at `{typography.body}` (FR3, NFR7 sizing)
**And** the badge shows its build-derived base state, verified / stale / deprecated, with "verified as of patch X.Y" text pattern (FR4, FR8, AD-7)
**And** Patch History renders in the inset well ordered ascending by patch with an explicit "No recorded changes" empty state (FR10, UX-DR9)
**And** a Copy-link control copies the canonical URL and swaps to the patch-stamped citation line with `aria-live` announcement (UX-DR8)
**And** the page is static, canonical-URLed, shareable, and an entry detail is reachable from home within two navigations (NFR1, AD-4)
**And** a detail-page skeleton (badge → conditions → history) shows during load (UX-DR11)

### Story 1.5: Matchup guidance and archetype views

As a player,
I want lane matchup guidance and archetype warnings with the same trust signals as interactions,
So that I can act on team-comp advice, not just ability pairs.

**Acceptance Criteria:**

**Given** matchup and archetype-warning content
**When** a visitor browses `/matchups/[slug]` from a hero page, and `/archetypes` from the footer/home
**Then** each guidance entry shows its badge and supports Patch History like an interaction (FR5, FR6, FR4)
**And** the archetype index groups warnings by archetype with links to their detail pages, the "by archetype" browse axis (FR5)
**And** every guidance detail is reachable from home within two navigations (FR6)
**And** all listed routes render statically (AD-4)

### Story 1.6: Home layout and free-text search

As a player,
I want hero-first browse and keyword search co-equal above the fold,
So that I can jump straight to "Knockdown" or pick a hero, whichever fits my moment.

**Acceptance Criteria:**

**Given** the home page
**When** a visitor opens `/` or types a query
**Then** headline + full-width search field and the hero roster both sit above the fold (UX-DR16)
**And** a JSON search index generated at build from the same loaders as the pages covers heroes, abilities, items, and effect terms, including deprecated entries, and search runs entirely client-side (FR2, AD-5, AD-14)
**And** results render in the `surface-sunken` well with `aria-live` count and serialize to `?q=` for shareable reload (UX-DR5)
**And** selecting a hero or result navigates to the same routes as browse (FR1/FR3 paths converge)
**And** featured entry cards and an archetype warning card render below the fold (UX-DR16)

## Epic 2: Community Flagging: visitors police freshness

Let visitors report freshness with one tap and no account, and surface those reports on the static badges.

**FRs covered:** FR9 · **Relevant NFRs:** NFR6, NFR8 · **Relevant UX-DRs:** UX-DR7, UX-DR13

### Story 2.1: Flag API with rate limit and dedupe

As a site operator,
I want flag submissions stored in a single runtime store with abuse controls,
So that the backlog stays trustworthy without accounts.

**Acceptance Criteria:**

**Given** the flag KV store configured via env (Upstash Redis preferred; Vercel KV excluded)
**When** a client sends `POST /api/flags` with `{entrySlug, verdict, note?}`
**Then** a valid flag persists with `{ id, entrySlug, verdict, note?, createdAt, status: "pending" }` (AD-3)
**And** responses use the `{ok, data?, error?}` envelope; failures never report success (AD-9, NFR8)
**And** duplicate submissions dedupe on `entrySlug + visitorHash` within a rolling window and sustained attempts rate-limit, both server-side, returning distinguishable error codes the UI maps to copy (NFR8, FR9)
**And** `GET /api/flags/overlay` returns `{flaggedSlugs: []}` publicly with no secret, built from pending `outdated` verdicts only (reviewed flags never surface) (AD-3, AD-12)
**And** no visitor-facing auth exists anywhere (NFR6)

### Story 2.2: Flag control on entry detail

As a player,
I want to mark an entry "Still correct" or "Outdated" in one tap,
So that bad counterplay gets corrected without an account wall.

**Acceptance Criteria:**

**Given** an open entry detail page
**When** a visitor taps "Outdated" (or "Still correct") on the flag control and submits, optionally with a one-line note
**Then** submission succeeds without auth and swaps in place to "Flagged. Thanks, it's in the review queue.", no modal, no redirect, no celebration (FR9, UX-DR7)
**And** a duplicate tap shows "Already counted, thanks."; sustained attempts show "Slow down, you've already flagged this recently."; failures show "Couldn't send. Try again." with the control enabled for retry (UX-DR7, UX-DR12)
**And** the control meets 44px min-height with `border-input` boundary and is fully keyboard-operable (UX-DR13, NFR3)

### Story 2.3: Flag overlay on badges

As a player,
I want an entry flagged by the community to visibly upgrade to "flagged outdated, in review"
So that I see fresh distrust signals on an otherwise static page.

**Acceptance Criteria:**

**Given** a statically rendered entry page with a base badge (verified/stale/deprecated)
**When** the client island fetches `GET /api/flags/overlay` after hydration
**Then** slugs in `flaggedSlugs` (pending `outdated` verdicts only, AD-3) upgrade their badge to `badge-flagged` with the announced phrase "Community-flagged outdated, in review" (FR4, FR9, AD-12)
**And** the build-derived base state remains the single source for freshness, the overlay never computes patch freshness (AD-7)
**And** a failed overlay fetch leaves the base badge intact, render never blocks, never falsely claims flagged (AD-12)
**And** the overlay fetcher is within the closed client-island list (AD-6)

## Epic 3: Patch Verification Sweep: editor keeps trust honest

Give the editor a way to see pending flags with age and clear them, so no flag outlives a Patch Cycle.

**FRs covered:** FR12 · **Relevant NFRs:** NFR8 · **Relevant UX-DRs:** UX-DR15

### Story 3.1: Flag backlog surface

As the editor,
I want to review pending flags sorted by age behind a secret,
So that I know exactly what needs re-verification this sweep.

**Acceptance Criteria:**

**Given** `EDITOR_SECRET` configured
**When** an authorized request hits `GET /api/flags/backlog`
**Then** pending flags return as `{ id, entrySlug, verdict, note, createdAt, age }[]` sorted oldest-first with age visible; requests without the secret are rejected (FR12, AD-3, NFR8)
**And** the backlog lists entry slug, verdict, note, and age, enough to audit "no flag older than one Patch Cycle unreviewed" (FR12)
**And** responses use the standard envelope (AD-9)

### Story 3.2: Sweep execution: re-verify and close flags

As the editor,
I want to re-verify flagged and stale entries, ship the content update, and mark flags reviewed,
So that every badge reflects the current patch.

**Acceptance Criteria:**

**Given** pending flags and a new Deadlock patch
**When** the editor re-verifies entries (updating `verifiedPatch`, `patchHistory`, deprecations) in `content/`, ships via build, and marks flags reviewed via `POST /api/flags/review` `{id}` (EDITOR_SECRET, the sole status write path, AD-3)
**Then** refreshed badges render the new `currentPatch` on next deploy, and stale badges are either refreshed or explicitly deprecated (FR12, FR8, AD-7)
**And** the build's schema validation still gates the content edits (FR11, AD-2)
**And** after the sweep no pending flag remains older than one Patch Cycle; a still-pending flag must be explicitly re-triaged, never silently dropped (FR12)
**And** the editorial voice of any user-facing copy stays per the Voice and Tone table (UX-DR15)

## Epic 4: Official Artwork & Recognition: players see the fight, not just text

Give players the recognition layer: official artwork on roster tiles and every counter card, tier-colored item cues, accessible detail tooltips, and refreshed trust-signal wording — all served from repo-synced static files with zero client calls to the assets API.

**FRs covered:** FR1, FR3, FR7 (asset/visual layer; primary coverage stays Epic 1) · **Relevant NFRs:** NFR3, NFR4, NFR9 · **Relevant UX-DRs:** UX-DR17–22

### Story 4.1: Asset sync pipeline and loader join

As a site builder,
I want official Deadlock artwork synced into the repo and joined to content at build time,
So that every page renders real artwork with zero client calls to the assets API.

**Acceptance Criteria:**

**Given** the repo with `scripts/sync-assets` and network access to `api.deadlock-api.com`
**When** `npm run sync:assets` runs
**Then** the script fetches `/v1/assets/heroes`, `/v1/assets/items`, and `/v1/assets/items/by-hero-id/<hero id>` for every hero in `content/heroes/`, and it is the only code path that ever contacts the API (AD-16, NFR9)
**And** images write to `public/assets/{heroes,abilities,items}/` and `lib/assets/manifest.json` regenerates with image path + png/webp variants per record plus source URL, fetch date, and attribution/license note per asset family (AD-16)
**And** `assetId`/`className` stamps upsert into editorial records (heroes, nested abilities, items) via official-name match within scope, reviewable as a git diff (AD-17)
**Given** the committed manifest
**When** `npm run build` runs
**Then** the manifest validates against the shared zod schema in `lib/schema`; a missing or invalid manifest fails the build with a clear error, never a silent all-placeholder render (AD-16)
**And** a stamp with no matching manifest record fails the build; an unstamped entity passes with no artwork, taking the placeholder path (AD-17)
**And** `lib/loaders` performs the single slug → stamp → manifest join and exposes typed asset props (paths, name, type/tier, summary), summary precedence editorial `summary` → manifest description sentence → name + type/tier (AD-17)
**And** the build-generated search index embeds the loader-resolved asset metadata so no client ever imports the manifest (AD-14)
**And** the default build performs no network calls; the env-gated pre-sync refresh is opt-in and is the only build-time API touch (AD-16)
**And** new files and slugs stay kebab-case, components PascalCase, TypeScript `.ts`/`.tsx` (NFR4, AD-10)

### Story 4.2: Hero artwork tiles

As a player,
I want roster and hero-page headers using official hero artwork,
So that I recognize my hero at a glance.

**Acceptance Criteria:**

**Given** synced artwork from Story 4.1 and the DESIGN tokens
**When** a visitor opens `/heroes` or `/heroes/[slug]`
**Then** each roster tile and the hero-page header render the official hero artwork as the background under the `hero-artwork-tile` scrim with the tile text shadow, hero name in `{colors.text}` at ≥4.5:1 measured on the busiest portrait area (UX-DR17, NFR3)
**And** artwork loads from static repo files passed down as loader props; no client fetch of artwork or manifest (AD-16, AD-17, NFR9)
**And** artwork is decorative (CSS background / `aria-hidden`) with the hero name as real text, and zero-entry heroes keep their full-tile "no entries yet" state (FR7, UX-DR6)
**And** an entity with no synced artwork renders the neutral placeholder with the entity initial, never a broken image; a missing image never fails the page (UX-DR17, AD-16)
**And** hover/selected states (`surface-raised` / `accent-dim` + accent border) are preserved over artwork (UX-DR6)
**And** `media-scrim-strong/soft` ship as CSS custom properties in `app/globals.css` via Tailwind 4 `@theme` (UX-DR22, AD-15)

### Story 4.3: Counter card media row, tier borders, and asset tooltips

As a player,
I want every entry card and detail to show the hero portraits and ability/item icons involved,
So that I can see the matchup without reading it.

**Acceptance Criteria:**

**Given** entries rendered on hero pages, search results, and detail
**When** an entry card or interaction detail renders
**Then** the media row shows 32px source/target hero portraits followed by 24px ability and shop-item icons, all resolved at build and passed as loader props (UX-DR18)
**And** each shop-item icon carries a 2px border in its `item_tier` color using `{colors.tier-1}`–`{colors.tier-4}`, and the tooltip states the tier in words so tier is never color-only (UX-DR18, NFR3)
**And** the asset tooltip opens on hover OR keyboard focus, persists while hovered or focused, dismisses with `Esc`, links to its trigger via `aria-describedby`, and renders name + type/tier + one-line effect within 280px max width (UX-DR19, WCAG 1.4.13)
**And** the tooltip is the only new `"use client"` island, inside AD-6's closed list (AD-6)
**And** search-result cards use the asset metadata embedded in the search index; no client manifest import (AD-14)
**And** a missing icon renders the neutral placeholder with the entity initial, and the tooltip still opens with text details (UX-DR22 state patterns)
**And** icons are decorative where adjacent text names the entity; the tooltip trigger is a real button with an accessible name (EXPERIENCE interaction primitives, NFR3)
**And** `tier-1..4` tokens and the `asset-tooltip` spec ship in `app/globals.css` / Tailwind 4 `@theme`; if sync reveals a curated item with `item_tier` 5, stop and surface the DESIGN tier-5 token gap before shipping (UX-DR22, spine open item)

### Story 4.4: Trust-signal refresh: Patch-Verified and Deprecated callout

As a player,
I want unmistakable trust states on every entry,
So that I instantly know what is current and what has been nerfed.

**Acceptance Criteria:**

**Given** the shipped badge and entry components
**When** any entry surface renders the verified base badge
**Then** the visible label reads `PATCH-VERIFIED · X.Y` and screen readers hear "Patch-verified as of patch X.Y", with icon + word + color unchanged (UX-DR20)
**And** stale/flagged/deprecated badge labels and states are unchanged (UX-DR4)
**And** no separate public community-verified count renders at MVP (UX-DR20)
**Given** an entry with `deprecated: true`
**When** its card or detail renders
**Then** a distinct rose `deprecated-callout` block appears below the record body stating "Deprecated Tech / Patch Note", the patch number, and the note from the latest `patchHistory` row (UX-DR21, AD-2)
**And** the callout supplements `badge-deprecated`, never replaces it, and record content stays fully rendered (FR10)
**And** deprecated entries with empty `patchHistory` already fail the build (AD-2), so the callout always has a patch number and note to show
**And** callout text meets WCAG 2.1 AA contrast on the rose surface, and the `deprecated-callout` spec ships in `app/globals.css` / Tailwind 4 `@theme` (NFR3, UX-DR22)
