- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-hero-roster-and-hero-browse-pages.md`
  summary: Finish the mobile navigation so the menu sheet and search affordance work and primary nav links are reachable below md.
  evidence: Navigation now mounts on every page, but its Menu and Search buttons have no handlers and the Heroes/Interactions/Matchups links are hidden below md, so mobile visitors cannot navigate through the top bar.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-hero-roster-and-hero-browse-pages.md`
  summary: Add render-level tests for the hero roster and hero pages.
  evidence: Tile counts, the zero-entry empty state, and static generation are verified only by build output inspection; a render or HTTP harness is needed to assert them automatically. Pure badge, participation, and grouping logic is covered by scripts/test-heroes.ts.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Add a salt and rotation decision for `visitorHash` so the digest is not a brute-forceable hash of IP and user agent.
  evidence: `hashVisitor` hashes IP and user agent without a secret; the spec does not define a salt, so the privacy baseline is weaker than a keyed hash.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Define trusted-proxy handling for `x-forwarded-for` and `x-real-ip` and stop headerless visitors from sharing the `"unknown"` rate-limit bucket.
  evidence: `getClientIp` trusts client-supplied headers; spoofing depends on the deployment proxy, which the spec does not define. Fallback behavior is now pinned by tests.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Validate that `entrySlug` exists in the content registry before persisting a flag.
  evidence: The runtime route has no content registry, so arbitrary kebab-case slugs can create records and overlay markers for entries Story 2.3 cannot render. Story 2.2 supplies real slugs.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Remove overlay markers when the last pending outdated flag for an entry is reviewed.
  evidence: The overlay uses per-slug marker keys with no TTL; the review and close path is Epic 3, so marker cleanup must land there.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Replace the overlay `KEYS` scan with a Redis set if the flagged-slug list grows.
  evidence: `getFlaggedSlugs` calls `KEYS flags:overlay:*` on every request; acceptable at the current corpus size but an O(N) scan in production Redis.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Exercise the Upstash REST adapter against a real instance or emulator.
  evidence: Tests always install the in-memory store; the production adapter's `SET NX`, `INCR`/`EXPIRE`, `TTL`, `DEL`, and `KEYS` command shapes are unverified.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Document `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env.example` and the README.
  evidence: Deployment configuration is undocumented; a missing pair now throws, but setup still has no reference.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Wire `test:flags` into CI when the repository gains a CI pipeline.
  evidence: The repo has no CI configuration, so the flag suite runs only when invoked manually.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-flag-api-with-rate-limit-and-dedupe.md`
  summary: Add a build or integration assertion that `GET /api/flags/overlay` runs per request under Cache Components.
  evidence: Direct handler tests simulate the Next request scope; the production `connection()` deferral path is verified only by build output inspection.
