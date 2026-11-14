# Counterlock PRD: Addendum

Supporting depth for architecture/UX. Captured during PRD creation, 2026-11-14.

## Flag Mechanism Options (decision deferred to architecture)

| Option | Pros | Cons |
|---|---|---|
| API route → simple store (KV/SQLite) | Queryable backlog; first-party; no vendor | Needs hosting of a dynamic endpoint |
| Third-party form (Tally/Google Forms) | Zero backend | Backlog lives off-site; spam control limited by vendor |
| Discord webhook | Community-native; free | Backlog is chat-scroll; hard to audit/age flags |

**Preference:** API route → simple store, because FR-12 (sweep aging: "no flag older than one patch cycle unreviewed") is easiest to audit with queryable flags. Non-blocking for UX/architecture start.

## Content Model Notes (for architecture)

- Structured files in repo: one file per Entry (Interaction Record / Matchup Guidance), hero index files, roster list, current-patch constant.
- Build-time schema validation: malformed entry = build failure (FR-11).
- Patch History as ordered array of {patch, note, effect-change} within each Entry file.
- Flag Backlog does NOT live in content files (flags are runtime data, entries are build-time).

## Rejected Alternatives (rationale)

- **Headless CMS / admin UI:** rejected for MVP, editorial load is one person, 25–40 records; CMS adds auth, hosting, and schema drift risk. Revisit if corpus exceeds ~100 records or a second editor joins.
- **Open submissions:** rejected per brief, curated trust is the brand; flags cover demand sensing.
- **Stat overlays (WR correlation):** rejected, cedes differentiation to Tracklock; dilutes counterplay-only filter.
- **Automated game-file patch ingestion:** rejected for MVP, fragile reverse-engineering; manual sweep is the product promise ("hand-verified").

## Search Scope Note (for architecture)

At ~25–40 records + roster, client-side search over a bundled index is sufficient; hosted search is a post-scale concern. SEO routes remain static/SSR regardless.

## UX Handoff Notes

- Hero-first is primary path; free-text search is first-class (header-level), not buried.
- Trust signal display (badge states: current / flagged-outdated / deprecated) needs consistent visual language across Views 1 and 2, feed `bmad-ux`.
- "No entries yet" roster states must be designed, not left to default 404s (FR-7).
