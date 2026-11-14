"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SearchFieldProps {
  placeholder?: string;
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
}

export function SearchField({
  placeholder = "Search heroes, abilities, items",
  onChange,
  value,
  className,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={[
        "relative w-full max-w-xs md:max-w-md",
        className,
      ].join(" ")}
    >
      <label className="sr-only">Search counterplay entries</label>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className="w-4 h-4 text-text-muted"
          aria-hidden="true"
        />
      </div>
      <input
        type="search"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={[
          "w-full rounded-md border border-border bg-surface px-3 py-1.5 pr-9 text-sm text-text transition-colors duration-150 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent",
          focused && "border-accent",
        ].join(" ")}
        aria-label="Search counterplay entries"
      />
    </div>
  );
}