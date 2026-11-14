interface PatchHistoryRow {
  patch: string;
  note: string;
  effectChange: string;
}

interface PatchHistoryProps {
  rows: PatchHistoryRow[];
  className?: string;
}

export function PatchHistory({ rows, className }: PatchHistoryProps) {
  const sorted = [...rows].sort((a, b) => {
    const [aMajor, aMinor] = a.patch.split(".").map(Number);
    const [bMajor, bMinor] = b.patch.split(".").map(Number);
    return aMajor - bMajor || aMinor - bMinor;
  });

  return (
    <section
      className={[
        "rounded-md border border-border p-4 bg-surface-sunken",
        className,
      ].join(" ")}
    >
      <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.04em] mb-2">
        Patch History
      </h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-text-secondary">No recorded changes</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((row) => (
            <li key={row.patch} className="flex items-baseline gap-2">
              <span className="text-[11px] font-mono text-text-muted">{row.patch}</span>
              <span className="text-sm text-text-secondary">{row.note}</span>
              <span className="ml-auto text-[11px] font-mono text-text-muted">
                {row.effectChange}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}