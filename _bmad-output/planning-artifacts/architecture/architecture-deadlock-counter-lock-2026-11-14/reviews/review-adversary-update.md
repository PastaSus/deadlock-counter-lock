# Adversary Review (Update Round): Architecture Spine (Counterlock)

- **Target:** `ARCHITECTURE-SPINE.md` (same folder), status `final`, updated 2026-11-16
- **Scope of attack:** the new/changed material only: AD-16 (asset sync pipeline), AD-17 (official id/class_name join), AD-2 amendment (entry vocabulary: `abilityRef`/`itemRef`, `deprecated`, ref integrity), AD-6 amendment (island list: asset tooltip, hero counterpart filter). Prior adversary rounds closed ADV-1..ADV-6 (their Prevents fields); findings here are numbered **ADV-U\*** to avoid collision. Two pre-existing holes found in passing are reported at the end.
- **Method:** adversarial pair construction. For each finding, two units one level down (sync-script builder, loader builder, schema builder, index builder, island builder, deploy builder) are specified. Each unit obeys **every AD literally**; the pair still ships incompatible artifacts, or proves a bound requirement unreachable within the AD set. Each pair closes with a proposed new or tightened AD.
- **Run at:** 2026-11-17

## Verdict

**FAIL.** The update genuinely closes the prior rounds' gaps (exhaustive registry, overlay read path, single-source index, closed island list all hold), but AD-16's "exact JSON shape is seed, owned by code" hands the one shared artifact in the new work, `lib/assets/manifest.json`, **two owners** (sync writer, loader reader) with a build check that covers only the manifest's *existence*, not its shape; the AD-16 placeholder rule then masks a total contract break as a legal degradation (ADV-U1, critical). Three further pairs split the new work across units: tooltip effect data has no sanctioned source under AD-16/AD-17 (ADV-U2), referential-integrity resolution is owned by both zod schemas (AD-2) and loaders (AD-17) (ADV-U3), and the loader-to-component props contract plus the search-index asset fields are unspecified (ADV-U4/U5). All close with additive AD edits, no redesign needed.

**Counts:** 1 critical · 2 high · 5 medium · 2 pre-existing (medium) found in passing

---

## ADV-U1: Manifest shape has two owners: writer and reader both "own the code" [critical]

**Units:**
- **Unit A. Sync-script builder (AD-16).** Writes `lib/assets/manifest.json` exactly as AD-16 specifies: per record an image path plus png/webp variants, per family source URL, fetch date, attribution note. AD-16 says "exact JSON shape is seed, **owned by code**", so A's code defines it: top-level grouping by family, records keyed by official API `id`, API-verbatim snake_case fields (`image_webp`), hero image records nested under a `heroes` map. All ADs obeyed: kebab-case file paths (AD-10), nothing routes through official ids (AD-8), sole API caller (AD-16), committed artifacts (AD-16).
- **Unit B. Loader builder (AD-17).** Reads the same file to perform "the single join slug → official id → manifest entry". B also reads "owned by code" and, seeing AD-10 ("interface types live in `lib/schema`") and AD-17's record wording (`id`, `class_name`, display name, tier, image), defines a flat `records[]` array with camelCase `displayName`, keyed by **kebab slug** (AD-8/AD-10 push slugs everywhere), hero records hoisted alongside item records. Also fully AD-compliant: AD-17 never pins top-level structure, hero-record shape, key type, or field casing; AD-16's field list names semantic contents, not JSON keys.

**Incompatibility:** both units satisfy every AD and the build stays green, because AD-16 requires only that a *missing* manifest fails the build ("a missing manifest fails the build with a clear error"), never that a present manifest validate against any schema. B's reads return `undefined` for every lookup, the loader hands `src: null` to every component, and AD-16's own rule converts the break into the **DESIGN placeholder**, which UX explicitly legalizes ("missing asset renders placeholder, never broken image"). Result: the entire Official Assets capability silently vanishes site-wide, zero build errors, zero AD violations. The failure mode is self-masking: the degradation path is also the observability gap. A flip side is equally reachable: if any unit adds a zod check with its own assumed shape, the build flaps between green and red depending on which story's assumption shipped.

**Close with:**
- **Tighten AD-16:** the manifest schema is declared **once**, as a zod v4 schema in `lib/schema` (AD-10's home), exporting the TypeScript type both sides import; the sync script writes output parsed through that schema; the build validates the manifest against it and a **malformed** manifest fails the build with a clear error, same class as a missing one. Keying is fixed: one record per official `id` per family; field names fixed verbatim (`id`, `class_name`, `image`, `imageWebp`, `tier`, ...).
- **Tighten AD-17:** the loader reads the manifest only through the exported type; "owned by code" is resolved as "owned by the single schema module", not by whichever story writes code first.

---

## ADV-U2: Tooltip "one-line effect summary" has no sanctioned data source [high]

**Units:**
- **Unit A. Sync/manifest builder.** Obeys AD-16 and AD-17 to the letter: ability/item records carry "official `id`, `class_name`, display name, tier, image" plus family source/date/attribution; hero records are editorial with `id`/`class_name`; A treats these lists as the contract and adds nothing. Fully compliant.
- **Unit B. Asset-tooltip island builder (AD-6 closed list).** Bound by DESIGN.md:254 and EXPERIENCE.md:65/75 (binding spine sources; AD-16/AD-17 both bind "UX (Official Assets & Media)"): the tooltip must state "the entity name, type or tier, and a **one-line effect summary**" for hero, ability, and item icons, and EXPERIENCE.md:93 requires the tooltip to "still open with text details" when the image is missing. Every source B can reach breaks an AD: editorial ability/item files violate AD-17 ("never hand-authored") and AD-2's fixed entity→directory map (no directory exists for them); a second API-calling script violates AD-16 (sole caller); a runtime fetch violates AD-16 offline-from-client; `entry.effects[]` exists but tooltips also fire on roster tiles and detail hero portraits, where no entry is in context; hero content files have no declared blurb field (AD-2 fixes entry vocabulary, not a hero description field).

**Incompatibility:** A's compliant manifest has nowhere to put an effect string, so B either ships name+tier only (obeying every spine AD, violating the binding UX input that AD-16/AD-17 cite as their bound source) or invents a second hand-authored store (violating AD-17). For ability/item icons there is **no compliant path at all** unless the live API exposes a description field, a fact the spine never records (the memlog's live check verified `type`, `class_name`, `image`, `image_webp` only).

**Close with:**
- **Tighten AD-16:** extend the per-record field list with the tooltip payload (`description`/`effect` one-liner), *after* verifying live whether `/v1/assets/*` provides it; record the verified fact in the AD the way the by-hero-id `type` discrimination was recorded.
- If the API does not provide it: **amend AD-17 + AD-2** (and reconcile DESIGN/EXPERIENCE): tooltip always shows name + type/tier; effect line comes from `entry.effects[]` only in card context; hero portraits show a one-line hero blurb owned by `content/heroes` with the field named in AD-2's hero schema. One of the two, but it must be a spine decision, not a per-story guess.

---

## ADV-U3: Referential integrity has two resolution sites: zod schema and loaders [high]

**Units:**
- **Unit A. Schema builder (AD-2 amendment).** Implements "`sourceRef`/`targetRef` must resolve against the hero registry and `abilityRef`/`itemRef` against the generated ability/item registry ... or the build fails" as zod `.refine()` checks inside `lib/schema`, importing the hero list and `lib/assets/manifest.json` directly. Fully compliant: AD-2 places the rule in schema validation.
- **Unit B. Loader builder (AD-17).** Implements "the single join slug → official id → manifest entry" in `lib/loaders`, including its own slug normalization and its own registry-existence checks when assembling card media rows. Also fully compliant: AD-17 says loaders own the join; AD-13/AD-1 enumerate routes from loaders.

**Incompatibility:** two implementations of "resolve a slug against a registry" with independent normalization (case folding, underscore/hyphen, apostrophes) and independent definitions of "resolvable" (present in registry vs has an image file). An entry can pass zod (A found the ability) while B's join returns no asset (B's normalization differs), producing a green build with permanently placeholder media; or A and B disagree in the other direction and the build fails only for content that page-builders already rendered. AD-2 names *where the rule is stated*, AD-17 names *who owns the join*, and neither says the two must be the same function, so "one loader, two consumers" (AD-14/AD-17's own slogan) is violated from inside `lib/`.

**Close with:**
- **Tighten AD-2 + AD-17 jointly:** referential integrity and the asset join are implemented **once**, in a named module (e.g. `lib/loaders/refs.ts`); zod schemas and loaders import it and never re-implement slug normalization or registry lookup. The AD text should name the module the way AD-7 names `lib/badges`.

---

## ADV-U4: Loader-to-component props contract is unspecified: placeholder ownership diverges [medium]

**Units:**
- **Unit A. Entry-card media builder.** Follows AD-17 ("hands resolved asset paths/metadata to components as props") with `AssetMeta { src: string | null, alt, initial, tier? }`; when `src` is null the component renders the DESIGN placeholder (entity initial + name). Never a broken image (AD-16), no manifest import (AD-17). Compliant.
- **Unit B. Roster-tile/tooltip builder.** Follows the same ADs with `AssetMeta { imageUrl, fallbackUrl: "/assets/placeholder.png", displayName, tierColor }`; the component always renders `<img src={imageUrl ?? fallbackUrl}>`. B reasons that AD-16's "degrades to the DESIGN placeholder" means the loader guarantees a path, and AD-17 lets loaders hand down metadata. Also compliant on the letter of every AD.

**Incompatibility:** two incompatible prop shapes for one shared concept (AD-10 puts interface types in `lib/schema` but no AD fixes *this* contract, so two stories each define their own), and B's synthetic fallback path is never written by the sync script (AD-16 writes only official artwork), so B ships the exact broken-image outcome AD-16 forbids while believing it obeyed. Placeholder visuals also drift: A's CSS initial vs B's file (or B's alt-text approach) vs DESIGN.md:220's "neutral placeholder with the entity initial".

**Close with:**
- **Tighten AD-17:** publish the props contract: loader returns `src: string | null` (**never** a synthetic fallback path), plus `name`, `typeOrTier?`, `initial`; exactly one shared presentational `AssetPlaceholder` component renders the fallback; no unit may write placeholder files under `public/assets/` (paradigm row: that directory is sync-written only).

---

## ADV-U5: Search cards need asset data client-side; no AD puts it in the index [medium]

**Units:**
- **Unit A. Index builder (AD-5/AD-14).** Obeys AD-14 (index generated by `lib/search` from `lib/loaders` output, one loader two consumers) but emits only the text fields it sees required: url, title, snippet, badge state. AD-5's rule still says only "a JSON search index ... searched entirely on the client"; the prior ADV-5 close (required index field list) never landed in rule text, and AD-14 governs provenance, not fields. Compliant.
- **Unit B. Search-island result-card builder.** Obeys EXPERIENCE.md:59 (the entry card, media row included, appears in search results) and AD-17 (components never import the manifest, never fetch asset data). The search island renders client-side from index data, so B has no compliant source for portraits/icons: the props path (AD-17) only works for RSC-rendered pages.

**Incompatibility:** A's index cannot render B's cards; B either ships placeholder media in search results while hero/detail pages show real art (a legal-but-divergent degradation no AD forbids) or reaches for the manifest/fetch and breaks AD-17. Same ungoverned-space pattern the prior round filed as ADV-5, now with assets riding on top of it.

**Close with:**
- **Tighten AD-5/AD-14:** the index record schema (declared in `lib/schema`) must carry the loader-resolved asset fields for each entry (source/target hero images, ability/item icon paths, tier), so search cards render the same media row via data, not fetch; or, if search cards are intentionally text-only, amend EXPERIENCE.md and say so in AD-14.

---

## ADV-U6: AD-16 Rule permits the prebuild hook; AD-16 Prevents forbids the network at build [medium]

**Units:**
- **Unit A. Deploy builder.** Reads AD-16's Rule: sync "run manually (`npm run sync:assets`) **or as an env-gated prebuild hook**". Sets the env var in CI and lets every build call `api.deadlock-api.com`. Literal compliance with the Rule.
- **Unit B. Release builder.** Reads AD-16's Prevents: "network dependency at build or render; rate-limit exposure". Runs sync manually, commits artifacts, builds offline. Literal compliance with the Prevents list.

**Incompatibility:** both cite the same AD and ship different pipelines: A's deploys go stale-or-red when the API is down or rate-limited (the exposure AD-16 exists to remove, relocated from browser to build), and a half-applied sync mutates `public/assets/` and the manifest mid-build (a second state-mutation path on shared artifacts). B's deploys are deterministic but assets drift until someone runs the script. An AD whose Rule permits exactly what its Prevents list forbids is unenforceable in both directions.

**Close with:**
- **Tighten AD-16, pick one:** (a) sync is manual-only, delete "or as an env-gated prebuild hook"; or (b) the hook is allowed but must be atomic (fetch to temp, validate against the AD-16 schema, swap only on full success) and a failed sync **falls back to the committed manifest without failing the build**. Either way the Rule/Prevents contradiction must go.

---

## ADV-U7: Deferred image/CDN (`next/image`) collides with AD-16's "no route handler serves assets" [medium]

**Units:**
- **Unit A. Perf-minded card builder.** Cites Deferred: "image/CDN strategy (incl. `next/image` optimization for `public/assets/` ...)" is explicitly open, so ships `<next/image>` for synced artwork.
- **Unit B. Static-purist card builder.** Cites AD-16: "No route handler serves assets dynamically." `next/image` optimization runs through the framework's `/_next/image` handler, so B ships plain `<img>`.

**Incompatibility:** both quote the spine, on different surfaces of the same card family the markup, URL shapes, `sharp` dependency, and config diverge story by story; and whichever wins, one unit can argue the other violated an AD. This is the clearest case of **Deferred letting two units diverge on the asset work**: the deferral is real, but it defers into the teeth of a rule that arguably already forbids the deferred option.

**Close with:**
- **Tighten AD-16 (one line):** state which way the tension resolves now, e.g. "host/framework-level image optimization (`/_next/image`) is not a project route handler and is permitted once the Deferred image decision lands; until then all surfaces ship `<img>`" (or the reverse). The point is that no story may pick per-surface.

---

## ADV-U8: Counterpart-filter serialization is named but not specified [medium]

**Units:**
- **Unit A. Counterpart-filter island builder.** In AD-6's closed list; serializes filter state to the route query string "mirroring `?q=`" as `?counterpart=<hero-slug>` using `router.push` on `/heroes/[slug]`.
- **Unit B. Second-surface filter builder.** Same island, same AD, chooses `?vs=<slug-or-official-id>` (AD-17 surfaces official ids and no AD constrains *query values*, only entity ids and routes) with `router.replace`.

**Incompatibility:** both satisfy AD-6's literal rule, yet back-nav and bookmarks diverge: AD-6 justifies the rule with "back-nav preserves browse state per EXPERIENCE", but push-vs-replace changes history semantics (push steps back through every toggle; replace collapses them) and the param name/vocabulary is unfixed, so two stories on one route (or filter vs `?q=` conventions) can't share URLs. Adjacent near-miss: AD-4 says `?q=` is "read client-side", but AD-6's mirror phrasing does not inherit that clause, so a unit could await `searchParams` in the page and break `cacheComponents` static rendering (that unit would violate AD-4, so it is a risk, not a compliant pair).

**Close with:**
- **Tighten AD-6:** name the param (`?counterpart=`), fix the value to the hero kebab slug (AD-8 vocabulary), declare read/write **client-side only inside the island** (no server `searchParams`), and fix history semantics (`router.replace` for filter toggles, so back-nav returns to a single preserved browse state rather than a toggle stack).

---

## Enforceability judgment: are the new ADs' Rules actually enforceable?

| Rule | Enforceable as written? | Gap |
| --- | --- | --- |
| AD-16: missing manifest fails the build | **Yes** (existence check) | Existence only; nothing requires shape validation (ADV-U1). Malformed manifest is unguarded. |
| AD-16: manifest record fields | **No** | "Exact JSON shape is seed, owned by code" is an in-AD deferral: with two code owners, any field/structure claim is unenforceable until a single zod schema exists. |
| AD-16: sole caller of the Assets API | **Partially** | Mechanically checkable (grep/eslint `no-restricted-syntax` outside `scripts/sync-assets`), but no AD mandates the check; today it is convention, not gate. |
| AD-16: artifacts committed to the repo | **No** | A build cannot observe git state; needs a CI "sync produced no diff / diff is committed" step or must be labeled process, not rule. |
| AD-16: never a broken image, placeholder on gap | **Partially** | Holds only if the loader props contract is pinned (ADV-U4); otherwise each component invents its own fallback. |
| AD-16: no route handler serves assets dynamically | **Yes** (directory allowlist: only `app/api/flags/*`) | Except it collides with the Deferred `next/image` option (ADV-U7). |
| AD-16: env-gated prebuild hook | **Self-contradictory** | Rule permits it; Prevents forbids "network dependency at build". Unenforceable in both directions until ADV-U6 resolves it. |
| AD-17: hero `id`/`class_name` required by AD-2 schemas | **Yes** (required zod fields) | Format unspecified: any string passes, so a slug or a typo in place of the API's raw id still validates and silently degrades to placeholder. Should state "verbatim string copy of the API field". |
| AD-17: ability/item records never hand-authored | **Weakly** | Enforced only negatively: AD-2's directory map has no home for them, but nothing states the map is *exhaustive-and-exclusive* (unknown content dirs are not declared build failures). Review-time convention. |
| AD-17: components never import the manifest / never fetch | **Partially** | Checkable via lint `no-restricted-imports` on `lib/assets/**` from `components/**`; no AD mandates the rule's enforcement mechanism. |
| AD-17: loaders own the single join | **No** | Coexists with AD-2's schema-side resolution (ADV-U3). "Single" is asserted, not structurally guaranteed. |
| AD-2: `abilityRef`/`itemRef` resolve or build fails | **Yes, given ADV-U1's schema** | The "generated ability/item registry" is never named as *the manifest*; two readers can each pick a source (ADV-U1/U3). |
| AD-6: closed island list | **Yes** (greppable: every `"use client"` boundary vs the list) | The strongest new rule in the update. |
| AD-6: filter state serializes to query string | **Weakly** | Param name, value vocabulary, reader (client vs server), and push/replace are all unspecified (ADV-U8). |

## Does anything under Deferred let two units diverge on the asset work?

**Yes, three items:**
1. **Image/CDN strategy including `next/image`** (Deferred line): directly contradicts AD-16's "No route handler serves assets dynamically" and splits markup story-by-story (ADV-U7).
2. **Manifest JSON shape**: logged in the memlog as staying deferred ("exact manifest JSON shape is seed, owned by code once written") and stated inside AD-16 itself. Functionally a deferral sitting on the single shared artifact of the update; it is the root of the critical finding (ADV-U1) and should be pulled out of deferral into a `lib/schema` module.
3. **Deploy host / prebuild env gating** (Deferred "deploy host, assume Vercel-compatible"): the env var that arms AD-16's prebuild hook is unnamed and unset anywhere, so hook-on vs hook-off diverges per environment with no spine-level default (ADV-U6).

Nothing else in Deferred (KV provider, zod pin, ISR, analytics, i18n) touches the asset work.

## Pre-existing holes found in passing (not caused by this update)

- **[medium] Flag review lifecycle still has two potential owners (ADV-7 residue).** AD-3 fixes the record shape and the three routes but never picks review-state ownership (KV write-through vs purely editorial sweep) nor specifies the backlog GET response fields; a route unit can add review marking while a sweep unit records outcomes in content, and FR-12's audit can only see one of them. The prior round filed this; it was not among the closed ADV-1..6.
- **[medium] Content schemas are not declared strict (ADV-8 residue).** AD-2 fixes the vocabulary and AD-7 says content never persists badge/status fields, but no AD says schemas are `.strict()` / reject unknown keys, so a stray `badge` field, a camelCase `className` variant, or any schema drift passes validation. The prior round's fix ("content schemas are strict and reject derived-state fields") never landed in rule text.

## Summary of required spine edits

| # | Finding | Severity | AD action |
| --- | --- | --- | --- |
| ADV-U1 | Manifest shape has two owners; existence-only build check + placeholder masking = silent total asset outage | critical | Tighten AD-16 + AD-17: one zod schema in `lib/schema`, malformed manifest fails build, fixed keys/field names |
| ADV-U2 | Tooltip "one-line effect" has no sanctioned source under AD-16/AD-17 record lists | high | Tighten AD-16 record list (verified API field) or amend AD-17/AD-2 + DESIGN scope |
| ADV-U3 | Ref resolution owned by both zod schemas (AD-2) and loaders (AD-17) | high | Tighten AD-2 + AD-17: one named resolver module, imported never re-implemented |
| ADV-U4 | Loader→component `AssetMeta` props + placeholder ownership unspecified | medium | Tighten AD-17: publish props contract (`src: string \| null`), one `AssetPlaceholder`, no synthetic paths |
| ADV-U5 | Search-result cards need asset data; index field list ungoverned | medium | Tighten AD-5/AD-14: index schema carries loader-resolved asset fields (or amend EXPERIENCE) |
| ADV-U6 | AD-16 Rule (prebuild hook) contradicts AD-16 Prevents (no network at build) | medium | Tighten AD-16: manual-only, or atomic hook with committed-manifest fallback |
| ADV-U7 | Deferred `next/image` vs AD-16 "no route handler serves assets" | medium | Tighten AD-16: one-line ruling on framework image optimization, not per-story |
| ADV-U8 | Counterpart filter: param name, value vocabulary, reader, push/replace all unspecified | medium | Tighten AD-6: `?counterpart=<slug>`, client-side read/write, `router.replace` |
| P-1 | Flag review-state ownership + backlog response fields still open (ADV-7 residue) | medium (pre-existing) | Tighten AD-3: pick KV-marked vs editorial-only; specify backlog fields |
| P-2 | Content schemas not declared strict (ADV-8 residue) | medium (pre-existing) | Tighten AD-2: schemas are `.strict()`, unknown/derived fields fail the build |
