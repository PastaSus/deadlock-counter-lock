import { HeroRosterTile } from "../components/hero-roster-tile";
import { HomeSearch } from "../components/home-search";
import { EntryCard } from "../components/entry-card";
import { deriveBadgeState } from "../lib/badges";
import { loadAllContent } from "../lib/loaders";
import type { Entry } from "../lib/schema";

export const metadata = {
  title: "Counterlock",
  description: "Deadlock counterplay lookup: is this counterplay still true this patch?",
};

export default function Home() {
  const content = loadAllContent();
  const interactionEntries = content.entries.filter(
    (entry) => entry.kind === "interaction",
  );
  const archetypeEntries = content.entries.filter(
    (entry) => entry.kind === "archetype-warning",
  );
  const featured = interactionEntries.slice(0, 3);
  const archetypeCard = archetypeEntries[0];
  return (
    <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-10">
        <h1 className="font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-text">
          Counterlock
        </h1>
        <p className="mt-2 text-text-secondary">
          Deadlock counterplay lookup: is this counterplay still true this patch?
        </p>
      </header>

      <HomeSearch index={buildSearchIndex(content)} />
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text mb-4">
          Heroes
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {content.heroes.map((hero) => {
            const entryCount = interactionEntries.filter(
              (entry) =>
                entry.sourceRef === hero.slug ||
                entry.targetRef === hero.slug ||
                hero.abilities.some(
                  (ability) =>
                    entry.sourceRef === ability.slug ||
                    entry.targetRef === ability.slug,
                ),
            ).length;
            return (
              <HeroRosterTile
                key={hero.slug}
                href={`/heroes/${hero.slug}`}
                name={hero.name}
                entryCount={entryCount}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text mb-4">
          Featured
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {featured.map((entry) => {
            const source =
              content.registry[entry.sourceRef]?.name ?? entry.sourceRef;
            const target =
              content.registry[entry.targetRef]?.name ?? entry.targetRef;
            const badgeVariant = deriveBadgeState(
              entry,
              content.config.currentPatch,
            );
            return (
              <EntryCard
                key={entry.slug}
                entrySlug={entry.slug}
                href={
                  entry.kind === "interaction"
                    ? `/interactions/${entry.slug}`
                    : `/matchups/${entry.slug}`
                }
                effectChip={
                  entry.effects.length > 0
                    ? entry.effects.join(" + ").toUpperCase()
                    : entry.kind === "matchup"
                      ? "MATCHUP"
                      : "ARCHETYPE WARNING"
                }
                source={source}
                target={target}
                condition={entry.conditions}
                badgeVariant={badgeVariant}
                patch={entry.verifiedPatch}
              />
            );
          })}
        </div>
      </section>

      {archetypeCard && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text mb-4">
            Archetype Warning
          </h2>
          <EntryCard
            entrySlug={archetypeCard.slug}
            href={`/matchups/${archetypeCard.slug}`}
            effectChip="ARCHETYPE WARNING"
            source={
              content.registry[archetypeCard.sourceRef]?.name ??
              archetypeCard.sourceRef
            }
            target={
              content.registry[archetypeCard.targetRef]?.name ??
              archetypeCard.targetRef
            }
            condition={archetypeCard.conditions}
            badgeVariant={deriveBadgeState(
              archetypeCard,
              content.config.currentPatch,
            )}
            patch={archetypeCard.verifiedPatch}
          />
        </section>
      )}
    </main>
  );
}

function buildSearchIndex(content: ReturnType<typeof loadAllContent>) {
  const heroes = content.heroes.map((hero) => ({
    slug: hero.slug,
    kind: "hero" as const,
    title: hero.name,
    label: hero.name,
    href: `/heroes/${hero.slug}`,
    terms: tokenize(hero.name),
  }));

  const abilities: Array<{
    slug: string;
    kind: "ability";
    title: string;
    label: string;
    href: string;
    terms: string[];
  }> = [];
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

  const items = content.items.map((item) => ({
    slug: item.slug,
    kind: "item" as const,
    title: item.name,
    label: item.name,
    href: `/items/${item.slug}`,
    terms: tokenize(item.name),
  }));

  const entries = content.entries.map((entry) => {
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
      kind: "entry" as const,
      title: entry.title,
      label: `${source} vs ${target}`,
      href,
      terms,
    };
  });

  return { heroes, abilities, items, entries };
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}
