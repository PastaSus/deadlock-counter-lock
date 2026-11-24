import {
  HERO_ARTWORK_TEXT_SHADOW,
  HeroArtworkBackdrop,
} from "./hero-artwork-backdrop";

interface HeroRosterTileProps {
  href: string;
  name: string;
  entryCount?: number;
  selected?: boolean;
  imagePath?: string;
  imageWebpPath?: string;
  className?: string;
}

export function HeroRosterTile({
  href,
  name,
  entryCount,
  selected,
  imagePath,
  imageWebpPath,
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
        "group relative flex min-h-[132px] flex-col overflow-hidden rounded-md border border-border p-4 bg-surface transition-colors duration-150 hover:border-border-strong",
        selected && "border-accent",
        className,
      ].join(" ")}
      aria-label={ariaLabel}
    >
      <HeroArtworkBackdrop
        name={name}
        imagePath={imagePath}
        imageWebpPath={imageWebpPath}
        overlay={
          <div
            className={[
              "absolute inset-0 transition-opacity duration-150",
              selected
                ? "bg-accent-dim/70 opacity-100"
                : "bg-surface-raised/60 opacity-0 group-hover:opacity-100",
            ].join(" ")}
          />
        }
      />

      <span
        className="relative z-10 mt-auto font-semibold text-text"
        style={{ textShadow: HERO_ARTWORK_TEXT_SHADOW }}
      >
        {name}
      </span>
      {!hasEntries && (
        <span
          className="relative z-10 mt-1 text-[11px] font-medium text-text-muted"
          style={{ textShadow: HERO_ARTWORK_TEXT_SHADOW }}
        >
          No entries yet
        </span>
      )}
    </a>
  );
}
