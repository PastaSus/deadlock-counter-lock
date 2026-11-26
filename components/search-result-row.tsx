import type { SearchIndexItem } from "../lib/search-index";
import { AssetMediaRow } from "./asset-media-row";

interface SearchResultRowProps {
  item: SearchIndexItem;
}

export function SearchResultRow({ item }: SearchResultRowProps) {
  return (
    <div className="relative flex items-center gap-2 rounded-md border border-border p-2 bg-surface text-sm text-text-secondary transition-colors hover:z-30 hover:border-border-strong focus-within:z-30">
      <a
        href={item.href}
        className="absolute inset-0 z-10 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={`${item.title}, ${item.label}`}
      />
      <div className="pointer-events-none relative z-20 flex min-w-0 flex-1 items-center gap-2">
        {item.media ? (
          <div className="pointer-events-auto shrink-0">
            <AssetMediaRow media={item.media} />
          </div>
        ) : item.asset ? (
          <div className="pointer-events-auto shrink-0">
            <AssetMediaRow asset={item.asset} />
          </div>
        ) : null}
        <span
          aria-hidden="true"
          className="truncate font-semibold text-text"
        >
          {item.title}
        </span>
        <span
          aria-hidden="true"
          className="ml-auto shrink-0 text-[11px] font-mono text-text-muted"
        >
          {item.label}
        </span>
      </div>
    </div>
  );
}
