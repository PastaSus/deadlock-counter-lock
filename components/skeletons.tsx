import { Badge } from "./badge";

export function RosterSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-md border border-border p-4 bg-surface animate-pulse">
          <div className="h-3 w-24 rounded-md bg-surface-raised mb-2" />
          <div className="h-2 w-full rounded-md bg-surface-raised mb-2" />
          <div className="h-2 w-3/4 rounded-md bg-surface-raised" />
        </div>
      ))}
    </div>
  );
}

export function EntryDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="h-7 w-16 rounded-md bg-surface-raised animate-pulse" />
        <div className="h-1 w-32 rounded-md bg-surface-raised animate-pulse" />
        <div className="h-1 w-16 rounded-md bg-surface-raised animate-pulse" />
      </div>
      <div className="h-1 w-1/2 rounded-md bg-surface-raised animate-pulse mb-2" />
      <div className="h-4 w-1/3 rounded-md bg-surface-raised animate-pulse" />
      <Badge variant="verified" patch="1.0" className="animate-pulse" />
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 w-64 rounded-md border border-border bg-surface animate-pulse" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-md border border-border p-4 bg-surface animate-pulse"
          >
            <div className="h-7 w-20 rounded-md bg-surface-raised" />
            <div className="h-1 w-32 rounded-md bg-surface-raised" />
            <div className="h-1 w-16 rounded-md bg-surface-raised" />
            <Badge variant="verified" patch="1.0" className="animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-surface-raised animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="h-4 w-32 rounded-md bg-surface-raised animate-pulse" />
          <div className="h-3 w-20 rounded-md bg-surface-raised animate-pulse" />
        </div>
      </div>
      <EntryDetailSkeleton />
      <EntryDetailSkeleton />
    </div>
  );
}