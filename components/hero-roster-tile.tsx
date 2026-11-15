interface HeroRosterTileProps {
  href: string;
  name: string;
  entryCount?: number;
  selected?: boolean;
  className?: string;
}

export function HeroRosterTile({
  href,
  name,
  entryCount,
  selected,
  className,
}: HeroRosterTileProps) {
  const count = entryCount ?? 0;
  const hasEntries = count > 0;
  const ariaLabel = hasEntries
    ? `${name}, ${count} ${count === 1 ? "entry" : "entries"}`
    : `${name}, no entries yet`;

  return (
    <a
      href={href}
      className={[
        "group relative flex flex-col rounded-md border border-border p-4 bg-surface transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised",
        selected && "border-accent bg-accent-dim",
        className,
      ].join(" ")}
      aria-label={ariaLabel}
    >
      <span className="font-semibold text-text">{name}</span>
      {!hasEntries && (
        <span className="mt-auto text-[11px] font-medium text-text-muted">
          No entries yet
        </span>
      )}
    </a>
  );
}