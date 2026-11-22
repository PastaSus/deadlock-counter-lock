import { AsyncLocalStorage } from "node:async_hooks";
import assert from "node:assert/strict";

import { FLAG_RECORD_KEY_PREFIX, getPendingFlags } from "../lib/flags";
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

interface BacklogItem {
  id: string;
  entrySlug: string;
  verdict: string;
  note: string | null;
  createdAt: string;
  age: number;
}

interface BacklogApiResponse {
  ok: boolean;
  data?: {
    flags?: BacklogItem[];
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

type BacklogHandler = (request: Request) => Promise<Response>;
type RequestScopeRunner = <T>(
  action: () => Promise<T>,
  connection?: Promise<void>,
) => Promise<T>;

let getBacklog: BacklogHandler;
let runInRequestScope: RequestScopeRunner;

function makeRequest(authorization?: string | null): Request {
  const headers = new Headers();
  if (authorization) {
    headers.set("authorization", authorization);
  }

  return new Request("http://localhost/api/flags/backlog", {
    method: "GET",
    headers,
  });
}

async function fetchBacklog(
  authorization: string | null = `Bearer ${TEST_SECRET}`,
): Promise<{ response: Response; payload: BacklogApiResponse }> {
  return runInRequestScope(async () => {
    const response = await getBacklog(makeRequest(authorization));
    const payload = (await response.json()) as BacklogApiResponse;
    return { response, payload };
  });
}

async function seedFlag(overrides: SeedOverrides = {}): Promise<void> {
  const id =
    overrides.id ?? `flag_${Math.random().toString(36).slice(2, 12)}`;
  const record = {
    id,
    entrySlug: overrides.entrySlug ?? "backlog-entry",
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

async function captureConsoleWarnings<T>(
  action: () => Promise<T>,
): Promise<{ result: T; warnings: unknown[][] }> {
  const original = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };
  try {
    const result = await action();
    return { result, warnings };
  } finally {
    console.warn = original;
  }
}

async function loadRoutes(): Promise<void> {
  const [backlogModule, work, unit] = await Promise.all([
    import("../app/api/flags/backlog/route"),
    import("next/dist/server/app-render/work-async-storage.external"),
    import("next/dist/server/app-render/work-unit-async-storage.external"),
  ]);

  getBacklog = backlogModule.GET;

  const workAsyncStorage = work.workAsyncStorage as unknown as {
    run: <T>(store: unknown, action: () => T) => T;
  };
  const workUnitAsyncStorage = unit.workUnitAsyncStorage as unknown as {
    run: <T>(store: unknown, action: () => T) => T;
  };

  runInRequestScope = (action, connection = Promise.resolve()) =>
    workAsyncStorage.run(
      {
        route: "/api/flags/backlog",
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
    "extractBearerSecret reads a Bearer token",
    () => {
      assert.equal(extractBearerSecret("Bearer abc"), "abc");
      assert.equal(extractBearerSecret("bearer abc"), "abc");
      assert.equal(extractBearerSecret("  Bearer   abc  "), "abc");
      assert.equal(extractBearerSecret(`Bearer ${TEST_SECRET}`), TEST_SECRET);
    },
  ],
  [
    "extractBearerSecret rejects missing, wrong, and empty tokens",
    () => {
      assert.equal(extractBearerSecret(null), null);
      assert.equal(extractBearerSecret(""), null);
      assert.equal(extractBearerSecret("Bearer"), null);
      assert.equal(extractBearerSecret("Bearer "), null);
      assert.equal(extractBearerSecret("Basic abc"), null);
      assert.equal(extractBearerSecret("abc"), null);
    },
  ],
  [
    "secretsMatch never throws on length mismatch and only matches equals",
    () => {
      assert.equal(secretsMatch(TEST_SECRET, TEST_SECRET), true);
      assert.equal(secretsMatch("secret-value", "secret-valuf"), false);
      assert.equal(secretsMatch("short", "a-much-longer-secret"), false);
      assert.equal(secretsMatch("", TEST_SECRET), false);
    },
  ],
  [
    "authorizeEditor fails closed when the secret is unconfigured",
    () => {
      const request = new Request("http://localhost/api/flags/backlog", {
        headers: { authorization: `Bearer ${TEST_SECRET}` },
      });

      assert.equal(authorizeEditor(request, {}), "unconfigured");
      assert.equal(
        authorizeEditor(request, { EDITOR_SECRET: "" }),
        "unconfigured",
      );
    },
  ],
  [
    "authorizeEditor accepts the configured bearer secret",
    () => {
      const request = new Request("http://localhost/api/flags/backlog", {
        headers: { authorization: `Bearer ${TEST_SECRET}` },
      });

      assert.equal(
        authorizeEditor(request, { EDITOR_SECRET: TEST_SECRET }),
        "authorized",
      );
    },
  ],
  [
    "authorizeEditor rejects missing, wrong, and malformed secrets",
    () => {
      const env = { EDITOR_SECRET: TEST_SECRET };
      const missing = new Request("http://localhost/api/flags/backlog");
      const wrong = new Request("http://localhost/api/flags/backlog", {
        headers: { authorization: "Bearer wrong-secret" },
      });
      const malformed = new Request("http://localhost/api/flags/backlog", {
        headers: { authorization: "Basic abc" },
      });

      assert.equal(authorizeEditor(missing, env), "unauthorized");
      assert.equal(authorizeEditor(wrong, env), "unauthorized");
      assert.equal(authorizeEditor(malformed, env), "unauthorized");
    },
  ],
  [
    "readEditorSecret trims padded values and treats whitespace as unconfigured",
    () => {
      assert.equal(
        readEditorSecret({ EDITOR_SECRET: `  ${TEST_SECRET}  ` }),
        TEST_SECRET,
      );
      assert.equal(readEditorSecret({ EDITOR_SECRET: "   " }), null);
      assert.equal(readEditorSecret({ EDITOR_SECRET: "" }), null);
      assert.equal(readEditorSecret({}), null);
    },
  ],
  [
    "authorizeEditor accepts a padded configured secret with a trimmed token",
    () => {
      const request = new Request("http://localhost/api/flags/backlog", {
        headers: { authorization: `Bearer ${TEST_SECRET}` },
      });

      assert.equal(
        authorizeEditor(request, { EDITOR_SECRET: `  ${TEST_SECRET}\n` }),
        "authorized",
      );
    },
  ],
  [
    "AUTH_OK returns pending flags oldest-first with age",
    async () => {
      const realNow = Date.now;
      const current = Date.parse("2026-11-19T12:00:00.000Z");
      Date.now = () => current;

      try {
        await seedFlag({
          id: "flag_new",
          entrySlug: "new-entry",
          createdAt: new Date(current - 5_000).toISOString(),
        });
        await seedFlag({
          id: "flag_old",
          entrySlug: "old-entry",
          createdAt: new Date(current - 90_000).toISOString(),
        });
        await seedFlag({
          id: "flag_mid",
          entrySlug: "mid-entry",
          createdAt: new Date(current - 30_000).toISOString(),
        });

        const { response, payload } = await fetchBacklog();

        assert.equal(response.status, 200);
        assert.equal(payload.ok, true);
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.deepEqual(
          payload.data?.flags?.map((flag) => flag.id),
          ["flag_old", "flag_mid", "flag_new"],
        );
        assert.deepEqual(
          payload.data?.flags?.map((flag) => flag.age),
          [90, 30, 5],
        );

        for (const flag of payload.data?.flags ?? []) {
          assert.equal(Number.isInteger(flag.age), true);
          assert.ok(flag.age >= 0);
          assert.equal(flag.note, null);
          assert.equal(typeof flag.createdAt, "string");
        }
      } finally {
        Date.now = realNow;
      }
    },
  ],
  [
    "SORT_AGE tie-breaks equal timestamps by id",
    async () => {
      const createdAt = new Date(Date.now() - 10_000).toISOString();
      await seedFlag({ id: "flag_zebra", createdAt });
      await seedFlag({ id: "flag_alpha", createdAt });

      const { payload } = await fetchBacklog();
      assert.deepEqual(
        payload.data?.flags?.map((flag) => flag.id),
        ["flag_alpha", "flag_zebra"],
      );
    },
  ],
  [
    "AUTH_MISSING rejects with 401 and no data",
    async () => {
      await seedFlag({ id: "flag_hidden" });

      const { response, payload } = await fetchBacklog(null);

      assert.equal(response.status, 401);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "UNAUTHORIZED");
      assert.equal(payload.data, undefined);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "AUTH_WRONG rejects with 401 and no data",
    async () => {
      await seedFlag({ id: "flag_hidden" });

      const { response, payload } = await fetchBacklog("Bearer not-the-secret");

      assert.equal(response.status, 401);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "UNAUTHORIZED");
      assert.equal(payload.data, undefined);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "an unauthorized request never touches the flag store",
    async () => {
      setFlagStore(createFailingStore());

      const { response, payload } = await fetchBacklog(null);

      assert.equal(response.status, 401);
      assert.equal(payload.error?.code, "UNAUTHORIZED");
    },
  ],
  [
    "SECRET_UNSET fails closed with 500 for missing and empty secrets",
    async () => {
      delete process.env.EDITOR_SECRET;

      const missing = await ignoringConsoleErrors(() => fetchBacklog());
      assert.equal(missing.response.status, 500);
      assert.equal(missing.payload.ok, false);
      assert.equal(missing.payload.error?.code, "INTERNAL_ERROR");
      assert.equal(missing.payload.data, undefined);
      assert.equal(
        missing.response.headers.get("cache-control"),
        "no-store",
      );

      process.env.EDITOR_SECRET = "";
      const empty = await ignoringConsoleErrors(() => fetchBacklog());
      assert.equal(empty.response.status, 500);
      assert.equal(empty.payload.error?.code, "INTERNAL_ERROR");
    },
  ],
  [
    "EMPTY returns an empty list",
    async () => {
      const { response, payload } = await fetchBacklog();

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(payload.data?.flags, []);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "REVIEWED_ONLY returns an empty list",
    async () => {
      await seedFlag({ id: "flag_reviewed", status: "reviewed" });

      const { response, payload } = await fetchBacklog();

      assert.equal(response.status, 200);
      assert.deepEqual(payload.data?.flags, []);
    },
  ],
  [
    "BOTH_VERDICTS returns pending verified and outdated flags",
    async () => {
      await seedFlag({
        id: "flag_verified",
        verdict: "verified",
        createdAt: new Date(Date.now() - 20_000).toISOString(),
      });
      await seedFlag({
        id: "flag_outdated",
        verdict: "outdated",
        createdAt: new Date(Date.now() - 10_000).toISOString(),
      });

      const { payload } = await fetchBacklog();

      assert.deepEqual(
        payload.data?.flags?.map((flag) => flag.id),
        ["flag_verified", "flag_outdated"],
      );
      assert.deepEqual(
        payload.data?.flags?.map((flag) => flag.verdict),
        ["verified", "outdated"],
      );
    },
  ],
  [
    "NO_NOTE returns note null instead of omitting it",
    async () => {
      await seedFlag({ id: "flag_no_note" });

      const { payload } = await fetchBacklog();
      const flag = payload.data?.flags?.[0];

      assert.ok(flag);
      assert.equal(flag.note, null);
      assert.equal(
        Object.prototype.hasOwnProperty.call(flag, "note"),
        true,
      );
    },
  ],
  [
    "MALFORMED_RECORD is skipped with one warning while the rest return",
    async () => {
      await seedRawRecord(
        {
          id: "flag_malformed",
          entrySlug: "Not A Slug",
          verdict: "verified",
          createdAt: "not-a-date",
          status: "pending",
        },
        "flag_malformed",
      );
      await seedFlag({ id: "flag_valid", entrySlug: "valid-entry" });

      const { result, warnings } = await captureConsoleWarnings(() =>
        fetchBacklog(),
      );

      assert.equal(warnings.length, 1);
      assert.equal(
        JSON.stringify(warnings).includes(TEST_SECRET),
        false,
      );
      assert.equal(result.response.status, 200);
      assert.deepEqual(
        result.payload.data?.flags?.map((flag) => flag.id),
        ["flag_valid"],
      );
    },
  ],
  [
    "getPendingFlags projects age and skips reviewed records",
    async () => {
      const current = Date.parse("2026-11-19T12:00:00.000Z");
      await seedFlag({
        id: "flag_pending",
        createdAt: new Date(current - 12_000).toISOString(),
      });
      await seedFlag({
        id: "flag_reviewed",
        status: "reviewed",
        createdAt: new Date(current - 60_000).toISOString(),
      });

      const flags = await getPendingFlags(current);

      assert.deepEqual(
        flags.map((flag) => flag.id),
        ["flag_pending"],
      );
      assert.equal(flags[0]?.age, 12);
    },
  ],
  [
    "getPendingFlags clamps a future createdAt to age zero",
    async () => {
      const current = Date.parse("2026-11-19T12:00:00.000Z");
      await seedFlag({
        id: "flag_future",
        createdAt: new Date(current + 5_000).toISOString(),
      });

      const flags = await getPendingFlags(current);

      assert.equal(flags[0]?.id, "flag_future");
      assert.equal(flags[0]?.age, 0);
    },
  ],
  [
    "a key deleted between keys() and get() is skipped without a warning",
    async () => {
      const base = createMemoryStore();
      const ghostKey = `${FLAG_RECORD_KEY_PREFIX}ghost`;
      setFlagStore(createGhostKeyStore(base, ghostKey));
      await seedFlag({ id: "flag_live", entrySlug: "live-entry" });

      const { result, warnings } = await captureConsoleWarnings(() =>
        fetchBacklog(),
      );

      assert.equal(result.response.status, 200);
      assert.equal(warnings.length, 0);
      assert.deepEqual(
        result.payload.data?.flags?.map((flag) => flag.id),
        ["flag_live"],
      );
    },
  ],
  [
    "AUTH_OK preserves entrySlug, a non-null note, and the stored createdAt",
    async () => {
      const createdAt = new Date(Date.now() - 7_000).toISOString();
      await seedFlag({
        id: "flag_detail",
        entrySlug: "detail-entry",
        note: "still true in 1.1",
        createdAt,
      });

      const { payload } = await fetchBacklog();
      const flag = payload.data?.flags?.find(
        (item) => item.id === "flag_detail",
      );

      assert.ok(flag);
      assert.equal(flag.entrySlug, "detail-entry");
      assert.equal(flag.note, "still true in 1.1");
      assert.equal(flag.createdAt, createdAt);
    },
  ],
  [
    "backlog returns a 500 envelope when the store fails",
    async () => {
      setFlagStore(createFailingStore());

      const { response, payload } = await ignoringConsoleErrors(() =>
        fetchBacklog(),
      );

      assert.equal(response.status, 500);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "INTERNAL_ERROR");
      assert.equal(
        response.headers.get("cache-control"),
        "no-store",
      );
    },
  ],
  [
    "backlog returns a 500 envelope when connection fails",
    async () => {
      const response = await ignoringConsoleErrors(() =>
        getBacklog(makeRequest(`Bearer ${TEST_SECRET}`)),
      );
      const payload = (await response.json()) as BacklogApiResponse;

      assert.equal(response.status, 500);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "INTERNAL_ERROR");
      assert.equal(
        response.headers.get("cache-control"),
        "no-store",
      );
    },
  ],
  [
    "the prerender rejection is rethrown instead of returning a 500 envelope",
    async () => {
      const message =
        "During prerendering, `connection()` rejects when the prerender is complete";

      await assert.rejects(
        () =>
          runInRequestScope(
            () => getBacklog(makeRequest(`Bearer ${TEST_SECRET}`)),
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
    console.error(`${failures} flag backlog test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${checks.length} flag backlog checks passed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
