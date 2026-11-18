"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle, ThumbsDown, ThumbsUp } from "lucide-react";

import {
  FLAG_COPY,
  FLAG_NOTE_MAX_LENGTH,
  FLAG_SUBMITTING_COPY,
  requestFlagSubmission,
  type FlagSelection,
} from "../lib/flags/feedback";

type Phase = "compose" | "submitting" | "success" | "duplicate" | "rate-limited";

const VERDICTS: {
  selection: FlagSelection;
  label: string;
  Icon: typeof ThumbsUp;
}[] = [
  { selection: "still-correct", label: "Still correct", Icon: ThumbsUp },
  { selection: "outdated", label: "Outdated", Icon: ThumbsDown },
];

const actionClasses =
  "inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60";

interface FlagControlProps {
  entrySlug: string;
  className?: string;
}

export function FlagControl({ entrySlug, className }: FlagControlProps) {
  const [selection, setSelection] = useState<FlagSelection | null>(null);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [failed, setFailed] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  const terminal =
    phase === "success" || phase === "duplicate" || phase === "rate-limited";
  const submitting = phase === "submitting";

  useEffect(() => {
    if (terminal) {
      noticeRef.current?.focus();
    }
  }, [terminal]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selection === null || submitting) {
      return;
    }

    setPhase("submitting");
    setFailed(false);

    const { outcome } = await requestFlagSubmission({
      entrySlug,
      selection,
      note,
    });

    if (outcome === "error") {
      setFailed(true);
      setPhase("compose");
      return;
    }

    setPhase(outcome);
  }

  let notice: string | null = null;
  if (phase === "submitting") {
    notice = FLAG_SUBMITTING_COPY;
  } else if (phase === "success") {
    notice = FLAG_COPY.success;
  } else if (phase === "duplicate") {
    notice = FLAG_COPY.duplicate;
  } else if (phase === "rate-limited") {
    notice = FLAG_COPY["rate-limited"];
  } else if (failed) {
    notice = FLAG_COPY.error;
  }

  return (
    <div className={["space-y-2", className].join(" ")}>
      <div
        ref={noticeRef}
        tabIndex={-1}
        aria-live="polite"
        role="status"
        className="focus:outline-none"
      >
        {notice !== null ? (
          <p
            className={[
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium min-h-[44px]",
              failed
                ? "border-error bg-transparent text-error"
                : "border-border bg-surface text-text-secondary",
            ].join(" ")}
          >
            {phase === "success" ? (
              <CheckCircle
                className="w-3 h-3 shrink-0 text-status-verified"
                aria-hidden="true"
              />
            ) : null}
            <span>{notice}</span>
          </p>
        ) : null}
      </div>

      {terminal ? null : (
        <form
          onSubmit={handleSubmit}
          className="space-y-2"
          aria-busy={submitting}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="Flag this entry">
            {VERDICTS.map(({ selection: value, label, Icon }) => {
              const selected = selection === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelection(value)}
                  disabled={submitting}
                  aria-pressed={selected}
                  className={[
                    actionClasses,
                    selected
                      ? "border-accent bg-surface-raised text-text"
                      : "border-border-input bg-transparent text-text-secondary hover:bg-surface-raised hover:text-text",
                  ].join(" ")}
                >
                  <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {selection !== null ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor={`flag-note-${entrySlug}`} className="sr-only">
                Note (optional)
              </label>
              <input
                id={`flag-note-${entrySlug}`}
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={FLAG_NOTE_MAX_LENGTH}
                placeholder="Add a note (optional)"
                disabled={submitting}
                className="min-h-[44px] w-full rounded-md border border-border-input bg-transparent px-3 text-[13px] text-text placeholder:text-text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 sm:flex-1"
              />
              <button
                type="submit"
                disabled={submitting}
                className={[
                  actionClasses,
                  "border-border-input bg-transparent text-text-secondary hover:bg-surface-raised hover:text-text",
                ].join(" ")}
              >
                Submit
              </button>
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}
