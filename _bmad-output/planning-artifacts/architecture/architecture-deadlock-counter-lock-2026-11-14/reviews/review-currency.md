# Currency / Reality Check Review: Architecture Spine (Counterlock)

- **Target:** `ARCHITECTURE-SPINE.md` (same folder), status `final`, created 2026-11-14, updated 2026-11-16
- **Lens:** every committed decision must be web-researched or reality-checked, not asserted from training data. Focus of this run: the new AD-16 / AD-17 claims and the AD-2 / AD-6 amendments; core stack spot-checked for staleness only.
- **Method:**
  - Live HTTP probes of `api.deadlock-api.com` (`/v1/assets/heroes`, `/v1/assets/items`, `/v1/assets/items/by-hero-id/{id}` for **all 65 hero ids**), response-shape inspection in Node, OpenAPI schema fetch (`/openapi.json`), header/auth checks
  - Live npm registry checks for `next`, `react`, `typescript`, `tailwindcss`, `zod`, `lucide-react`
  - Existing project on disk: `package.json`, `content/`, `scripts/`, `lib/`
  - DESIGN.md "Official Assets & Media" bullet cross-check
- **Run at:** 2026-11-17

## Verdict

**PASS WITH FINDINGS.** The headline AD-16 claims check out live: `api.deadlock-api.com` exists, all three named endpoints return HTTP 200 with no auth (OpenAPI `security: none`; an invalid `X-API-KEY` still gets 200), hero/item records carry `id` + `class_name`, items are discriminated by `type` (`ability` | `weapon` | `upgrade`), image URLs resolve (png+webp pairs), and `Cache-Control: public, max-age=3600` supports a manual sync script. But one clause AD-16 marks "(verified live)" is **false as written** — `/v1/assets/items/by-hero-id/{id}` returns **only** `type: "ability"` for every hero, never shop items — and AD-17's "tier" field does not exist on abilities or weapons (only upgrades have `item_tier`). The slug→official-id join AD-17 commits to has no defined mapping source for abilities/items against the real payload shapes, and the spine's "never editorial" rule collides with `content/items/` and editorial `abilities[]` already on disk.

**Counts:** 0 critical · 2 high · 3 medium · 3 low

---

## What was verified live (new claims)

| Claim (spine) | Reality (2026-11-17) | Status |
| --- | --- | --- |
| `api.deadlock-api.com` exists; open, free REST API | Live, OpenAPI 3.1.0 at `/openapi.json`, docs at `/docs`, MIT, community-run (not Valve-endorsed) | ✅ |
| `GET /v1/assets/heroes` public, no auth | HTTP 200, 1,912,004 bytes, 65 heroes; no `security` on operation; `securitySchemes` exist but global `security: none` | ✅ |
| `GET /v1/assets/items` public, no auth | HTTP 200, 6,457,908 bytes, 782 records | ✅ |
| `GET /v1/assets/items/by-hero-id/{id}` public, no auth | HTTP 200 for every real hero id probed (65/65); invalid id → `[]` | ✅ |
| Heroes carry official `id` + `class_name` | All 65 have both; OpenAPI `Hero.required` includes `id`,`class_name`,`name`; sample `id=1, class_name=hero_inferno` | ✅ |
| Items carry `id`, `class_name`, `type` | All 782 have `id`/`class_name`/`type`; `ItemType` enum = `ability`\|`weapon`\|`upgrade` (437/95/250) | ✅ |
| "by-hero-id payload carries items **and** abilities, discriminated by `type` (verified live)" | **False.** Across **all 65 heroes**: 319 records, **100% `type=ability`**, zero `weapon`/`upgrade`. OpenAPI summary: *"Hero-bound abilities, excluding the generic movement abilities."* The `type` field exists but is constant on this endpoint. | ❌ |
| No credentials; public API | Confirmed (200 with and without bogus `X-API-KEY`) | ✅ |
| png/webp variants as offered | Items: `image` + `image_webp`; heroes: nested `images.*` / `*_webp` pairs (e.g. `icon_hero_card`); sample image URL → HTTP 200 on `assets-bucket.deadlock-api.com` | ✅ |
| Sync endpoints only via `scripts/sync-assets`; no runtime caller | Design-only; `scripts/sync-assets` and `lib/assets/manifest.json` do not exist yet (greenfield, presented as target) | ⚠️ target only |
| `npm run sync:assets` | **Not defined** in `package.json` `scripts` (no `sync:assets` entry) | ⚠️ |

### Detail: by-hero-id is abilities-only (F-1)

- Aggregate over all 65 hero ids: `{"ability": 319}` — **no non-ability record ever appears**.
- Contrast: `/v1/assets/items` for Haze (`heroes: [13]`) returns 14 abilities **and** 1 weapon (`citadel_weapon_haze_set`); `heroes[]` on `/items` links 68 weapons to heroes. So hero-bound **shop items exist in the data** but are **not** served by `by-hero-id`.
- `by-hero-id` also **excludes** generic movement abilities (jump/slide/zip-line/mantle/…): for Haze, `/items` has 14 abilities, `by-hero-id/13` has 5. Those generic abilities are in `/items` with `heroes[]` populated.
- Consequence for AD-16: the three-endpoint set still *can* build a complete manifest **if** the script joins `heroes[]` from `/v1/assets/items` (or `/by-type/{type}`) for weapons/upgrades; relying on `by-hero-id` alone for "items and abilities" silently drops every weapon and upgrade image. The "(verified live)" annotation is incorrect and must be fixed so an implementer does not trust it.

### Detail: `tier` does not exist as claimed (F-2)

- AD-17: manifest records *"(official `id`, `class_name`, display name, **tier**, image)"*.
- Live field name is **`item_tier`**, and it is present on **Upgrade** schema only (250/782 records; `item_tier` distribution `1`–`5`). `Ability` and `Weapon` schemas have **no** tier property at all (OpenAPI confirms).
- DESIGN tooltips say "type **or** tier" — type is the universal discriminator; tier is upgrade-only metadata. The spine should say `item_tier` (upgrades only) or drop tier from the universal record list.

### Detail: slug → official id join has no mapping source (F-3)

- AD-17 commits `lib/loaders` to *join slug → official id → manifest entry* and forbids display-name matching.
- Hero side: feasible once `content/heroes/*` carry `id` (AD-17 requires it) — but **0 of 13** existing hero files have `id`/`class_name` today (F-6).
- Ability/item side: editorial slugs are kebab and hero-prefixed (`haze-sleep-dagger`, `knockdown`); official records are `ability_sleep_dagger` / `upgrade_knockdown`-style `class_name`s with unrelated numeric `id`s. Neither the manifest record list (per AD-17: `id`, `class_name`, display name, tier, image) nor `content/items/items.json` (`{slug, name}` only) provides a slug→official-id edge. Without an explicit mapping source (manifest gains `slug`, or a generated slug derivation rule, or editorial refs switch to `class_name`), the join is undecidable and AD-2's "unresolvable reference fails the build" would fail every `abilityRef`/`itemRef`.

### Detail: "never editorial" vs project reality (F-4)

- AD-17: *"ability and item records … are never hand-authored (AD-2: generated, not editorial)"*.
- On disk: `content/items/items.json` (10 hand-authored `{slug,name}` records) and every `content/heroes/*.json` embeds an editorial `abilities[]` array (slug+name pairs, e.g. Haze's 4 abilities). Structural Seed lists only `content/{heroes,entries,config}` — it omits both `content/items/` and `content/archetypes/` (which exists with `archetypes.json`).
- Either those files are deprecated-by-decision (say so: seed + AD-1 must mention them) or the AD overclaims. As written, a builder following the spine and a builder following the repo diverge.

### Detail: asset-tooltip island / AD-6 amendment

- AD-6 adds `asset tooltip` to the closed island list "per DESIGN" — DESIGN.md does specify the tooltip as a client island for WCAG 1.4.13 dismissal (`Esc`, hoverable, persistent). ✅ reality-checked against DESIGN.
- Hero counterpart filter + `?q=`-style query serialization: no external dependency; no currency issue.

### Detail: AD-2 amendment

- `deprecated: { patch, note }`, fixed vocabulary, referential integrity against generated ability/item registry: internally consistent with AD-16/17; depends on F-3/F-4 being closed before build validation can actually pass.

---

## Core stack staleness spot-check (vs npm `latest`, 2026-11-17)

| Spine / package.json | npm latest today | Note |
| --- | --- | --- |
| next **16.4.6** | 16.4.6 | ✅ current |
| react **19.3.0** (lockstep 19.3.0) | **19.3.1** | ⚠️ one patch behind; harmless, note only |
| typescript **^6.0.3** | **7.0.2** (7.0.2 published 2026-11-17) | ⚠️ **TS 7 stable is out** (Go-based line had been in preview; `latest` tag now 7.0.2). Spine + package.json pin `^6.0.3`, which will not auto-take 7. Confirm the pin is intentional; do not let `^6` silently float if the team expects "current major". |
| tailwindcss **4.3.3** | **4.3.5** | ⚠️ two patches behind; CSS-first `@theme` model unchanged |
| zod **^4** (4.6.7 at authoring) | 4.6.7 | ✅ still current; package.json now has direct `"zod": "^4.6.7"` (prior F-3 action appears done) |
| eslint ^9 | — | ✅ unchanged |
| lucide-react ^1.73.0 (in package.json, **not** in spine Stack) | 1.74.0 | ℹ️ present in project, absent from spine Stack table; icons-only, AGENTS.md mandates it — worth one Stack row so the table stops pretending it isn't a dependency |

No core-stack item is *wrong* the way Vercel KV was; the only decision-grade item is TypeScript 7 vs the `^6` pin.

---

## Findings

### F-1 [high] AD-16's "(verified live)" by-hero-id claim is false

**Claim:** "the by-hero-id payload carries items **and** abilities, discriminated by its `type` field (verified live)".

**Reality:** all 65 hero ids → only `type: "ability"` (319 records). OpenAPI: "Hero-bound abilities, excluding the generic movement abilities." Shop items (weapon/upgrade) reachable per-hero only via `heroes[]` on `/v1/assets/items` (68 weapons have non-empty `heroes[]`; upgrades have **empty** `heroes[]` — they are global, not hero-bound).

**Action:** rewrite the clause: `by-hero-id` returns hero-bound abilities only (excludes generic movement abilities); weapons come from `/v1/assets/items` filtered by `heroes[]`; upgrades are global via `/items` or `/by-type/upgrade`. Delete "(verified live)" until re-verified after the edit. Update the sync-pipeline description so the manifest cannot ship with zero weapon art.

### F-2 [high] AD-17's slug→official-id join has no defined mapping source

**Claim:** loaders join *slug → official id → manifest entry*; display-name matching forbidden; unresolvable refs fail the build.

**Reality:** official records key on numeric `id` + `class_name` (`ability_sleep_dagger`); content keys on kebab slugs (`haze-sleep-dagger`, `knockdown`). No committed field or rule connects them for abilities/items (hero files will carry `id` after migration, but ability/item refs are the AD-2 hot path).

**Action:** pick one and write it into AD-17: (a) sync writes editorial `slug` into each manifest record (derivation rule for slug must be stated — it cannot be `class_name` alone because refs are hero-prefixed); (b) entry refs change to `class_name` (conflicts AD-10 kebab-only unless an exception is granted); or (c) a generated `slug ↔ id` sidecar in `lib/assets/`. Until one exists, AD-2's referential integrity cannot pass.

### F-3 [medium] "tier" is the wrong field name and wrong universality

**Claim:** every ability/item manifest record includes "tier".

**Reality:** field is `item_tier`, present only on `type: "upgrade"` (250/782). Abilities and weapons have no tier (OpenAPI schemas confirm).

**Action:** restate as: records carry `type` always; upgrades additionally carry `item_tier` (1–5); tooltips render "type or tier" per DESIGN.

### F-4 [medium] "Never hand-authored" collides with files already in the repo

**Claim:** ability/item records generated only; Structural Seed shows `content/{heroes,entries,config}` only.

**Reality:** `content/items/items.json` (10 editorial items) and editorial `abilities[]` inside all 13 `content/heroes/*.json` exist; `content/archetypes/` exists outside the Seed.

**Action:** either (a) declare `content/items/` + hero `abilities[]` deprecated and delete/migrate them in the same PR as AD-17 adoption, or (b) scope AD-17's "never editorial" to *asset-join fields* only and allow a slim editorial slug vocabulary — then the Seed must list `content/items/`. One sentence either way; today the spine and the repo disagree.

### F-5 [medium] TypeScript 7 is stable; spine still implies TS 6 is current-gen

**Reality (npm, run day):** `typescript@latest` = **7.0.2** (published 2026-11-17). Spine Stack: `^6.0.3`; package.json identical.

**Action:** one Stack note: "pinned to 6.x deliberately; TS 7.0.2 is latest as of 2026-11-17 — re-evaluate at install." Not a redesign, but an unremarked `^6` in Nov 2026 is exactly the "asserted, not checked" pattern this lens exists to catch. Also bump-note react 19.3.1 / tailwind 4.3.5 as optional lockfile refreshes.

### F-6 [low] Hero files lack the AD-17-required join fields today

**Reality:** 0/13 `content/heroes/*.json` contain `id` or `class_name`; AD-17 says they are "required by the AD-2 schemas". Existing content would fail the build the moment AD-2 adopts the rule.

**Action:** record a migration note (backfill 13 heroes from `/v1/assets/heroes`) so sprint planning sizes it; not a spine redesign.

### F-7 [low] `npm run sync:assets` does not exist yet

**Reality:** `package.json` has no `sync:assets` script; `scripts/` has validate/search/test files only; no `lib/assets/manifest.json`, no `public/assets/`.

**Action:** acceptable as greenfield target (Seed is aspirational), but AD-16 phrases it as a runnable command — mark "script + script entry added with the assets epic" or add the stub so the AD doesn't read as already true.

### F-8 [low] Spine Stack omits lucide-react already in package.json

**Reality:** `"lucide-react": "^1.73.0"` installed (AGENTS.md requires it); spine Stack table doesn't list it; AD-15 says "no component library" which is still true (icons ≠ component library), but the Stack table should match `package.json`.

**Action:** add a Stack row `lucide-react | ^1.73` with a note "icons only; not a component library (AD-15)".

---

## Verified-clean (no action)

- **Endpoints exist and are public** — all three, with OpenAPI `security: none`; rate limits are not documented on `/assets/*` (unlike analytics), and responses are edge-cached 1h (`stale-while-revalidate` 2h) — friendly to a manual sync script; no key required. The general API's load-shedding/API-key queue notes apply to DB-backed analytics, not these asset reads.
- **`id` / `class_name` join fields exist** on heroes and items exactly as AD-17 says.
- **`type` discriminator** is real on `/v1/assets/items` (`ItemType` enum in OpenAPI) — the discrimination claim is true for `/items`, just not for `by-hero-id` (F-1).
- **Image CDN** (`assets-bucket.deadlock-api.com/...`) resolves; png+webp pairs present as AD-16 "variants as offered".
- **DESIGN alignment:** "synced from the Deadlock Assets API … stored with the repo … browser never calls the assets API" (DESIGN.md L212) matches AD-16; placeholder + manifest attribution bullet (L220) matches AD-16's degradation/attribution rules; tooltip island (L216/254) matches the AD-6 addition.
- **Prior-run core items still hold:** Vercel KV still correctly excluded (Deferred line already rewritten); zod still 4.6.7 and now a direct dependency; `cacheComponents`/`partialPrefetching` already recorded in AD-4 from the prior review; scaffold still builds (package.json scripts intact).
- **Next 16.4.6 still npm-latest** — no staleness.

---

## Required spine edits (before this lens signs off)

1. **F-1:** correct the by-hero-id clause (abilities only; weapons via `heroes[]` on `/items`; upgrades global); drop the false "(verified live)".
2. **F-2:** commit one slug↔official-id mapping mechanism for abilities/items in AD-17 (and matching AD-2 resolution rule).
3. **F-3:** rename `tier` → `item_tier`, scope it to upgrades; keep `type` as the universal field.
4. **F-4:** reconcile AD-17 "never editorial" + Structural Seed with `content/items/`, hero `abilities[]`, `content/archetypes/` (delete/migrate or list+scope).
5. **F-5:** one Stack line on TypeScript 7.0.2 vs the intentional `^6.0.3` pin (optional: react 19.3.1 / tailwind 4.3.5 refresh).
