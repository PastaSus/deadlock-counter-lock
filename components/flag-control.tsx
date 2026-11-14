"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";

type FlagState = "idle" | "submitted" | "already-counted" | "rate-limited";

interface FlagControlProps {
  className?: string;
}

export function FlagControl({ className }: FlagControlProps) {
  const [state, setState] = useState<FlagState>("idle");

  function submit(flag: "correct" | "outdated") {
    setState("submitted");
  }

  if (state === "submitted") {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 bg-surface text-[13px] font-medium text-text-secondary min-h-[44px]">
        <CheckCircle className="w-3 h-3 text-status-verified" aria-hidden="true" />
        <span>Flagged. Thanks, it&apos;s in the review queue.</span>
      </div>
    );
  }

  if (state === "already-counted") {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 bg-surface text-[13px] font-medium text-text-secondary min-h-[44px]">
        <span>Already counted, thanks.</span>
      </div>
    );
  }

  if (state === "rate-limited") {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 bg-surface text-[13px] font-medium text-text-secondary min-h-[44px]">
        <span>Slow down, you&apos;ve already flagged this recently.</span>
      </div>
    );
  }

  return (
    <div className="flex gap-1" role="group" aria-label="Flag this entry">
      <button
        onClick={() => submit("correct")}
        className="rounded-md border border-border-input px-3 py-1.5 bg-transparent text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-raised min-h-[44px]"
        aria-label="Still correct"
      >
        <ThumbsUp className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span className="ml-1">Still correct</span>
      </button>
      <button
        onClick={() => submit("outdated")}
        className="rounded-md border border-border-input px-3 py-1.5 bg-transparent text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-raised min-h-[44px]"
        aria-label="Outdated"
      >
        <ThumbsDown className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span className="ml-1">Outdated</span>
      </button>
    </div>
  );
}