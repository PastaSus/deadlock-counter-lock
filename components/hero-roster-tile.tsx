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
  const hasEntries = (entryCount ?? 0) > 0;

  return (
    <a
      href={href}
      className={[
        "group relative flex flex-col rounded-md border border-border p-4 bg-surface transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised",
        selected && "border-accent bg-accent-dim",
        className,
      ].join(" ")}
      aria-label={name}
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