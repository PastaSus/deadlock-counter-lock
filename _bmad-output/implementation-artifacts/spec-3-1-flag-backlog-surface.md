---
title: 'Story 3.1: Flag backlog surface'
type: 'feature'
created: '2026-11-19'
baseline_commit: '303b31e58b0c42cc6014c21f622a07bac9559df5'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The flag API stores pending flags and the public overlay exposes only outdated verdicts, but the editor has no way to list pending flags with age. The rule "no flag older than one Patch Cycle unreviewed" cannot be audited, and Story 3.2 has no backlog surface to sweep.

**Approach:** Add a secret-guarded `GET /api/flags/backlog` that scans the flag records, returns only pending flags oldest-first with age, and uses the standard JSON envelope. Put the read projection in a tested helper and the secret check in a timing-safe server-only helper. No editor UI or page.

## Boundaries & Constraints

**Always:** Require `EDITOR_SECRET` supplied as `Authorization: Bearer <secret>`; reject missing or invalid secrets with `401` and `{ ok: false, error: { code: "UNAUTHORIZED" } }`; fail closed with `500 INTERNAL_ERROR` when the secret is not configured. Return only records whose `status` is `pending`. Sort oldest-first by `createdAt`, tie-break by `id`. Return `{ ok: true, data: { flags: [{ id, entrySlug, verdict, note, createdAt, age }] } }` with `note` as `string | null` and `age` as a non-negative integer number of seconds. Set `Cache-Control: no-store`. Force the route dynamic with `await connection()` and rethrow the prerender rejection exactly as the overlay route does. Compare secrets in constant time. Skip records that fail `flagRecordSchema.safeParse`, and keep the rest.

**Never:** No editor UI, new page, or client island. No auth, cookies, or accounts. No changes to the flag record shape, store interface, POST contract, overlay contract, or content. No status writes (that is Story 3.2). No new npm dependency. No secret in a response, log line, or query string. No backlog rate limiting in this story (the secret is the control and traffic is low volume). No change to existing tests except adding the new suite.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| AUTH_OK | Valid `Authorization: Bearer <secret>` and pending flags | `200 { ok: true, data: { flags: [...] } }`, oldest-first, each item carries `age` in seconds | N/A |
| AUTH_MISSING | No secret supplied | `401` envelope with `UNAUTHORIZED` | Reject, no data |
| AUTH_WRONG | Wrong secret | `401` envelope with `UNAUTHORIZED` | Reject, no data |
| SECRET_UNSET | `EDITOR_SECRET` missing or empty | `500` envelope with `INTERNAL_ERROR` | Fail closed |
| EMPTY | No pending flags | `200` with an empty list | N/A |
| REVIEWED_ONLY | Only reviewed records | `200` with an empty list | N/A |
| BOTH_VERDICTS | Pending `verified` and `outdated` records | Both returned with `verdict` preserved | N/A |
| NO_NOTE | Pending record without a note | Item has `note: null` | N/A |
| MALFORMED_RECORD | A stored record fails the schema | That record is skipped; the rest return | Log one warning, never fail the request |
| SORT_AGE | Several pending records | Oldest `createdAt` first; `age` is a non-negative integer number of seconds | N/A |
| NO_STORE | Any response | `Cache-Control: no-store` | N/A |

</frozen-after-approval>

## Code Map

- `lib/flags/index.ts` -- owns flag reads and `FLAG_RECORD_KEY_PREFIX`; add `BacklogFlag` and `getPendingFlags(now?, store?)` using `store.keys`/`store.get` and `flagRecordSchema.safeParse`; do not change existing exports or behavior.
- `lib/flags/editor-auth.ts` -- new server-only helper: read the configured secret, extract the supplied secret from the request, and compare with `node:crypto` `timingSafeEqual` (hash both values first so lengths never throw); imported only by the route and its test.
- `app/api/flags/backlog/route.ts` -- new `GET(request)`: `await connection()`, authorize, call `getPendingFlags`, return the envelope with `no-store`, and rethrow the prerender rejection.
- `app/api/flags/overlay/route.ts` -- reference for `connection()`, `NO_STORE_HEADERS`, the envelope, and the prerender-rejection branch; do not change.
- `app/api/flags/route.ts` -- reference for the error envelope and status-code style; do not change.
- `lib/flags/schema.ts` -- `flagRecordSchema`, `FlagRecord`, `FlagVerdict`; do not change.
- `lib/flags/store.ts` -- `FlagStore.keys` and `FlagStore.get`; do not change.
- `scripts/test-flags.ts` -- request-scope harness pattern (`loadRoutes`, `runInRequestScope`, `makeRequest`); mirror it, do not modify.
- `scripts/test-flag-backlog.ts` -- new suite covering every matrix row, the auth paths, and the real route envelope.
- `package.json` -- add `test:flag-backlog` using the existing `tsx` pattern.

## Tasks & Acceptance

**Execution:**
- [x] `lib/flags/index.ts` -- add `BacklogFlag` and `getPendingFlags` (filter pending, sort, project `note` and `age`, skip malformed) -- one tested read path for the route.
- [x] `lib/flags/editor-auth.ts` -- add timing-safe secret validation with a fail-closed unset case -- no secret leaks and no timing oracle.
- [x] `app/api/flags/backlog/route.ts` -- add the guarded `GET` with the standard envelope and `no-store` -- delivers the backlog surface.
- [x] `scripts/test-flag-backlog.ts` + `package.json` -- cover the matrix, the auth paths, and the real route -- pins the contract.

**Acceptance Criteria:**
- Given `EDITOR_SECRET` configured, when an authorized request hits `GET /api/flags/backlog`, then pending flags return oldest-first with age in the standard envelope (FR12, AD-3, NFR8).
- Given a missing or wrong secret, then the request is rejected with `401` and no flag data (NFR8).
- Given no pending flags or only reviewed flags, then the response is an empty list (FR12, AD-3).
- Given pending flags of both verdicts, then both are returned with their verdict intact (FR12).
- Given a malformed stored record, then it is skipped and the remaining pending flags still return (AD-9).
- And every response is `no-store`, and only `/api/flags/*` remains dynamic (AD-4, AD-9).

## Implementation Notes

- `getPendingFlags(now?, store?)` reads every `flags:records:*` key in parallel, validates each with `flagRecordSchema.safeParse`, skips malformed records with one warning per record, keeps only `pending`, projects `note` as `string | null`, computes `age` as `Math.max(0, floor((now - createdAt) / 1000))`, and sorts by `createdAt` then `id`.
- `lib/flags/editor-auth.ts` parses a case-insensitive `Bearer` token, hashes both values with SHA-256 before `timingSafeEqual`, and returns `unconfigured` for a missing or empty `EDITOR_SECRET`. The route checks authorization before any store read.
- `app/api/flags/backlog/route.ts` mirrors the overlay's `await connection()` and prerender-rejection rethrow, returns `401 UNAUTHORIZED` for missing or wrong secrets, `500 INTERNAL_ERROR` when unset or on a store failure, and `no-store` on every response.
- `scripts/test-flag-backlog.ts` adds 20 checks covering every matrix row, the auth helper units, the auth-before-store ordering, the real route envelope, a store failure, and a connection failure. `package.json` adds `test:flag-backlog`.
- Review patches: `getPendingFlags` treats a null `get` as a vanished record rather than a malformed one, and `readEditorSecret` trims the expected secret so a padded env var cannot lock the editor out. The suite grew to 26 checks to pin the prerender rethrow, `entrySlug`/`note`/`createdAt` passthrough, the future-age clamp, the vanished-key skip, and padded secret normalization.

## Spec Change Log

## Review Triage Log

## Design Notes

The backlog is a read projection over the existing record keys, so it adds no store method and no second source of truth. `age` is derived from `createdAt` at request time, which keeps the stored record unchanged and lets the value reflect the current clock. The secret check runs before any store read, so an unauthorized request never touches the flag store. Comparing hashed values avoids `timingSafeEqual` length errors and keeps the comparison constant-time for equal-length digests.

## Verification

**Commands:**
- `npm run test:flag-backlog` -- expected: every matrix row PASS.
- `npm run test:flags` -- expected: 20/20 PASS (unchanged).
- `npm run test:flag-control` -- expected: 26/26 PASS (unchanged).
- `npm run test:flag-overlay` -- expected: 19/19 PASS (unchanged).
- `npm run lint` -- expected: no errors.
- `npm run build` -- expected: green; content routes stay static or partially prerendered and only `/api/flags`, `/api/flags/overlay`, and `/api/flags/backlog` are dynamic.

**Results (2026-11-19):**
- `npm run test:flag-backlog` -- PASS, 26/26. Review added coverage for the prerender rethrow, `entrySlug`/`note`/`createdAt` passthrough, the future-age clamp, the vanished-key skip, and padded secret normalization.
- `npm run test:flags` -- PASS, 20/20.
- `npm run test:flag-control` -- PASS, 26/26.
- `npm run test:flag-overlay` -- PASS, 19/19.
- `npm run lint` -- PASS, no output.
- `npm run build` -- PASS, 61 pages generated; only `/api/flags`, `/api/flags/overlay`, and `/api/flags/backlog` are dynamic, and content routes stay static or partially prerendered.

**Manual checks (if no CLI):**
- With `EDITOR_SECRET` set, call the backlog with `Authorization: Bearer <secret>` and confirm pending flags are oldest-first with age.
- Repeat without the secret and with a wrong secret; both must return `401` and no data.
- Clear `EDITOR_SECRET` and confirm the route fails closed with `500`.
