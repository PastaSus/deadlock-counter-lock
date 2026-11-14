"use client";

import { useState } from "react";
import { Link as LucideLink, Link2 } from "lucide-react";

interface CopyLinkProps {
  url: string;
  title: string;
  patch: string;
  className?: string;
}

export function CopyLink({ url, title, patch, className }: CopyLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? Link2 : LucideLink;
  const label = copied
    ? `Counterlock · ${title} · verified as of patch ${patch}`
    : "Copy link";

  return (
    <button
      onClick={handleCopy}
      className={[
        "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 bg-transparent text-[13px] font-medium text-text-secondary transition-colors hover:text-text min-h-[44px]",
        className,
      ].join(" ")}
      aria-label={label}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{copied ? "Copied" : "Copy link"}</span>
    </button>
  );
}