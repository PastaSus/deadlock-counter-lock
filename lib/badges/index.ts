import {
  comparePatches,
  type Entry,
  type PatchHistoryEntry,
} from "../schema";

export type BaseBadgeState = "verified" | "stale" | "deprecated";

export function deriveBadgeState(
  entry: Pick<Entry, "verifiedPatch" | "deprecated">,
  currentPatch: string,
): BaseBadgeState {
  if (entry.deprecated) {
    return "deprecated";
  }

  return comparePatches(entry.verifiedPatch, currentPatch) < 0
    ? "stale"
    : "verified";
}

export function latestPatchHistory(
  entry: Pick<Entry, "patchHistory">,
): PatchHistoryEntry | undefined {
  return entry.patchHistory.reduce<PatchHistoryEntry | undefined>(
    (latest, row) =>
      latest === undefined || comparePatches(row.patch, latest.patch) > 0
        ? row
        : latest,
    undefined,
  );
}
