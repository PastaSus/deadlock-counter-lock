---
title: 'Story 2.1: Flag API with rate limit and dedupe'
type: 'feature'
created: '2026-11-16'
baseline_commit: '9ce3117b0dabdd92422dcf40ec303d7cea1699db'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Visitors cannot report stale counterplay. There is no runtime endpoint to accept, validate, dedupe, or store flags, so static badges can never upgrade to `flagged` and the editor has no backlog. Story 2.1 builds the accountless flag API that Stories 2.2 and 2.3 consume.

**Approach:** Add `POST /api/flags` accepting `{ entrySlug, verdict, note? }` with no auth, backed by an env-configured KV store (Upstash Redis REST preferred) with server-side rate limiting and dedupe, plus a public `GET /api/flags/overlay` returning flagged slugs. All responses use the AD-9 `{ ok, data?, error? }` envelope.

## Boundaries & Constraints

**Always:** Validate with zod v4: `entrySlug` kebab-case, `verdict` `"verified" | "outdated"`, optional `note` trimmed to 200 chars. Persist `{ id, entrySlug, verdict, note?, createdAt, status: "pending" }` (AD-3). Rate limit 5 requests per 30s per `visitorHash`. Dedupe `entrySlug + visitorHash` for 60s and return the existing flag with code `DUPLICATE`. Compute `visitorHash` server-side as SHA-256 of IP + user-agent; never store the raw IP. Errors return `ok: false` with a machine-readable `error.code` and never report success. `GET /api/flags/overlay` is public, returns `{ flaggedSlugs }` for pending `outdated` flags, and calls `connection()` so it runs per request under Cache Components. Use Upstash REST via `fetch` with `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; fall back to an in-memory adapter when env is absent so local dev and tests run. Keep runtime code in `lib/flags/` and routes in `app/api/flags/`.

**Never:** No auth, cookies, sessions, or accounts (NFR6). No database migration, file backlog, or new npm dependency. No `GET /api/flags/backlog` (Epic 3). No flag-control or badge-overlay UI wiring (Stories 2.2/2.3). No `"use client"`. No `export const dynamic` config under Cache Components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| VALID_VERIFIED | `{ entrySlug: "sleep-dagger-vs-lash-ult", verdict: "verified" }` | 201, `ok: true`, pending flag persisted | N/A |
| VALID_OUTDATED | `{ entrySlug: "slowing-hex-vs-danny", verdict: "outdated" }` | 201, `ok: true`, flag persisted and slug added to overlay | N/A |
| MISSING_VERDICT | `{ entrySlug: "..." }` | 400, `ok: false`, `VALIDATION_ERROR`, no write | Validation |
| INVALID_VERDICT | `{ entrySlug: "...", verdict: "maybe" }` | 400, `ok: false`, `VALIDATION_ERROR`, no write | Validation |
| RATE_LIMITED | 6th request in 30s from one visitorHash | 429, `ok: false`, `RATE_LIMITED` | Retry after window |
| DUPLICATE | Same entrySlug + verdict + visitorHash within 60s | 409, `ok: false`, `DUPLICATE`, existing flag in `data.flag`, no new record | Idempotent |
| OVERLAY | `GET /api/flags/overlay` after an outdated flag | 200, `ok: true`, `data.flaggedSlugs` includes the slug | N/A |
| OVERLAY_EMPTY | No flags stored | 200, `ok: true`, `data.flaggedSlugs: []` | N/A |

</frozen-after-approval>

## Code Map

- `lib/schema/index.ts` -- existing zod v4 patterns (`slugSchema`, `strictObject`); reuse `slugSchema` for `entrySlug`.
- `lib/flags/schema.ts` -- new: `flagVerdictSchema`, `flagSubmissionSchema`, `FlagRecord` type.
- `lib/flags/store.ts` -- new: `FlagStore` interface, Upstash REST adapter via `fetch`, in-memory adapter, `createMemoryStore`, `getDefaultStore`, `setFlagStore` test override, `resetMemoryStore`.
- `lib/flags/index.ts` -- new: `hashVisitor`, `submitFlag`, `getFlaggedSlugs`, key constants, rate-limit/dedupe constants.
- `app/api/flags/route.ts` -- replace broken WIP: `POST` only, validate, hash visitor, map result to envelope/status.
- `app/api/flags/overlay/route.ts` -- new: public `GET`, `await connection()`, return `{ ok, data: { flaggedSlugs } }`.
- `app/lib/flags.ts`, `app/schemas/flagSchema.ts` -- broken WIP (missing `moment-timezone`, zod `.errors`, wrong folders); delete both.
- `components/flag-control.tsx` -- existing client-island stub with `already-counted` / `rate-limited` states; do not wire it in this story.
- `next.config.mjs` -- `cacheComponents: true`; do not add `dynamic` configs.
- `package.json` / `scripts/test-flags.ts` -- add `test:flags` using the existing `tsx` script pattern.

## Tasks & Acceptance

**Execution:**
- [x] `lib/flags/schema.ts` -- define the zod submission schema, verdict enum, and record type -- single source for validation.
- [x] `lib/flags/store.ts` -- implement the KV interface, Upstash REST adapter, in-memory adapter, and test override -- supports env and local/test runs.
- [x] `lib/flags/index.ts` -- implement visitor hashing, rate limit, dedupe, submit, overlay, and key constants -- owns AD-3/AD-9 behavior.
- [x] `app/api/flags/route.ts` -- implement `POST` with validation, rate-limit/dedupe results, and envelope mapping -- exposes the API.
- [x] `app/api/flags/overlay/route.ts` -- implement the public overlay `GET` with `connection()` -- feeds Story 2.3.
- [x] `scripts/test-flags.ts` + `package.json` -- cover every matrix row through the route handlers with a memory store -- verifies behavior.
- [x] Delete `app/lib/flags.ts` and `app/schemas/flagSchema.ts` -- remove the non-conformant WIP.

**Acceptance Criteria:**
- Given a valid `verified` or `outdated` submission, when `POST /api/flags` is called, then a pending flag is persisted and returned in the envelope.
- Given a missing/invalid verdict or malformed `entrySlug`, when `POST` is called, then 400 `VALIDATION_ERROR` is returned and nothing is written.
- Given 6 submissions in 30s from one visitor, when the 6th arrives, then 429 `RATE_LIMITED` is returned.
- Given a duplicate `entrySlug + verdict` from the same visitor within 60s, when `POST` is called, then 409 `DUPLICATE` returns the existing flag and no second record is written.
- Given a pending outdated flag, when `GET /api/flags/overlay` is called, then its slug appears in `flaggedSlugs`; with no flags the array is empty.
- Given KV env vars are absent, when the API runs locally or under test, then the in-memory adapter provides the same behavior.
- Given any visitor with no auth, when they call either route, then requests are accepted or rejected only by validation, rate-limit, or dedupe.

## Implementation Notes

- Dedupe key follows AD-3 (`entrySlug + visitorHash`), broader than the matrix's same-verdict example: a visitor who changes verdict within 60s receives the existing flag as `DUPLICATE`.
- Rate-limit and dedupe are read-modify-write against the KV adapter, so concurrent requests can race. Atomic `INCR`/`SET NX` is a follow-up if abuse volume grows.
- Overlay uses per-slug marker keys read with `KEYS flags:overlay:*`; fine at this corpus size, but a Redis set is preferable if the overlay grows.
- Upstash adapter is implemented but not exercised against a live instance (no credentials); tests use the in-memory adapter.
- Overlay `connection()` is wrapped so direct route-handler tests can run outside a Next request scope.
- Update after review: rate limiting now uses atomic `INCR`/`EXPIRE` and dedupe uses `SET NX`; record reads validate with `flagRecordSchema`; partial Upstash config throws; Upstash fetches time out after 2s; overlay responses set `Cache-Control: no-store`; the overlay rethrows prerender deferrals so Next handles them.
- Verified: `pnpm test:flags` 20/20 PASS, `pnpm lint` clean, `pnpm build` succeeds with `/api/flags` and `/api/flags/overlay` dynamic.

## Verification

**Commands:**
- `pnpm test:flags` -- all matrix rows PASS.
- `pnpm lint` -- no errors.
- `pnpm build` -- build succeeds with no Cache Components violations.

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Dedupe excludes verdict, so a verdict change within 60s is dropped (blind-hunter, verification-gap) | false | none | AD-3 and the spec's Always define dedupe as `entrySlug + visitorHash`; the same-verdict matrix row is a subset, not a competing rule. The behavior is intended. |
| Cross-verdict dedupe is untested (verification-gap) | medium | patch | A regression that adds verdict to the key would pass the suite. Add a test pinning 409, one record, and an unchanged overlay. |
| Rate limit before dedupe counts duplicate taps (blind-hunter) | false | none | Sustained attempts, including duplicate taps, are meant to rate-limit; five double-clicks in 30s is abuse. |
| Validation before rate limit lets malformed bodies bypass quota (blind-hunter, edge-case-hunter) | low | reject | Invalid requests write nothing and the fix needs a route refactor; platform-level DoS protection covers the residual risk. |
| `hashVisitor` concatenates IP and UA without a delimiter (blind-hunter, edge-case-hunter, verification-gap) | low | patch | Distinct pairs can collide. Add a delimiter and pin the exact digest. |
| `hashVisitor` is unsalted (blind-hunter) | low | defer | A salt needs a secret and rotation decision; hashing IP+UA is the accepted baseline for this story. |
| `getClientIp` trusts `x-forwarded-for` and shares an `"unknown"` bucket (blind-hunter, edge-case-hunter, verification-gap) | medium | defer | Spoofing depends on the deployment proxy; the spec does not define trusted proxies. Add header-fallback tests now and revisit proxy trust with deployment. |
| No `entrySlug` existence check (blind-hunter) | low | defer | The runtime route has no content registry; Story 2.2 supplies real slugs and the overlay ignores unknown slugs. |
| `flagRecordSchema` is unused and reads are cast (blind-hunter) | low | patch | Validate records on read; treat invalid records as missing and clear the dedupe key. |
| Overlay marker keys have no TTL and ignore review status (blind-hunter) | low | defer | The review and close path is Epic 3; the marker must be removed there. |
| Overlay uses `KEYS` on every request and has no cache directive (blind-hunter) | low | patch/defer | Add `Cache-Control: no-store`; `KEYS` is acceptable at this corpus size and should become a Redis set if the overlay grows. |
| Input size is unbounded; `entrySlug` has no max length (blind-hunter, edge-case-hunter) | medium | patch | Cap the flag submission slug at 100 chars; platform limits cover the raw body. |
| Partial writes can orphan a record or miss the overlay (blind-hunter, edge-case-hunter) | low | patch | Use atomic `SET NX` for dedupe and delete the dedupe key if the record or overlay write fails. |
| Rate-limit and dedupe are not atomic under concurrency (blind-hunter, edge-case-hunter) | medium | patch | Concurrent double-taps can create two records and concurrent spam can exceed 5/30s. Use atomic `INCR`+`EXPIRE` for the limit and `SET NX` for dedupe. |
| Window expiry and `Retry-After` are not observed (verification-gap) | medium | patch | Tests run in milliseconds. Seed expired counters and dedupe keys, then assert recovery and a known `Retry-After`. |
| 500 `INTERNAL_ERROR` paths are untested (verification-gap) | medium | patch | Add a failing-store stub and assert 500 with `ok:false` for POST and GET. |
| `x-real-ip` and headerless identity plus exact SHA-256 are untested (verification-gap) | medium | patch | Add route checks for the fallbacks and a known digest assertion. |
| Multiple overlay slugs/order, strict extra fields, and empty/200-char notes are untested (blind-hunter, verification-gap) | low | patch | Add focused checks; these are cheap and pin the contract. |
| Upstash adapter is unexercised (verification-gap, blind-hunter) | medium | defer | No credentials or emulator are available; a mocked fetch would not verify the REST contract. |
| Upstash `fetch` has no timeout (edge-case-hunter) | medium | patch | A hung KV call hangs the route. Add an abort timeout. |
| Partial Upstash config silently uses memory (blind-hunter, edge-case-hunter) | medium | patch | Throw when only one of URL or TOKEN is set; keep the memory fallback when both are absent. |
| `connection()` swallow can bypass the envelope (edge-case-hunter) | low | patch | Wrap the whole overlay handler so any `connection()` failure returns the 500 envelope. |
| Whitespace-only note persists as an empty string (edge-case-hunter) | low | patch | Transform trimmed empty to `undefined`. |
| Error codes are hardcoded; only the first zod issue is returned; `data` and `error` coexist (blind-hunter) | low | reject | The envelope and DUPLICATE `data` are specified; stable string codes are sufficient and UI copy needs one message. |
| Stub submits `"correct"` while the API accepts `"verified"` (blind-hunter) | false | none | The stub is unwired local state; Story 2.2 maps the labels to the API verdicts. |
| Spec status `in-review` while sprint-status says `in-progress` (blind-hunter, verification-gap) | false | none | Expected mid-review; step-05 syncs sprint status. |
| `story_location` block-scalar change is unrelated (blind-hunter) | false | none | Pre-existing working-tree YAML formatting, not caused by this story. |
| No `.env.example` or README docs (blind-hunter) | low | defer | Documentation was not in scope; add it with deployment setup. |
| `test:flags` is not wired into CI (blind-hunter) | low | defer | The repo has no CI configuration. |
| `setFlagStore` and `resetMemoryStore` are production exports (blind-hunter) | low | patch | Remove the unused `resetMemoryStore`; keep `setFlagStore` as the documented test seam. |
| `waitForRequestScope` swallows an error and request-time is untested (blind-hunter, verification-gap) | low | defer | Direct handler tests cannot create a request scope; add a build or integration assertion later. |
| Deletion task has no diff evidence (blind-hunter) | false | none | The deleted files were untracked WIP, so absence from the diff is expected. |
| Em dash in the frozen attribute (blind-hunter) | false | none | BMAD template boilerplate, not authored prose; changing it would deviate from the template. |
| Verification section lacks recorded results (blind-hunter) | low | patch | Record `pnpm test:flags`, `pnpm lint`, and `pnpm build` outcomes in Implementation Notes. |
