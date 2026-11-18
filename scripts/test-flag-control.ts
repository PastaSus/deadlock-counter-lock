import assert from "node:assert/strict";

import { POST } from "../app/api/flags/route";
import { FLAG_RECORD_KEY_PREFIX } from "../lib/flags";
import {
  FLAG_COPY,
  FLAG_NOTE_MAX_LENGTH,
  FLAG_SUBMITTING_COPY,
  buildFlagSubmission,
  classifyFlagResponse,
  normalizeFlagNote,
  requestFlagSubmission,
  verdictForSelection,
  type FlagFetch,
} from "../lib/flags/feedback";
import {
  createMemoryStore,
  getDefaultStore,
  setFlagStore,
  type FlagStore,
} from "../lib/flags/store";

function errorBody(code: string, message = "test error") {
  return { ok: false, error: { code, message } };
}

function createdBody() {
  return {
    ok: true,
    data: {
      flag: {
        id: "flag_test",
        entrySlug: "knockdown-vs-danny-crash",
        verdict: "outdated",
        createdAt: "2026-11-18T00:00:00.000Z",
        status: "pending",
      },
    },
  };
}

function fetchFromRoute(): FlagFetch {
  return (url, init) =>
    POST(new Request(new URL(url, "http://localhost"), init));
}

function createFailingStore(): FlagStore {
  const failure = async (): Promise<never> => {
    throw new Error("forced store failure");
  };

  return {
    get: failure,
    set: failure,
    delete: failure,
    keys: failure,
    setNx: failure,
    incrWithTtl: failure,
    ttl: failure,
  };
}

async function ignoringConsoleErrors<T>(
  action: () => Promise<T>,
): Promise<T> {
  const original = console.error;
  console.error = () => undefined;
  try {
    return await action();
  } finally {
    console.error = original;
  }
}

const checks: [string, () => void | Promise<void>][] = [
  [
    "copy strings match the approved UX wording",
    () => {
      assert.equal(
        FLAG_COPY.success,
        "Flagged. Thanks, it's in the review queue.",
      );
      assert.equal(FLAG_COPY.duplicate, "Already counted, thanks.");
      assert.equal(
        FLAG_COPY["rate-limited"],
        "Slow down, you've already flagged this recently.",
      );
      assert.equal(FLAG_COPY.error, "Couldn't send. Try again.");
      assert.equal(FLAG_SUBMITTING_COPY, "Sending...");
    },
  ],
  [
    "verdict mapping: Still correct is verified, Outdated is outdated",
    () => {
      assert.equal(verdictForSelection("still-correct"), "verified");
      assert.equal(verdictForSelection("outdated"), "outdated");
    },
  ],
  [
    "SUBMIT_OUTDATED builds an outdated payload for the entry",
    () => {
      assert.deepEqual(
        buildFlagSubmission("knockdown-vs-danny-crash", "outdated"),
        {
          entrySlug: "knockdown-vs-danny-crash",
          verdict: "outdated",
        },
      );
    },
  ],
  [
    "SUBMIT_VERIFIED builds a verified payload for the entry",
    () => {
      assert.deepEqual(
        buildFlagSubmission("knockdown-vs-danny-crash", "still-correct"),
        {
          entrySlug: "knockdown-vs-danny-crash",
          verdict: "verified",
        },
      );
    },
  ],
  [
    "NOTE_INCLUDED trims the note and keeps it on the payload",
    () => {
      assert.deepEqual(
        buildFlagSubmission(
          "knockdown-vs-danny-crash",
          "outdated",
          "  dash now recharges  ",
        ),
        {
          entrySlug: "knockdown-vs-danny-crash",
          verdict: "outdated",
          note: "dash now recharges",
        },
      );
    },
  ],
  [
    "EMPTY_NOTE omits the note property entirely",
    () => {
      for (const note of ["", "   ", null, undefined]) {
        const submission = buildFlagSubmission(
          "knockdown-vs-danny-crash",
          "still-correct",
          note,
        );
        assert.equal(
          Object.prototype.hasOwnProperty.call(submission, "note"),
          false,
        );
      }
    },
  ],
  [
    "note normalization caps input at 200 characters",
    () => {
      assert.equal(FLAG_NOTE_MAX_LENGTH, 200);
      assert.equal(normalizeFlagNote("x".repeat(201))?.length, 200);
      assert.equal(normalizeFlagNote(`  ${"x".repeat(400)}  `)?.length, 200);
    },
  ],
  [
    "SUBMIT_OUTDATED posts the built payload to /api/flags",
    async () => {
      let capturedUrl = "";
      let capturedInit: RequestInit | null = null;
      const fetchImpl: FlagFetch = async (url, init) => {
        capturedUrl = url;
        capturedInit = init;
        return Response.json(createdBody(), { status: 201 });
      };

      const result = await requestFlagSubmission(
        {
          entrySlug: "knockdown-vs-danny-crash",
          selection: "outdated",
          note: "  dash recharges now  ",
        },
        fetchImpl,
      );

      assert.equal(capturedUrl, "/api/flags");
      assert.ok(capturedInit);
      assert.equal(capturedInit.method, "POST");
      assert.deepEqual(capturedInit.headers, {
        "Content-Type": "application/json",
      });
      assert.deepEqual(JSON.parse(String(capturedInit.body)), {
        entrySlug: "knockdown-vs-danny-crash",
        verdict: "outdated",
        note: "dash recharges now",
      });
      assert.equal(result.outcome, "success");
      assert.deepEqual(result.payload, {
        entrySlug: "knockdown-vs-danny-crash",
        verdict: "outdated",
        note: "dash recharges now",
      });
    },
  ],
  [
    "SUBMIT_VERIFIED posts verdict verified",
    async () => {
      let sent: Record<string, unknown> | null = null;
      const fetchImpl: FlagFetch = async (_url, init) => {
        sent = JSON.parse(String(init.body)) as Record<string, unknown>;
        return Response.json({ ok: true }, { status: 201 });
      };

      await requestFlagSubmission(
        { entrySlug: "knockdown-vs-danny-crash", selection: "still-correct" },
        fetchImpl,
      );

      assert.equal(sent?.verdict, "verified");
    },
  ],
  [
    "EMPTY_NOTE posts a body without a note property",
    async () => {
      let sent: Record<string, unknown> | null = null;
      const fetchImpl: FlagFetch = async (_url, init) => {
        sent = JSON.parse(String(init.body)) as Record<string, unknown>;
        return Response.json({ ok: true }, { status: 201 });
      };

      await requestFlagSubmission(
        {
          entrySlug: "knockdown-vs-danny-crash",
          selection: "outdated",
          note: "   ",
        },
        fetchImpl,
      );

      assert.ok(sent);
      assert.equal(
        Object.prototype.hasOwnProperty.call(sent, "note"),
        false,
      );
    },
  ],
  [
    "the request carries an abort timeout",
    async () => {
      let signal: AbortSignal | undefined;
      const fetchImpl: FlagFetch = async (_url, init) => {
        signal = init.signal ?? undefined;
        return Response.json({ ok: true }, { status: 201 });
      };

      await requestFlagSubmission(
        { entrySlug: "knockdown-vs-danny-crash", selection: "outdated" },
        fetchImpl,
      );

      assert.ok(signal instanceof AbortSignal);
      assert.equal(signal.aborted, false);
    },
  ],
  [
    "a hung request aborts into the retryable error outcome",
    async () => {
      const fetchImpl: FlagFetch = (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        });

      const result = await requestFlagSubmission(
        {
          entrySlug: "knockdown-vs-danny-crash",
          selection: "outdated",
          note: "retry me",
        },
        fetchImpl,
        5,
      );

      assert.equal(result.outcome, "error");
      assert.equal(result.payload.note, "retry me");
    },
  ],
  [
    "a thrown fetch maps to the retryable error outcome",
    async () => {
      const result = await requestFlagSubmission(
        { entrySlug: "knockdown-vs-danny-crash", selection: "outdated" },
        async () => {
          throw new Error("network down");
        },
      );

      assert.equal(result.outcome, "error");
    },
  ],
  [
    "an unparseable response body maps to error",
    async () => {
      const result = await requestFlagSubmission(
        { entrySlug: "knockdown-vs-danny-crash", selection: "outdated" },
        async () => new Response("not json", { status: 201 }),
      );

      assert.equal(result.outcome, "error");
    },
  ],
  [
    "a 2xx body without ok: true never claims success",
    async () => {
      const result = await requestFlagSubmission(
        { entrySlug: "knockdown-vs-danny-crash", selection: "outdated" },
        async () => Response.json({ ok: false }, { status: 201 }),
      );

      assert.equal(result.outcome, "error");
    },
  ],
  [
    "DUPLICATE maps 409 DUPLICATE to the duplicate outcome",
    () => {
      assert.equal(
        classifyFlagResponse(409, errorBody("DUPLICATE")),
        "duplicate",
      );
    },
  ],
  [
    "RATE_LIMITED maps 429 RATE_LIMITED to the rate-limited outcome",
    () => {
      assert.equal(
        classifyFlagResponse(429, errorBody("RATE_LIMITED")),
        "rate-limited",
      );
    },
  ],
  [
    "VALIDATION_ERROR keeps the control in the retryable error state",
    () => {
      assert.equal(
        classifyFlagResponse(400, errorBody("VALIDATION_ERROR")),
        "error",
      );
    },
  ],
  [
    "SERVER_OR_NETWORK failures map to the retryable error state",
    () => {
      assert.equal(
        classifyFlagResponse(500, errorBody("INTERNAL_ERROR")),
        "error",
      );
      assert.equal(classifyFlagResponse(500, null), "error");
      assert.equal(classifyFlagResponse(502, "<html>bad gateway</html>"), "error");
    },
  ],
  [
    "mismatched status and code pairs do not produce a terminal outcome",
    () => {
      assert.equal(
        classifyFlagResponse(409, errorBody("RATE_LIMITED")),
        "error",
      );
      assert.equal(
        classifyFlagResponse(429, errorBody("DUPLICATE")),
        "error",
      );
      assert.equal(classifyFlagResponse(409, { ok: true }), "error");
    },
  ],
  [
    "malformed error envelopes fall back to error",
    () => {
      assert.equal(classifyFlagResponse(409, { error: "DUPLICATE" }), "error");
      assert.equal(classifyFlagResponse(429, { error: { code: 429 } }), "error");
      assert.equal(classifyFlagResponse(400, []), "error");
    },
  ],
  [
    "a real 201 envelope classifies as success and persists the note",
    async () => {
      const result = await requestFlagSubmission(
        {
          entrySlug: "contract-success-entry",
          selection: "outdated",
          note: "  still true after the patch  ",
        },
        fetchFromRoute(),
      );

      assert.equal(result.outcome, "success");

      const store = getDefaultStore();
      const keys = await store.keys(FLAG_RECORD_KEY_PREFIX);
      assert.equal(keys.length, 1);
      const record = await store.get<{ note?: string; verdict?: string }>(
        keys[0],
      );
      assert.equal(record?.verdict, "outdated");
      assert.equal(record?.note, "still true after the patch");
    },
  ],
  [
    "a real 409 envelope classifies as duplicate",
    async () => {
      await requestFlagSubmission(
        { entrySlug: "contract-duplicate-entry", selection: "outdated" },
        fetchFromRoute(),
      );
      const second = await requestFlagSubmission(
        { entrySlug: "contract-duplicate-entry", selection: "still-correct" },
        fetchFromRoute(),
      );

      assert.equal(second.outcome, "duplicate");
    },
  ],
  [
    "a real 429 envelope classifies as rate-limited",
    async () => {
      for (let index = 1; index <= 5; index += 1) {
        const allowed = await requestFlagSubmission(
          {
            entrySlug: `contract-rate-entry-${index}`,
            selection: "still-correct",
          },
          fetchFromRoute(),
        );
        assert.equal(allowed.outcome, "success");
      }

      const limited = await requestFlagSubmission(
        { entrySlug: "contract-rate-entry-6", selection: "still-correct" },
        fetchFromRoute(),
      );

      assert.equal(limited.outcome, "rate-limited");
    },
  ],
  [
    "a real 400 envelope classifies as error",
    async () => {
      const response = await POST(
        new Request("http://localhost/api/flags", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            entrySlug: "Not A Slug",
            verdict: "outdated",
          }),
        }),
      );

      assert.equal(response.status, 400);
      assert.equal(
        classifyFlagResponse(response.status, await response.json()),
        "error",
      );
    },
  ],
  [
    "a real 500 envelope classifies as error",
    async () => {
      setFlagStore(createFailingStore());

      const response = await ignoringConsoleErrors(() =>
        POST(
          new Request("http://localhost/api/flags", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              entrySlug: "contract-failure-entry",
              verdict: "verified",
            }),
          }),
        ),
      );

      assert.equal(response.status, 500);
      assert.equal(
        classifyFlagResponse(response.status, await response.json()),
        "error",
      );
    },
  ],
];

async function main(): Promise<void> {
  let failures = 0;

  for (const [name, check] of checks) {
    setFlagStore(createMemoryStore());
    try {
      await check();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  setFlagStore(null);

  if (failures > 0) {
    console.error(`${failures} flag control test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${checks.length} flag control checks passed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
