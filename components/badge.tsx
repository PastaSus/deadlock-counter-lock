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
  verified: { icon: Check, label: "VERIFIED" },
  stale: { icon: Minus, label: "STALE" },
  flagged: { icon: AlertCircle, label: "FLAGGED OUTDATED" },
  deprecated: { icon: Minus, label: "DEPRECATED" },
};

export function Badge({ variant, patch, className }: BadgeProps) {
  const state = STATE[variant];
  const Icon = state.icon;
  const stamp = patch ? ` · ${patch}` : "";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.04em] leading-none",
        className,
      ].join(" ")}
      aria-label={`${state.label}${patch ? `, verified as of patch ${patch}` : ""}`}
    >
      <Icon
        className="w-3 h-3 shrink-0"
        aria-hidden="true"
      />
      {state.label}{stamp}
    </span>
  );
}