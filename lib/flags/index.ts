import { createHash, randomUUID } from "node:crypto";

import {
  flagRecordSchema,
  type FlagRecord,
  type FlagSubmission,
  type FlagVerdict,
} from "./schema";
import { getDefaultStore, type FlagStore } from "./store";

export const FLAG_RECORD_KEY_PREFIX = "flags:records:";
export const FLAG_DEDUPE_KEY_PREFIX = "flags:dedupe:";
export const FLAG_RATE_LIMIT_KEY_PREFIX = "flags:rate:";
export const FLAG_OVERLAY_KEY_PREFIX = "flags:overlay:";

export const RATE_LIMIT_WINDOW_MS = 30_000;
export const RATE_LIMIT_MAX_REQUESTS = 5;
export const DEDUPE_WINDOW_MS = 60_000;

const RATE_LIMIT_WINDOW_SECONDS = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);
const DEDUPE_WINDOW_SECONDS = Math.ceil(DEDUPE_WINDOW_MS / 1000);

export type SubmitFlagResult =
  | { status: "created"; flag: FlagRecord }
  | { status: "duplicate"; flag: FlagRecord }
  | { status: "rate-limited"; retryAfterSeconds: number };

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function hashVisitor(ip: string, userAgent: string): string {
  return createHash("sha256").update(`${ip}\u0000${userAgent}`).digest("hex");
}

function rateLimitKey(visitorHash: string): string {
  return `${FLAG_RATE_LIMIT_KEY_PREFIX}${visitorHash}`;
}

function dedupeKey(visitorHash: string, entrySlug: string): string {
  return `${FLAG_DEDUPE_KEY_PREFIX}${visitorHash}:${entrySlug}`;
}

function flagRecordKey(flagId: string): string {
  return `${FLAG_RECORD_KEY_PREFIX}${flagId}`;
}

function overlayKey(entrySlug: string): string {
  return `${FLAG_OVERLAY_KEY_PREFIX}${entrySlug}`;
}

async function checkRateLimit(
  store: FlagStore,
  visitorHash: string,
): Promise<RateLimitResult> {
  const key = rateLimitKey(visitorHash);
  const count = await store.incrWithTtl(key, RATE_LIMIT_WINDOW_SECONDS);

  if (count <= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const remaining = await store.ttl(key);
  return {
    allowed: false,
    retryAfterSeconds:
      remaining > 0 ? remaining : RATE_LIMIT_WINDOW_SECONDS,
  };
}

async function readStoredFlag(
  store: FlagStore,
  flagId: string,
): Promise<FlagRecord | null> {
  const raw = await store.get<unknown>(flagRecordKey(flagId));
  if (raw === null) {
    return null;
  }

  const parsed = flagRecordSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function readFlagByDedupeKey(
  store: FlagStore,
  key: string,
): Promise<FlagRecord | null> {
  const flagId = await store.get<unknown>(key);
  if (typeof flagId !== "string") {
    if (flagId !== null) {
      await store.delete(key);
    }
    return null;
  }

  const flag = await readStoredFlag(store, flagId);
  if (!flag) {
    await store.delete(key);
    return null;
  }

  return flag;
}

async function cleanupFlag(
  store: FlagStore,
  visitorHash: string,
  entrySlug: string,
  flagId: string,
): Promise<void> {
  await Promise.allSettled([
    store.delete(dedupeKey(visitorHash, entrySlug)),
    store.delete(flagRecordKey(flagId)),
  ]);
}

export async function submitFlag(
  submission: FlagSubmission,
  visitorHash: string,
  store: FlagStore = getDefaultStore(),
): Promise<SubmitFlagResult> {
  const rateLimit = await checkRateLimit(store, visitorHash);
  if (!rateLimit.allowed) {
    return {
      status: "rate-limited",
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const existing = await readFlagByDedupeKey(
    store,
    dedupeKey(visitorHash, submission.entrySlug),
  );
  if (existing) {
    return { status: "duplicate", flag: existing };
  }

  const now = Date.now();
  const flag: FlagRecord = {
    id: `flag_${randomUUID()}`,
    entrySlug: submission.entrySlug,
    verdict: submission.verdict,
    ...(submission.note !== undefined ? { note: submission.note } : {}),
    createdAt: new Date(now).toISOString(),
    status: "pending",
  };

  await store.set(flagRecordKey(flag.id), flag);

  let claimed = false;
  try {
    claimed = await store.setNx(
      dedupeKey(visitorHash, submission.entrySlug),
      flag.id,
      DEDUPE_WINDOW_SECONDS,
    );
  } catch (error) {
    await Promise.allSettled([store.delete(flagRecordKey(flag.id))]);
    throw error;
  }

  if (!claimed) {
    await Promise.allSettled([store.delete(flagRecordKey(flag.id))]);

    const duplicate = await readFlagByDedupeKey(
      store,
      dedupeKey(visitorHash, submission.entrySlug),
    );
    if (duplicate) {
      return { status: "duplicate", flag: duplicate };
    }

    claimed = await store.setNx(
      dedupeKey(visitorHash, submission.entrySlug),
      flag.id,
      DEDUPE_WINDOW_SECONDS,
    );

    if (claimed) {
      try {
        await store.set(flagRecordKey(flag.id), flag);
      } catch (error) {
        await cleanupFlag(
          store,
          visitorHash,
          submission.entrySlug,
          flag.id,
        );
        throw error;
      }
    } else {
      const retry = await readFlagByDedupeKey(
        store,
        dedupeKey(visitorHash, submission.entrySlug),
      );
      if (retry) {
        return { status: "duplicate", flag: retry };
      }
      throw new Error("Unable to reserve dedupe key");
    }
  }

  if (flag.verdict === "outdated") {
    try {
      await store.set(overlayKey(flag.entrySlug), true);
    } catch (error) {
      await cleanupFlag(
        store,
        visitorHash,
        submission.entrySlug,
        flag.id,
      );
      throw error;
    }
  }

  return { status: "created", flag };
}

export async function getFlaggedSlugs(
  store: FlagStore = getDefaultStore(),
): Promise<string[]> {
  const keys = await store.keys(FLAG_OVERLAY_KEY_PREFIX);
  return keys
    .map((key) => key.slice(FLAG_OVERLAY_KEY_PREFIX.length))
    .filter((slug) => slug.length > 0)
    .sort((a, b) => a.localeCompare(b));
}

export interface BacklogFlag {
  id: string;
  entrySlug: string;
  verdict: FlagVerdict;
  note: string | null;
  createdAt: string;
  age: number;
}

interface BacklogEntry extends BacklogFlag {
  createdAtMs: number;
}

export async function getPendingFlags(
  now: number = Date.now(),
  store: FlagStore = getDefaultStore(),
): Promise<BacklogFlag[]> {
  const keys = await store.keys(FLAG_RECORD_KEY_PREFIX);
  const records = await Promise.all(
    keys.map(async (key): Promise<BacklogEntry | null> => {
      const raw = await store.get<unknown>(key);
      if (raw === null) {
        return null;
      }

      const parsed = flagRecordSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn("Skipping malformed flag record:", key);
        return null;
      }

      if (parsed.data.status !== "pending") {
        return null;
      }

      const createdAtMs = Date.parse(parsed.data.createdAt);
      return {
        id: parsed.data.id,
        entrySlug: parsed.data.entrySlug,
        verdict: parsed.data.verdict,
        note: parsed.data.note ?? null,
        createdAt: parsed.data.createdAt,
        age: Math.max(0, Math.floor((now - createdAtMs) / 1000)),
        createdAtMs,
      };
    }),
  );

  return records
    .filter((record): record is BacklogEntry => record !== null)
    .sort((a, b) => {
      if (a.createdAtMs !== b.createdAtMs) {
        return a.createdAtMs - b.createdAtMs;
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .map(({ id, entrySlug, verdict, note, createdAt, age }) => ({
      id,
      entrySlug,
      verdict,
      note,
      createdAt,
      age,
    }));
}
