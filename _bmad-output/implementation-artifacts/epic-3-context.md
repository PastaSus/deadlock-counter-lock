# Epic 3 Context: Patch Verification Sweep: editor keeps trust honest

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic closes the trust loop for the site's editor. After each game patch, the editor needs to see all pending community flags (with their age) and work through them: re-verify flagged and stale entries in the repo content, ship the corrected content through the normal build, and close the flags. Success means no flag outlives a Patch Cycle, and every visible badge reflects the current patch or is explicitly deprecated. The work is a small secret-guarded operational surface (backlog read plus a review write endpoint) layered on the existing flag API, plus the editorial content workflow it supports. It deliberately does not introduce an admin UI, accounts, or automated patch ingestion.

## Stories

- Story 3.1: Flag backlog surface
- Story 3.2: Sweep execution: re-verify and close flags

## Requirements & Constraints

- The editor can review pending flags and re-verify entries per patch: update verification state, badges, patch history, and deprecations.
- The backlog must expose flag age so the "no flag older than one Patch Cycle unreviewed" rule is auditable.
- After a sweep, no entry may carry a badge older than the current patch without an explicit stale or deprecated marker.
- A flag older than one Patch Cycle must never remain silently pending; it must be explicitly re-triaged rather than dropped.
- Backlog access requires a server-validated editor secret; unauthenticated requests are rejected. Backlog review is a manual editorial process; no tooling beyond repo file editing is in scope.
- Error responses must never report success; flag writes and reads are rate-limited and deduped server-side where applicable.
- Content edits remain content-only: no DB migration, and malformed content fails the build with a clear error rather than shipping.
- Any user-facing copy the editor adds or touches follows the trusted-scout voice: plain, specific, patch-stamped, never hype or error codes.

## Technical Decisions

- **Backlog endpoint:** `GET /api/flags/backlog` returns pending flags as `{ id, entrySlug, verdict, note, createdAt, age }[]`, sorted oldest-first, so the oldest unreviewed flag is always first. Guarded by `EDITOR_SECRET`; responses use the standard `{ ok, data?, error? }` envelope.
- **Review endpoint:** `POST /api/flags/review` with `{ id }` (secret-guarded) is the sole path that moves a flag from `pending` to `reviewed`. No other route or client writes flag status.
- **Flag ownership:** all flag reads/writes live in `/api/flags/*`; no other route touches the flag KV store. The stored flag record is `{ id, entrySlug, verdict: "verified" | "outdated", note?, createdAt, status: "pending" | "reviewed" }`. Review status lives only in KV, never in content files.
- **Freshness is build-derived:** badge base state is computed at build from `entry.verifiedPatch` versus the single `currentPatch` content constant; content persists only the optional `deprecated` boolean. `deprecated: true` requires a non-empty `patchHistory` or the build fails. Runtime flags layer on top separately (via the public overlay) and never compute freshness.
- **Content is the source of truth:** sweep edits change `content/` files (`verifiedPatch`, `patchHistory`, `deprecated`, plus related record fields), then ship through the normal build/deploy. Build-time schema validation and reference resolution gate every change.
- **Provider/environment:** flag storage is a KV provider (Upstash Redis preferred; Vercel KV is excluded). Environment supplies KV connection vars and `EDITOR_SECRET`. The app is a Vercel-compatible Next.js App Router deployment with content served statically and `/api/flags/*` as the only dynamic surface.
- **Overlay behavior:** only pending `outdated` verdicts surface as flagged on the public site; reviewed flags disappear from the overlay, so closing a flag via review is what clears the visible flagged state.
- **Conventions:** kebab-case files and slugs, PascalCase components, shared interface types in `lib/schema`, ISO-8601 dates, patch format `X.Y`, JSON envelope on all API responses.

## UX & Interaction Patterns

- No dedicated editor UI or route; the editor works via the secret-guarded endpoint output and repo content files.
- Sweep is post-patch and produces no visitor-facing interaction change beyond refreshed badge stamps, patch history, and deprecation labels.
- Microcopy tone for any copy the editor adds: trusted scout, patch-stamped and direct (e.g. "verified as of patch X.Y", "Deprecated: see patch history"), never marketing hype, emoji-heavy, or raw technical errors.
- Deprecated entries stay published and fully readable at their canonical URL with a distinct deprecated label and patch note; they are never deleted or hidden.

## Cross-Story Dependencies

- Depends on Epic 2: flag submission, the flag record shape, KV storage, the overlay, and the existing `/api/flags` route conventions. Without pending flags there is no backlog to sweep.
- Depends on Epic 1: content schema and build validation, the `currentPatch` constant, build-time badge derivation, patch history, and the editorial content files that the sweep edits.
- Internal ordering: Story 3.2 consumes the backlog surface from Story 3.1 and the review endpoint contract; the sweep cannot be audited without the age-exposing backlog.
- Story 3.2's badge refresh is visible only after the next build/deploy, tying editorial content changes to the deploy pipeline rather than any runtime mechanism.
