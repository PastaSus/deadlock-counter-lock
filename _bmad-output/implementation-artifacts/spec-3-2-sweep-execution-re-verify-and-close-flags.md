---
title: 'Story 3.2: Sweep execution: re-verify and close flags'
type: 'feature'
created: '2026-11-19'
baseline_commit: '9f4069c305edbef109a9a88e8b577cc6dc1f17c6'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The editor can list pending flags with age via the backlog surface (Story 3.1), but has no way to act on them. There is no endpoint to move a flag from `pending` to `reviewed`, so flags can never be closed and the "no flag older than one Patch Cycle unreviewed" rule cannot be enforced.

**Approach:** Add a secret-guarded `POST /api/flags/review` endpoint that accepts `{ id }`, validates the editor secret, marks the matching pending flag as `reviewed` in KV, and returns the standard JSON envelope. Pair it with a `reviewFlag` store helper and a test suite covering the auth matrix, state transition, and edge cases. This is the write path that Story 3.1's read path depends on.

## Boundaries & Constraints

**Always:** Require `EDITOR_SECRET` as `Authorization: Bearer <secret>`; reject missing or invalid secrets with `401` and `{ ok: false, error: { code: "UNAUTHORIZED" } }`; fail closed with `500` when the secret is not configured. Only transition records whose `status` is `pending` to `reviewed`; return `404` when the flag id does not exist or is not pending. Use the standard `{ ok, data?, error? }` envelope. Set `Cache-Control: no-store`. Force the route dynamic with `await connection()` and rethrow the prerender rejection exactly as the overlay route does. Compare secrets in constant time. No editor UI, new page, or client island. No auth, cookies, or accounts. No changes to the flag record shape, store interface, GET contract, overlay contract, or content. No new npm dependency. No secret in a response, log line, or query string.

**Never:** No status reads beyond the single flag being reviewed. No bulk review. No content file changes (that is the sweep's editorial step, separate from the API). No change to existing tests except adding the new suite.

## Code Map

- `lib/flags/index.ts` -- add `reviewFlag(id, store?)` using `store.get`/`store.set` and `flagRecordSchema.safeParse`; transition `pending` → `reviewed` only; do not change existing exports or behavior.
- `lib/flags/editor-auth.ts` -- reuse `authorizeEditor`, `readEditorSecret`, `extractBearerSecret`, `secretsMatch`; no changes needed.
- `app/api/flags/review/route.ts` -- new route mirroring backlog's `await connection()` + auth-before-store pattern, returns `401 UNAUTHORIZED`, `500 INTERNAL_ERROR` when unset, `404` when flag missing/not pending, `200` with reviewed flag on success, `no-store` on every response.
- `scripts/test-flag-review.ts` -- new test suite covering auth matrix, pending→reviewed transition, 404 for missing/already-reviewed, store failure, connection failure, prerender rethrow, no-store header; `package.json` adds `test:flag-review`.

## Tasks & Acceptance

**Execution:**
- [x] `lib/flags/index.ts` -- add `reviewFlag` function that transitions a pending flag to reviewed -- sole write path for flag status
- [x] `app/api/flags/review/route.ts` -- create POST route guarded by editor secret, calls `reviewFlag`, returns standard envelope -- public write surface for closing flags
- [x] `scripts/test-flag-review.ts` -- add test suite covering every matrix row -- verify auth and state transition behavior
- [x] `package.json` -- add `test:flag-review` script -- expose the new suite via npm

**Acceptance Criteria:**
- Given a valid editor secret and a pending flag id, when POST /api/flags/review is called, then the flag's status becomes `reviewed` and the response returns `200 { ok: true, data: { flag: { ..., status: "reviewed" } } }`
- Given a missing or wrong secret, when POST /api/flags/review is called, then the response returns `401` with `UNAUTHORIZED` and no data
- Given `EDITOR_SECRET` unset, when POST /api/flags/review is called, then the response returns `500` with `INTERNAL_ERROR`
- Given a nonexistent or already-reviewed flag id, when POST /api/flags/review is called, then the response returns `404`
- Given a store failure, when POST /api/flags/review is called, then the response returns `500` with `INTERNAL_ERROR` and `no-store`
- Every response sets `Cache-Control: no-store`

</frozen-after-approval>

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

## Verification

**Commands:**
- `npm run test:flag-review` -- expected: every matrix row PASS.
- `npm run test:flags` -- expected: 20/20 PASS (unchanged).
- `npm run test:flag-control` -- expected: 26/26 PASS (unchanged).
- `npm run test:flag-overlay` -- expected: 19/19 PASS (unchanged).
- `npm run test:flag-backlog` -- expected: 26/26 PASS (unchanged).
- `npm run lint` -- expected: no errors.
- `npm run build` -- expected: green; only `/api/flags`, `/api/flags/overlay`, `/api/flags/backlog`, and `/api/flags/review` are dynamic.

**Manual checks (if no CLI):**
- With `EDITOR_SECRET` set, call the review endpoint with a valid pending flag id and confirm status becomes `reviewed`.
- Repeat without the secret and with a wrong secret; both must return `401` and no data.
- Call with a nonexistent id and an already-reviewed id; both must return `404`.
- Clear `EDITOR_SECRET` and confirm the route fails closed with `500`.
