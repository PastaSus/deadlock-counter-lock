import assert from "node:assert/strict";

import { ContentError, buildAssetMap } from "../lib/loaders";
import type { Hero, Item, Manifest, ManifestRecord } from "../lib/schema";

const moduleRecord: ManifestRecord = {
  slug: "test-hero",
  type: "hero",
  assetId: "1",
  className: "hero_test",
  name: "Test Hero",
  family: "heroes",
  imagePath: "/assets/heroes/test-hero/card.png",
  imageWebpPath: "/assets/heroes/test-hero/card.webp",
  portraitPath: "/assets/heroes/test-hero/portrait.png",
  sourceUrl: "https://example.com/hero.png",
  fetchDate: "2026-01-01T00:00:00.000Z",
  description: "Manifest description.",
};

const itemRecord: ManifestRecord = {
  slug: "test-item",
  type: "item",
  assetId: "2",
  className: "upgrade_test",
  name: "Test Item",
  family: "items",
  imagePath: "/assets/items/test-item/icon.png",
  sourceUrl: "https://example.com/item.png",
  fetchDate: "2026-01-01T00:00:00.000Z",
  tier: "tier-3",
};

function makeManifest(records: ManifestRecord[]): Manifest {
  return {
    families: {
      heroes: {
        sourceUrl: "https://example.com/heroes",
        attribution: "Hero attribution.",
        license: "Hero license.",
      },
      abilities: {
        sourceUrl: "https://example.com/abilities",
        attribution: "Ability attribution.",
        license: "Ability license.",
      },
      items: {
        sourceUrl: "https://example.com/items",
        attribution: "Item attribution.",
        license: "Item license.",
      },
    },
    records,
    generatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function makeHero(overrides: Partial<Hero> = {}): Hero {
  return {
    slug: "test-hero",
    name: "Test Hero",
    abilities: [],
    assetId: "1",
    className: "hero_test",
    ...overrides,
  };
}

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    slug: "test-item",
    name: "Test Item",
    assetId: "2",
    className: "upgrade_test",
    ...overrides,
  };
}

const checks: Array<[string, () => void]> = [
  [
    "joins a stamped hero to its manifest record",
    () => {
      const assets = buildAssetMap(
        [makeHero()],
        [],
        makeManifest([moduleRecord]),
      );
      const asset = assets["test-hero"];

      assert.equal(asset.imagePath, "/assets/heroes/test-hero/card.png");
      assert.equal(asset.imageWebpPath, "/assets/heroes/test-hero/card.webp");
      assert.equal(asset.portraitPath, "/assets/heroes/test-hero/portrait.png");
      assert.equal(asset.typeLabel, "Hero");
      assert.equal(asset.attribution, "Hero attribution.");
      assert.equal(asset.license, "Hero license.");
    },
  ],
  [
    "editorial summary wins over the manifest description",
    () => {
      const assets = buildAssetMap(
        [makeHero({ summary: "Editorial summary." })],
        [],
        makeManifest([moduleRecord]),
      );
      assert.equal(assets["test-hero"].summary, "Editorial summary.");
    },
  ],
  [
    "manifest description fills in when the record has no summary",
    () => {
      const assets = buildAssetMap(
        [makeHero()],
        [],
        makeManifest([moduleRecord]),
      );
      assert.equal(assets["test-hero"].summary, "Manifest description.");
    },
  ],
  [
    "name and type fill in when there is no summary or description",
    () => {
      const record: ManifestRecord = { ...moduleRecord, description: undefined };
      const assets = buildAssetMap([makeHero()], [], makeManifest([record]));
      assert.equal(assets["test-hero"].summary, "Test Hero (Hero)");
    },
  ],
  [
    "an item reports its tier in words",
    () => {
      const assets = buildAssetMap([], [makeItem()], makeManifest([itemRecord]));
      const asset = assets["test-item"];
      assert.equal(asset.tier, "tier-3");
      assert.equal(asset.typeLabel, "Tier 3 item");
      assert.equal(asset.attribution, "Item attribution.");
    },
  ],
  [
    "an unstamped entity resolves to no artwork",
    () => {
      const assets = buildAssetMap(
        [makeHero({ assetId: undefined, className: undefined })],
        [],
        makeManifest([moduleRecord]),
      );
      assert.equal(assets["test-hero"], undefined);
    },
  ],
  [
    "a stamp without a manifest record fails the build",
    () => {
      assert.throws(
        () => buildAssetMap([makeHero()], [], makeManifest([])),
        (error: unknown) =>
          error instanceof ContentError && /no matching record/.test(error.message),
      );
    },
  ],
  [
    "a className mismatch fails the build",
    () => {
      assert.throws(
        () =>
          buildAssetMap(
            [makeHero({ className: "hero_other" })],
            [],
            makeManifest([moduleRecord]),
          ),
        (error: unknown) =>
          error instanceof ContentError &&
          /does not match manifest className/.test(error.message),
      );
    },
  ],
  [
    "an incomplete stamp fails the build",
    () => {
      assert.throws(
        () =>
          buildAssetMap(
            [makeHero({ className: undefined })],
            [],
            makeManifest([moduleRecord]),
          ),
        (error: unknown) =>
          error instanceof ContentError && /incomplete asset stamp/.test(error.message),
      );
    },
  ],
  [
    "a record referencing an unknown family fails the build",
    () => {
      const manifest = makeManifest([
        { ...moduleRecord, family: "abilities" },
      ]);
      const families = {
        heroes: manifest.families.heroes,
        items: manifest.families.items,
      } as Manifest["families"];

      assert.throws(
        () => buildAssetMap([makeHero()], [], { ...manifest, families }),
        (error: unknown) =>
          error instanceof ContentError && /unknown family/.test(error.message),
      );
    },
  ],
  [
    "duplicate manifest records for one asset id fail the build",
    () => {
      assert.throws(
        () =>
          buildAssetMap(
            [makeHero()],
            [],
            makeManifest([moduleRecord, moduleRecord]),
          ),
        (error: unknown) =>
          error instanceof ContentError && /duplicate record/.test(error.message),
      );
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
  console.error(`${failures} asset test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${checks.length} asset checks passed.`);
}
