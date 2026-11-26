import type { PatchHistoryEntry } from "../lib/schema";

interface DeprecatedCalloutProps {
  row: PatchHistoryEntry;
  className?: string;
}

export function DeprecatedCallout({ row, className }: DeprecatedCalloutProps) {
  return (
    <aside
      role="note"
      className={[
        "rounded-md border border-deprecated-callout-border bg-deprecated-callout-background p-deprecated-callout-padding text-deprecated-callout-foreground",
        className,
      ].join(" ")}
    >
      <p className="text-[13px] font-medium leading-1.4">
        Deprecated Tech / Patch Note
      </p>
      <p className="mt-1 flex items-baseline gap-2 text-[13px] leading-1.4">
        <span className="font-mono text-[11px]">{row.patch}</span>
        <span>{row.note}</span>
      </p>
    </aside>
  );
}
