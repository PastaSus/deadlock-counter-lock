"use client";

import { useEffect, useState } from "react";

import type { BaseBadgeState } from "../lib/badges";
import {
  createOverlayLoader,
  resolveOverlayPresentation,
  wasFlagSubmittedAfter,
} from "../lib/flags/overlay";
import { Badge } from "./badge";

const loadFlaggedSlugs = createOverlayLoader();

interface FlagOverlayBadgeProps {
  entrySlug: string;
  baseVariant: BaseBadgeState;
  patch?: string;
  className?: string;
}

export function FlagOverlayBadge({
  entrySlug,
  baseVariant,
  patch,
  className,
}: FlagOverlayBadgeProps) {
  const [flaggedSlug, setFlaggedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (baseVariant === "deprecated") {
      return;
    }

    const startedAt = Date.now();
    let active = true;

    loadFlaggedSlugs().then((slugs) => {
      if (
        active &&
        slugs !== null &&
        slugs.includes(entrySlug) &&
        !wasFlagSubmittedAfter(entrySlug, startedAt)
      ) {
        setFlaggedSlug(entrySlug);
      }
    });

    return () => {
      active = false;
    };
  }, [entrySlug, baseVariant]);

  const { variant, announcement } = resolveOverlayPresentation(
    baseVariant,
    entrySlug,
    flaggedSlug,
  );

  return (
    <>
      <Badge variant={variant} patch={patch} className={className} />
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
