import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyLink } from "../../../components/copy-link";
import { FlagControl } from "../../../components/flag-control";
import { FlagOverlayBadge } from "../../../components/flag-overlay-badge";
import { PatchHistory } from "../../../components/patch-history";
import { deriveBadgeState } from "../../../lib/badges";
import { loadAllContent } from "../../../lib/loaders";
import type { Entry } from "../../../lib/schema";

export function generateStaticParams() {
  const content = loadAllContent();
  const slugs = content.entries
    .filter(
      (entry) => entry.kind === "matchup" || entry.kind === "archetype-warning",
    )
    .map((entry) => entry.slug);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = loadAllContent();
  const entry = content.entries.find((candidate) => candidate.slug === slug);

  if (!entry) {
    return { title: "Guidance not found | Counterlock" };
  }

  const source =
    content.registry[entry.sourceRef]?.name ?? entry.sourceRef;
  const target =
    content.registry[entry.targetRef]?.name ?? entry.targetRef;

  return {
    title: `${source} vs ${target} | Counterlock`,
    description: `${entry.title} — verified as of patch ${content.config.currentPatch}.`,
  };
}

export default async function GuidanceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = loadAllContent();
  const entry = content.entries.find((candidate) => candidate.slug === slug);

  if (!entry) {
    notFound();
  }

  const source = content.registry[entry.sourceRef]?.name ?? entry.sourceRef;
  const target = content.registry[entry.targetRef]?.name ?? entry.targetRef;
  const badgeVariant = deriveBadgeState(entry, content.config.currentPatch);
  const canonicalUrl = `/matchups/${entry.slug}`;
  const kindLabel =
    entry.kind === "matchup" ? "MATCHUP" : "ARCHETYPE WARNING";
  const effectChip =
    entry.effects.length > 0
      ? entry.effects.join(" + ").toUpperCase()
      : kindLabel;

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
          {source} vs {target}
        </h1>
        <p className="mt-1 text-[13px] font-mono text-text-muted">
          {entry.title}
        </p>
      </header>

      <section className="mt-8 space-y-6">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-semibold text-text">{source}</span>
          <span className="text-text-muted"> vs </span>
          <span className="font-semibold text-text">{target}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span
            className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-mono text-text-secondary"
          >
            {effectChip}
          </span>
        </div>

        <div className="rounded-md border border-border p-4 bg-surface">
          <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.04em] mb-3">
            Conditions
          </h3>
          <p className="text-sm text-text-secondary leading-1.6">
            {entry.conditions}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <FlagOverlayBadge
            entrySlug={entry.slug}
            baseVariant={badgeVariant}
            patch={entry.verifiedPatch}
          />
          <CopyLink
            url={canonicalUrl}
            title={entry.title}
            patch={entry.verifiedPatch}
          />
        </div>

        <PatchHistory rows={entry.patchHistory} />

        <FlagControl key={entry.slug} entrySlug={entry.slug} />
      </section>

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
