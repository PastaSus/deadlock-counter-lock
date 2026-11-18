# Epic 2 Context: Community Flagging: visitors police freshness

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Complete the visitor trust loop on top of the static lookup: let any visitor report that an entry is still correct or outdated with one tap and no account, then surface accepted outdated reports as a `badge-flagged` upgrade on otherwise static pages. This matters because curated content rots between patches, and community flags are the primary backlog input that tells the editor what to re-verify. Flags must reliably reach a single runtime store, resist spam and duplicates, and never introduce auth, a second store, or a second owner of badge freshness.

## Stories

- Story 2.1: Flag API with rate limit and dedupe
- Story 2.2: Flag control on entry detail
- Story 2.3: Flag overlay on badges

## Requirements & Constraints

- Accountless submission of "verified" or "outdated" plus an optional one-line note. No accounts, auth, or profiles anywhere in the visitor experience.
- Accepted flags persist with enough metadata to audit flag age: entry, verdict, timestamp, status.
- Duplicate submissions from the same visitor within a short rolling window are deduped, and sustained attempts are rate-limited. Both run server-side, and the error codes must be distinguishable so the UI can map them to specific copy.
- API responses use a consistent JSON envelope; failures never report success.
- The public overlay exposes only pending outdated verdicts; reviewed flags never surface. It requires no secret.
- The flag backlog requires the editor secret. The review write path is also secret-guarded and is the only way status moves from pending to reviewed.
- Only `/api/flags/*` is dynamic. All content routes stay statically rendered.
- Flag store provider is deferred: Upstash Redis is preferred; Vercel KV is sunset and must not be used. Connection env vars plus the editor secret are the only flag-related configuration.
- WCAG 2.1 AA: the flag control is fully keyboard-operable and at least 44px min-height; confirmations and state changes are announced, not conveyed by color.

## Technical Decisions

- `app/api/flags` owns every flag read and write. No other route and no client touches the KV store, and `lib/` never reads the KV store.
- Flag record shape is fixed: `{ id, entrySlug, verdict: "verified" | "outdated", note?, createdAt, status: "pending" | "reviewed" }`. Review state lives only in KV; content files never store flag state.
- Endpoints: `POST /api/flags` takes `{ entrySlug, verdict, note? }`; `GET /api/flags/overlay` publicly returns `{ flaggedSlugs: string[] }` built from pending `outdated` verdicts only; `GET /api/flags/backlog` (secret) returns pending flags with age; `POST /api/flags/review` (secret) takes `{ id }` and is the sole status write path. Story 2.1 implements submit and overlay; backlog and review ship with the Epic 3 sweep but their contract is fixed now.
- Dedupe keys on `entrySlug + visitorHash` within a rolling window; rate limiting and dedupe are enforced inside the route handler.
- `lib/badges` remains the single owner of build-derived base state (`verified` / `stale` / `deprecated`). The overlay never computes patch freshness and is layered on top as a separate read-only upgrade.
- Overlay is fetched after hydration by one client island, which upgrades `verified` or `stale` to `flagged` for slugs returned in `flaggedSlugs`. A failed fetch leaves the base badge intact; rendering never blocks and never falsely claims flagged.
- RSC is the default. The closed client-island list is: search input/results, flag form, mobile menu, badge-flag overlay fetcher, copy-link. No other `"use client"` boundary.
- Naming: kebab-case files and slugs, PascalCase components, shared interface types in `lib/schema`. Slugs, not numeric IDs.

## UX & Interaction Patterns

- Flag control: a quiet ghost button pair, "Still correct" / "Outdated", label typography in `text-secondary`, `border-input` boundary, `{rounded.md}`, 44px min-height. An optional one-line note field appears on activate. Lives on entry detail beside the copy-link control.
- Post-submit swaps in place to "Flagged. Thanks, it's in the review queue." No modal, no redirect, no celebration. A duplicate tap shows "Already counted, thanks."; sustained attempts show "Slow down, you've already flagged this recently."; a failure shows "Couldn't send. Try again." using `{colors.error}` as text and border only (never a fill), with the control left enabled for retry.
- The visitor's own submission shows the confirmation line, not the badge again. Other visitors see `badge-flagged` with the announced phrase "Community-flagged outdated, in review"; the entry stays fully readable and Patch History is unchanged until the editor sweep.
- `badge-flagged` uses the amber status family with icon + word + color always; status colors are reserved for badges and appear nowhere else.
- On detail pages focus order runs badge/conditions, then history, then flag control. Flag confirmations and badge state changes announce via `aria-live="polite"`. Never show account prompts or nags.

## Cross-Story Dependencies

- Story 2.1 provides the submit endpoint and the public overlay; 2.2 consumes the submit contract and its error codes for the control's notices; 2.3 consumes the overlay plus the Epic 1 Badge component to upgrade base badges.
- Epic 1 supplies the Badge component (including the `badge-flagged` state, rendered but unsourced until this epic), the interaction detail page, and shared `lib/schema` types. Epic 2 must not alter build-derived badge logic or add content-held flag fields.
- Epic 3 consumes the flag records, backlog, and review contract fixed here; Epic 2 must not implement the backlog UI or sweep workflow.
