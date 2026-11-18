import type { BaseBadgeState } from "../badges";

export const FLAGGED_ANNOUNCEMENT =
  "Community-flagged outdated, in review";

const OVERLAY_REQUEST_TIMEOUT_MS = 10_000;

const submittedAt = new Map<string, number>();

export type OverlayBadgeState = BaseBadgeState | "flagged";

export type OverlayFetch = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export function markFlagSubmitted(entrySlug: string): void {
  submittedAt.set(entrySlug, Date.now());
}

export function wasFlagSubmittedAfter(
  entrySlug: string,
  since: number,
): boolean {
  const timestamp = submittedAt.get(entrySlug);
  return timestamp !== undefined && timestamp >= since;
}

export function parseFlaggedSlugs(body: unknown): string[] {
  if (body === null || typeof body !== "object") {
    return [];
  }

  if ((body as { ok?: unknown }).ok !== true) {
    return [];
  }

  const data = (body as { data?: unknown }).data;
  if (data === null || typeof data !== "object") {
    return [];
  }

  const slugs = (data as { flaggedSlugs?: unknown }).flaggedSlugs;
  if (!Array.isArray(slugs)) {
    return [];
  }

  return slugs.filter(
    (slug): slug is string => typeof slug === "string" && slug.length > 0,
  );
}

export async function requestFlagOverlay(
  fetchImpl: OverlayFetch = (url, init) => fetch(url, init),
): Promise<string[] | null> {
  try {
    const response = await fetchImpl("/api/flags/overlay", {
      cache: "no-store",
      signal: AbortSignal.timeout(OVERLAY_REQUEST_TIMEOUT_MS),
    });

    if (response.status < 200 || response.status >= 300) {
      return null;
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return null;
    }

    if (
      body === null ||
      typeof body !== "object" ||
      (body as { ok?: unknown }).ok !== true
    ) {
      return null;
    }

    const data = (body as { data?: unknown }).data;
    if (data === null || typeof data !== "object") {
      return null;
    }

    if (!Array.isArray((data as { flaggedSlugs?: unknown }).flaggedSlugs)) {
      return null;
    }

    return parseFlaggedSlugs(body);
  } catch {
    return null;
  }
}

export function createOverlayLoader(
  fetchImpl: OverlayFetch = (url, init) => fetch(url, init),
): () => Promise<string[] | null> {
  let pending: Promise<string[] | null> | null = null;

  return () => {
    if (pending === null) {
      pending = requestFlagOverlay(fetchImpl).then((slugs) => {
        if (slugs === null) {
          pending = null;
        }
        return slugs;
      });
    }

    return pending;
  };
}

export function overlayBadgeVariant(
  base: BaseBadgeState,
  isFlagged: boolean,
): OverlayBadgeState {
  if (isFlagged && (base === "verified" || base === "stale")) {
    return "flagged";
  }

  return base;
}

export interface OverlayPresentation {
  variant: OverlayBadgeState;
  announcement: string;
}

export function resolveOverlayPresentation(
  base: BaseBadgeState,
  entrySlug: string,
  confirmedSlug: string | null,
): OverlayPresentation {
  const variant = overlayBadgeVariant(base, confirmedSlug === entrySlug);

  return {
    variant,
    announcement: variant === "flagged" ? FLAGGED_ANNOUNCEMENT : "",
  };
}
