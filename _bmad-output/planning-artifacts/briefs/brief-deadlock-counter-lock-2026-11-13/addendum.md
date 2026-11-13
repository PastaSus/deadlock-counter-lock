# Counterlock Brief — Addendum

Supporting depth for downstream documents (PRD, architecture). Captured during brief creation, 2026-11-13.

## Technical Constraints (locked from prompt)

- **Stack:** Next.js 16 (TypeScript — updated 2026-11-13 at user request, supersedes initial JSX constraint), App Router, Tailwind CSS
- **Rendering:** SEO-first; fast static/SSR lookup for hero and matchup routes
- **Naming:** strict kebab-case for all files and folders
- **Accessibility:** WCAG 2.1 AA compliance
- **Scaffold status:** Next.js 16.4.6 + Tailwind 4 + ESLint + TypeScript scaffolded at project root (2026-11-13); `npm run build` passes with TS check.

## Market Landscape (research digest, Nov 2026)

- **Stat/correlational trackers:** Tracklock (builds, WR, MMR), Deadlock Guru, Deadlock Labs, Batru, deadlockmeta.dev — head-to-head win rates and counter-item stats; never assert whether a specific interaction works.
- **Prose tip sites:** getcounterlock.com (name collision — patch-dated prose matchup tips, not granular ability pairs), DenyPick, LockBlaze Counter Lab, deadlock-recommender counter pickers.
- **Wiki:** deadlock.wiki (~1,250 pages) has "Notable interactions" sections and per-entity update history, but no per-interaction patch-verification badges; freshness is implicit in edit history.
- **Pain evidence (Reddit 2026):** "Counter items how people describe them VS how they actually work" (3.1k upvotes); "Knockdown doesn't really counter Flyers anymore" (326 upvotes); counter info "buried in long videos, messy spreadsheets."
- **Gap confirmed:** no tool indexes ability→ability/item pairs as first-class queryable records, and none track per-patch verified/changed/deprecated states of individual interactions.

## Naming Decision

Keep "Counterlock" despite getcounterlock.com. Differentiation: interaction records + patch verification badges vs. its prose tips. Revisit only if confusion becomes a real acquisition problem.

## MVP Content Model

- Curated seed: ~25–40 high-value interactions + archetype matchup warnings
- Full hero roster browsable (structure complete, depth curated)
- Manual re-verification sweep after each Deadlock patch
- Community flag mechanism (accountless report: "verified" / "outdated") feeds backlog
- Growth: flags → requested interactions → widen coverage; open submissions only if curated model can't keep pace

## Example Interaction Seed (from user prompt — to expand in PRD)

- Haze's Sleep Dagger / Paradox's Swap interrupting Lash's ult/slam
- Early Slowing Hex grounding Deadman Danny mid-crash (explodes mid-air)
- Knockdown extending stuns on airborne targets
- Disarm vs. Silver
- Suppressor vs. high fire-rate M1 heroes
- Apollo's Riposte no longer cancels Seven's ult (deprecated-tech example)
- Solomon vs. flier comps (archetype matchup warning example)
