---
title: 'Story 1.1: Content pipeline and seed corpus'
type: 'feature'
created: '2026-11-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'cd07f75d18a352dabd2c12006fbe26dffd495772'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repo is a default Next.js scaffold with no content model, so no counterplay data can be authored, validated, or loaded. Without a build-validated pipeline, malformed or dangling content could ship, and later stories (design system, roster, detail, search) have no data source.

**Approach:** Add `content/` as the content SSOT, zod v4 schemas in `lib/schema`, fs loaders in `lib/loaders`, and a `prebuild` validation gate so `npm run build` fails with path-specific errors on invalid content or unresolved refs. Seed the corpus with the exhaustive hero registry, items/archetypes, and 25 to 40 interaction plus matchup/archetype entries.

**Decisions (human delegated):** roster is the 10 mockup heroes plus Danny, Silver, and Apollo to cover the brief's named examples (13 total, Doorman intentionally zero-entry); agent drafts the seed corpus (editable, user reviews facts); `currentPatch` is `"1.0"`; the ref registry unifies hero, ability, item, and archetype slugs; deprecation is sourced from an optional `deprecated: true` entry field (the AD-7 content source that the fixed field list omits); items and archetypes live as arrays in single `content/items/items.json` and `content/archetypes/archetypes.json` files.

## Boundaries & Constraints

**Always:** `content/` is the only content store; every content file validates at build; `sourceRef`/`targetRef` resolve against the entity registry or the build fails; `content/heroes/` holds one file per roster hero including zero-entry heroes; loaders never read the flag store; routes never import content directly and components never import loaders.

**Never:** No database, runtime content store, auth, API route, page, or UI in this story; no badge/freshness computation (later stories); do not change `next.config.mjs` or TypeScript strictness; never persist badge/status fields in content.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid corpus | complete `content/` | build validation passes | N/A |
| Malformed entry | missing or invalid field | build fails | error names file path and offending field |
| Dangling ref | `sourceRef`/`targetRef` not in registry | build fails | error names entry file and unresolved ref |
| Zero-entry hero | hero file with no entries | validates; hero stays in registry | N/A |
| Empty patch history | `patchHistory: []` | valid | N/A |
| Deprecated entry | `deprecated: true` | valid; entry retained | N/A |

</frozen-after-approval>

## Code Map

- `package.json` — no zod/tsx yet; add dependencies and the `prebuild` gate.
- `tsconfig.json` — `resolveJsonModule: true`, `strict: false`; leave strictness unchanged.
- `next.config.mjs` — already `cacheComponents` + `partialPrefetching` + Tailwind turbopack; leave untouched.
- `app/` — scaffold routes; untouched in this story.
- `content/{config,heroes,items,archetypes,entries}/` — new SSOT files (JSON).
- `lib/schema/index.ts` — new zod schemas and inferred types.
- `lib/loaders/index.ts` — new fs loaders, registry resolution, path-specific errors.
- `scripts/validate-content.ts` — new prebuild entrypoint.

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` — add `zod@^4` to dependencies, `tsx` to devDependencies, `"prebuild": "tsx scripts/validate-content.ts"`, and `"test:content": "tsx scripts/test-content.ts"` — provides the build gate, TS runner, and test command.
- [ ] `content/config/current-patch.json` — `{ "currentPatch": "1.0" }` — single freshness anchor.
- [ ] `content/heroes/<slug>.json` — one file per roster hero (13): `solomon`, `haze`, `lash`, `seven`, `paradox`, `doorman`, `abrams`, `vindicta`, `grey-talon`, `wraith`, `danny`, `silver`, `apollo`; shape `{ slug, name, abilities: [{ slug, name }] }`; include zero-entry `doorman` — exhaustive registry.
- [ ] `content/items/items.json` and `content/archetypes/archetypes.json` — arrays of `{ slug, name }`; items include `knockdown`, `slowing-hex`, `suppressor`, `disarm`, `counterspell`, `silence-glyph`, `curse`, `metal-skin`, `debuff-remover`, `ethereal-shift`; archetypes include `flier-comps`, `dive-comps`, `poke-comps`, `brawl-comps`; `riposte` is an Apollo ability, not an item — covers item-sourced interactions and archetype warnings.
- [ ] `content/entries/<slug>.json` — 25 to 40 entries, shape `{ slug, kind, title, sourceRef, targetRef, effects[], conditions, verifiedPatch, patchHistory[], deprecated? }`; `kind` is `interaction | matchup | archetype-warning`; `effects[]` uses `interrupt | ground | silence | block | extend`; `patchHistory[]` items are `{ patch, note, effectChange }` — seed corpus.
- [ ] `lib/schema/index.ts` — zod v4 schemas for config, hero, ability, item, archetype, patch history, and entry; export inferred types — validation SSOT.
- [ ] `lib/loaders/index.ts` — `loadConfig`, `loadHeroes`, `loadItems`, `loadArchetypes`, `loadEntries`, `loadAllContent`; read `content/` via `node:fs`; aggregate a registry of hero/ability/item/archetype slugs; enforce referential integrity; throw an error carrying the file path plus zod issues — one loader, later consumed by pages and search.
- [ ] `scripts/validate-content.ts` — call `loadAllContent`, print path-specific failures, exit nonzero — makes `npm run build` fail fast.
- [ ] `scripts/test-content.ts` — assert every I/O Matrix row: valid corpus loads, malformed entry fails with path, dangling ref fails with ref, zero-entry Doorman validates and stays in registry, empty `patchHistory` validates, `deprecated: true` validates — matrix coverage. Loaders must accept an optional content root so fixtures can be isolated.

**Acceptance Criteria:**
- Given the repo at build time, when `npm run build` runs, then every `content/` file validates against zod v4 and a malformed file fails with a clear, path-specific error.
- Given a `sourceRef`/`targetRef` that does not resolve against the entity registry, when validation runs, then the build fails naming the entry file and unresolved ref.
- Given `content/heroes/`, then exactly one file exists per roster hero, including zero-entry heroes, and the roster is independent of the entry set.
- Given the seed corpus, then 25 to 40 interaction records plus archetype/lane matchup guidance ship, including the brief's examples: Sleep Dagger/Swap vs Lash ult, Slowing Hex vs Danny, Knockdown stun extension, Disarm vs Silver, Suppressor vs fire-rate M1, Riposte vs Seven ult (deprecated), Solomon vs flier comps.
- Given `content/config/`, then it holds the single `currentPatch` constant.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npm install` — expected: zod and tsx installed, lockfile updated.
- `npm run test:content` — expected: all matrix rows PASS.
- `npm run build` — expected: valid seed corpus builds green.
- `npm run lint` — expected: no errors.
- Manual malformed check — add a temporary invalid entry, run `npm run build`, confirm a nonzero exit naming the file path, then remove it.
