import type { ReactNode } from "react";

export const HERO_ARTWORK_TEXT_SHADOW = "0 1px 2px rgba(0, 0, 0, 0.85)";

interface HeroArtworkBackdropProps {
  name: string;
  imagePath?: string;
  imageWebpPath?: string;
  imagePosition?: string;
  overlay?: ReactNode;
  className?: string;
}

function entityInitial(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || "?";
}

function artworkBackground(
  imagePath?: string,
  imageWebpPath?: string,
): string | undefined {
  if (!imagePath) return undefined;
  if (!imageWebpPath) return `url("${imagePath}")`;
  return `image-set(url("${imageWebpPath}") type("image/webp"), url("${imagePath}") type("image/png"))`;
}

export function HeroArtworkBackdrop({
  name,
  imagePath,
  imageWebpPath,
  imagePosition = "center",
  overlay,
  className,
}: HeroArtworkBackdropProps) {
  const backgroundImage = artworkBackground(imagePath, imageWebpPath);

  return (
    <div
      aria-hidden="true"
      className={[
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      ].join(" ")}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-surface-raised">
        <span className="font-display text-4xl font-semibold text-text-muted">
          {entityInitial(name)}
        </span>
      </div>

      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage,
              backgroundPosition: imagePosition,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to top, var(--media-scrim-strong), var(--media-scrim-soft))",
            }}
          />
        </>
      )}

      {overlay}
    </div>
  );
}
