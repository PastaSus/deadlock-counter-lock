"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { AssetTier } from "../lib/schema";

const TIER_BORDER_CLASS: Record<AssetTier, string> = {
  "tier-1": "border-tier-1",
  "tier-2": "border-tier-2",
  "tier-3": "border-tier-3",
  "tier-4": "border-tier-4",
};

const SIZE_CLASS = {
  portrait: "h-8 w-8",
  icon: "h-6 w-6",
} as const;

const RADIUS_CLASS = {
  portrait: "rounded-md",
  icon: "rounded-sm",
} as const;

export interface AssetTooltipProps {
  name: string;
  typeLabel: string;
  summary: string;
  tier?: AssetTier;
  imagePath?: string;
  imageWebpPath?: string;
  variant?: "portrait" | "icon";
  tierBorder?: boolean;
  className?: string;
}

function entityInitial(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || "?";
}

export function shouldShowImage(
  imagePath: string | undefined,
  imageFailed: boolean,
): boolean {
  return Boolean(imagePath) && !imageFailed;
}

export function AssetTooltip({
  name,
  typeLabel,
  summary,
  tier,
  imagePath,
  imageWebpPath,
  variant = "icon",
  tierBorder = false,
  className,
}: AssetTooltipProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const tooltipId = useId();
  const imgRef = useRef<HTMLImageElement>(null);

  const open = (hovered || focused) && !dismissed;
  const showImage = shouldShowImage(imagePath, imageFailed);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDismissed(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setImageFailed(true);
    }
  }, [imagePath, imageWebpPath]);

  const borderClass =
    tierBorder && tier
      ? `border-2 ${TIER_BORDER_CLASS[tier]}`
      : "border border-border";

  return (
    <span
      className={["relative inline-flex", className].join(" ")}
      onMouseEnter={() => {
        setHovered(true);
        setDismissed(false);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={name}
        aria-describedby={tooltipId}
        onFocus={() => {
          setFocused(true);
          setDismissed(false);
        }}
        onBlur={() => setFocused(false)}
        onClick={() => setDismissed(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDismissed(true);
          } else if (event.key === "Enter" || event.key === " ") {
            setDismissed(false);
          }
        }}
        className={[
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-raised text-text-muted",
          SIZE_CLASS[variant],
          RADIUS_CLASS[variant],
          borderClass,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "absolute inset-0 flex items-center justify-center bg-surface-raised font-mono text-text-muted",
            variant === "portrait" ? "text-[12px]" : "text-[10px]",
          ].join(" ")}
        >
          {entityInitial(name)}
        </span>

        {showImage && (
          <picture className="relative block h-full w-full">
            {imageWebpPath ? (
              <source srcSet={imageWebpPath} type="image/webp" />
            ) : null}
            <img
              ref={imgRef}
              src={imagePath}
              alt=""
              aria-hidden="true"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          </picture>
        )}
      </button>

      <span
        className={[
          "absolute left-0 top-full z-30 pt-1",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <span
          id={tooltipId}
          role="tooltip"
          className="block w-max max-w-[var(--asset-tooltip-max-width)] rounded-md border border-border-strong bg-surface-raised p-3 text-[12px] leading-[1.4]"
        >
          <span className="block font-semibold text-text">{name}</span>
          <span className="mt-0.5 block font-mono text-[11px] text-text-muted">
            {typeLabel}
          </span>
          <span className="mt-1 block text-text-secondary">{summary}</span>
        </span>
      </span>
    </span>
  );
}
