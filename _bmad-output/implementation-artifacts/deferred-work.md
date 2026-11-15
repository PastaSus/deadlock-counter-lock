- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-hero-roster-and-hero-browse-pages.md`
  summary: Finish the mobile navigation so the menu sheet and search affordance work and primary nav links are reachable below md.
  evidence: Navigation now mounts on every page, but its Menu and Search buttons have no handlers and the Heroes/Interactions/Matchups links are hidden below md, so mobile visitors cannot navigate through the top bar.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-hero-roster-and-hero-browse-pages.md`
  summary: Add render-level tests for the hero roster and hero pages.
  evidence: Tile counts, the zero-entry empty state, and static generation are verified only by build output inspection; a render or HTTP harness is needed to assert them automatically. Pure badge, participation, and grouping logic is covered by scripts/test-heroes.ts.
