---
title: "Input Reconciliation — Architecture Spine"
type: input-reconciliation
purpose: research-only extract of load-bearing inputs vs ARCHITECTURE-SPINE.md
status: final
created: 2026-11-14
updated: 2026-11-14
inputs:
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/prds/prd-deadlock-counter-lock-2026-11-14/prd.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-deadlock-counter-lock-2026-11-14/EXPERIENCE.md
  - _bmad-output/planning-artifacts/architecture/architecture-deadlock-counter-lock-2026-11-14/.memlog.md
---

# Input Reconciliation — Architecture Spine (Counterlock)

Research-only. Full extract of what landed, what partially landed, and what did not land in `ARCHITECTURE-SPINE.md`.

## 1. Verdict

**5 material gaps.** All 12 PRDs' FRs are bound and mapped; all memlog decisions are represented. The gaps are: (1) a contradiction between build-time badge derivation and runtime flag visibility, (2) an undefined flag data model, (3) an incomplete client-island enumeration that bans a UX-required component, (4) an unresolved search-surface/render-mode decision the UX already fixed, and (5) the entire design-token/delivery layer (tokens, fonts, no-component-library, dark-only) having no AD home.

## 2. What landed cleanly (no action)

| Input item | Spine home |
| --- | --- |
| PRD FR-1…FR-12 all bound + mapped | frontmatter `binds` (spine:11); Capability map (spine:165–180) |
| PRD OQ1 flag transport (API route → store) | AD-3, AD-9; Deferred note (spine:189) |
| PRD OQ2 current-patch source (manual constant) | AD-7; Deferred note (spine:189) |
| PRD OQ3 search scope (client-side) | AD-5; Deferred note (spine:189) |
| PRD §4.5 git-is-CMS / build-time schema validation | AD-1, AD-2 |
| PRD §5 no-auth / non-goals | Consistency table "no auth anywhere" (spine:128); AD-3 prevents client-writable persistence |
| PRD §6.1 locked stack (Next 16, TS, Tailwind 4, kebab-case, WCAG 2.1 AA) | Stack table (spine:130–141); AD-10, AD-11; memlog:16 |
| PRD FR-9 rate-limit + dedupe, envelope, no silent success | AD-9 |
| Memlog paradigm / SSOT / only-runtime-store / static rendering / client search / RSC default / freshness / slug ids / API contract / deferred list | AD-1…AD-9, Deferred (spine:182–189) — full 1:1 coverage of memlog:8–19 |
| UX "deprecated stays at canonical URL, in search, labeled" | AD-1, AD-4, AD-7 + FR-10 row (spine:178) |
| UX no component library (memlog lock) — *partially* | stack has Tailwind; **no AD/convention records the constraint** (see Gap 5) |
| UX site-wide current-Patch stamp in header/footer | implied by AD-7 (currentPatch constant) — no explicit component home (minor, spine altitude) |

## 3. Gap register (material)

### Gap 1 — Runtime flag overlay vs build-time badge derivation (contradiction)

- **PRD FR-9 consequence:** accepted "outdated" flag "sets a visible 'community-flagged outdated' indicator on the Entry (pending review)" for other visitors (prd:159).
- **UX binding:** "Accepted 'outdated' flips the entry to `badge-flagged` … for other visitors" (EXPERIENCE:62, 74; UJ-2 step 5, EXPERIENCE:118); badge-flagged is a required badge state (DESIGN:118–119, 206).
- **Spine says both:**
  - AD-7: badge state "derived at build from `entry.patch` vs `currentPatch` **plus the flag overlay**" (spine:84).
  - AD-3/AD-4: flags are runtime, `/api/flags` is the only dynamic surface, content routes render statically (spine:60, 66).
- **Did not land:** no mechanism reconciles the two — a static build cannot embed runtime flags. Unchosen options: client fetch of flag overlay on detail pages (extra island), ISR/revalidation (Deferred says pure static assumed), server read at request time (breaks AD-4), or editor-managed flag overlay written back into `content/` (would contradict "pending review, before sweep"). The spine asserts the overlay exists at build with no read path.

### Gap 2 — Flag data model undefined

- **PRD FR-9:** flag carries Entry, verdict ("verified"/"outdated"), optional one-line note, timestamp — "enough metadata … to audit flag age" (prd:160).
- **PRD FR-12:** "the backlog must expose flag age so this is auditable" (prd:186).
- **Spine:** ER diagram gives `Flag` zero attributes (spine:157–163); AD-9 requires server-side dedupe/rate-limit (spine:96) but never defines the dedupe key, note field, timestamp, verdict enum, or GET backlog response shape (beyond the `{ok,data,error}` envelope).
- **Did not land:** flag record schema, POST body contract, GET backlog item contract, dedupe-window field. FR-9/FR-12 testable consequences are unimplementable from the spine alone.

### Gap 3 — AD-6 client-island enumeration bans a UX-required component

- **AD-6:** client components limited to "search input/results, flag form, and mobile menu" (spine:78; repeated in Consistency table spine:128 and memlog:14).
- **UX requires a fourth:** Copy link control — copies canonical URL, swaps label to citation line, announces via `aria-live` (DESIGN:208; EXPERIENCE:63). Needs client JS; cannot be a server component.
- **Also unlisted:** `/`-to-focus search keyboard shortcut + Esc/arrows (EXPERIENCE:84) — presumably rides the search island, but AD-6 as written has no room; skeleton shimmer is CSS (OK); flag confirmation/dedupe/rate-limit states ride the flag form (OK).
- **Did not land:** copy-link island. As written, AD-6 prevents implementing a final UX component pattern.

### Gap 4 — Search surface + home render mode left open after UX decided

- **UX decision (ASSUMPTION):** search results are "home with `?q=`" — query-param on home, **not** a `/search` route (EXPERIENCE:28); query serializes to `?q=` for share/reload (EXPERIENCE:86); search debounced ~200ms with `aria-live` count (EXPERIENCE:71, 58).
- **Spine:** AD-4 says "dynamic surface limited to `/api/flags` (**SSR only as search fallback if needed**)" (spine:66) — an unresolved hedge that contradicts the UX's fixed decision; structural seed (spine:146–153) never lists `app/page.tsx` or the `?q=` read; no rule covers the static-HTML + `useSearchParams` (client bailout) pattern.
- **Did not land:** the `?q=`-on-home decision, home route in the seed/route inventory, and the render-mode consequence (static shell + search island reading the query). OQ3 was resolved for *engine* (AD-5) but not for *surface*.

### Gap 5 — Design-token / delivery layer has no AD or convention

- **DESIGN.md** ships a complete token system in frontmatter: colors (incl. semantic badge surfaces, error-as-text-only), typography roles (Space Grotesk / Inter / JetBrains Mono), spacing incl. named tokens (`gutter`, `max-content` 1120px), radii, and per-component token recipes (DESIGN:8–158); dark-only with light mode deferred (DESIGN:9, 165).
- **EXPERIENCE Foundation:** "Tailwind CSS 4 custom components — **no component library** (memlog); `DESIGN.md` … owns all tokens" (EXPERIENCE:16); accessibility floor beyond the AA label: 44px tap targets (EXPERIENCE:83), `aria-live` announcements, grayscale-distinguishable badges, `prefers-reduced-motion` (EXPERIENCE:94–98); skeletons over spinners (EXPERIENCE:71).
- **Spine:** Stack lists tailwindcss 4.3.3 only (spine:136). No AD/convention for: token delivery (CSS variables / Tailwind 4 `@theme` in `globals.css`), font loading strategy (next/font), dark-only theme lock + light-mode deferral (Deferred list spine:182–188 has analytics/i18n/images but **not** light mode), no-component-library lock, skeleton/reduced-motion state styling. AD-11 defers only *copy* to EXPERIENCE.md (spine:108), not the token/state system.
- **Did not land:** the whole "how DESIGN.md reaches the browser" layer — the most concrete artifact downstream builders will need.

## 4. Minor observations (not material gaps)

- **Roster completeness validation (FR-7):** PRD consequence "Roster count matches the tracked hero list … not a 404" (prd:140). AD-2 validates schema, not completeness (every tracked hero has a content file / static route). Worth a line in AD-2 eventually.
- **SEO obligations:** PRD §6.1 "SEO-first static/SSR" (prd:210) and memlog:16 adopted constraint; spine has no metadata/sitemap/canonical rule, though UX deep-links lean on canonical URLs (EXPERIENCE:86).
- **Deprecated-in-index:** AD-5 doesn't state the search index includes deprecated records (FR-10/EXPERIENCE:58 require it).
- **FR-3 / FR-7 empty states:** "No recorded changes" and "no entries yet" are covered only obliquely via AD-11's "error/empty copy follows EXPERIENCE.md" (spine:108) — adequate at spine altitude.
- **Site-wide Patch stamp:** no component home (header/footer), implied by AD-7 — acceptable at spine altitude.
- **Search index size guard:** FR-2 "corpus fits within client-side data limits" (prd:98) — implied by AD-5; no budget stated (fine at MVP scale).

## 5. Input-by-input coverage scorecard

| Input | Landed | Partial | Dropped |
| --- | --- | --- | --- |
| PRD (12 FRs, 3 OQs, non-goals, assumptions) | FRs bound; OQ1–3 resolved; stack/non-goals captured | FR-9/FR-12 metadata+audit (Gaps 1–2); FR-7 completeness; SEO | — |
| DESIGN.md | AA + error-copy deferral (AD-11) | — | Token system, fonts, dark-only, component recipes (Gap 5) |
| EXPERIENCE.md | IA routes (mostly), deprecated handling, a11y label | A11y floor specifics (folded into Gap 5) | `?q=` search decision (Gap 4); copy-link island (Gap 3); skeletons/motion (Gap 5) |
| .memlog.md | All 11 decisions + adopted constraints represented 1:1 | light-mode deferral (mentioned in DESIGN as memlog) not in spine Deferred | — |
