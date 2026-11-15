import Link from "next/link";

import { Badge } from "../../components/badge";
import { deriveBadgeState } from "../../lib/badges";
import { loadAllContent } from "../../lib/loaders";
import type { Entry } from "../../lib/schema";

export async function generateMetadata() {
  const content = loadAllContent();
  const count = content.entries.filter(
    (entry) => entry.kind === "archetype-warning",
  ).length;
  return {
    title: `Archetype Warnings | Counterlock`,
    description: `${count} archetype warnings verified against patch ${content.config.currentPatch}.`,
  };
}

export default async function ArchetypesPage() {
  const content = loadAllContent();
  const warnings = content.entries.filter(
    (entry) => entry.kind === "archetype-warning",
  );

  const groups = new Map<string, Entry[]>();
  for (const entry of warnings) {
    const key = entry.targetRef;
    const existing = groups.get(key) ?? [];
    existing.push(entry);
    groups.set(key, existing);
  }

  const sortedGroups = Array.from(groups.entries()).sort(
    ([a], [b]) => a.localeCompare(b, "en"),
  );

  return (
    <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 md:px-6 py-8 md:py-12">
      <Link
        href="/heroes"
        className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-text-secondary transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        All heroes
      </Link>

      <header className="mt-2 mb-8">
        <h1 className="font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-text">
          Archetype Warnings
        </h1>
        <p className="mt-1 text-[13px] font-mono text-text-muted">
          Community counterplay warnings grouped by archetype
        </p>
      </header>

      {sortedGroups.length === 0 ? (
        <div className="max-w-xl rounded-md border border-border bg-surface p-6">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text">
            No archetype warnings
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            There are no archetype warnings in the current corpus.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedGroups.map(([archetypeSlug, entries]) => {
            const name = content.registry[archetypeSlug]?.name ?? archetypeSlug;
            return (
              <section key={archetypeSlug}>
                <h2
                  id={archetypeSlug}
                  className="scroll-mt-24 font-display text-2xl font-semibold tracking-[-0.01em] text-text"
                >
                  {name}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {entries.map((entry) => {
                    const badgeVariant = deriveBadgeState(
                      entry,
                      content.config.currentPatch,
                    );
                    return (
                      <article
                        key={entry.slug}
                        className="rounded-md border border-border p-4 bg-surface transition-colors duration-150 hover:border-border-strong"
                      >
                        <Link
                          href={`/matchups/${entry.slug}`}
                          className="block h-full"
                          aria-label={`${entry.title}, ${name}`}
                        >
                          <div className="flex items-baseline gap-1 mb-1">
                            <span className="font-semibold text-text">
                              {entry.sourceRef}
                            </span>
                            <span className="text-text-muted"> vs </span>
                            <span className="font-semibold text-text">
                              {name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <span
                              className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-mono text-text-secondary"
                            >
                              ARCHETYPE WARNING
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary leading-1.4">
                            {entry.conditions}
                          </p>
                          <footer className="mt-3 flex items-center justify-between border-t border-border pt-3">
                            <Badge
                              variant={badgeVariant}
                              patch={entry.verifiedPatch}
                            />
                            <span className="text-[11px] font-mono text-text-muted" aria-hidden="true">
                              &rarr;
                            </span>
                          </footer>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <nav className="mt-12 pt-6 border-t border-border">
        <Link
          href="/heroes"
          className="inline-flex min-h-[44px] items-center text-[13px] font-medium text-text-secondary transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to heroes
        </Link>
      </nav>
    </main>
  );
}
