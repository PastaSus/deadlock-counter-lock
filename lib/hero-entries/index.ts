import type { ContentRegistry } from "../loaders";
import type { Entry, Hero } from "../schema";

export interface Counterpart {
  slug: string;
  name: string;
}

export interface HeroEntryGroup extends Counterpart {
  entries: Entry[];
}

function isHeroSide(slug: string, hero: Hero): boolean {
  return (
    slug === hero.slug ||
    hero.abilities.some((ability) => ability.slug === slug)
  );
}

export function entryInvolvesHero(entry: Entry, hero: Hero): boolean {
  return isHeroSide(entry.sourceRef, hero) || isHeroSide(entry.targetRef, hero);
}

export function getHeroEntries(entries: Entry[], hero: Hero): Entry[] {
  return entries.filter((entry) => entryInvolvesHero(entry, hero));
}

export function getCounterpart(
  entry: Entry,
  hero: Hero,
  registry: ContentRegistry,
): Counterpart | undefined {
  const sourceIsHero = isHeroSide(entry.sourceRef, hero);
  const targetIsHero = isHeroSide(entry.targetRef, hero);

  if (!sourceIsHero && !targetIsHero) {
    return undefined;
  }

  const counterpartSlug = !targetIsHero
    ? entry.targetRef
    : !sourceIsHero
      ? entry.sourceRef
      : entry.targetRef;

  return {
    slug: counterpartSlug,
    name: registry[counterpartSlug]?.name ?? counterpartSlug,
  };
}

export function groupEntriesByCounterpart(
  entries: Entry[],
  hero: Hero,
  registry: ContentRegistry,
): HeroEntryGroup[] {
  const groups = new Map<string, HeroEntryGroup>();

  for (const entry of getHeroEntries(entries, hero)) {
    const counterpart = getCounterpart(entry, hero, registry);
    if (!counterpart) {
      continue;
    }

    const group = groups.get(counterpart.slug);
    if (group) {
      if (!group.entries.some((candidate) => candidate.slug === entry.slug)) {
        group.entries.push(entry);
      }
    } else {
      groups.set(counterpart.slug, {
        slug: counterpart.slug,
        name: counterpart.name,
        entries: [entry],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "en"),
  );
}
