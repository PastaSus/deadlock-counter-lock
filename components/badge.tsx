import { Check, AlertCircle, Minus } from "lucide-react";

type BadgeVariant = "verified" | "stale" | "flagged" | "deprecated";

interface BadgeProps {
  variant: BadgeVariant;
  patch?: string;
  className?: string;
}

const STATE: Record<
  BadgeVariant,
  { icon: React.ElementType; label: string }
> = {
  verified: { icon: Check, label: "PATCH-VERIFIED" },
  stale: { icon: Minus, label: "STALE" },
  flagged: { icon: AlertCircle, label: "FLAGGED OUTDATED" },
  deprecated: { icon: Minus, label: "DEPRECATED" },
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  verified:
    "border border-status-verified bg-status-verified-surface text-status-verified",
  stale:
    "border border-dashed border-status-verified bg-status-verified-surface text-status-verified",
  flagged:
    "border border-status-flagged bg-status-flagged-surface text-status-flagged",
  deprecated:
    "border border-status-deprecated bg-status-deprecated-surface text-status-deprecated",
};

const PATCH_PHRASE: Record<BadgeVariant, (patch: string) => string> = {
  verified: (patch) => `Patch-verified as of patch ${patch}`,
  stale: (patch) => `last checked against patch ${patch}`,
  flagged: (patch) => `last checked against patch ${patch}`,
  deprecated: (patch) => `last checked against patch ${patch}`,
};

export function Badge({ variant, patch, className }: BadgeProps) {
  const state = STATE[variant];
  const Icon = state.icon;
  const stamp = patch ? ` · ${patch}` : "";
  const patchPhrase = patch ? `, ${PATCH_PHRASE[variant](patch)}` : "";
  const accessibleName =
    variant === "verified"
      ? patch
        ? PATCH_PHRASE.verified(patch)
        : "Patch-verified"
      : `${state.label}${patchPhrase}`;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.04em] leading-none",
        VARIANT_CLASSES[variant],
        className,
      ].join(" ")}
      aria-label={accessibleName}
    >
      <Icon
        className="w-3 h-3 shrink-0"
        aria-hidden="true"
      />
      {state.label}{stamp}
    </span>
  );
}