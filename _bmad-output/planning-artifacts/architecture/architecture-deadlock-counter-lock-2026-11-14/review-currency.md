# Currency / Reality Check Review — Architecture Spine (Counterlock)

- **Target:** `ARCHITECTURE-SPINE.md` (same folder), status `draft`, created 2026-11-14
- **Method:** line-by-line reconciliation of the spine's Stack, ADs, and Structural Seed against (a) `package.json` + `package-lock.json` at the project root, (b) the actual scaffold on disk (`app/`, `next.config.mjs`, `app/globals.css`), (c) a verified `next build` run this session, (d) the bundled Next.js 16 docs in `node_modules/next/dist/docs/` (per AGENTS.md mandate), (e) live web checks for zod and Vercel KV currency as of Nov 2026
- **Run at:** 2026-11-14

## Verdict

**PASS WITH FINDINGS.** Every version in the spine's Stack matches the lockfile exactly and the scaffold-green claim verifies under a real build, but three committed-adjacent items were clearly reasoned from training data rather than checked: the rendering/static mechanism under the scaffold's **enabled `cacheComponents`/`partialPrefetching` flags** (invisible in the spine, yet it governs AD-4/AD-9 implementation), the **Vercel KV** candidate in Deferred (product sunset December 2024), and the **zod "pin at install"** assumption (current major is v4; no direct dependency exists yet). None require redesign — all are fixable by recording what was verified.

**Counts:** 0 critical · 2 high · 2 medium · 2 low

## Stack reconciliation (verified against package-lock + live build)

| Spine Stack entry | Spine claim | Reality (lockfile / disk) | Status |
| --- | --- | --- | --- |
| next | 16.4.6 | `node_modules/next` 16.4.6 | ✅ exact |
| react | 19.3.0 | `react` 19.3.0, `react-dom` 19.3.0 | ✅ exact |
| typescript | ^6.0.3 | 6.0.3 | ✅ exact |
| tailwindcss | 4.3.3 | 4.3.3 (+ `@tailwindcss/turbopack` 4.3.3) | ✅ exact |
| eslint | ^9 | 9.39.5 (+ `eslint-config-next` 16.4.6) | ✅ exact |
| zod | "pin at install" [ASSUMPTION] | **not a direct dep**; only transitively present at 4.6.7 | ⚠️ underspecified — see F-3 |
| flag KV provider | deferred | no KV package installed | ✅ honestly deferred — but option list stale, see F-2 |
| "Scaffold builds green" | claim | `npm run build` this session: compile ✅, TS ✅, `/` + `/_not-found` prerendered static ✅ | ✅ verified |

## Findings

### F-1 [high] Scaffold's Cache Components config is real, unrecorded, and governs two ADs

**Reality:** `next.config.mjs` sets `cacheComponents: true` and `partialPrefetching: true`; the build output prints "Cache Components enabled / Partial Prefetching enabled". The spine's Stack section and AD-4/AD-9 never mention either flag.

**Why it matters (confirmed against bundled Next 16 docs, not memory):**

- Under `cacheComponents`, the legacy segment-config model the spine would naturally reach for is the *wrong* model: `export const dynamic = 'force-static'` (still shown in the bundled route-handlers guide for caching GET) is the pre-Cache-Components pattern and must be migrated per `migrating-to-cache-components.md`; `export const dynamicParams` **fails the build** ("not compatible with `nextConfig.cacheComponents`").
- `generateStaticParams` **must return at least one param** under Cache Components — an empty array is a build error (`empty-generate-static-params`). AD-4 ("heroes/interactions/matchups/archetypes routes render statically at build") has no stated mechanism; without `generateStaticParams`, dynamic `[slug]` routes render on request and AD-4 is violated while every letter of the AD is "followed" by omission.
- Request-time rendering requires `<Suspense>` boundaries around uncached data — relevant to AD-4's unqualified "SSR only as search fallback if needed" escape hatch (see F-5).

**Action:** record `cacheComponents` + `partialPrefetching` in the Stack table and restate AD-4 in Cache Components terms: `generateStaticParams` sourced from loaders (≥1 param), no `dynamicParams` export, no `dynamic = 'force-static'` segment configs, Suspense placement rule for any request-time data.

### F-2 [high] "Vercel KV" no longer exists — Deferred option set is stale training data

**Reality (web-verified, Nov 2026):** Vercel KV was sunset; all stores moved to Upstash Redis in December 2024; `@vercel/kv` on npm is deprecated (last release Sep 2024). Vercel's own docs: "Vercel KV is no longer available… For new projects, install a Redis integration from the Marketplace." The spine's Deferred line — "Flag KV provider (Upstash Redis vs Vercel KV vs other)" — names a product that cannot be chosen. This is precisely a decision list built from training-era memory, not checked.

**Also:** env var names `FLAG_KV_*` / `EDITOR_SECRET` are fine as generic placeholders, but if the provider resolves to Upstash via Marketplace the injected names will be `UPSTASH_REDIS_REST_URL/TOKEN` — worth noting so the API route's env reading isn't written against fictional vars.

**Action:** replace the Deferred option pair with "Upstash Redis (Vercel Marketplace integration) vs other Marketplace Redis provider"; drop Vercel KV. AD-3/AD-9 contract is unaffected.

### F-3 [medium] zod pin is an assumption that hides a major-version decision

**Reality:** zod's current `latest` tag is **4.6.7** (Oct 2026); zod 3 is "functionally end-of-life" per zod.dev (security/bug fixes only, no new features). The project has **no direct zod dependency** — the installed 4.6.7 is transitive (via `eslint-plugin-react-hooks`), so "pin at install" today would resolve to v4 by default, but nothing in the spine says so.

**Why it matters:** AD-2's build validation will be written by an implementer whose zod knowledge may be v3-vintage (`z.record` two-arg signature, `.flatten()`, error format changes in v4). The spine names zod but commits neither major nor API dialect.

**Action:** change the Stack row to `zod ^4 (pin at install)` and add to AD-2: schemas written against the zod v4 API; add `zod` as a direct dependency at install time (do not rely on the transitive copy).

### F-4 [medium] Named technologies exist and fit — but only three were actually confirmed

Verified as still-current and fit-for-purpose: **Next 16 App Router** (RSC default, route handlers, static prerendering — all confirmed in bundled docs), **client-side JSON search index** (trivial at 25–40 records; no hosted-search dependency named, nothing stale), **serverless KV** (Upstash REST client exists and targets serverless runtimes), **Tailwind 4 CSS-first setup** (scaffold uses `@import "tailwindcss"` + `@theme inline`, no `tailwind.config.js` — matches Tailwind 4 convention; the `@tailwindcss/turbopack` rule in `next.config.mjs` matches reality).

Gap: the spine never states the Tailwind 4 config-less convention, so DESIGN.md's token frontmatter has no committed home (`@theme` block in `globals.css`). Low risk but worth one line so two implementers don't create competing `tailwind.config` files (see also adversary ADV-3's shape-clash pattern).

### F-5 [low] Unverified escape hatch in AD-4

"SSR only as search fallback if needed" was not checked against Next 16's Cache Components request-time rules (Suspense/uncached-data constraints). Either delete the escape hatch (search is AD-5 client-side by decree anyway) or spell it out with the doc-confirmed mechanism.

### F-6 [low] Everything else reality-checks clean

- PRD §6.1 locked constraints (Next.js 16, App Router, Tailwind CSS 4, kebab-case, WCAG 2.1 AA, scaffold builds green) — all match the spine and the disk.
- Sources exist: PRD, `DESIGN.md`, `EXPERIENCE.md` all present at the cited paths.
- Structural Seed directories (`content/`, `app/`, `components/`, `lib/`) are not yet created — expected for greenfield, and the spine presents them as targets, not as existing. No staleness.
- `react` 19.3 / `typescript` 6 / `eslint` 9 all current-gen and mutually compatible per lockfile.

## Required actions (spine edits before leaving draft)

1. **F-1:** Stack + AD-4 restated for Cache Components/Partial Prefetching (`generateStaticParams` ≥1 param, no `dynamicParams`, no `dynamic = 'force-static'`).
2. **F-2:** Drop Vercel KV from Deferred; name Marketplace Redis/Upstash reality.
3. **F-3:** Pin `zod ^4` and its API dialect in Stack + AD-2; make it a direct dependency.
4. **F-5:** Confirm or delete the AD-4 SSR escape hatch.
