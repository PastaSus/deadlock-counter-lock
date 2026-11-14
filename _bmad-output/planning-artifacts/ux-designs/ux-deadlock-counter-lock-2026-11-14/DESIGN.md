---
title: "DESIGN.md: Counterlock"
status: final
created: 2026-11-14
updated: 2026-11-14
name: Counterlock
description: Dark-first precision-tool design system for a Deadlock counterplay lookup — Deadlock-derived warm charcoal and parchment neutrals, verdigris accent, freshness stamps, scan-first cards, semantic badge states.
colors:
  # Surfaces — warm charcoal from Deadlock's ink/graphite identity (light mode deferred per memlog)
  background: '#101112'
  surface: '#181A19'
  surface-raised: '#212423'
  surface-sunken: '#0B0C0B'
  border: '#2E322F'
  border-strong: '#444A45'
  border-input: '#6A716B'
  # Text ramp — parchment cream, after Deadlock's parchment/gold tones
  text: '#F0EADB'
  text-secondary: '#B5B1A3'
  text-muted: '#8E8B7F'
  # Accent — verdigris: Deadlock's sage green brightened for interactive use
  accent: '#57C7AE'
  accent-foreground: '#06130F'
  accent-dim: '#0F2E28'
  # Semantic badge states (all AA on {colors.background} / {colors.surface})
  status-verified: '#4ADE80'
  status-verified-surface: '#0E2A1C'
  status-flagged: '#FBBF24'
  status-flagged-surface: '#2B2109'
  status-deprecated: '#E38B8B'
  status-deprecated-surface: '#2A1518'
  # Error text/border only — never a fill (see Colors · Avoid)
  error: '#F28B82'
  error-surface: '#2A1616'
typography:
  display:
    fontFamily: 'Space Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline:
    fontFamily: 'Space Grotesk, ui-sans-serif, system-ui, sans-serif'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  title:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.55'
  label:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  mono:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  mono-sm:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.04em
rounded:
  sm: 3px
  md: 4px
  lg: 6px
  xl: 8px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  gutter: 16px
  gutter-desktop: 24px
  card-padding: 16px
  section-gap: 40px
  max-content: 1120px
components:
  entry-card:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
    padding: '{spacing.4}'
  badge:
    radius: '{rounded.full}'
    padding: '4px 10px'
    min-height: 24px
    typography: '{typography.mono-sm}'
    hit-area: 'linked badges expand hit area to 44px via pseudo-element or wrapper padding (WCAG 2.5.8)'
  badge-verified:
    background: '{colors.status-verified-surface}'
    foreground: '{colors.status-verified}'
  badge-stale:
    background: '{colors.status-verified-surface}'
    foreground: '{colors.status-verified}'
    border: '1px dashed {colors.status-verified}'
    label-suffix: '· STALE'
  badge-flagged:
    background: '{colors.status-flagged-surface}'
    foreground: '{colors.status-flagged}'
  badge-deprecated:
    background: '{colors.status-deprecated-surface}'
    foreground: '{colors.status-deprecated}'
  search-field:
    background: '{colors.surface}'
    border: '1px solid {colors.border-input}'
    radius: '{rounded.md}'
    focus-border: '{colors.accent}'
    typography: '{typography.body}'
  hero-roster-tile:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
    hover-background: '{colors.surface-raised}'
  flag-control:
    background: 'transparent'
    foreground: '{colors.text-secondary}'
    border: '1px solid {colors.border-input}'
    radius: '{rounded.md}'
    min-height: 44px
    typography: '{typography.label}'
  patch-history:
    background: '{colors.surface-sunken}'
    border: '1px solid {colors.border}'
    radius: '{rounded.md}'
    padding: '{spacing.4}'
    row-typography: '{typography.mono}'
  copy-link:
    foreground: '{colors.text-secondary}'
    typography: '{typography.label}'
    min-height: 44px
  navigation:
    background: '{colors.background}'
    border-bottom: '1px solid {colors.border}'
    foreground: '{colors.text-secondary}'
    active-foreground: '{colors.text}'
    accent-foreground: '{colors.accent}'
---

## Brand & Style

Counterlock is a precision instrument, not a community hub. It answers one question — *is this counterplay still true this patch?* — under time pressure, often on a phone, minutes before hero select locks in. The visual language follows: dark-first (pre-game happens at night), warm charcoal surfaces drawn from Deadlock's ink/graphite identity, parchment-cream text, hairline borders, tight corners, monospace patch stamps, and exactly one chromatic accent — verdigris, Deadlock's sage brightened for interactivity — used like a status LED. Nothing decorative competes with the freshness badge, because the badge is the product.

Dark-first is the shipped mode; light mode is deferred (memlog). The palette is deliberately the game's own: charcoal like the wordmark's graphite, parchment like its UI tones, verdigris like its sage — so the tool feels native to Deadlock without touching Valve art. The aesthetic reads "gaming peripheral config panel" — engineered, calm, slightly technical — and deliberately avoids edgelord gamer tropes (neon gradients, glitch textures, aggressive display type). Every screen should feel scannable in under ten seconds: cards over prose, stamps over paragraphs, state over decoration.

## Colors

The palette is one neutral ramp, one accent, three semantic status colors.

- **Background / Surface ramp (`#101112` → `#181A19` → `#212423`)** — the entire tonal world, warm charcoal drawn from Deadlock's ink/graphite identity (logo wordmark `#4d4f52` family). `background` is the page; `surface` is cards, roster tiles, and the search field; `surface-raised` is hover/active elevation only; `surface-sunken` is inset wells (search results well, Patch History block). Hierarchy is tonal layering, not shadow.
- **Text ramp (`{colors.text}` `#F0EADB` → `{colors.text-secondary}` `#B5B1A3` → `{colors.text-muted}` `#8E8B7F`)** — parchment cream, after Deadlock's parchment/gold tones: primary content, secondary metadata (hero names, effect labels), tertiary hints/placeholder. Body text on `background` and `surface` exceeds 7:1; `text-muted` passes AA (≥4.5:1) on `background`, `surface`, `surface-raised`, and `accent-dim` — permitted for helper text and placeholder at any size, never for conditions or badge text (FR-3 requires conditions to stay readable).
- **Accent (`{colors.accent}` `#57C7AE`, verdigris)** — the single brand chromatic: Deadlock's signature sage green brightened until it works as an interactive signal (8.5:1 on `background`). Means *interactive or selected*: primary actions, active nav, focus rings, the hero you've picked, links. Never used to encode verification status, never decorative fills, never body text. `{colors.accent-dim}` (`#0F2E28`) is the selected-state tint (picked hero tile, active tab). Rejected pairings: parchment gold (collides with the amber flagged badge) and Valve coral (collides with the rose deprecated badge).
- **`{colors.status-verified}` `#4ADE80` (green) / `{colors.status-flagged}` `#FBBF24` (amber) / `{colors.status-deprecated}` `#E38B8B` (soft rose)** — reserved exclusively for trust-signal badge states (FR-4, FR-8, FR-10). Each ships as tinted surface + matching foreground, all passing WCAG 2.1 AA on both `background` and `surface`. Color never carries the state alone: every badge also renders its word ("verified", "flagged outdated", "deprecated") in `{typography.mono-sm}` plus a distinct glyph. Green/amber/rose appear nowhere else — not on buttons, not as accents, not decoratively.
- **Border (`{colors.border}` `#2E322F`, `{colors.border-strong}` `#444A45`, `{colors.border-input}` `#6A716B`)** — hairline separation in the same warm charcoal family. `border-strong` is for hover/focus-adjacent edges. `border-input` passes 3:1 against `surface`/`background` (WCAG 1.4.11) and is mandatory on any control whose boundary is how you identify it: search field, flag buttons, note field.

Avoid: gradients, glows, neon washes, more than one accent hue, status colors outside badges, red-as-error fills (error copy uses `{colors.error}` as text + border only, per EXPERIENCE.md · State Patterns).

## Typography

Three roles, each with a job.

- **UI / body** — **Inter** (`{typography.body}`, `{typography.label}`, `{typography.caption}`). The default voice: hero names, effect text, conditions, microcopy. Nothing clever; maximum legibility at 3am on a phone.
- **Display / headline** — **Space Grotesk** (`{typography.display}`, `{typography.headline}`). Used sparingly: home hero line, page titles ("Solomon"), empty-state headlines. Its slightly technical geometry carries the precision-tool posture without a "gamer font."
- **Mono** — **JetBrains Mono** (`{typography.mono}`, `{typography.mono-sm}`). The freshness voice: patch numbers, badge stamps ("verified as of patch X.Y"), patch-history rows, effect-type chips (INTERRUPT / GROUND / SILENCE). Monospace signals *machine-checked fact* — the same way a terminal stamps a build hash. Never used for sentences.

Rules: conditions text on detail pages is `{typography.body}` at full size — never truncated below readability (FR-3 consequence). All-caps only for mono effect chips and badge labels. No italics for state.

## Layout & Spacing

Spacing scale is Tailwind's 4-based rhythm (`{spacing.1}`–`{spacing.7}`: 4/8/12/16/24/32/48). Named tokens: `{spacing.gutter}` (16px mobile page margin), `{spacing.gutter-desktop}` (24px), `{spacing.card-padding}` (16px), `{spacing.section-gap}` (40px between major blocks), `{spacing.max-content}` (1120px — the ceiling; this is a lookup tool, not a magazine).

Mobile-first single column. Roster and card grids expand with breakpoint (see EXPERIENCE.md · Responsive & Platform); detail pages never exceed `max-content` and center. The search field sits above the fold on home — hero-first browse and free-text search are co-equal entry points (FR-1, FR-2), so neither is buried. Gutter stays 16px on mobile; nothing bleeds to the device edge. Dense-but-breathing: cards pack tightly in grids (`{spacing.3}` gaps) but sections separate by `{spacing.section-gap}`.

## Elevation & Depth

Minimal. Depth is tonal: `surface` sits on `background`, `surface-raised` signals hover/active, `surface-sunken` insets the Patch History well. Shadows exist only as a 1px border shift on hover (`border` → `border-strong`) — no drop shadows on cards, no glow on the accent, no glassmorphism. The one permitted elevation cue is the sticky search/nav bar on scroll: `background` at full opacity with `border-bottom`, no blur. Focus is never shadow — it's the accent ring (`2px solid {colors.accent}`, 2px offset).

## Shapes

Tight and instrumental: `{rounded.sm}` (3px) for badges and chips, `{rounded.md}` (4px) for cards, inputs, buttons, roster tiles, `{rounded.lg}` (6px) for panels/dialogs, `{rounded.full}` strictly for verification badges and small status pills. No oversized friendly radii — 12px+ reads consumer-app, not instrument. Card corners and media follow container radius exactly. The pill shape on badges is the one soft note: a stamp is a stamp.

## Components

- **Entry card** (`components.entry-card`) — the core unit for Interaction Records and Matchup Guidance in lists. `surface` + hairline `border` + `{rounded.md}` + `{spacing.card-padding}`. Anatomy top-to-bottom: effect-type mono chip → source → target → one-line condition preview (truncated at sentence boundary only) → footer row with Patch Verification Badge (left) and flag control (right). Whole card is the tap target to detail (FR-3). Hover: `border-strong`. Deprecated variant shows badge-deprecated and never visually hides the card (FR-10 — history stays visible).
- **Badge / chip** (`components.badge*`) — four states, one shape. `badge-verified` (green tint): "✓ VERIFIED · X.Y". `badge-stale` (green tint, dashed border, `· STALE` suffix): shown when the verified Patch is older than the site's current Patch — visually distinguishable at a glance (FR-4), same green so freshness reads as the axis, not correctness. `badge-flagged` (amber tint): "! FLAGGED OUTDATED · X.Y" — shown when community flags are pending review (FR-9). `badge-deprecated` (rose tint): "✕ DEPRECATED · X.Y". Patch number always in `{typography.mono-sm}`. Icon + word + color, all three, always (AA + color-independence). Badge on `surface` or tinted own background — never on accent. Linked badges keep a 44px hit area (hit-area rule in frontmatter).
- **Patch History block** (`components.patch-history`) — inset well on detail pages below the record body (FR-10): `surface-sunken` + border + `{rounded.md}` + `{spacing.card-padding}`. Rows in `{typography.mono}` ordered by Patch ascending; empty state reads "No recorded changes" in `{colors.text-secondary}` — never blank.
- **Copy link** (`components.copy-link`) — quiet control on detail pages next to the flag control: copies the canonical URL; on copy, swaps label to a patch-stamped citation line ("Counterlock · <entry title> · verified as of patch X.Y") for content creators (PRD §2.1 social JTBD). `{typography.label}`, `text-secondary`, 44px min-height.
- **Search field** (`components.search-field`) — full-width on home, collapses into nav icon on scroll for desktop (see navigation). `surface` fill, `border-input` (3:1), `{rounded.md}`, left search glyph in `text-secondary`, placeholder in `text-muted`. Focus: `border` → `{colors.accent}`. Results render below in a `surface-sunken` well with `aria-live` count ("12 matches").
- **Hero roster grid** (`components.hero-roster-tile`) — equal tiles, `surface` + border + `{rounded.md}`; hero name in `{typography.title}`; hover/selected uses `surface-raised` / `accent-dim` + accent border. Heroes with zero curated entries render identically but carry a `text-muted` "no entries yet" line (FR-7 — full roster, honest depth, no 404s, no dimming that implies broken).
- **Flag control** (`components.flag-control`) — quiet ghost button pair on every entry detail: "Still correct" / "Outdated" (`{typography.label}`, `text-secondary`, `border-input`, `{rounded.md}`, 44px min-height), optional one-line note field revealed on activate (FR-9). Post-submit: control swaps to a static confirmation line in `text-secondary` — no modal, no account wall, no celebration. Rate-limited/deduped responses replace the control with a single-line notice (see EXPERIENCE.md · State Patterns).
- **Navigation** (`components.navigation`) — flat top bar on `background`: wordmark, primary links (Heroes, Interactions, Matchups), search affordance. Active link: `{colors.text}` + accent underline (2px). Mobile: same bar with search + menu glyphs; menu opens a single-level sheet. No mega-menus, no sidebar on desktop — three destinations don't need one.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Every badge state = icon + word + color, all three | Encode verification state with color alone |
| Reserve green/amber/rose exclusively for trust badges | Use status colors on buttons, links, hovers, or decoration |
| Keep body/condition text ≥7:1 on `surface` | Drop `text-muted` below caption size or onto conditions |
| One accent (`{colors.accent}`) for interactive/selected only | Add a second brand hue, gradient, or glow |
| Monospace for patches, stamps, effect chips only | Set sentences or card titles in mono |
| Tight radii (3/4/6px); pill only on badges | Friendly 12px+ radii or fully rounded cards |
| Tonal layering + hairline borders for hierarchy | Drop shadows, glass blur, neon outlines |
| Show deprecated entries with badge + history, in place | Hide, gray-out to illegibility, or delete deprecated records |
| Let empty roster tiles state "no entries yet" plainly | Dim/omit heroes to fake corpus depth |
| Truncate card previews at sentence boundaries | Truncate conditions text on detail pages (FR-3) |
