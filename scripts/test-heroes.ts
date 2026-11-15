import assert from "node:assert/strict";

import { deriveBadgeState } from "../lib/badges";
import {
  entryInvolvesHero,
  getCounterpart,
  getHeroEntries,
  groupEntriesByCounterpart,
} from "../lib/hero-entries";
import type { ContentRegistry } from "../lib/loaders";
import type { Entry, Hero } from "../lib/schema";

const hero: Hero = {
  slug: "test-hero",
  name: "Test Hero",
  abilities: [
    { slug: "test-hero-blast", name: "Blast" },
    { slug: "test-hero-shield", name: "Shield" },
  ],
};

const registry: ContentRegistry = {
  "test-hero": { slug: "test-hero", kind: "hero", name: "Test Hero" },
  "test-hero-blast": {
    slug: "test-hero-blast",
    kind: "ability",
    name: "Blast",
    heroSlug: "test-hero",
  },
  "test-hero-shield": {
    slug: "test-hero-shield",
    kind: "ability",
    name: "Shield",
    heroSlug: "test-hero",
  },
  "rival-hero": { slug: "rival-hero", kind: "hero", name: "Rival Hero" },
  "rival-strike": {
    slug: "rival-strike",
    kind: "ability",
    name: "Rival Strike",
    heroSlug: "rival-hero",
  },
  "test-item": { slug: "test-item", kind: "item", name: "Test Item" },
  "other-item": { slug: "other-item", kind: "item", name: "Other Item" },
};

function makeEntry(
  slug: string,
  sourceRef: string,
  targetRef: string,
): Entry {
  return {
    slug,
    kind: "interaction",
    title: slug,
    sourceRef,
    targetRef,
    effects: ["interrupt"],
    conditions: "Test condition.",
    verifiedPatch: "1.0",
    patchHistory: [],
  };
}

const checks: [string, () => void][] = [
  [
    "deprecated wins over a stale patch",
    () => {
      assert.equal(
        deriveBadgeState(
          { verifiedPatch: "0.9", deprecated: true },
          "1.10",
        ),
        "deprecated",
      );
    },
  ],
  [
    "numeric patch ordering treats 1.10 as newer than 1.9",
    () => {
      assert.equal(
        deriveBadgeState({ verifiedPatch: "1.9" }, "1.10"),
        "stale",
      );
      assert.equal(
        deriveBadgeState({ verifiedPatch: "1.10" }, "1.10"),
        "verified",
      );
      assert.equal(
        deriveBadgeState({ verifiedPatch: "1.10" }, "1.9"),
        "verified",
      );
    },
  ],
  [
    "ability source ref participates in the hero",
    () => {
      const entry = makeEntry(
        "ability-source",
        "test-hero-blast",
        "test-item",
      );
      assert.equal(entryInvolvesHero(entry, hero), true);
      assert.deepEqual(
        getHeroEntries([entry], hero).map((candidate) => candidate.slug),
        ["ability-source"],
      );
    },
  ],
  [
    "ability target ref participates in the hero",
    () => {
      const entry = makeEntry(
        "ability-target",
        "rival-strike",
        "test-hero-shield",
      );
      assert.equal(entryInvolvesHero(entry, hero), true);
      assert.deepEqual(
        getHeroEntries([entry], hero).map((candidate) => candidate.slug),
        ["ability-target"],
      );
    },
  ],
  [
    "counterpart names resolve from the source and target sides",
    () => {
      const heroSource = makeEntry(
        "hero-source",
        "test-hero-blast",
        "test-item",
      );
      const heroTarget = makeEntry(
        "hero-target",
        "rival-strike",
        "test-hero-shield",
      );
      const heroDirect = makeEntry("hero-direct", "test-hero", "rival-hero");

      assert.equal(getCounterpart(heroSource, hero, registry)?.name, "Test Item");
      assert.equal(
        getCounterpart(heroTarget, hero, registry)?.name,
        "Rival Strike",
      );
      assert.equal(
        getCounterpart(heroDirect, hero, registry)?.name,
        "Rival Hero",
      );
    },
  ],
  [
    "shared counterparts group entries together exactly once",
    () => {
      const entries = [
        makeEntry("shared-a", "test-hero-blast", "test-item"),
        makeEntry("shared-b", "test-hero-shield", "test-item"),
        makeEntry("other", "test-hero", "rival-hero"),
      ];
      const groups = groupEntriesByCounterpart(entries, hero, registry);
      const itemGroup = groups.find((group) => group.slug === "test-item");

      assert.equal(groups.length, 2);
      assert.ok(itemGroup);
      assert.equal(itemGroup.name, "Test Item");
      assert.deepEqual(
        itemGroup.entries.map((entry) => entry.slug),
        ["shared-a", "shared-b"],
      );
    },
  ],
  [
    "an entry with both sides on the same entity is grouped once",
    () => {
      const entry = makeEntry(
        "self-entry",
        "test-hero-blast",
        "test-hero-blast",
      );
      const groups = groupEntriesByCounterpart([entry], hero, registry);

      assert.equal(groups.length, 1);
      assert.equal(groups[0].entries.length, 1);
      assert.equal(groups[0].entries[0].slug, "self-entry");
    },
  ],
];

let failures = 0;

for (const [name, check] of checks) {
  try {
    check();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`${failures} hero test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${checks.length} hero checks passed.`);
}
