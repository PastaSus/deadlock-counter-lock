import { AsyncLocalStorage } from "node:async_hooks";
import assert from "node:assert/strict";

import { FLAG_RECORD_KEY_PREFIX, reviewFlag } from "../lib/flags";
import {
  authorizeEditor,
  extractBearerSecret,
  readEditorSecret,
  secretsMatch,
} from "../lib/flags/editor-auth";
import {
  createMemoryStore,
  getDefaultStore,
  setFlagStore,
  type FlagStore,
} from "../lib/flags/store";

(globalThis as { AsyncLocalStorage?: typeof AsyncLocalStorage }).AsyncLocalStorage =
  AsyncLocalStorage;

const TEST_SECRET = "test-editor-secret";

interface ReviewItem {
  id: string;
  entrySlug: string;
  verdict: string;
  note: string | null;
  createdAt: string;
  status: string;
}

interface ReviewApiResponse {
  ok: boolean;
  data?: {
    flag?: ReviewItem;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

interface SeedOverrides {
  id?: string;
  entrySlug?: string;
  verdict?: "verified" | "outdated";
  note?: string;
  createdAt?: string;
  status?: "pending" | "reviewed";
}

type ReviewHandler = (request: Request) => Promise<Response>;
type RequestScopeRunner = <T>(
  action: () => Promise<T>,
  connection?: Promise<void>,
) => Promise<T>;

let postReview: ReviewHandler;
let runInRequestScope: RequestScopeRunner;

function makeRequest(body: unknown, authorization?: string | null): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (authorization) {
    headers.set("authorization", authorization);
  }

  return new Request("http://localhost/api/flags/review", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function fetchReview(
  body: unknown,
  authorization: string | null = `Bearer ${TEST_SECRET}`,
): Promise<{ response: Response; payload: ReviewApiResponse }> {
  return runInRequestScope(async () => {
    const response = await postReview(makeRequest(body, authorization));
    const payload = (await response.json()) as ReviewApiResponse;
    return { response, payload };
  });
}

async function seedFlag(overrides: SeedOverrides = {}): Promise<void> {
  const id =
    overrides.id ?? `flag_${Math.random().toString(36).slice(2, 12)}`;
  const record = {
    id,
    entrySlug: overrides.entrySlug ?? "review-entry",
    verdict: overrides.verdict ?? "verified",
    ...(overrides.note !== undefined ? { note: overrides.note } : {}),
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    status: overrides.status ?? "pending",
  };

  await getDefaultStore().set(`${FLAG_RECORD_KEY_PREFIX}${id}`, record);
}

async function seedRawRecord(value: unknown, id: string): Promise<void> {
  await getDefaultStore().set(`${FLAG_RECORD_KEY_PREFIX}${id}`, value);
}

function createGhostKeyStore(base: FlagStore, ghostKey: string): FlagStore {
  return {
    get: <T>(key: string) => base.get<T>(key),
    set: <T>(key: string, value: T, ttlSeconds?: number) =>
      base.set<T>(key, value, ttlSeconds),
    delete: (key: string) => base.delete(key),
    keys: async (prefix: string) => [...(await base.keys(prefix)), ghostKey],
    setNx: <T>(key: string, value: T, ttlSeconds: number) =>
      base.setNx<T>(key, value, ttlSeconds),
    incrWithTtl: (key: string, ttlSeconds: number) =>
      base.incrWithTtl(key, ttlSeconds),
    ttl: (key: string) => base.ttl(key),
  };
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

async function ignoringConsoleErrors<T>(action: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => undefined;
  try {
    return await action();
  } finally {
    console.error = original;
  }
}

async function loadRoutes(): Promise<void> {
  const [reviewModule, work, unit] = await Promise.all([
    import("../app/api/flags/review/route"),
    import("next/dist/server/app-render/work-async-storage.external"),
    import("next/dist/server/app-render/work-unit-async-storage.external"),
  ]);

  postReview = reviewModule.POST;

  const workAsyncStorage = work.workAsyncStorage as unknown as {
    run: <T>(store: unknown, action: () => T) => T;
  };
  const workUnitAsyncStorage = unit.workUnitAsyncStorage as unknown as {
    run: <T>(store: unknown, action: () => T) => T;
  };

  runInRequestScope = (action, connection = Promise.resolve()) =>
    workAsyncStorage.run(
      {
        route: "/api/flags/review",
        forceStatic: false,
        dynamicShouldError: false,
      },
      () =>
        workUnitAsyncStorage.run(
          {
            type: "request",
            phase: "render",
            asyncApiPromises: {
              connection,
            },
          },
          action,
        ),
    );
}

const checks: [string, () => void | Promise<void>][] = [
  [
    "reviewFlag returns null when the flag does not exist",
    async () => {
      const result = await reviewFlag("does-not-exist");
      assert.equal(result, null);
    },
  ],
  [
    "reviewFlag returns null when the flag is already reviewed",
    async () => {
      await seedFlag({ id: "already-reviewed", status: "reviewed" });
      const result = await reviewFlag("already-reviewed");
      assert.equal(result, null);
    },
  ],
  [
    "reviewFlag transitions a pending flag to reviewed",
    async () => {
      await seedFlag({ id: "pending-flag", status: "pending" });
      const result = await reviewFlag("pending-flag");
      assert.ok(result);
      assert.equal(result!.status, "reviewed");
      assert.equal(result!.id, "pending-flag");
    },
  ],
  [
    "reviewFlag preserves all other fields",
    async () => {
      await seedFlag({
        id: "preserve-fields",
        entrySlug: "some-entry",
        verdict: "outdated",
        note: "a note",
        createdAt: "2026-01-01T00:00:00.000Z",
        status: "pending",
      });
      const result = await reviewFlag("preserve-fields");
      assert.ok(result);
      assert.equal(result!.entrySlug, "some-entry");
      assert.equal(result!.verdict, "outdated");
      assert.equal(result!.note, "a note");
      assert.equal(result!.createdAt, "2026-01-01T00:00:00.000Z");
      assert.equal(result!.status, "reviewed");
    },
  ],
  [
    "reviewFlag skips malformed records",
    async () => {
      await seedRawRecord({ not: "a valid record" }, "malformed");
      const result = await reviewFlag("malformed");
      assert.equal(result, null);
    },
  ],
  [
    "authorizeEditor rejects missing secret header",
    async () => {
      const req = new Request("http://localhost/api/flags/review", {
        method: "POST",
      });
      assert.equal(authorizeEditor(req), "unauthorized");
    },
  ],
  [
    "authorizeEditor rejects wrong secret",
    async () => {
      const req = new Request("http://localhost/api/flags/review", {
        method: "POST",
        headers: { authorization: "Bearer wrong-secret" },
      });
      assert.equal(authorizeEditor(req), "unauthorized");
    },
  ],
  [
    "authorizeEditor returns unconfigured when EDITOR_SECRET is unset",
    async () => {
      const original = process.env.EDITOR_SECRET;
      delete process.env.EDITOR_SECRET;
      try {
        const req = new Request("http://localhost/api/flags/review", {
          method: "POST",
          headers: { authorization: `Bearer ${TEST_SECRET}` },
        });
        assert.equal(authorizeEditor(req), "unconfigured");
      } finally {
        if (original === undefined) {
          delete process.env.EDITOR_SECRET;
        } else {
          process.env.EDITOR_SECRET = original;
        }
      }
    },
  ],
  [
    "review route returns 401 without a secret",
    async () => {
      const { response, payload } = await fetchReview({ id: "x" }, null);
      assert.equal(response.status, 401);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "UNAUTHORIZED");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route returns 401 with a wrong secret",
    async () => {
      const { response, payload } = await fetchReview({ id: "x" }, "Bearer wrong");
      assert.equal(response.status, 401);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "UNAUTHORIZED");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route returns 200 and transitions pending to reviewed",
    async () => {
      await seedFlag({ id: "flag-to-review", status: "pending" });
      const { response, payload } = await fetchReview({ id: "flag-to-review" });
      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.equal(payload.data?.flag?.id, "flag-to-review");
      assert.equal(payload.data?.flag?.status, "reviewed");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route returns 404 for a nonexistent flag id",
    async () => {
      const { response, payload } = await fetchReview({ id: "no-such-flag" });
      assert.equal(response.status, 404);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "NOT_FOUND");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route returns 404 for an already-reviewed flag id",
    async () => {
      await seedFlag({ id: "already-reviewed", status: "reviewed" });
      const { response, payload } = await fetchReview({
        id: "already-reviewed",
      });
      assert.equal(response.status, 404);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "NOT_FOUND");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route returns 500 when the store fails",
    async () => {
      setFlagStore(createFailingStore());
      const { response, payload } = await ignoringConsoleErrors(() =>
        fetchReview({ id: "x" }),
      );
      assert.equal(response.status, 500);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "INTERNAL_ERROR");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route returns 500 when EDITOR_SECRET is unset",
    async () => {
      const original = process.env.EDITOR_SECRET;
      delete process.env.EDITOR_SECRET;
      try {
        const { response, payload } = await ignoringConsoleErrors(() =>
          fetchReview({ id: "x" }),
        );
        assert.equal(response.status, 500);
        assert.equal(payload.ok, false);
        assert.equal(payload.error?.code, "INTERNAL_ERROR");
        assert.equal(response.headers.get("cache-control"), "no-store");
      } finally {
        if (original === undefined) {
          delete process.env.EDITOR_SECRET;
        } else {
          process.env.EDITOR_SECRET = original;
        }
      }
    },
  ],
  [
    "review route returns 400 for an invalid body",
    async () => {
      const { response, payload } = await fetchReview({ notAnId: true });
      assert.equal(response.status, 400);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "VALIDATION_ERROR");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "review route rethrows the prerender connection rejection",
    async () => {
      const message =
        "During prerendering, `connection()` rejects when the prerender is complete";

      await assert.rejects(
        () =>
          runInRequestScope(
            () => postReview(makeRequest({ id: "x" }, `Bearer ${TEST_SECRET}`)),
            Promise.reject(new Error(message)),
          ),
        (error: unknown) =>
          error instanceof Error && error.message === message,
      );
    },
  ],
];

const originalSecret = process.env.EDITOR_SECRET;

async function main(): Promise<void> {
  await loadRoutes();

  let failures = 0;

  for (const [name, check] of checks) {
    setFlagStore(createMemoryStore());
    process.env.EDITOR_SECRET = TEST_SECRET;
    try {
      await check();
      console.log(`PASS ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  if (originalSecret === undefined) {
    delete process.env.EDITOR_SECRET;
  } else {
    process.env.EDITOR_SECRET = originalSecret;
  }
  setFlagStore(null);

  if (failures > 0) {
    console.error(`${failures} flag review test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${checks.length} flag review checks passed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



