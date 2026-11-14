import { Badge } from "./badge";

export interface EntryCardProps {
  href: string;
  effectChip: string;
  source: string;
  target: string;
  condition: string;
  badgeVariant: "verified" | "stale" | "flagged" | "deprecated";
  patch?: string;
  className?: string;
}

export function EntryCard({
  href,
  effectChip,
  source,
  target,
  condition,
  badgeVariant,
  patch,
  className,
}: EntryCardProps) {
  return (
    <article
      className={[
        "group relative flex flex-col rounded-md border border-border p-4 bg-surface transition-colors duration-150 hover:border-border-strong",
        className,
      ].join(" ")}
    >
      <a href={href} className="absolute inset-0 z-10" aria-hidden="true" />

      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-mono text-text-secondary">
          {effectChip}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-semibold text-text">{source}</span>
        <span className="text-text-muted"> vs </span>
        <span className="font-semibold text-text">{target}</span>
      </div>

      <p className="text-sm text-text-secondary leading-1.4 truncate">{condition}</p>

      <footer className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Badge variant={badgeVariant} patch={patch} />
        <span className="text-[11px] font-mono text-text-muted" aria-hidden="true">
          &rarr;
        </span>
      </footer>
    </article>
  );
}