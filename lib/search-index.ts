import { loadAllContent } from "./loaders";

export interface SearchIndexItem {
  slug: string;
  kind: "hero" | "ability" | "item" | "entry";
  title: string;
  label: string;
  href: string;
  terms: string[];
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

export function buildSearchIndex(): SearchIndex {
  const content = loadAllContent();

  const heroes: SearchIndexItem[] = content.heroes.map((hero) => ({
    slug: hero.slug,
    kind: "hero",
    title: hero.name,
    label: hero.name,
    href: `/heroes/${hero.slug}`,
    terms: tokenize(hero.name),
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
