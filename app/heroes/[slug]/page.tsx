import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryCard } from "../../../components/entry-card";
import {
  HERO_ARTWORK_TEXT_SHADOW,
  HeroArtworkBackdrop,
} from "../../../components/hero-artwork-backdrop";
import { deriveBadgeState } from "../../../lib/badges";
import {
  getHeroEntries,
  groupEntriesByCounterpart,
} from "../../../lib/hero-entries";
import { loadAllContent, loadHeroes } from "../../../lib/loaders";
import type { Entry } from "../../../lib/schema";

const SECTIONS = [
  {
    kind: "interaction",
    id: "interaction-records",
    title: "Interaction Records",
  },
  {
    kind: "matchup",
    id: "matchup-guidance",
    title: "Matchup Guidance",
  },
  {
    kind: "archetype-warning",
    id: "archetype-warnings",
    title: "Archetype Warnings",
  },
] as const;

const KIND_LABELS: Record<Entry["kind"], string> = {
  interaction: "INTERACTION",
  matchup: "MATCHUP",
  "archetype-warning": "ARCHETYPE WARNING",
};

function entryHref(entry: Entry): string {
  return entry.kind === "interaction"
    ? `/interactions/${entry.slug}`
    : `/matchups/${entry.slug}`;
}

function effectChip(entry: Entry): string {
  return entry.effects.length > 0
    ? entry.effects.join(" + ").toUpperCase()
    : KIND_LABELS[entry.kind];
}

export function generateStaticParams() {
  return loadHeroes().map((hero) => ({ slug: hero.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = loadAllContent();
  const hero = content.heroes.find((candidate) => candidate.slug === slug);

  if (!hero) {
    return { title: "Hero not found | Counterlock" };
  }

  return {
    title: `${hero.name} | Counterlock`,
    description: `${hero.name} interaction records, matchup guidance, and archetype warnings verified against patch ${content.config.currentPatch}.`,
  };
}

export default async function HeroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = loadAllContent();
  const hero = content.heroes.find((candidate) => candidate.slug === slug);

  if (!hero) {
    notFound();
  }

  const heroEntries = getHeroEntries(content.entries, hero);
  const asset = content.assets[hero.slug];
  const sections = SECTIONS.map((section) => ({
    ...section,
    groups: groupEntriesByCounterpart(
      heroEntries.filter((entry) => entry.kind === section.kind),
      hero,
      content.registry,
    ),
  })).filter((section) => section.groups.length > 0);

  return (
    <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <Link
        href="/heroes"
        className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-text-secondary transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        All heroes
      </Link>

      <header className="relative mt-2 mb-8 flex min-h-[132px] items-end overflow-hidden rounded-md border border-border bg-surface">
        <HeroArtworkBackdrop
          name={hero.name}
          imagePath={asset?.imagePath}
          imageWebpPath={asset?.imageWebpPath}
          imagePosition="center 20%"
        />
        <h1
          className="relative z-10 p-4 font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-text"
          style={{ textShadow: HERO_ARTWORK_TEXT_SHADOW }}
        >
          {hero.name}
        </h1>
      </header>

      {heroEntries.length === 0 ? (
        <div className="max-w-xl rounded-md border border-border bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text">
            No entries yet.
          </h2>
          <p className="mt-2 text-text-secondary">
            {hero.name} is tracked, but no counterplay has been curated for this
            hero yet.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-[44px] items-center rounded-md border border-border-input px-4 text-[13px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Back to home
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <section
              key={section.kind}
              aria-labelledby={`${section.id}-heading`}
            >
              <h2
                id={`${section.id}-heading`}
                className="font-display text-2xl font-semibold tracking-[-0.01em] text-text"
              >
                {section.title}
              </h2>

              <nav
                aria-label={`${section.title} counterpart groups`}
                className="mt-4"
              >
                <p className="text-[13px] text-text-muted">
                  Jump to counterpart
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {section.groups.map((group) => {
                    const anchorId = `${section.id}-${group.slug}`;

                    return (
                      <li key={group.slug}>
                        <a
                          href={`#${anchorId}`}
                          className="inline-flex min-h-[44px] items-center rounded-md border border-border bg-surface px-3 text-[13px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          {group.name}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mt-2 space-y-8">
                {section.groups.map((group) => {
                  const anchorId = `${section.id}-${group.slug}`;

                  return (
                    <div key={group.slug}>
                      <h3
                        id={anchorId}
                        className="scroll-mt-24 font-display text-lg font-semibold text-text"
                      >
                        {group.name}
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {group.entries.map((entry) => (
                          <EntryCard
                            key={entry.slug}
                            entrySlug={entry.slug}
                            href={entryHref(entry)}
                            effectChip={effectChip(entry)}
                            source={
                              content.registry[entry.sourceRef]?.name ??
                              entry.sourceRef
                            }
                            target={
                              content.registry[entry.targetRef]?.name ??
                              entry.targetRef
                            }
                            condition={entry.conditions}
                            badgeVariant={deriveBadgeState(
                              entry,
                              content.config.currentPatch,
                            )}
                            patch={entry.verifiedPatch}
                            media={content.entryMedia[entry.slug]}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
