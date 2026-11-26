import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AssetMediaRow } from "../components/asset-media-row";
import { AssetTooltip, shouldShowImage } from "../components/asset-tooltip";
import { EntryCard } from "../components/entry-card";
import { SearchResultRow } from "../components/search-result-row";
import {
  buildEntryMedia,
  loadAllContent,
  type AllContent,
  type AssetProps,
  type ContentAssets,
  type ContentRegistry,
} from "../lib/loaders";
import { buildSearchIndex, type SearchIndexItem } from "../lib/search-index";
import type { Entry } from "../lib/schema";

function makeAsset(
  overrides: Partial<AssetProps> & Pick<AssetProps, "slug" | "kind" | "name">,
): AssetProps {
  const typeLabel =
    overrides.kind === "hero"
      ? "Hero"
      : overrides.kind === "ability"
        ? "Ability"
        : "Item";

  return {
    slug: overrides.slug,
    kind: overrides.kind,
    name: overrides.name,
    typeLabel: overrides.typeLabel ?? typeLabel,
    tier: overrides.tier,
    summary: overrides.summary ?? `${overrides.name} summary.`,
    description: overrides.description,
    imagePath:
      overrides.imagePath ??
      `/assets/${overrides.kind}s/${overrides.slug}/image.png`,
    imageWebpPath: overrides.imageWebpPath,
    portraitPath: overrides.portraitPath,
    portraitWebpPath: overrides.portraitWebpPath,
    sourceUrl: "https://example.com/source.png",
    fetchDate: "2026-01-01T00:00:00.000Z",
    attribution: "Test attribution.",
    license: "Test license.",
  };
}

const registry: ContentRegistry = {
  haze: { slug: "haze", kind: "hero", name: "Haze" },
  "haze-sleep-dagger": {
    slug: "haze-sleep-dagger",
    kind: "ability",
    name: "Sleep Dagger",
    heroSlug: "haze",
  },
  doorman: { slug: "doorman", kind: "hero", name: "Doorman" },
  "doorman-doorway": {
    slug: "doorman-doorway",
    kind: "ability",
    name: "Doorway",
    heroSlug: "doorman",
  },
  knockdown: { slug: "knockdown", kind: "item", name: "Knockdown" },
  "silence-glyph": { slug: "silence-glyph", kind: "item", name: "Silence Glyph" },
  "dive-comps": { slug: "dive-comps", kind: "archetype", name: "Dive comps" },
  "poke-comps": { slug: "poke-comps", kind: "archetype", name: "Poke comps" },
};

const assets: ContentAssets = {
  haze: makeAsset({
    slug: "haze",
    kind: "hero",
    name: "Haze",
    summary: "A stealthy assassin.",
    imagePath: "/assets/heroes/haze/card.png",
    imageWebpPath: "/assets/heroes/haze/card.webp",
    portraitPath: "/assets/heroes/haze/portrait.png",
    portraitWebpPath: "/assets/heroes/haze/portrait.webp",
  }),
  "haze-sleep-dagger": makeAsset({
    slug: "haze-sleep-dagger",
    kind: "ability",
    name: "Sleep Dagger",
    summary: "Sleep a target from range.",
    imagePath: "/assets/abilities/haze-sleep-dagger/icon.png",
    imageWebpPath: "/assets/abilities/haze-sleep-dagger/icon.webp",
  }),
  knockdown: makeAsset({
    slug: "knockdown",
    kind: "item",
    name: "Knockdown",
    typeLabel: "Tier 3 item",
    tier: "tier-3",
    summary: "Stun a target after a short delay.",
    imagePath: "/assets/items/knockdown/icon.png",
    imageWebpPath: "/assets/items/knockdown/icon.webp",
  }),
};

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  return {
    slug: "haze-sleep-dagger-vs-knockdown",
    kind: "interaction",
    title: "Sleep Dagger interrupts Knockdown",
    sourceRef: "haze-sleep-dagger",
    targetRef: "knockdown",
    effects: ["interrupt"],
    conditions: "The dagger must land before the stun resolves.",
    verifiedPatch: "1.0",
    patchHistory: [],
    ...overrides,
  };
}

function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

function walkRepoFiles(relativeDirectory: string): string[] {
  const root = path.resolve(process.cwd(), relativeDirectory);
  const files: string[] = [];

  function walk(directory: string): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(
          path.relative(process.cwd(), absolutePath).split(path.sep).join("/"),
        );
      }
    }
  }

  walk(root);
  return files.sort();
}

const checks: Array<[string, () => void]> = [
  [
    "a hero side resolves its 32px portrait",
    () => {
      const media = buildEntryMedia(
        makeEntry({ sourceRef: "haze", targetRef: "knockdown" }),
        registry,
        assets,
      );

      assert.equal(media.source.kind, "hero");
      assert.equal(media.source.name, "Haze");
      assert.equal(media.source.typeLabel, "Hero");
      assert.equal(media.source.portrait?.slug, "haze");
      assert.equal(
        media.source.portrait?.portraitPath,
        "/assets/heroes/haze/portrait.png",
      );
      assert.equal(media.source.icon, undefined);
    },
  ],
  [
    "an ability side pairs the owning-hero portrait with the ability icon",
    () => {
      const media = buildEntryMedia(
        makeEntry({ sourceRef: "haze-sleep-dagger", targetRef: "knockdown" }),
        registry,
        assets,
      );

      assert.equal(media.source.kind, "ability");
      assert.equal(media.source.portrait?.slug, "haze");
      assert.equal(
        media.source.portrait?.portraitPath,
        "/assets/heroes/haze/portrait.png",
      );
      assert.equal(media.source.icon?.slug, "haze-sleep-dagger");
      assert.equal(
        media.source.icon?.imagePath,
        "/assets/abilities/haze-sleep-dagger/icon.png",
      );
      assert.equal(media.source.summary, "Sleep a target from range.");
    },
  ],
  [
    "an item side carries its tier border color and tier in words",
    () => {
      const media = buildEntryMedia(
        makeEntry({ sourceRef: "haze-sleep-dagger", targetRef: "knockdown" }),
        registry,
        assets,
      );

      assert.equal(media.target.kind, "item");
      assert.equal(media.target.tier, "tier-3");
      assert.equal(media.target.typeLabel, "Tier 3 item");
      assert.equal(media.target.icon?.tier, "tier-3");
      assert.equal(
        media.target.icon?.imagePath,
        "/assets/items/knockdown/icon.png",
      );
      assert.equal(media.target.portrait, undefined);
    },
  ],
  [
    "an archetype side has text details and no artwork",
    () => {
      const media = buildEntryMedia(
        makeEntry({ sourceRef: "haze", targetRef: "poke-comps" }),
        registry,
        assets,
      );

      assert.equal(media.target.kind, "archetype");
      assert.equal(media.target.name, "Poke comps");
      assert.equal(media.target.typeLabel, "Archetype");
      assert.equal(media.target.summary, "Poke comps (Archetype)");
      assert.equal(media.target.portrait, undefined);
      assert.equal(media.target.icon, undefined);
    },
  ],
  [
    "unstamped entities keep text details without image paths",
    () => {
      const media = buildEntryMedia(
        makeEntry({ sourceRef: "doorman-doorway", targetRef: "silence-glyph" }),
        registry,
        assets,
      );

      assert.equal(media.source.kind, "ability");
      assert.equal(media.source.portrait?.slug, "doorman");
      assert.equal(media.source.portrait?.portraitPath, undefined);
      assert.equal(media.source.icon?.name, "Doorway");
      assert.equal(media.source.icon?.imagePath, undefined);
      assert.equal(media.source.typeLabel, "Ability");

      assert.equal(media.target.kind, "item");
      assert.equal(media.target.icon?.name, "Silence Glyph");
      assert.equal(media.target.icon?.imagePath, undefined);
      assert.equal(media.target.typeLabel, "Item");
    },
  ],
  [
    "the media row renders 32px portraits, 24px icons, and a vs divider",
    () => {
      const media = buildEntryMedia(makeEntry(), registry, assets);
      const html = render(createElement(AssetMediaRow, { media }));

      assert.ok(html.includes("h-8 w-8"));
      assert.ok(html.includes("h-6 w-6"));
      assert.ok(html.includes(">vs</span>"));
      assert.ok(html.includes('src="/assets/heroes/haze/portrait.png"'));
      assert.ok(
        html.includes('src="/assets/abilities/haze-sleep-dagger/icon.png"'),
      );
      assert.ok(html.includes('src="/assets/items/knockdown/icon.png"'));
    },
  ],
  [
    "item icons carry a 2px tier border and state the tier in the tooltip",
    () => {
      const media = buildEntryMedia(makeEntry(), registry, assets);
      const html = render(createElement(AssetMediaRow, { media }));

      assert.ok(html.includes("border-2"));
      assert.ok(html.includes("border-tier-3"));
      assert.ok(html.includes("Tier 3 item"));
      assert.ok(html.includes("Stun a target after a short delay."));
    },
  ],
  [
    "each tooltip is a button trigger linked with aria-describedby",
    () => {
      const media = buildEntryMedia(makeEntry(), registry, assets);
      const html = render(createElement(AssetMediaRow, { media }));

      assert.ok(html.includes("<button"));
      assert.ok(html.includes('type="button"'));
      assert.ok(html.includes('aria-label="Sleep Dagger"'));
      assert.ok(html.includes('aria-describedby="'));
      assert.ok(html.includes('role="tooltip"'));
      assert.ok(html.includes('id="'));
      assert.ok(html.includes("opacity-0"));
      assert.ok(html.includes("pointer-events-none"));
    },
  ],
  [
    "the tooltip uses the asset-tooltip spec tokens",
    () => {
      const media = buildEntryMedia(makeEntry(), registry, assets);
      const html = render(createElement(AssetMediaRow, { media }));

      assert.ok(html.includes("max-w-[var(--asset-tooltip-max-width)]"));
      assert.ok(html.includes("bg-surface-raised"));
      assert.ok(html.includes("border-border-strong"));
      assert.ok(html.includes("rounded-md"));
      assert.ok(html.includes("p-3"));
      assert.ok(html.includes("text-[12px]"));
    },
  ],
  [
    "a missing image falls back to the entity initial and keeps text details",
    () => {
      const media = buildEntryMedia(
        makeEntry({ sourceRef: "silence-glyph", targetRef: "dive-comps" }),
        registry,
        assets,
      );
      const html = render(createElement(AssetMediaRow, { media }));

      assert.ok(!html.includes("<img"));
      assert.ok(html.includes(">S</span>"));
      assert.ok(html.includes(">D</span>"));
      assert.ok(html.includes("Silence Glyph"));
      assert.ok(html.includes("Dive comps"));
      assert.ok(html.includes("Archetype"));
      assert.ok(html.includes("role=\"tooltip\""));
    },
  ],
  [
    "a 404 on a set image path is wired to hide the img and keep the initial",
    () => {
      const html = render(
        createElement(AssetTooltip, {
          name: "Knockdown",
          typeLabel: "Tier 3 item",
          summary: "Stun a target after a short delay.",
          tier: "tier-3",
          imagePath: "/assets/items/knockdown/icon.png",
          variant: "icon",
          tierBorder: true,
        }),
      );

      assert.ok(html.includes('src="/assets/items/knockdown/icon.png"'));
      assert.ok(html.includes(">K</span>"));
      assert.ok(html.includes('role="tooltip"'));

      const source = readRepoFile("components/asset-tooltip.tsx");
      assert.ok(source.includes("onError"));
      assert.ok(source.includes("setImageFailed(true)"));
    },
  ],
  [
    "a single search asset renders without a vs divider",
    () => {
      const html = render(
        createElement(AssetMediaRow, {
          asset: assets.haze,
        }),
      );

      assert.ok(html.includes("h-8 w-8"));
      assert.ok(html.includes('src="/assets/heroes/haze/portrait.png"'));
      assert.ok(!html.includes(">vs</span>"));
    },
  ],
  [
    "the entry card shows the media row when media is provided",
    () => {
      const media = buildEntryMedia(makeEntry(), registry, assets);
      const html = render(
        createElement(EntryCard, {
          href: "/interactions/haze-sleep-dagger-vs-knockdown",
          entrySlug: "haze-sleep-dagger-vs-knockdown",
          effectChip: "INTERRUPT",
          source: "Sleep Dagger",
          target: "Knockdown",
          condition: "The dagger must land before the stun resolves.",
          badgeVariant: "verified",
          patch: "1.0",
          media,
        }),
      );

      assert.ok(html.includes("h-8 w-8"));
      assert.ok(html.includes("h-6 w-6"));
      assert.ok(html.includes("relative z-20"));
    },
  ],
  [
    "the entry card omits the media row when media is absent",
    () => {
      const html = render(
        createElement(EntryCard, {
          href: "/interactions/haze-sleep-dagger-vs-knockdown",
          entrySlug: "haze-sleep-dagger-vs-knockdown",
          effectChip: "INTERRUPT",
          source: "Sleep Dagger",
          target: "Knockdown",
          condition: "The dagger must land before the stun resolves.",
          badgeVariant: "verified",
          patch: "1.0",
        }),
      );

      assert.ok(!html.includes("h-8 w-8"));
      assert.ok(!html.includes("h-6 w-6"));
    },
  ],
  [
    "the search index embeds entry media and keeps the asset fields",
    () => {
      const entry = makeEntry();
      const media = buildEntryMedia(entry, registry, assets);
      const content: AllContent = {
        config: { currentPatch: "1.0" },
        heroes: [],
        items: [],
        archetypes: [],
        entries: [entry],
        registry,
        assets,
        entryMedia: { [entry.slug]: media },
      };

      const index = buildSearchIndex(content);
      const indexed = index.entries.find(
        (item) => item.slug === entry.slug,
      );

      assert.ok(indexed);
      assert.equal(indexed.media?.source.ref, "haze-sleep-dagger");
      assert.equal(indexed.media?.target.ref, "knockdown");
      assert.equal(indexed.sourceAsset?.slug, "haze-sleep-dagger");
      assert.equal(indexed.targetAsset?.slug, "knockdown");
    },
  ],
  [
    "the search index falls back to buildEntryMedia when media is missing",
    () => {
      const entry = makeEntry();
      const content = {
        config: { currentPatch: "1.0" },
        heroes: [],
        items: [],
        archetypes: [],
        entries: [entry],
        registry,
        assets,
        entryMedia: {},
      } as AllContent;

      const index = buildSearchIndex(content);
      const indexed = index.entries.find(
        (item) => item.slug === entry.slug,
      );

      assert.ok(indexed?.media);
      assert.equal(indexed.media.source.kind, "ability");
      assert.equal(indexed.media.target.kind, "item");
    },
  ],
  [
    "the real corpus exposes media for every entry",
    () => {
      const content = loadAllContent();

      for (const entry of content.entries) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(
            content.entryMedia,
            entry.slug,
          ),
          `missing entryMedia for ${entry.slug}`,
        );
        assert.deepEqual(
          content.entryMedia[entry.slug],
          buildEntryMedia(entry, content.registry, content.assets),
        );
      }
    },
  ],
  [
    "shouldShowImage reflects path and failure state",
    () => {
      assert.equal(shouldShowImage(undefined, false), false);
      assert.equal(shouldShowImage(undefined, true), false);
      assert.equal(shouldShowImage("/assets/item.png", false), true);
      assert.equal(shouldShowImage("/assets/item.png", true), false);
    },
  ],
  [
    "the search result row renders entry media",
    () => {
      const entry = makeEntry();
      const item: SearchIndexItem = {
        slug: entry.slug,
        kind: "entry",
        title: entry.title,
        label: "Sleep Dagger vs Knockdown",
        href: `/interactions/${entry.slug}`,
        terms: [],
        media: buildEntryMedia(entry, registry, assets),
      };
      const html = render(createElement(SearchResultRow, { item }));

      assert.ok(html.includes("h-8 w-8"));
      assert.ok(html.includes("h-6 w-6"));
      assert.ok(html.includes('src="/assets/heroes/haze/portrait.png"'));
      assert.ok(html.includes(">vs</span>"));
      assert.ok(html.includes("hover:z-30"));
      assert.ok(html.includes("focus-within:z-30"));
      assert.ok(html.includes('aria-hidden="true"'));
    },
  ],
  [
    "the search result row renders a single search asset",
    () => {
      const item: SearchIndexItem = {
        slug: "haze",
        kind: "hero",
        title: "Haze",
        label: "Haze",
        href: "/heroes/haze",
        terms: [],
        asset: assets.haze,
      };
      const html = render(createElement(SearchResultRow, { item }));

      assert.ok(html.includes("h-8 w-8"));
      assert.ok(html.includes('src="/assets/heroes/haze/portrait.png"'));
      assert.ok(!html.includes(">vs</span>"));
    },
  ],
  [
    "each button's aria-describedby resolves to its tooltip panel id",
    () => {
      const media = buildEntryMedia(makeEntry(), registry, assets);
      const html = render(createElement(AssetMediaRow, { media }));
      const describedBy = [
        ...html.matchAll(/aria-describedby="([^"]+)"/g),
      ].map((match) => match[1]);

      assert.ok(describedBy.length > 0);

      for (const id of describedBy) {
        assert.ok(
          html.includes(`id="${id}"`),
          `aria-describedby "${id}" has no matching tooltip id`,
        );
      }
    },
  ],
  [
    "asset tooltip is the only new media client island",
    () => {
      assert.ok(
        readRepoFile("components/asset-tooltip.tsx").startsWith('"use client";'),
      );
      assert.ok(
        !readRepoFile("components/asset-media-row.tsx").includes('"use client"'),
      );
      assert.ok(
        !readRepoFile("components/entry-card.tsx").includes('"use client"'),
      );
    },
  ],
  [
    "media surfaces never import the manifest or fetch asset data",
    () => {
      const files = [...walkRepoFiles("app"), ...walkRepoFiles("components")]
        .filter((file) => /\.(?:ts|tsx|js|jsx|mjs|css)$/.test(file));

      for (const file of files) {
        const source = readRepoFile(file);
        assert.ok(
          !/lib\/assets|manifest\.json|fetch\(/.test(source),
          `${file} must not import the manifest or fetch asset data`,
        );
      }
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
  console.error(`${failures} asset media test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${checks.length} asset media checks passed.`);
}
