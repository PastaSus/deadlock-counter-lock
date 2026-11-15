"use client";

import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { SearchField } from "./search-field";
import type { SearchIndex, SearchIndexItem } from "../lib/search-index";

interface HomeSearchProps {
  index: SearchIndex;
}

export function HomeSearch({ index }: HomeSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("q") ?? ""
      : "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems: SearchIndexItem[] = [
    ...index.heroes,
    ...index.abilities,
    ...index.items,
    ...index.entries,
  ];

  const results = runSearch(query);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function runSearch(q: string): SearchIndexItem[] {
    const tokens = q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    if (tokens.length === 0) return [];
    const seen = new Set<string>();
    const out: SearchIndexItem[] = [];
    for (const item of allItems) {
      const text = `${item.title} ${item.label}`.toLowerCase();
      if (tokens.some((t) => text.includes(t)) && !seen.has(item.slug)) {
        seen.add(item.slug);
        out.push(item);
      }
    }
    return out;
  }

  function handleChange(value: string): void {
    setQuery(value);
    router.push(`/?q=${encodeURIComponent(value)}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-2xl">
        <label className="sr-only">Search counterplay entries</label>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-text-muted" aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search heroes, abilities, items, effects"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-1.5 pr-9 text-sm text-text transition-colors duration-150 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          aria-label="Search counterplay entries"
        />
      </div>

      {query.length > 0 ? (
        <section
          aria-live="polite"
          className="rounded-md border border-border p-4 bg-surface-sunken"
        >
          <h3 className="text-[11px] font-mono text-text-muted uppercase tracking-[0.04em] mb-3">
            Results ({results.length})
          </h3>
          {results.length === 0 ? (
            <p className="text-sm text-text-secondary">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.slice(0, 10).map((item) => (
                <li key={item.slug}>
                  <a
                    href={item.href}
                    className="flex items-center gap-2 rounded-md border border-border p-2 bg-surface text-sm text-text-secondary transition-colors hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <span className="font-semibold text-text">{item.title}</span>
                    <span className="ml-auto text-[11px] font-mono text-text-muted">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
              {results.length > 10 && (
                <p className="text-[11px] font-mono text-text-muted mt-2">
                  +{results.length - 10} more
                </p>
              )}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
