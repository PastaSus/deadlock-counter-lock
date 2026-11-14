# Epic 1 Context: Counterplay Lookup: the static site players use

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Ship the complete static lookup experience with zero backend: a curated, build-validated content corpus rendered into hero-first browse, hero pages, interaction and matchup/archetype detail, and client-side free-text search. This epic is the product's core promise ("is this counterplay still true this patch?") because every surface carries build-derived trust badges and Patch History. Success means a returning player can reach a specific interaction's effect and badge in roughly ten seconds on a phone, and editorial corpus changes ship through a normal build with malformed content impossible to deploy.

## Stories

- Story 1.1: Content pipeline and seed corpus
- Story 1.2: Design system foundation and core components
- Story 1.3: Hero roster and hero browse pages
- Story 1.4: Interaction detail with trust signals
- Story 1.5: Matchup guidance and archetype views
- Story 1.6: Home layout and free-text search

## Requirements & Constraints

- All editorial content (heroes, entries, patch history, current patch) lives as structured files under `content/`; nothing else stores content.
- Every content file validates against a zod v4 schema at build; a malformed file fails the build with a clear, path-specific error. `sourceRef`/`targetRef` must resolve against the hero/ability registry or the build fails.
- The hero registry is exhaustive: one file per hero, including zero-entry heroes. Roster and hero pages enumerate the registry, never the entry set. Zero-entry heroes show a valid "no entries yet" state, never a 404 or dimmed tile.
- Seed corpus: 25 to 40 high-value interaction records plus archetype/lane matchup guidance, including the brief's example interactions (Sleep Dagger/Swap vs Lash ult, Slowing Hex vs Danny, Knockdown stun extension, Disarm vs Silver, Suppressor vs fire-rate M1, Riposte vs Seven ult as deprecated, Solomon vs flier comps).
- Every entry exposes a badge (verified / stale / deprecated) and per-entry Patch History ordered ascending. Deprecated entries stay published, labeled, and searchable, never deleted.
- Content-only changes require no database migration.
- Routes are static, SEO-first, canonical, and shareable. Any interaction detail is reachable from home within two navigations.
- Search covers heroes, abilities, items, and effect terms across interactions and matchup guidance, including deprecated entries; it runs entirely client-side and serializes to `?q=` on the static home page.
- WCAG 2.1 AA everywhere. Status is never conveyed by color alone. Files and slugs are kebab-case.
- Stack is locked: Next.js 16 (TypeScript), App Router, Tailwind CSS 4; scaffold builds green. No accounts, auth, or profiles anywhere in the visitor experience.

## Technical Decisions

- Layering: `content/` is SSOT; `lib/` holds zod schema, loaders, search-index builder, and badge derivation; `app/` holds statically rendered server components; `components/` holds presentational UI and client islands. Routes must not import content directly; components must not import loaders or content.
- Static rendering via `generateStaticParams` for all content routes. `next.config.mjs` uses `cacheComponents: true` and `partialPrefetching: true`; every static segment must satisfy Cache Components rules. The only dynamic surface reserved is `/api/flags/*` (implemented in Epic 2). Search is not a route.
- Fixed entry vocabulary: `slug`, `kind` (`interaction` | `matchup` | `archetype-warning`), `title`, `sourceRef`, `targetRef`, `effects[]`, `conditions`, `verifiedPatch`, `patchHistory[]`. `currentPatch` lives under `content/config/`.
- Badge base state is derived at build in `lib/badges` only, from `verifiedPatch` vs `currentPatch` plus deprecation from content. Content files never persist badge/status fields. `lib/` never reads the flag store.
- Search index is generated at build by `lib/search` from the same loader output that renders pages (one loader, two consumers), and includes every entry including deprecated ones.
- RSC by default. The client-island list is closed: search input/results, flag form, mobile menu, badge-flag overlay fetcher, copy-link. No global state library.
- Slugs are kebab-case and mirrored in routes (`/heroes/[slug]`, `/interactions/[slug]`); no numeric IDs.
- Naming: kebab-case files and slugs, PascalCase components, interface types in `lib/schema`.
- Design tokens ship as CSS custom properties mapped into Tailwind 4 `@theme` in `app/globals.css`; fonts load via `next/font` (Inter, Space Grotesk, JetBrains Mono). No component library, hand-built on Tailwind. Dark-only until a later spine change.

## UX & Interaction Patterns

- Dark-only precision-tool aesthetic: warm charcoal surface ramp, parchment text, one verdigris accent for interactive/selected states only. Green/amber/rose are reserved exclusively for badge states. Tonal layering with hairline borders, no shadows, gradients, or glows. Tight radii (3/4/6px; full pill on badges).
- Entry card anatomy (top to bottom): mono effect chip, source, target, one-line condition preview truncated only at a sentence boundary, footer with badge and flag control. Whole card links to detail; hover shifts `border` to `border-strong`; deprecated cards stay unhidden.
- Badge: four states (`badge-verified`, `badge-stale` with dashed border and `· STALE` suffix, `badge-flagged`, `badge-deprecated`), always icon + word + color, mono patch stamp, 44px hit area when linked. Detail pages state "verified as of patch X.Y".
- Roster tiles are equal; selected uses `accent-dim` plus accent border; zero-entry tiles stay full opacity with "no entries yet" in `text-muted`.
- Search field: `surface` fill, `border-input` 3:1 boundary, accent focus border, `text-muted` placeholder, `aria-live` result count, results in a `surface-sunken` well.
- Home: headline, full-width search, and hero roster co-equal above the fold; featured entry cards and an archetype warning card below.
- Patch History renders in a `surface-sunken` inset well with mono rows ascending and an explicit "No recorded changes" empty state.
- Copy-link control copies the canonical URL and swaps its label to a patch-stamped citation line with an `aria-live` announcement; 44px min-height.
- Navigation: flat top bar with wordmark, Heroes/Interactions/Matchups, search, and a current-patch mono stamp; active link gets an accent underline; mobile collapses to search and menu glyphs with a single-level sheet. Icon-only controls carry `aria-label`; decorative badge glyphs are `aria-hidden`.
- Skeletons exist for roster, hero page, search, and entry detail (badge, then conditions, then history); no spinner-only screens; shimmer honors `prefers-reduced-motion`. Empty-state copy is specific ("No entries yet for {hero}.", "No matches for '{q}'."), never 404 or "coming soon".
- Accessibility floor: accent focus ring, visible focus order, 44x44 touch targets, grayscale-distinguishable badge states, complete badge phrases for screen readers, `aria-live` confirmations.
- Responsive: below 640px single column (roster 2-col, stacked detail); 640 to 1023px roster 3-col; at 1024px and above content caps at 1120px with roster 4 to 6-col.

## Cross-Story Dependencies

- 1.1 supplies schemas, loaders, badge derivation inputs, and seed data that every later story consumes.
- 1.2 supplies tokens, navigation, Badge, entry card, empty/skeleton primitives used by 1.3 through 1.6.
- 1.3, 1.4, and 1.5 build the canonical browse and detail routes; 1.6's search results must converge on those same routes.
- 1.6's search index depends on 1.1 loaders and must include entries introduced in 1.3 through 1.5.
- `badge-flagged` is rendered by 1.2 but has no runtime source in this epic; the public overlay and flag submission arrive in Epic 2, and the verification sweep in Epic 3. Epic 1 must not add dynamic routes or flag transport.
