---
title: 'Story 4.1: Asset sync pipeline and loader join'
type: 'feature'
created: '2026-11-19'
baseline_commit: '3e1e05ca8efcc3bf9e48bfab7195ec7504bb08ae'
status: 'review'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Counterlock shows only text — players can't recognize heroes, abilities, or items at a glance because official Deadlock artwork isn't synced into the repo or joined to content at build time. Every page that needs a portrait or icon has no asset source, and components never call the Deadlock Assets API (NFR9).

**Approach:** Add `scripts/sync-assets` to fetch `/v1/assets/heroes`, `/v1/assets/items`, and `/v1/assets/items/by-hero-id/<id>` per hero, write images to `public/assets/{heroes,abilities,items}/`, regenerate `lib/assets/manifest.json`, and upsert `assetId`/`className` stamps into editorial records. Add a zod schema for the manifest in `lib/schema`, make `lib/loaders` perform the single slug → stamp → manifest join returning typed asset props, and validate the manifest at build so a missing/invalid manifest fails the build with a clear error.

## Boundaries & Constraints

**Always:** `scripts/sync-assets` is the only code path that contacts `api.deadlock-api.com` (AD-16, NFR9). Images write to `public/assets/{heroes,abilities,items}/`; manifest at `lib/assets/manifest.json` with image path + png/webp variants per record plus source URL, fetch date, and attribution/license note per asset family (AD-16). `assetId`/`className` stamps upsert into editorial records (heroes, nested abilities, items) via official-name match, reviewable as a git diff (AD-17). Manifest validates against a shared zod schema in `lib/schema`; missing/invalid manifest fails the build with a clear error (AD-16). A stamp with no matching manifest record fails the build; an unstamped entity passes with no artwork, taking the placeholder path (AD-17). `lib/loaders` performs the single slug → stamp → manifest join and exposes typed asset props (paths, name, type/tier, summary); summary precedence: editorial `summary` → manifest description sentence → name + type/tier (AD-17). Build-generated search index embeds loader-resolved asset metadata so no client imports the manifest (AD-14). Default build performs no network calls; env-gated pre-sync refresh is opt-in (AD-16). New files kebab-case, components PascalCase, `.ts`/`.tsx` (NFR4, AD-10). No client ever imports the manifest; components never match by display name (AD-17).

**Never:** No page/component/client island calls the Deadlock Assets API at build, render, or runtime (NFR9). Components never import the manifest (AD-17). No build-time network call by default (AD-16). No silent all-placeholder render when the manifest is missing/invalid (AD-16).

## Code Map

- `scripts/sync-assets` — new sync script: sole API caller, writes images + manifest + upserts stamps (AD-16, AD-17)
- `lib/assets/manifest.json` — generated manifest (not hand-edited) (AD-16)
- `lib/schema/index.ts` — add manifest zod schema (AD-2, AD-10 interface types in lib/schema)
- `lib/assets/` — manifest module/typed exports (AD-17)
- `lib/loaders/index.ts` — slug → stamp → manifest join, typed asset props (AD-17)
- `content/heroes/*`, hero abilities, `content/items/items.json` — `assetId`/`className` stamps upserted (AD-17)
- `scripts/build-search-index.ts` — embed loader-resolved asset metadata (AD-14)
- `package.json` — add `sync:assets` script (review-currency flagged missing entry)

## Tasks & Acceptance

**Execution:**
- [x] `scripts/sync-assets` -- create sync script fetching heroes/items/by-hero-id, writing images + manifest + upserting stamps -- sole API path (AD-16, NFR9)
- [x] `lib/schema/index.ts` -- add manifest zod schema -- build validation contract (AD-2, AD-10)
- [x] `lib/assets/` -- manifest module with typed exports -- manifest surface for loaders (AD-17)
- [x] `lib/loaders/index.ts` -- add slug → stamp → manifest join returning typed asset props -- single join site (AD-17)
- [x] `content/heroes/*` and `content/items/items.json` -- upsert `assetId`/`className` stamps via official-name match -- git-diff reviewable (AD-17)
- [x] `scripts/build-search-index.ts` -- embed loader-resolved asset metadata -- no client manifest import (AD-14)
- [x] `package.json` -- add `sync:assets` script -- expose sync via npm (review-currency gap)

**Acceptance Criteria:**
- Given network access to `api.deadlock-api.com`, when `npm run sync:assets` runs, then it fetches `/v1/assets/heroes`, `/v1/assets/items`, and `/v1/assets/items/by-hero-id/<id>` per hero and writes images to `public/assets/{heroes,abilities,items}/` with `lib/assets/manifest.json` regenerated (AD-16)
- Given the committed manifest, when `npm run build` runs, then the manifest validates against the zod schema; missing/invalid manifest fails the build with a clear error (AD-16)
- Given a stamp with no matching manifest record, when `npm run build` runs, then the build fails; an unstamped entity passes with placeholder path (AD-17)
- Given editorial records with stamps, when `lib/loaders` joins, then typed asset props (paths, name, type/tier, summary) are returned with editorial `summary` → manifest description → name + type/tier precedence (AD-17)
- Given content, when the search index builds, then loader-resolved asset metadata is embedded; no client imports the manifest (AD-14)
- Given a default build, when it runs, then no network calls are made (AD-16)

</frozen-after-approval>

## Implementation Notes

- `scripts/sync-assets.ts` fetches `/v1/assets/heroes` and `/v1/assets/items`, then `/v1/assets/items/by-hero-id/<id>` only for content heroes that match an API hero by official name or slugified name. It writes card and portrait variants for heroes, icon variants for abilities and curated items, and upserts official `id`/`class_name` stamps. Unmatched entities (Doorman, four renamed curated items, and three heroes whose ability names changed upstream) keep no stamp and take the placeholder path.
- Manifest records are keyed by editorial slug and carry `assetId`, `className`, family, image paths, source URL, fetch date, optional description, and item tier. Attribution and license are recorded once per family. API SVG item icons keep `.svg`; no duplicate webp path is emitted when the API offers the same file.
- `lib/assets` owns manifest read/validate/write only. `lib/loaders.buildAssetMap` owns the slug -> stamp -> manifest join, rejects incomplete stamps, stamps without records, className mismatches, unknown families, and duplicate records, and resolves summary precedence as editorial `summary` -> manifest description -> `name (type label)`. `loadAllContent` exposes the resolved props under `assets`.
- `lib/search-index.buildSearchIndex` now accepts the loaded content and embeds `asset` for heroes/abilities/items plus `sourceAsset`/`targetAsset` for entries. `app/page.tsx` reuses this builder instead of its duplicate copy, so no client island imports the manifest.
- `scripts/prebuild-assets.ts` runs the sync only when `ASSET_SYNC=1`; the default prebuild and build make no network calls.
- Added `scripts/test-assets.ts` (`npm run test:assets`) covering join, summary precedence, tier labeling, unstamped pass-through, and every build-failing stamp case.
- Curated shop items use the API `shop_image`/`shop_image_webp` fields (current 200px shop art) instead of the legacy `image`/`image_webp` modifier icons. The sync prunes any asset file no longer referenced by the regenerated manifest so old icon variants cannot linger.

## Spec Change Log

## Review Triage Log

## Design Notes

## Verification

**Commands:**
- `npm run sync:assets` -- expected: images + manifest written, stamps upserted, no build network calls afterward
- `npm run build` -- expected: green; manifest validated, missing/invalid manifest fails build, stamps-without-records fail build
- `npm run lint` -- expected: no errors
- `npm run test:content` -- expected: content validation passes
- `npm run test:heroes` -- expected: hero tests pass

**Manual checks (if no CLI):**
- Confirm `public/assets/{heroes,abilities,items}/` populated and `lib/assets/manifest.json` regenerated after sync
- Confirm `assetId`/`className` stamps appear in `content/heroes/*` and `content/items/items.json` as a reviewable git diff
- Confirm build fails when manifest is missing or a stamp lacks a manifest record
