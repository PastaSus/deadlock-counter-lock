import { markFlagSubmitted } from "./overlay";
import type { FlagSubmission, FlagVerdict } from "./schema";

export const FLAG_NOTE_MAX_LENGTH = 200;

export const FLAG_REQUEST_TIMEOUT_MS = 10_000;

export const FLAG_SUBMITTING_COPY = "Sending...";

export const FLAG_COPY: Record<FlagOutcome, string> = {
  success: "Flagged. Thanks, it's in the review queue.",
  duplicate: "Already counted, thanks.",
  "rate-limited": "Slow down, you've already flagged this recently.",
  error: "Couldn't send. Try again.",
};

export type FlagSelection = "still-correct" | "outdated";

export type FlagOutcome =
  | "success"
  | "duplicate"
  | "rate-limited"
  | "error";

export function verdictForSelection(selection: FlagSelection): FlagVerdict {
  return selection === "outdated" ? "outdated" : "verified";
}

export function normalizeFlagNote(
  note: string | null | undefined,
): string | undefined {
  if (typeof note !== "string") {
    return undefined;
  }

  const trimmed = note.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, FLAG_NOTE_MAX_LENGTH);
}

export function buildFlagSubmission(
  entrySlug: string,
  selection: FlagSelection,
  note?: string | null,
): FlagSubmission {
  const normalizedNote = normalizeFlagNote(note);

  return {
    entrySlug,
    verdict: verdictForSelection(selection),
    ...(normalizedNote !== undefined ? { note: normalizedNote } : {}),
  };
}

function readErrorCode(body: unknown): string | undefined {
  if (body === null || typeof body !== "object") {
    return undefined;
  }

  const error = (body as { error?: unknown }).error;
  if (error === null || typeof error !== "object") {
    return undefined;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function readOk(body: unknown): unknown {
  if (body === null || typeof body !== "object") {
    return undefined;
  }

  return (body as { ok?: unknown }).ok;
}

export function classifyFlagResponse(
  status: number,
  body: unknown,
): FlagOutcome {
  const successfulStatus = status >= 200 && status < 300;

  if (successfulStatus && readOk(body) === true) {
    return "success";
  }

  const errorCode = readErrorCode(body);

  if (status === 409 && errorCode === "DUPLICATE") {
    return "duplicate";
  }

  if (status === 429 && errorCode === "RATE_LIMITED") {
    return "rate-limited";
  }

  return "error";
}

export interface FlagSubmitRequest {
  entrySlug: string;
  selection: FlagSelection;
  note?: string | null;
}

export interface FlagSubmitResult {
  payload: FlagSubmission;
  outcome: FlagOutcome;
}

export type FlagFetch = (url: string, init: RequestInit) => Promise<Response>;

export async function requestFlagSubmission(
  request: FlagSubmitRequest,
  fetchImpl: FlagFetch = (url, init) => fetch(url, init),
  timeoutMs: number = FLAG_REQUEST_TIMEOUT_MS,
): Promise<FlagSubmitResult> {
  const payload = buildFlagSubmission(
    request.entrySlug,
    request.selection,
    request.note,
  );

  markFlagSubmitted(payload.entrySlug);

  try {
    const response = await fetchImpl("/api/flags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return { payload, outcome: classifyFlagResponse(response.status, body) };
  } catch {
    return { payload, outcome: "error" };
  }
}
