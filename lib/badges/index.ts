import { comparePatches, type Entry } from "../schema";

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
