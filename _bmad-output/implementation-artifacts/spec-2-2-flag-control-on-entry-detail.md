---
title: 'Story 2.2: Flag control on entry detail'
type: 'feature'
created: '2026-11-17'
baseline_commit: '2aa5e8da264d11b5406f472d729a830c58f4de3b'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Entry detail pages render a `FlagControl` stub that takes no `entrySlug`, never calls the network, and always claims success. The Story 2.1 flag API exists, but visitors still cannot report that counterplay is still correct or outdated, so no flag reaches the backlog.

**Approach:** Make `FlagControl` a working client island that receives `entrySlug`, lets a visitor pick "Still correct" or "Outdated", optionally add a one-line note, and submits to `POST /api/flags`. It swaps in place to the specified confirmation, duplicate, rate-limited, or error copy, and announces state changes via `aria-live="polite"`. Put the response-to-outcome mapping in a pure, client-safe module so it can be unit-tested without a DOM.

## Boundaries & Constraints

**Always:** Render on both entry detail routes (`/interactions/[slug]` and `/matchups/[slug]`) in its own row directly below Patch History, leaving Copy link in the badge row. Accountless; no modal, redirect, or account prompt. Verdict mapping is "Still correct" → `verified`, "Outdated" → `outdated`. Submit `{ entrySlug, verdict, note? }`; trim the note and omit it when empty; cap it at 200 characters. Only a `2xx` response with `ok: true` may claim success. Map `409 DUPLICATE` to "Already counted, thanks.", `429 RATE_LIMITED` to "Slow down, you've already flagged this recently.", and every other failure (validation, 5xx, network, unparseable body) to "Couldn't send. Try again." shown in `text-error`/`border-error` (never a fill) with the control left enabled for retry. Confirmation is "Flagged. Thanks, it's in the review queue." Control is fully keyboard-operable, every control is at least 44px min-height, uses the `border-input` boundary and existing tokens, and the island stays within AD-6's closed list.

**Never:** No API, schema, store, or badge changes; no overlay wiring (Story 2.3); no auth, cookies, or accounts; no new npm dependency; no flag controls on cards, roster, or search results; no absolute API URL (use the relative `/api/flags`); no restyling of existing components; no persisted flag state in content.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| SUBMIT_OUTDATED | Tap "Outdated", then Submit | `POST /api/flags` with `verdict: "outdated"`; 201 `ok: true` swaps to the success line | N/A |
| SUBMIT_VERIFIED | Tap "Still correct", then Submit | `POST` with `verdict: "verified"`; success line | N/A |
| NOTE_INCLUDED | One-line note entered | Payload includes the trimmed note; input caps at 200 characters | N/A |
| EMPTY_NOTE | No note entered | Payload omits `note` entirely | N/A |
| DUPLICATE | 409 `DUPLICATE` | Static "Already counted, thanks." line | Idempotent, no retry |
| RATE_LIMITED | 429 `RATE_LIMITED` | Static "Slow down, you've already flagged this recently." line | No account prompt |
| VALIDATION_ERROR | 400 `VALIDATION_ERROR` | Error notice, compose form still enabled | Retry allowed |
| SERVER_OR_NETWORK | 500, throw, or unparseable body | Error notice, compose form still enabled | Retry allowed |

</frozen-after-approval>

## Code Map

- `components/flag-control.tsx` -- rewrite the stub: add `entrySlug` prop, verdict selection, note field, submit, response mapping, live region; keep the existing visual language.
- `lib/flags/feedback.ts` -- new pure module (no `node:` imports): `buildFlagSubmission(entrySlug, selection, note)`, `classifyFlagResponse(status, body)`, `requestFlagSubmission` (payload, fetch, timeout, outcome with injectable fetch), and the copy strings; imported by the client island and the test script.
- `app/interactions/[slug]/page.tsx` -- static server page; add a `<FlagControl entrySlug={entry.slug} />` row directly below `PatchHistory`. Everything else stays unchanged.
- `app/matchups/[slug]/page.tsx` -- same layout; add the same `<FlagControl entrySlug={entry.slug} />` row below `PatchHistory`.
- `lib/flags/schema.ts` -- existing submission contract (`verified` / `outdated`, 200-char note); do not change.
- `app/api/flags/route.ts` -- existing `POST` and error codes (`VALIDATION_ERROR`, `DUPLICATE`, `RATE_LIMITED`, `INTERNAL_ERROR`); do not change.
- `components/copy-link.tsx` -- reference for button styling and the existing client-island pattern; do not change.
- `components/index.ts` -- already exports `FlagControl`; no change expected.
- `scripts/test-flags.ts` -- existing route-level suite pattern (assert + tsx); mirror its structure, do not modify.
- `package.json` -- add `test:flag-control` using the existing `tsx` script pattern.

## Tasks & Acceptance

**Execution:**
- [x] `lib/flags/feedback.ts` -- define the submission builder, response classifier, copy strings, and note normalization -- gives the island one tested mapping layer.
- [x] `components/flag-control.tsx` -- implement the two-step control (verdict → optional note + Submit), fetch, in-place states, retry, 44px targets, and polite announcements -- delivers the story behavior.
- [x] `app/interactions/[slug]/page.tsx` -- mount the control with `entry.slug` -- exposes the feature on interaction detail.
- [x] `app/matchups/[slug]/page.tsx` -- add the control row below `PatchHistory` -- exposes it on guidance detail.
- [x] `scripts/test-flag-control.ts` + `package.json` -- cover every matrix row and the verdict/note mapping through the pure module -- pins the contract.

**Acceptance Criteria:**
- Given an open interaction or guidance detail page, when a visitor taps "Outdated", adds an optional note, and submits, then a flag is sent without auth and the control swaps in place to "Flagged. Thanks, it's in the review queue." (FR9, UX-DR7)
- And "Still correct" submits `verdict: "verified"` while "Outdated" submits `verdict: "outdated"`.
- Given a duplicate, rate-limited, or failed submission, when the response arrives, then the matching notice replaces or accompanies the control, failures keep it enabled for retry, and no failure ever claims success (UX-DR7, UX-DR12).
- And the control, note field, and submit are keyboard-operable with 44px min-height and the `border-input` boundary, and state changes are announced via `aria-live="polite"` (UX-DR13, NFR3).
- And the detail page stays statically rendered with no new route, and the only added client island is the flag form (AD-6, AD-4).

## Implementation Notes

- `lib/flags/feedback.ts` imports only the `FlagSubmission` and `FlagVerdict` types from `./schema`, so it stays client-safe. It owns the four copy strings, `normalizeFlagNote` (trim, 200-character cap, empty becomes `undefined`), `verdictForSelection`, and `classifyFlagResponse`. The classifier claims success only for a `2xx` status whose body has `ok: true`; `409 DUPLICATE` and `429 RATE_LIMITED` require the matching status and code, and everything else returns `error`.
- `requestFlagSubmission` holds the submit wiring so it is testable without a DOM. It builds the payload, posts to the relative `/api/flags` with a 10-second abort timeout, tolerates unparseable bodies, and returns both the payload and the classified outcome. The fetch implementation is injectable, which lets the suite drive the real route handler as well as synthetic failures.
- `FlagControl` renders the verdict pair with `aria-pressed`, reveals the optional note plus Submit after a verdict is chosen, and announces notices through a wrapping `aria-live="polite"` `role="status"` region. The region shows "Sending..." while in flight and receives focus when the form unmounts on a terminal outcome. Success, duplicate, and rate-limited outcomes hide the form in place. Failures keep the form enabled and the note intact, with the notice styled `border-error`/`text-error` and no fill. All controls use `min-h-[44px]`, `border-input`, and the existing focus-ring tokens, and the form sets `aria-busy` while submitting.
- The control is mounted directly below `PatchHistory` and keyed by entry slug on both `/interactions/[slug]` and `/matchups/[slug]`, so client state resets when navigating between entries. No other page or badge was touched.
- `scripts/test-flag-control.ts` covers the pure mapping, the request wiring (endpoint, method, content type, body, note omission, timeout, thrown fetch, unparseable body, missing `ok`), and real route envelopes for `201`, `409`, `429`, `400`, and `500`. It needs no DOM or new dependency.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence | Route |
|---|---|---|---|
| Client state can survive navigation between entries and hide the new form | medium | The flag island sits in the same page slot across slug changes; a terminal notice from the previous entry could persist. | patch: keyed `FlagControl` by `entry.slug` on both pages |
| `bg-transparent` and `bg-surface-raised` conflict in the selected verdict | low | Both background utilities were emitted, so the selected background depended on CSS order. | patch: removed the shared background and made it explicit per state |
| No visible or announced in-flight state | low | The live region stayed empty while submitting and controls only grayed out. | patch: added "Sending..." copy and `aria-busy` |
| Focus falls to the body when a terminal notice unmounts the form | low | The focused Submit unmounts on success/duplicate/rate-limit. | patch: focus moves to the status region |
| Selected verdict conveyed only by color | low | `aria-pressed` already conveys selection programmatically; border, background, and text change together. A glyph would add layout churn for no additional AT value. | reject |
| Note field reveal is not focused or announced | low | The field follows the verdict buttons in DOM and tab order; forcing focus would disrupt pointer users. | reject |
| No timeout on the submit request | medium | A hung connection left the phase at `submitting` with every control disabled. | patch: 10-second abort timeout mapped to the retryable error state |
| Network errors are swallowed with no diagnostic | low | The user still receives the retry copy; client logging adds noise and no action. | reject |
| Success icon uses the reserved status color | low | Pre-existing stub styling; status colors are reserved for badges. Not introduced by this story. | defer |
| 200-character limit duplicated with the schema | low | Sharing the constant would require editing `lib/flags/schema.ts`, excluded by the frozen Never list. | reject |
| `slice` can split a surrogate pair | low | The input `maxLength` and server schema already cap at 200 code units; grapheme truncation is disproportionate. | reject |
| No character counter for the note | low | Silent capping is the specified behavior; helper text is out of scope. | reject |
| Rate-limited outcome has no retry path | false | The spec mandates a static rate-limit line and no account prompt. | false |
| `Retry-After` is discarded and failures collapse | false | The spec maps every non-duplicate/non-rate-limited failure to the single generic copy. | false |
| Submit wiring is not executed by any test | medium | No test drove payload, endpoint, fetch, and classification together; dropping the note or the wrong URL would have passed. | patch: `requestFlagSubmission` plus wiring checks |
| "Every matrix row" claim overstated the tests | low | The throw and unparseable-body paths were inspection-only. | patch: added those checks and corrected the results |
| No aggregate test script or CI | low | The repo has no CI pipeline; flag suites remain manual. | defer |
| No automated static-route regression assertion | low | Staticness is confirmed only through build output inspection. | defer |
| Spec omits extra matrix rows (double submit, hung request, paste, multibyte) | false | The fix is to edit the frozen matrix, which review must not do. | reject |
| Manual checks omit keyboard and announcement steps | false | Same: a verification-copy edit, not a code defect. | reject |
| Literal closing tag left at the end of the spec | low | A stray `</content>` remained below the manual checks. | patch: deleted the tag |
| Em dash in the frozen reason line | false | Frozen human-owned text; review cannot edit it. | reject |
| `context: []` does not link the epic context | false | The epic context loads through step-01; the context list is for additional files. | false |
| Epic context drift ("one tap", "beside copy-link") | low | The story's frozen intent chooses the two-step flow below Patch History; the epic context is compiled prose. | defer |
| Spec and review logs were empty at review | false | The review log is populated now; no spec change was required. | false |
| `sprint-status.yaml` formatting churn | low | The YAML stayed valid and behavior did not change; reverting is churn for no benefit. | reject |
| `verdictForSelection` silently defaults unknown input | false | `FlagSelection` is a two-value union; the default is unreachable and throwing would crash instead of degrade. | false |
| Page mounts and slug values are not verified | low | No render harness exists; the two-line mount is covered by build and manual checks. | defer |
| Classifier not verified against the real route | low | Client and route used separate fixtures, so a code rename could silently downgrade duplicate/rate-limited copy. | patch: real route envelopes now feed the classifier |
| Duplicate edge-case findings (timeout, submitting state, focus, throw test) | low | Same root causes as the rows above. | merged |

## Design Notes

The flow follows UJ-2: tapping a verdict does not submit immediately; it reveals the optional one-line note and a Submit control. Both verdict buttons stay visible so the visitor can switch before submitting. Success, duplicate, and rate-limit outcomes replace the control with a single static line; failures return to the compose state with the note preserved so retry is one click.

## Verification

**Commands:**
- `npm run test:flag-control` -- expected: every matrix row PASS.
- `npm run test:flags` -- expected: 20/20 PASS (API unchanged).
- `npm run lint` -- expected: no errors.
- `npm run build` -- expected: green; `/interactions/[slug]` and `/matchups/[slug]` still static.

**Results (2026-11-18, after review patches):**
- `npm run test:flag-control` -- PASS, all 26 checks passed (verdict/note mapping, request wiring and timeout, thrown/unparseable failures, classifier edge cases, and real 201/409/429/400/500 route envelopes).
- `npm run test:flags` -- PASS, all 20 flag checks passed.
- `npm run lint` -- PASS, no output.
- `npm run build` -- PASS, compiled successfully and type-checked; 60 pages generated. `/interactions/[slug]` and `/matchups/[slug]` keep their pre-existing partial-prerender treatment, `/api/flags` and `/api/flags/overlay` remain the only dynamic routes.

**Manual checks (if no CLI):**
- Open `/interactions/knockdown-vs-danny-crash`, tap "Outdated", confirm the note field and Submit appear, submit, and confirm the confirmation line.
- Tap again in a new session within 60s to see "Already counted, thanks."; submit six times in 30s to see the rate-limit copy.
