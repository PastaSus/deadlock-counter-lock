import { AsyncLocalStorage } from "node:async_hooks";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { FlagOverlayBadge } from "../components/flag-overlay-badge";
import { requestFlagSubmission } from "../lib/flags/feedback";
import {
  FLAGGED_ANNOUNCEMENT,
  createOverlayLoader,
  overlayBadgeVariant,
  parseFlaggedSlugs,
  requestFlagOverlay,
  resolveOverlayPresentation,
  wasFlagSubmittedAfter,
  type OverlayFetch,
} from "../lib/flags/overlay";
import {
  createMemoryStore,
  setFlagStore,
  type FlagStore,
} from "../lib/flags/store";

(globalThis as { AsyncLocalStorage?: typeof AsyncLocalStorage }).AsyncLocalStorage =
  AsyncLocalStorage;

type PostHandler = (request: Request) => Promise<Response>;
type OverlayHandler = () => Promise<Response>;
type RequestScopeRunner = <T>(action: () => Promise<T>) => Promise<T>;

let postFlag: PostHandler;
let getOverlay: OverlayHandler;
let runInRequestScope: RequestScopeRunner;

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/flags", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "flag-overlay-test",
      "x-forwarded-for": "203.0.113.42",
    },
    body: JSON.stringify(body),
  });
}

function fetchFromRoute(): OverlayFetch {
  return () => runInRequestScope(() => getOverlay());
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

async function loadRoutes(): Promise<void> {
  const [routeModule, overlayModule, work, unit] = await Promise.all([
    import("../app/api/flags/route"),
    import("../app/api/flags/overlay/route"),
    import("next/dist/server/app-render/work-async-storage.external"),
    import("next/dist/server/app-render/work-unit-async-storage.external"),
  ]);

  postFlag = routeModule.POST;
  getOverlay = overlayModule.GET;

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

const checks: [string, () => void | Promise<void>][] = [
  [
    "announcement phrase matches the approved wording",
    () => {
      assert.equal(
        FLAGGED_ANNOUNCEMENT,
        "Community-flagged outdated, in review",
      );
    },
  ],
  [
    "parseFlaggedSlugs reads a valid overlay envelope",
    () => {
      assert.deepEqual(
        parseFlaggedSlugs({
          ok: true,
          data: { flaggedSlugs: ["alpha", "beta"] },
        }),
        ["alpha", "beta"],
      );
    },
  ],
  [
    "parseFlaggedSlugs drops non-strings and keeps duplicates harmless",
    () => {
      assert.deepEqual(
        parseFlaggedSlugs({
          ok: true,
          data: { flaggedSlugs: ["alpha", 42, null, "", "beta"] },
        }),
        ["alpha", "beta"],
      );
      assert.deepEqual(
        parseFlaggedSlugs({
          ok: true,
          data: { flaggedSlugs: ["alpha", "alpha"] },
        }),
        ["alpha", "alpha"],
      );
    },
  ],
  [
    "parseFlaggedSlugs rejects malformed envelopes",
    () => {
      assert.deepEqual(parseFlaggedSlugs(null), []);
      assert.deepEqual(parseFlaggedSlugs("<html>"), []);
      assert.deepEqual(parseFlaggedSlugs({ ok: false, data: { flaggedSlugs: ["alpha"] } }), []);
      assert.deepEqual(parseFlaggedSlugs({ ok: true }), []);
      assert.deepEqual(parseFlaggedSlugs({ ok: true, data: { flaggedSlugs: "alpha" } }), []);
      assert.deepEqual(parseFlaggedSlugs({ data: { flaggedSlugs: ["alpha"] } }), []);
    },
  ],
  [
    "BASE_RENDER renders the build-derived badge in static markup",
    () => {
      const verified = renderToStaticMarkup(
        createElement(FlagOverlayBadge, {
          entrySlug: "alpha",
          baseVariant: "verified",
          patch: "1.0",
        }),
      );
      const deprecated = renderToStaticMarkup(
        createElement(FlagOverlayBadge, {
          entrySlug: "alpha",
          baseVariant: "deprecated",
          patch: "1.0",
        }),
      );

      assert.match(verified, /VERIFIED/);
      assert.match(verified, /aria-live="polite"/);
      assert.doesNotMatch(verified, /FLAGGED OUTDATED/);
      assert.match(deprecated, /DEPRECATED/);
      assert.doesNotMatch(deprecated, /FLAGGED OUTDATED/);
    },
  ],
  [
    "FLAGGED_UPGRADE maps verified and stale to flagged",
    () => {
      assert.equal(overlayBadgeVariant("verified", true), "flagged");
      assert.equal(overlayBadgeVariant("stale", true), "flagged");
    },
  ],
  [
    "NOT_FLAGGED keeps the base variants",
    () => {
      assert.equal(overlayBadgeVariant("verified", false), "verified");
      assert.equal(overlayBadgeVariant("stale", false), "stale");
      assert.equal(overlayBadgeVariant("deprecated", false), "deprecated");
    },
  ],
  [
    "DEPRECATED_PROTECTED never upgrades",
    () => {
      assert.equal(overlayBadgeVariant("deprecated", true), "deprecated");
      const presentation = resolveOverlayPresentation(
        "deprecated",
        "alpha",
        "alpha",
      );
      assert.equal(presentation.variant, "deprecated");
      assert.equal(presentation.announcement, "");
    },
  ],
  [
    "SLUG_CHANGE scopes the upgrade and announcement to the current slug",
    () => {
      const previous = resolveOverlayPresentation("verified", "beta", "alpha");
      assert.equal(previous.variant, "verified");
      assert.equal(previous.announcement, "");

      const current = resolveOverlayPresentation("verified", "alpha", "alpha");
      assert.equal(current.variant, "flagged");
      assert.equal(current.announcement, FLAGGED_ANNOUNCEMENT);
    },
  ],
  [
    "requestFlagOverlay calls the relative overlay route with no-store",
    async () => {
      let capturedUrl = "";
      let capturedInit: RequestInit | null = null;

      const slugs = await requestFlagOverlay(async (url, init) => {
        capturedUrl = url;
        capturedInit = init;
        return Response.json({
          ok: true,
          data: { flaggedSlugs: ["alpha"] },
        });
      });

      assert.equal(capturedUrl, "/api/flags/overlay");
      assert.ok(capturedInit);
      assert.equal(capturedInit.cache, "no-store");
      assert.ok(capturedInit.signal instanceof AbortSignal);
      assert.deepEqual(slugs, ["alpha"]);
    },
  ],
  [
    "FETCH_FAILURE returns null on throw, error status, ok:false, missing slugs, or unparseable body",
    async () => {
      const thrown = await requestFlagOverlay(async () => {
        throw new Error("network down");
      });
      assert.equal(thrown, null);

      const serverError = await requestFlagOverlay(async () =>
        Response.json({ ok: false, error: { code: "INTERNAL_ERROR" } }, { status: 500 }),
      );
      assert.equal(serverError, null);

      const notOk = await requestFlagOverlay(async () =>
        Response.json({ ok: false }, { status: 200 }),
      );
      assert.equal(notOk, null);

      const missingSlugs = await requestFlagOverlay(async () =>
        Response.json({ ok: true, data: {} }),
      );
      assert.equal(missingSlugs, null);

      const nonArraySlugs = await requestFlagOverlay(async () =>
        Response.json({ ok: true, data: { flaggedSlugs: "alpha" } }),
      );
      assert.equal(nonArraySlugs, null);

      const broken = await requestFlagOverlay(async () =>
        new Response("not json", { status: 200 }),
      );
      assert.equal(broken, null);
    },
  ],
  [
    "a submission marks the slug so an in-flight overlay cannot self-upgrade",
    async () => {
      const before = Date.now();
      const result = await requestFlagSubmission(
        { entrySlug: "overlay-submitted-entry", selection: "outdated" },
        async () => Response.json({ ok: true }, { status: 201 }),
      );
      const failed = await requestFlagSubmission(
        { entrySlug: "overlay-failed-entry", selection: "outdated" },
        async () => {
          throw new Error("network down");
        },
      );

      assert.equal(result.outcome, "success");
      assert.equal(failed.outcome, "error");
      assert.equal(
        wasFlagSubmittedAfter("overlay-submitted-entry", before),
        true,
      );
      assert.equal(wasFlagSubmittedAfter("overlay-failed-entry", before), true);
      assert.equal(
        wasFlagSubmittedAfter("overlay-submitted-entry", Date.now() + 1_000),
        false,
      );
      assert.equal(wasFlagSubmittedAfter("overlay-other-entry", before), false);
    },
  ],
  [
    "SHARED_FETCH makes one request across concurrent and later callers",
    async () => {
      let calls = 0;
      const load = createOverlayLoader(async () => {
        calls += 1;
        return Response.json({
          ok: true,
          data: { flaggedSlugs: ["alpha"] },
        });
      });

      const [first, second, third] = await Promise.all([
        load(),
        load(),
        load(),
      ]);
      const later = await load();

      assert.equal(calls, 1);
      assert.deepEqual(first, ["alpha"]);
      assert.deepEqual(second, ["alpha"]);
      assert.deepEqual(third, ["alpha"]);
      assert.deepEqual(later, ["alpha"]);
    },
  ],
  [
    "a failed shared request is not cached and can retry",
    async () => {
      let calls = 0;
      const load = createOverlayLoader(async () => {
        calls += 1;
        if (calls === 1) {
          throw new Error("first attempt fails");
        }
        return Response.json({
          ok: true,
          data: { flaggedSlugs: [] },
        });
      });

      assert.equal(await load(), null);
      assert.deepEqual(await load(), []);
      assert.equal(calls, 2);
    },
  ],
  [
    "a real overlay response includes an outdated slug",
    async () => {
      const posted = await postFlag(
        makeRequest({ entrySlug: "overlay-outdated-entry", verdict: "outdated" }),
      );
      assert.equal(posted.status, 201);

      const slugs = await requestFlagOverlay(fetchFromRoute());
      assert.ok(slugs?.includes("overlay-outdated-entry"));
    },
  ],
  [
    "a real overlay response excludes verified-only flags",
    async () => {
      const posted = await postFlag(
        makeRequest({ entrySlug: "overlay-verified-entry", verdict: "verified" }),
      );
      assert.equal(posted.status, 201);

      const slugs = await requestFlagOverlay(fetchFromRoute());
      assert.deepEqual(slugs, []);
    },
  ],
  [
    "a real overlay response is no-store",
    async () => {
      const response = await runInRequestScope(() => getOverlay());
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("cache-control"), "no-store");
    },
  ],
  [
    "a failing overlay route resolves to the base-badge fallback",
    async () => {
      setFlagStore(createFailingStore());

      const slugs = await ignoringConsoleErrors(() =>
        requestFlagOverlay(fetchFromRoute()),
      );

      assert.equal(slugs, null);
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

  setFlagStore(null);

  if (failures > 0) {
    console.error(`${failures} flag overlay test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${checks.length} flag overlay checks passed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
