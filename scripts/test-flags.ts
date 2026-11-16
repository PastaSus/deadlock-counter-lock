import { AsyncLocalStorage } from "node:async_hooks";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  FLAG_RECORD_KEY_PREFIX,
  hashVisitor,
} from "../lib/flags";
import {
  createMemoryStore,
  getDefaultStore,
  setFlagStore,
  type FlagStore,
} from "../lib/flags/store";

(globalThis as { AsyncLocalStorage?: typeof AsyncLocalStorage }).AsyncLocalStorage =
  AsyncLocalStorage;

interface FlagApiResponse {
  ok: boolean;
  data?: {
    flag?: Record<string, unknown>;
    flaggedSlugs?: string[];
  };
  error?: {
    code?: string;
    message?: string;
  };
}

interface RequestOptions {
  ip?: string | null;
  realIp?: string | null;
  userAgent?: string | null;
}

interface RouteModules {
  POST: (request: Request) => Promise<Response>;
  getOverlay: () => Promise<Response>;
}

type RequestScopeRunner = <T>(action: () => Promise<T>) => Promise<T>;

let routes: RouteModules;
let runInRequestScope: RequestScopeRunner;

function makeRequest(
  body: unknown,
  options: RequestOptions = {},
): Request {
  const headers = new Headers({
    "content-type": "application/json",
  });

  const ip = options.ip === undefined ? "203.0.113.10" : options.ip;
  if (ip !== null) {
    headers.set("x-forwarded-for", ip);
  }

  if (options.realIp) {
    headers.set("x-real-ip", options.realIp);
  }

  const userAgent =
    options.userAgent === undefined
      ? "counterlock-test"
      : options.userAgent;
  if (userAgent !== null) {
    headers.set("user-agent", userAgent);
  }

  return new Request("http://localhost/api/flags", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

async function postFlag(
  body: unknown,
  options?: RequestOptions,
): Promise<{ response: Response; payload: FlagApiResponse }> {
  const response = await routes.POST(makeRequest(body, options));
  const payload = (await response.json()) as FlagApiResponse;
  return { response, payload };
}

async function readOverlay(): Promise<{
  response: Response;
  payload: FlagApiResponse;
}> {
  const response = await routes.getOverlay();
  const payload = (await response.json()) as FlagApiResponse;
  return { response, payload };
}

async function fetchOverlay(): Promise<{
  response: Response;
  payload: FlagApiResponse;
}> {
  return runInRequestScope(() => readOverlay());
}

async function recordKeys(): Promise<string[]> {
  return getDefaultStore().keys(FLAG_RECORD_KEY_PREFIX);
}

function createFailingStore(method: keyof FlagStore): FlagStore {
  const failure = async (): Promise<never> => {
    throw new Error(`forced ${String(method)} failure`);
  };

  return {
    get: method === "get" ? failure : async () => null,
    set: method === "set" ? failure : async () => undefined,
    delete: method === "delete" ? failure : async () => undefined,
    keys: method === "keys" ? failure : async () => [],
    setNx: method === "setNx" ? failure : async () => true,
    incrWithTtl: method === "incrWithTtl" ? failure : async () => 1,
    ttl: method === "ttl" ? failure : async () => 30,
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

async function loadRoutes(): Promise<void> {
  const [routeModule, overlayModule, work, unit] = await Promise.all([
    import("../app/api/flags/route"),
    import("../app/api/flags/overlay/route"),
    import("next/dist/server/app-render/work-async-storage.external"),
    import("next/dist/server/app-render/work-unit-async-storage.external"),
  ]);

  routes = {
    POST: routeModule.POST,
    getOverlay: overlayModule.GET,
  };

  const workAsyncStorage = work.workAsyncStorage as unknown as {
    run: <T>(store: unknown, action: () => T) => T;
  };
  const workUnitAsyncStorage = unit.workUnitAsyncStorage as unknown as {
    run: <T>(store: unknown, action: () => T) => T;
  };

  runInRequestScope = (action) =>
    workAsyncStorage.run(
      {
        route: "/api/flags/overlay",
        forceStatic: false,
        dynamicShouldError: false,
      },
      () =>
        workUnitAsyncStorage.run(
          {
            type: "request",
            phase: "render",
            asyncApiPromises: {
              connection: Promise.resolve(),
            },
          },
          action,
        ),
    );
}

const checks: [string, () => Promise<void>][] = [
  [
    "VALID_VERIFIED persists a pending flag",
    async () => {
      const { response, payload } = await postFlag({
        entrySlug: "sleep-dagger-vs-lash-ult",
        verdict: "verified",
      });

      assert.equal(response.status, 201);
      assert.equal(payload.ok, true);

      const flag = payload.data?.flag;
      assert.ok(flag);
      assert.equal(flag.entrySlug, "sleep-dagger-vs-lash-ult");
      assert.equal(flag.verdict, "verified");
      assert.equal(flag.status, "pending");
      assert.match(String(flag.id), /^flag_/);
      assert.match(String(flag.createdAt), /^\d{4}-\d{2}-\d{2}T/);
      assert.equal((await recordKeys()).length, 1);
    },
  ],
  [
    "VALID_OUTDATED persists the flag and feeds the overlay",
    async () => {
      const { response } = await postFlag({
        entrySlug: "slowing-hex-vs-danny",
        verdict: "outdated",
      });
      assert.equal(response.status, 201);

      const overlay = await fetchOverlay();
      assert.equal(overlay.response.status, 200);
      assert.equal(overlay.payload.ok, true);
      assert.equal(
        overlay.response.headers.get("cache-control"),
        "no-store",
      );
      assert.ok(
        overlay.payload.data?.flaggedSlugs?.includes(
          "slowing-hex-vs-danny",
        ),
      );
    },
  ],
  [
    "MISSING_VERDICT returns validation error and writes nothing",
    async () => {
      const { response, payload } = await postFlag({
        entrySlug: "missing-verdict",
      });

      assert.equal(response.status, 400);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "VALIDATION_ERROR");
      assert.equal((await recordKeys()).length, 0);
    },
  ],
  [
    "INVALID_VERDICT returns validation error and writes nothing",
    async () => {
      const { response, payload } = await postFlag({
        entrySlug: "invalid-verdict",
        verdict: "maybe",
      });

      assert.equal(response.status, 400);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "VALIDATION_ERROR");
      assert.equal((await recordKeys()).length, 0);
    },
  ],
  [
    "MALFORMED_SLUG returns validation error and writes nothing",
    async () => {
      const { response, payload } = await postFlag({
        entrySlug: "Not A Slug",
        verdict: "outdated",
      });

      assert.equal(response.status, 400);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "VALIDATION_ERROR");
      assert.equal((await recordKeys()).length, 0);
    },
  ],
  [
    "strict submission rejects extra fields",
    async () => {
      const { response, payload } = await postFlag({
        entrySlug: "strict-entry",
        verdict: "verified",
        extra: true,
      });

      assert.equal(response.status, 400);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "VALIDATION_ERROR");
      assert.equal((await recordKeys()).length, 0);
    },
  ],
  [
    "invalid JSON body returns validation error",
    async () => {
      const request = new Request("http://localhost/api/flags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      });
      const response = await routes.POST(request);
      const payload = (await response.json()) as FlagApiResponse;

      assert.equal(response.status, 400);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "VALIDATION_ERROR");
      assert.equal((await recordKeys()).length, 0);
    },
  ],
  [
    "RATE_LIMITED returns Retry-After and resets after the window",
    async () => {
      const realNow = Date.now;
      let current = realNow();
      Date.now = () => current;

      try {
        for (let index = 1; index <= 5; index += 1) {
          const { response } = await postFlag({
            entrySlug: `rate-limit-entry-${index}`,
            verdict: "verified",
          });
          assert.equal(response.status, 201);
        }

        const sixth = await postFlag({
          entrySlug: "rate-limit-entry-6",
          verdict: "verified",
        });

        assert.equal(sixth.response.status, 429);
        assert.equal(sixth.payload.ok, false);
        assert.equal(sixth.payload.error?.code, "RATE_LIMITED");
        assert.equal(
          sixth.response.headers.get("retry-after"),
          "30",
        );

        current += 30_001;

        const afterWindow = await postFlag({
          entrySlug: "rate-limit-entry-7",
          verdict: "verified",
        });
        assert.equal(afterWindow.response.status, 201);
      } finally {
        Date.now = realNow;
      }
    },
  ],
  [
    "DUPLICATE returns the existing flag and writes no second record",
    async () => {
      const first = await postFlag({
        entrySlug: "duplicate-entry",
        verdict: "outdated",
        note: "first note",
      });
      assert.equal(first.response.status, 201);

      const second = await postFlag({
        entrySlug: "duplicate-entry",
        verdict: "outdated",
        note: "second note",
      });

      assert.equal(second.response.status, 409);
      assert.equal(second.payload.ok, false);
      assert.equal(second.payload.error?.code, "DUPLICATE");
      assert.equal(
        second.payload.data?.flag?.id,
        first.payload.data?.flag?.id,
      );
      assert.equal(second.payload.data?.flag?.note, "first note");
      assert.equal((await recordKeys()).length, 1);
    },
  ],
  [
    "dedupe is keyed by entry slug and visitor, not verdict",
    async () => {
      const first = await postFlag({
        entrySlug: "cross-verdict-entry",
        verdict: "outdated",
      });
      assert.equal(first.response.status, 201);

      const second = await postFlag({
        entrySlug: "cross-verdict-entry",
        verdict: "verified",
      });

      assert.equal(second.response.status, 409);
      assert.equal(second.payload.error?.code, "DUPLICATE");
      assert.equal(second.payload.data?.flag?.verdict, "outdated");
      assert.equal((await recordKeys()).length, 1);

      const overlay = await fetchOverlay();
      assert.deepEqual(overlay.payload.data?.flaggedSlugs, [
        "cross-verdict-entry",
      ]);
    },
  ],
  [
    "dedupe window expires after 60 seconds",
    async () => {
      const realNow = Date.now;
      let current = realNow();
      Date.now = () => current;

      try {
        const first = await postFlag({
          entrySlug: "dedupe-window-entry",
          verdict: "outdated",
        });
        assert.equal(first.response.status, 201);

        const duplicate = await postFlag({
          entrySlug: "dedupe-window-entry",
          verdict: "verified",
        });
        assert.equal(duplicate.response.status, 409);

        current += 60_001;

        const afterWindow = await postFlag({
          entrySlug: "dedupe-window-entry",
          verdict: "verified",
        });
        assert.equal(afterWindow.response.status, 201);
        assert.notEqual(
          afterWindow.payload.data?.flag?.id,
          first.payload.data?.flag?.id,
        );
      } finally {
        Date.now = realNow;
      }
    },
  ],
  [
    "OVERLAY_EMPTY returns an empty slug list",
    async () => {
      const { response, payload } = await fetchOverlay();

      assert.equal(response.status, 200);
      assert.equal(payload.ok, true);
      assert.deepEqual(payload.data?.flaggedSlugs, []);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "verified flags do not enter the overlay",
    async () => {
      await postFlag({
        entrySlug: "verified-only-entry",
        verdict: "verified",
      });

      const { payload } = await fetchOverlay();
      assert.deepEqual(payload.data?.flaggedSlugs, []);
    },
  ],
  [
    "multiple overlay slugs come back sorted",
    async () => {
      for (const slug of [
        "zebra-entry",
        "alpha-entry",
        "middle-entry",
      ]) {
        const { response } = await postFlag({
          entrySlug: slug,
          verdict: "outdated",
        });
        assert.equal(response.status, 201);
      }

      const { payload } = await fetchOverlay();
      assert.deepEqual(payload.data?.flaggedSlugs, [
        "alpha-entry",
        "middle-entry",
        "zebra-entry",
      ]);
    },
  ],
  [
    "notes trim, collapse to undefined, and stay within 200 characters",
    async () => {
      const trimmed = await postFlag({
        entrySlug: "trimmed-note",
        verdict: "verified",
        note: "  hello  ",
      });
      assert.equal(trimmed.response.status, 201);
      assert.equal(trimmed.payload.data?.flag?.note, "hello");

      const empty = await postFlag({
        entrySlug: "empty-note",
        verdict: "verified",
        note: "   ",
      });
      assert.equal(empty.response.status, 201);
      assert.equal(empty.payload.data?.flag?.note, undefined);
      assert.equal(
        Object.prototype.hasOwnProperty.call(
          empty.payload.data?.flag ?? {},
          "note",
        ),
        false,
      );

      const maximumNote = "x".repeat(200);
      const maximum = await postFlag({
        entrySlug: "maximum-note",
        verdict: "verified",
        note: maximumNote,
      });
      assert.equal(maximum.response.status, 201);
      assert.equal(maximum.payload.data?.flag?.note, maximumNote);

      const tooLong = await postFlag({
        entrySlug: "long-note",
        verdict: "verified",
        note: "x".repeat(201),
      });
      assert.equal(tooLong.response.status, 400);
      assert.equal(tooLong.payload.ok, false);
      assert.equal(tooLong.payload.error?.code, "VALIDATION_ERROR");
    },
  ],
  [
    "visitorHash matches the exact SHA-256 digest",
    async () => {
      const digest = createHash("sha256")
        .update("203.0.113.10\u0000counterlock-test")
        .digest("hex");

      assert.equal(
        hashVisitor("203.0.113.10", "counterlock-test"),
        digest,
      );
      assert.notEqual(
        hashVisitor("203.0.113.10", "counterlock-test"),
        hashVisitor("203.0.113.11", "counterlock-test"),
      );
      assert.notEqual(
        hashVisitor("203.0.113.10", "counterlock-test"),
        "203.0.113.10",
      );
      assert.notEqual(
        hashVisitor("1", "23"),
        hashVisitor("12", "3"),
      );
    },
  ],
  [
    "x-real-ip and headerless visitors get stable identities",
    async () => {
      const headerlessFirst = await postFlag(
        {
          entrySlug: "headerless-entry",
          verdict: "verified",
        },
        { ip: null, userAgent: null },
      );
      assert.equal(headerlessFirst.response.status, 201);

      const headerlessDuplicate = await postFlag(
        {
          entrySlug: "headerless-entry",
          verdict: "verified",
        },
        { ip: null, userAgent: null },
      );
      assert.equal(headerlessDuplicate.response.status, 409);

      const realIpFirst = await postFlag(
        {
          entrySlug: "real-ip-entry",
          verdict: "verified",
        },
        { ip: null, realIp: "198.51.100.7" },
      );
      assert.equal(realIpFirst.response.status, 201);

      const realIpDuplicate = await postFlag(
        {
          entrySlug: "real-ip-entry",
          verdict: "verified",
        },
        { ip: null, realIp: "198.51.100.7" },
      );
      assert.equal(realIpDuplicate.response.status, 409);

      const distinctRealIp = await postFlag(
        {
          entrySlug: "headerless-entry",
          verdict: "verified",
        },
        { ip: null, realIp: "198.51.100.8" },
      );
      assert.equal(distinctRealIp.response.status, 201);
    },
  ],
  [
    "POST returns a 500 envelope when the store fails",
    async () => {
      setFlagStore(createFailingStore("incrWithTtl"));

      const { response, payload } = await ignoringConsoleErrors(() =>
        postFlag({
          entrySlug: "failing-post",
          verdict: "verified",
        }),
      );

      assert.equal(response.status, 500);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "INTERNAL_ERROR");
    },
  ],
  [
    "overlay returns a 500 envelope when the store fails",
    async () => {
      setFlagStore(createFailingStore("keys"));

      const { response, payload } = await ignoringConsoleErrors(() =>
        fetchOverlay(),
      );

      assert.equal(response.status, 500);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "INTERNAL_ERROR");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "overlay returns a 500 envelope when connection fails",
    async () => {
      setFlagStore(createMemoryStore());

      const { response, payload } = await ignoringConsoleErrors(() =>
        readOverlay(),
      );

      assert.equal(response.status, 500);
      assert.equal(payload.ok, false);
      assert.equal(payload.error?.code, "INTERNAL_ERROR");
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
];

async function main(): Promise<void> {
  await loadRoutes();

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

  if (failures > 0) {
    console.error(`${failures} flag test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${checks.length} flag checks passed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
