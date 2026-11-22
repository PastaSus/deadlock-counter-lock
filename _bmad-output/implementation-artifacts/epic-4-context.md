# Epic 4 Context: Official Artwork & Recognition

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Layer a recognition surface on top of Epic 1's shipped lookup: official Deadlock artwork on roster tiles and every entry card, tier-colored shop-item cues, accessible detail tooltips, and refreshed trust-signal wording (Patch-Verified label, Deprecated Tech callout). Every image ships as a repo-committed static file produced by a manual sync script, so no page, component, or client island ever calls the assets API and a missing image degrades to a placeholder instead of a broken render. This epic adds no new functional requirements; it serves FR1/FR3/FR7 as the visual layer, carried by NFR9 and the UX-DR17–22 set.

## Stories

- Story 4.1: Asset sync pipeline and loader join
- Story 4.2: Hero artwork tiles
- Story 4.3: Counter card media row, tier borders, and asset tooltips
- Story 4.4: Trust-signal refresh: Patch-Verified and Deprecated callout

## Requirements & Constraints

- All official artwork ships as static files committed under `public/assets/`; nothing calls the Deadlock Assets API at build, render, or runtime (NFR9).
- Official artwork is a functional recognition layer, never decoration competing with the freshness badge.
- WCAG 2.1 AA everywhere. Status and item tier are never color-only: tier is always stated in words in the tooltip (NFR3).
- Naming: kebab-case files/folders/slugs, PascalCase components, `.ts`/`.tsx` (NFR4).
- A valid entity with no image renders the neutral placeholder with the entity initial and name; a missing image never fails the page or shows a broken image.
- A missing or invalid manifest is a clear build error, never a silent all-placeholder render. A stamp not found in the manifest fails the build; an unstamped entity passes with no artwork and takes the placeholder path.
- Zero-entry heroes keep their full-tile "no entries yet" state under artwork.
- Tier-5 gap: if sync reveals a curated item with `item_tier` 5, stop and surface the DESIGN tier-5 token gap before shipping (tokens only define tier-1..4).

## Technical Decisions

- `scripts/sync-assets` is the sole caller of `api.deadlock-api.com` (no auth): `/v1/assets/heroes`, `/v1/assets/items`, `/v1/assets/items/by-hero-id/<hero id>`. Run manually via `npm run sync:assets`. The default build is network-free; an env-gated pre-sync refresh is the only opt-in build-time API touch.
- The script writes images to `public/assets/{heroes,abilities,items}/` and regenerates `lib/assets/manifest.json` (image path + png/webp variants, API summary where present, per-family source URL, fetch date, attribution/license note). All output is committed.
- The script upserts optional `assetId`/`className` stamps into editorial records (heroes + nested abilities, items) via official-name match within scope, reviewable as a git diff. Script is the only writer of these stamps.
- The manifest validates against the shared zod schema in `lib/schema` at build.
- `lib/loaders` owns the single slug → stamp → manifest join plus all cross-file resolution, and hands typed asset props (paths, name, type/tier, summary) to components. Components never import the manifest, never match by display name, never fetch asset data.
- Tooltip effect-line precedence is fixed: editorial `summary` → manifest description sentence → name + type/tier.
- Item tier renders from the manifest `item_tier`.
- The build-generated search index embeds loader-resolved asset metadata so the client search island never imports the manifest.
- The asset tooltip is the only new client island and stays inside the closed client-island list; all other components remain server components by default.
- `tier-1..4`, `media-scrim-strong/soft`, and the `asset-tooltip` / `deprecated-callout` component specs ship as CSS custom properties + Tailwind 4 `@theme` in `app/globals.css`.

## UX & Interaction Patterns

- Hero artwork tiles: official hero card/background as the tile background, cropped, under the `hero-artwork-tile` scrim (the only permitted gradient) plus tile text shadow. Hero name in `{colors.text}` verified at >=4.5:1 on the busiest portrait area. Hover `surface-raised`, selected `accent-dim` + accent border, both preserved over artwork. Artwork is decorative (CSS background / `aria-hidden`) with the hero name as real text.
- Counter card media row: 32px source/target hero portraits followed by 24px ability and shop-item icons, all resolved at build and passed as loader props. Item icons carry a 2px border in `{colors.tier-1}`–`{colors.tier-4}`.
- Asset tooltip: `surface-raised` + `border-strong`, `{rounded.md}`, caption type, 280px max width. Opens on hover OR keyboard focus, persists while hovered/focused, dismisses with `Esc`, linked to its trigger via `aria-describedby` (WCAG 1.4.13). Content is name, type or tier, and one-line effect summary. The trigger is a real button with an accessible name; no hover-only affordance, no layout shift; touch users focus to read.
- Patch-Verified badge: visible label `PATCH-VERIFIED · X.Y`; screen readers hear "Patch-verified as of patch X.Y"; icon + word + color unchanged; no separate public community-verified count at MVP.
- Deprecated Tech / Patch Note callout: distinct rose `status-deprecated` block below the record body stating "Deprecated Tech / Patch Note", the patch number, and the note from the latest `patchHistory` row. It supplements `badge-deprecated`, never replaces it; record content stays fully rendered. Text meets AA contrast on the rose surface.
- Icons are decorative where adjacent text names the entity; icon-only controls carry an accessible name.

## Cross-Story Dependencies

- Story 4.1 must land first: it produces the manifest, the record stamps, the loader join, and the search-index metadata that 4.2, 4.3, and 4.4 consume.
- 4.2 and 4.3 extend Epic 1's shipped tokens, roster tile, entry card, and loaders; 4.3 adds the single new tooltip island and reuses the search-index asset metadata from 4.1.
- 4.4 modifies the shipped badge's verified label and adds the deprecated callout; it relies on existing deprecation validation (`deprecated: true` requires non-empty `patchHistory`) so the callout always has a patch number and note.
