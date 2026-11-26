import { loadAllContent, type AllContent, type AssetProps } from "./loaders";
import type { AssetTier } from "./schema";

export interface SearchAsset {
  slug: string;
  name: string;
  kind: "hero" | "ability" | "item";
  typeLabel: string;
  tier?: AssetTier;
  summary: string;
  imagePath: string;
  imageWebpPath?: string;
  portraitPath?: string;
  portraitWebpPath?: string;
}

export interface SearchIndexItem {
  slug: string;
  kind: "hero" | "ability" | "item" | "entry";
  title: string;
  label: string;
  href: string;
  terms: string[];
  asset?: SearchAsset | null;
  sourceAsset?: SearchAsset | null;
  targetAsset?: SearchAsset | null;
}

export interface SearchIndex {
  heroes: SearchIndexItem[];
  abilities: SearchIndexItem[];
  items: SearchIndexItem[];
  entries: SearchIndexItem[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function toSearchAsset(asset: AssetProps | undefined): SearchAsset | null {
  if (!asset) return null;
  return {
    slug: asset.slug,
    name: asset.name,
    kind: asset.kind,
    typeLabel: asset.typeLabel,
    tier: asset.tier,
    summary: asset.summary,
    imagePath: asset.imagePath,
    imageWebpPath: asset.imageWebpPath,
    portraitPath: asset.portraitPath,
    portraitWebpPath: asset.portraitWebpPath,
  };
}

export function buildSearchIndex(
  content: AllContent = loadAllContent(),
): SearchIndex {
  const heroes: SearchIndexItem[] = content.heroes.map((hero) => ({
    slug: hero.slug,
    kind: "hero",
    title: hero.name,
    label: hero.name,
    href: `/heroes/${hero.slug}`,
    terms: tokenize(hero.name),
    asset: toSearchAsset(content.assets[hero.slug]),
  }));

  const abilities: SearchIndexItem[] = [];
  for (const hero of content.heroes) {
    for (const ability of hero.abilities) {
      abilities.push({
        slug: ability.slug,
        kind: "ability",
        title: ability.name,
        label: `${ability.name} (${hero.name})`,
        href: `/heroes/${hero.slug}`,
        terms: tokenize(ability.name),
        asset: toSearchAsset(content.assets[ability.slug]),
      });
    }
  }

  const items: SearchIndexItem[] = content.items.map((item) => ({
    slug: item.slug,
    kind: "item",
    title: item.name,
    label: item.name,
    href: `/items/${item.slug}`,
    terms: tokenize(item.name),
    asset: toSearchAsset(content.assets[item.slug]),
  }));

  const entries: SearchIndexItem[] = content.entries.map((entry) => {
    const source = content.registry[entry.sourceRef]?.name ?? entry.sourceRef;
    const target = content.registry[entry.targetRef]?.name ?? entry.targetRef;
    const href =
      entry.kind === "interaction"
        ? `/interactions/${entry.slug}`
        : `/matchups/${entry.slug}`;
    const terms = tokenize(
      `${entry.title} ${source} ${target} ${entry.conditions} ${entry.effects.join(" ")}`,
    );
    return {
      slug: entry.slug,
      kind: "entry",
      title: entry.title,
      label: `${source} vs ${target}`,
      href,
      terms,
      sourceAsset: toSearchAsset(content.assets[entry.sourceRef]),
      targetAsset: toSearchAsset(content.assets[entry.targetRef]),
    };
  });

  return { heroes, abilities, items, entries };
}

export function search(index: SearchIndex, query: string): SearchIndexItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const matches: SearchIndexItem[] = [];
  const seen = new Set<string>();

  for (const category of ["heroes", "abilities", "items", "entries"] as const) {
    for (const item of index[category]) {
      const itemText = `${item.title} ${item.terms.join(" ")}`.toLowerCase();
      const score = tokens.filter((t) => itemText.includes(t)).length;
      if (score > 0 && !seen.has(item.slug)) {
        seen.add(item.slug);
        matches.push(item);
      }
    }
  }

  return matches;
}
