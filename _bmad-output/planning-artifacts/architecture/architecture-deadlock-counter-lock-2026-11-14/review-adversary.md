# Adversary Review: Architecture Spine (Counterlock)

- **Target:** `ARCHITECTURE-SPINE.md` (same folder), status `draft`, created 2026-11-14
- **Method:** adversarial pair construction. For each finding, two units one level down (feature-builders / story-implementers) are specified. Each unit obeys **every AD literally**, no AD is broken, yet the two units ship incompatible artifacts, or the pair proves a bound FR is unreachable within the AD set. Each pair closes with a proposed new or tightened AD.
- **Run at:** 2026-11-14

## Verdict

**FAIL.** The AD set is internally consistent on naming, static rendering, and API shape, but two pairs reach critical: (ADV-1) AD-7 requires the flag overlay to participate in **build-time** badge derivation while AD-3 makes flags **runtime-only behind a secret-guarded GET**, no compliant path exists to render the `badge-flagged` state FR-9 promises other visitors; (ADV-2) no AD declares `content/heroes` the exhaustive hero registry, so a fully-compliant builder can ship a roster that 404s zero-entry heroes, violating FR-7's explicit consequence. Both close with additive AD edits, no redesign needed.

**Counts:** 2 critical · 4 high · 2 medium · 1 low

---

## ADV-1: Flag overlay vs build-time badge: the promised `badge-flagged` is unreachable [critical]

**Units:**
- **Unit A. Entry Detail builder (FR-3, FR-4, FR-8).** Obeys AD-7 to the letter: badge state "derived at build from `entry.patch` vs `currentPatch` **plus the flag overlay**." Obeys AD-4 (static route) and AD-1 (content is SSOT). At build time the flag KV is unreachable-by-design, so A either (a) silently drops the flag overlay and bakes only verified/stale/deprecated, or (b) treats "flag overlay" as a content field and waits for editorial input that only exists after a sweep.
- **Unit B. Flag Form builder (FR-9).** Obeys AD-3 ("`/api/flags` owns all flag reads/writes; GET exposes the backlog behind a **server secret**; no other route or client touches the KV store") and AD-9 (envelope, server-side rate-limit/dedupe). POST works. Now B must satisfy FR-9's consequence, *"sets a visible 'community-flagged outdated' indicator on the Entry"* for **other visitors**. Every compliant option fails: a new public GET route touching KV violates AD-3's "no other route"; calling the secret-guarded GET from the client island puts the secret in the bundle; a client fetch without the secret 401s.

**Incompatibility:** A's static page physically cannot display B's accepted flag; EXPERIENCE.md mandates `badge-flagged` on cards and detail "for the next visitor." FR-9's visible-indicator consequence is unreachable without violating an AD. Root cause: AD-7's "derived at build … plus the flag overlay" is an internal contradiction with AD-3 (build cannot derive runtime state).

**Close with:**
- **New AD-12. Public flag-state read contract:** exactly one public read exists for visitor-facing flag state (e.g. `GET /api/flags/state?entry=<slug>` → `{ok, data: {entrySlug, outdatedCount, pendingSince}}`), rate-limited, serverless-cacheable, in the AD-9 envelope; it never exposes the backlog or notes (those stay behind `EDITOR_SECRET`). One client island (`flag-state` or folded into the flag-control island) fetches it post-hydration and renders `badge-flagged`.
- **Tighten AD-7:** build derives verified/stale/deprecated only; the flagged overlay is client-composited after hydration and is explicitly *not* build-derived. Cards/detail must tolerate its absence (default badge until fetched).

---

## ADV-2: Hero registry ownership: two sources of "who is a Hero" [critical]

**Units:**
- **Unit A. Roster builder (FR-7).** Reads AD-1 ("all heroes … live as structured files under `content/`") + the Structural Seed (`content/heroes/`) and makes `content/heroes/*` the registry: `generateStaticParams` over the loader's hero list; zero-entry hero renders "no entries yet." Fully compliant; FR-7 satisfied.
- **Unit B. Interaction detail / hero-first browse builder (FR-1, FR-3).** Obeys AD-1 too, it never creates a second *store*; it derives Hero objects at build from `source.hero` / `target.hero` references inside `content/entries` (AD-1 only forbids stores outside `content/`, and AD-8's kebab slugs are respected). B's `/heroes/[slug]` therefore knows only heroes that appear in at least one entry.

**Incompatibility:** a hero present in `content/heroes` with zero curated entries exists for A (renders "no entries yet", FR-7 ✓) and 404s under B's route (FR-7 explicitly forbids this). Worse, if both ship partial route coverage, the same slug resolves differently depending on which unit's loader built the page. Every AD was obeyed; no AD says which source is *exhaustive* or that entries may not be used to discover heroes.

**Close with:**
- **Tighten AD-1:** "`content/heroes` is the exhaustive Hero registry. Routes, `generateStaticParams`, search, and display may only enumerate heroes from it. Entries reference heroes by slug; loaders must never synthesize Hero entities from entry references. Referencing an unknown hero slug is a build failure (see ADV-3)."
- **Tighten AD-8:** route params for `/heroes/[slug]` derive exclusively from the registry loader.

---

## ADV-3: Clashing content-file shapes: format, field names, and zero referential integrity [high]

**Units:**
- **Unit A. Interaction Records author.** Chooses `content/entries/*.json`, objects shaped `{slug, source: {hero: "haze", ability: "sleep-dagger"}, target: {..}, effect, patch, conditions}`, zod-validated (AD-2), kebab-case (AD-10), slugs as ids (AD-8). All ADs obeyed.
- **Unit B. Matchup/Archetype author.** Chooses `content/entries/*.md` with frontmatter `{id: "solomon-fliers", heroes: ["solomon"], type: archetype-warning, patch}`, also zod-validated via frontmatter parsing (AD-2 never names a file format, a schema module, or a field vocabulary), also kebab-case, also slug ids.

**Incompatibility:** two file formats, two schemas, two loaders, and no shared `Entry` union in `lib/schema`: AD-10 only says interface types *live* there, not that one union governs all entries. Reference fields diverge (`source.hero` slug vs `heroes` display-name list; AD-8 constrains entity ids, not *reference fields*). Nothing in the AD set requires **referential integrity**: A can ship `target.hero: "sevenn"`, pass zod, pass build, and render a dead hero link. FR-11's "malformed entries fail the build" passes while the corpus is silently broken.

**Close with:**
- **Tighten AD-2:** (a) exactly one content format for entries (pick JSON *or* MD+frontmatter, one decision, one row); (b) one zod schema module in `lib/schema` exporting a discriminated `Entry` union (`interaction | matchup | archetype-warning`) that both loaders consume; (c) build-time referential integrity: every hero reference resolves to a `content/heroes` slug (ADV-2's rule), every entry slug globally unique across all types, `X.Y` patch format machine-checked.
- **Tighten AD-10:** reference fields carry slugs, never display names.

---

## ADV-4: Divergent badge computation: two derivation sites, two patch comparisons [high]

**Units:**
- **Unit A. FR-4/FR-8 builder.** Implements `deriveBadgeState` in `lib/loaders` and compares `entry.patch` vs `currentPatch` **numerically** ("7.10" > "7.9" → stale logic correct for double-digit minors).
- **Unit B. FR-2 search-index builder.** AD-5 says the index is "generated at build from `content/`"; AD-7 says badge state is "derived at build" but never names a single owner; FR-10 requires deprecated records stay **labeled in search**. B therefore includes badge state in the index, computed inside `lib/search` with `localeCompare` (**lexicographic**: "7.10" <"7.9" → wrong verdict) or, seeing no AD that demands badge-in-index, omits it entirely (deprecated search results render unlabeled, violating FR-10 while obeying every AD).

**Incompatibility:** a record can read `stale` on its detail page and `verified` in search results; or deprecated labeling disappears from search. Both units derived "at build," both zod-validated (AD-2), both static (AD-4), both client-searched (AD-5). AD-7's derivation has no single-owner clause and no comparison rule.

**Close with:**
- **Tighten AD-7:** exactly one function (one named module, e.g. `lib/loaders/badge.ts`) computes badge state; every consumer, detail pages, cards, `generateStaticParams` lists, the search index, consumes its output and may not recompute. Patch comparison is a numeric `X.Y` tuple compare (explicitly not string/lexicographic).
- **Tighten AD-7 (content side):** content files store only badge *inputs* (`patch`/verified-patch, `deprecated`, `patchHistory`); derived badge fields in content are rejected by the schema (see ADV-8).

---

## ADV-5: Search index vs content drift: the index schema is ungoverned [high]

**Units:**
- **Unit A, index minimalist.** Obeying PRD's "corpus fits within client-side data limits" and AD-5, emits `{q, url, title}` only, smallest payload, still "a JSON search index … searched entirely on the client."
- **Unit B, result-card builder.** Obeying EXPERIENCE.md + FR-10, expects search results to show badge state, effect chips, and conditions; and seeing AD-3 permit flag reads *somewhere*, tries to bake flag state into the index at build (impossible, flags are runtime) or fetch flags per query at search time (drifts from AD-5's "searched entirely on the client" spirit and multiplies requests).

**Incompatibility:** A's index cannot render B's required result cards; B's workaround either ships stale flag data or violates AD-5's boundaries. Compounding it: A builds the index by its own lightweight Markdown scan while `lib/loaders` (AD-2's validation path) does full zod parsing, two parsers over one corpus, so a schema change validated by AD-2 never reaches the index and search silently degrades. AD-5 says *where* the index lives but never *what it contains* or *what it derives from*.

**Close with:**
- **Tighten AD-5:** the index is built **from the zod-validated loader output only** (never a second parser), inside the same build pipeline, loader validation failure fails the index build too; index record schema is declared in `lib/schema` alongside content schemas and must include at minimum `url, title, snippet, badgeState, deprecated` so FR-10 labeling in search is structurally guaranteed; flag overlay is out of scope for the index (runtime, per ADV-1); delivery is a bundled client import, no `/search-index.json` route (see ADV-9).

---

## ADV-6: Entity-to-directory mapping for matchups/archetypes is undecided [high]

**Units:**
- **Unit A. Directory-per-entity builder.** Obeys AD-1 ("all heroes, entries, patch history, currentPatch live … under `content/`", it does) and creates `content/matchups/` and `content/archetypes/` with their own zod schemas, because routes `/matchups` and `/archetypes` (FR-5, FR-6) obviously deserve matching homes. Kebab-case everywhere (AD-10).
- **Unit B. Discriminated-union builder.** Reads the Structural Seed literally, `content/` contains only `heroes/, entries/, patches/, config`, and files matchup guidance + archetype warnings as typed variants inside `content/entries/`. Also fully AD-1-compliant.

**Incompatibility:** one entity class ("Entry" = Interaction Record **or** Matchup Guidance per PRD glossary) lives in two directories with two loaders; B's `Entry` union never sees A's files and vice versa; `lib/loaders` accumulates two competing read paths, and FR-5/FR-6 pages silently miss content depending on which builder's convention won. Both obeyed every AD, the seed table and AD-1 simply never publish an entity→directory map.

**Close with:**
- **Tighten AD-1 (or the Structural Seed):** an explicit mapping row per entity, either `content/entries/` holds *all* Entry variants with `type` discrimination, or each route family gets a named content directory (then update the Seed). One line, but it must be a line.

---

## ADV-7: Flag review lifecycle: two owners of "reviewed" state [medium]

**Units:**
- **Unit A. API builder (FR-12 support).** Extends the same route AD-3 already owns with `PATCH /api/flags` marking `reviewedAt` in KV, arguably within "`/api/flags` owns all flag reads/writes."
- **Unit B. Sweep-story builder (FR-12 execution).** Obeys AD-1/PRD's "backlog review is a manual editorial process; tooling beyond file editing is out of MVP scope" and records review outcomes in a content file (`content/config/reviewed-flags.json` or sweep notes), then edits entries.

**Incompatibility:** flag review state now lives in KV *and* in content, two owners of one entity's lifecycle. FR-12's audit ("no Flag older than one Patch Cycle unreviewed") is checkable against only one of them; after a sweep, KV flags look forever pending. The KV write also contradicts nothing (AD-3 says the route owns KV) yet contradicts the other unit's content-as-code review record.

**Close with:**
- **Tighten AD-3/AD-9:** declare the flag lifecycle contract: KV holds append-only flags with timestamps; either (a) review is *exclusively* editorial, backlog GET returns age + entry slug, sweep happens in files, KV review marks are out of scope for MVP, or (b) review writes `reviewedAt` through the route only, and content must never mirror review state. Pick one; specify the backlog GET response fields (id, entry slug, verdict, note, timestamp, age) so FR-12's audit has a defined source.

---

## ADV-8: Persisted vs derived badge: sweep script writes what AD-7 says is derived [medium]

**Units:**
- **Unit A. Sweep-tooling builder (FR-12).** Adds a script that computes badge strings and writes them back into entry content: `badge: "verified@7.3"`, content in repo (AD-1 ✓), zod-valid because A's schema includes the field (AD-2 ✓), kebab-safe (AD-10 ✓).
- **Unit B. Page renderer.** Obeying AD-7's "derived at build," ignores any persisted badge and computes state fresh, so a content file claiming `verified@7.3` renders `stale` (or worse, A's field wins somewhere and B's derivation is dead code).

**Incompatibility:** one truth (`badge`) has two sources, persisted editorial claim vs derived computation, and both validate. AD-7 forbids runtime derivation but never forbids *persisting* the result, so the sweep path happily closes the loop back into content, where drift is guaranteed at the next patch bump.

**Close with:**
- **Tighten AD-7 (schema clause):** content schemas are strict and **reject** derived-state fields (`badge`, `stale`, `flagged`); only inputs (`patch`/verified-patch, `deprecated`, `patchHistory`, `currentPatch`) may be persisted. Sweep edits inputs; build derives output.

---

## ADV-9: Index delivery and second data paths: two clients, two fetches [low]

**Units:**
- **Unit A** imports the build-emitted index JSON into the search island bundle. **Unit B**, wanting cacheability and seeing no AD on delivery, adds `app/search-index.json` as a static route (it is static, so AD-4's "dynamic surface limited to `/api/flags`" is arguably obeyed) and `fetch`es it, plus a second fetch for flag state.

**Incompatibility:** the index ships twice by two mechanisms; budget/duplication diverges; B's route family (`app/*.json`) is a surface the Capability→Architecture Map never assigned. Low severity, payload duplication at hobby scale, but it's the same ungoverned-space pattern as ADV-5.

**Close with:**
- **Tighten AD-5:** one delivery mechanism, index emitted at build and **imported** by the client island; no route serves it. (ADV-1's AD-12 covers the flag-state fetch so it isn't reinvented per surface.)

---

## Summary of required spine edits

| # | Finding | Severity | AD action |
| --- | --- | --- | --- |
| ADV-1 | Flag overlay unreachable: AD-7 build-derivation vs AD-3 runtime-secret store | critical | **New AD-12** (public flag-state read) + tighten AD-7 |
| ADV-2 | Hero registry not declared exhaustive; entries-derived roster violates FR-7 | critical | Tighten AD-1 + AD-8 |
| ADV-3 | Content file format/field vocabulary/referential integrity undefined | high | Tighten AD-2 + AD-10 |
| ADV-4 | Badge derivation has no single owner; patch compare unordered | high | Tighten AD-7 (single function, numeric compare) |
| ADV-5 | Search index schema and provenance ungoverned → FR-10 drift | high | Tighten AD-5 (loader-derived, schema in lib/schema, required fields) |
| ADV-6 | Entity→content-directory mapping undecided (seed vs AD-1) | high | Tighten AD-1 / Structural Seed (mapping row) |
| ADV-7 | Flag review state owned by both KV and content | medium | Tighten AD-3/AD-9 (lifecycle contract + backlog fields) |
| ADV-8 | Persisted badge fields vs derive-at-build | medium | Tighten AD-7 (strict schema: reject derived fields) |
| ADV-9 | Index delivery mechanism unspecified | low | Tighten AD-5 (bundled import, no route) |
