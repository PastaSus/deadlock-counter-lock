import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import InteractionDetailPage from "../app/interactions/[slug]/page";
import { Badge } from "../components/badge";
import { DeprecatedCallout } from "../components/deprecated-callout";
import { EntryCard } from "../components/entry-card";
import { deriveBadgeState, latestPatchHistory } from "../lib/badges";
import { ContentError, loadAllContent } from "../lib/loaders";
import { entrySchema, type PatchHistoryEntry } from "../lib/schema";

function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

function row(patch: string, note: string): PatchHistoryEntry {
  return { patch, note, effectChange: "effect changed" };
}

function writeJson(root: string, relativePath: string, data: unknown): void {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "counterlock-trust-"));
  writeJson(root, "config/current-patch.json", { currentPatch: "1.0" });
  writeJson(root, "heroes/test-hero.json", {
    slug: "test-hero",
    name: "Test Hero",
    abilities: [{ slug: "test-hero-blast", name: "Blast" }],
  });
  writeJson(root, "items/items.json", [{ slug: "test-item", name: "Test Item" }]);
  writeJson(root, "archetypes/archetypes.json", [
    { slug: "test-archetype", name: "Test Archetype" },
  ]);
  return root;
}

function removeFixture(root: string): void {
  fs.rmSync(root, { recursive: true, force: true });
}

function captureContentError(action: () => void): ContentError {
  try {
    action();
  } catch (error) {
    assert.ok(
      error instanceof ContentError,
      `expected ContentError, received ${String(error)}`,
    );
    return error;
  }

  assert.fail("expected content validation to throw");
}

const checks: [string, () => void | Promise<void>][] = [
  [
    "verified badge reads PATCH-VERIFIED with its patch stamp",
    () => {
      const markup = render(
        createElement(Badge, { variant: "verified", patch: "1.2" }),
      );
      assert.match(markup, /PATCH-VERIFIED · 1\.2/);
      assert.match(markup, /aria-label="Patch-verified as of patch 1\.2"/);
      assert.doesNotMatch(markup, /aria-label="PATCH-VERIFIED/);
    },
  ],
  [
    "verified badge without a patch omits the stamp",
    () => {
      const markup = render(createElement(Badge, { variant: "verified" }));
      assert.match(markup, />PATCH-VERIFIED</);
      assert.match(markup, /aria-label="Patch-verified"/);
      assert.doesNotMatch(markup, / · /);
    },
  ],
  [
    "stale badge label, aria, icon, and color are unchanged",
    () => {
      const markup = render(
        createElement(Badge, { variant: "stale", patch: "1.2" }),
      );
      assert.match(markup, /STALE/);
      assert.match(markup, /aria-label="STALE, last checked against patch 1\.2"/);
      assert.match(markup, /border-dashed/);
      assert.match(markup, /border-status-verified/);
      assert.doesNotMatch(markup, /PATCH-VERIFIED/);
    },
  ],
  [
    "flagged badge label, aria, icon, and color are unchanged",
    () => {
      const markup = render(
        createElement(Badge, { variant: "flagged", patch: "1.2" }),
      );
      assert.match(markup, /FLAGGED OUTDATED/);
      assert.match(
        markup,
        /aria-label="FLAGGED OUTDATED, last checked against patch 1\.2"/,
      );
      assert.match(markup, /border-status-flagged/);
      assert.doesNotMatch(markup, /PATCH-VERIFIED/);
    },
  ],
  [
    "deprecated badge label, aria, icon, and color are unchanged",
    () => {
      const markup = render(
        createElement(Badge, { variant: "deprecated", patch: "1.2" }),
      );
      assert.match(markup, /DEPRECATED/);
      assert.match(
        markup,
        /aria-label="DEPRECATED, last checked against patch 1\.2"/,
      );
      assert.match(markup, /border-status-deprecated/);
      assert.doesNotMatch(markup, /PATCH-VERIFIED/);
    },
  ],
  [
    "latestPatchHistory returns the highest patch, not the last row",
    () => {
      const latest = latestPatchHistory({
        patchHistory: [
          row("1.2", "middle"),
          row("0.9", "oldest"),
          row("1.10", "newest"),
        ],
      });
      assert.equal(latest?.patch, "1.10");
      assert.equal(latest?.note, "newest");
    },
  ],
  [
    "latestPatchHistory returns undefined for empty history",
    () => {
      assert.equal(latestPatchHistory({ patchHistory: [] }), undefined);
    },
  ],
  [
    "seed deprecated entry's latest row is 0.9 while the badge stamp stays 0.8",
    () => {
      const content = loadAllContent();
      const entry = content.entries.find(
        (candidate) =>
          candidate.slug === "apollo-riposte-vs-seven-storm-cloud",
      );
      assert.ok(entry);
      assert.equal(entry.deprecated, true);
      assert.equal(entry.verifiedPatch, "0.8");
      assert.equal(latestPatchHistory(entry)?.patch, "0.9");
      assert.equal(
        deriveBadgeState(entry, content.config.currentPatch),
        "deprecated",
      );
    },
  ],
  [
    "DeprecatedCallout renders the rose note with label, patch, and note",
    () => {
      const markup = render(
        createElement(DeprecatedCallout, {
          row: row("0.9", "Storm Cloud reclassified as a persistent area effect."),
        }),
      );
      assert.match(markup, /role="note"/);
      assert.match(markup, /Deprecated Tech \/ Patch Note/);
      assert.match(markup, />0\.9</);
      assert.match(markup, /Storm Cloud reclassified as a persistent area effect\./);
      assert.match(markup, /bg-deprecated-callout-background/);
      assert.match(markup, /border-deprecated-callout-border/);
      assert.match(markup, /text-deprecated-callout-foreground/);
    },
  ],
  [
    "deprecated entry card renders the callout below the body and above the footer",
    () => {
      const condition = "Riposte no longer cancels Storm Cloud.";
      const markup = render(
        createElement(EntryCard, {
          href: "/interactions/apollo-riposte-vs-seven-storm-cloud",
          entrySlug: "apollo-riposte-vs-seven-storm-cloud",
          effectChip: "BLOCK",
          source: "Apollo",
          target: "Seven",
          condition,
          badgeVariant: "deprecated",
          patch: "0.8",
          deprecatedCallout: row("0.9", "Storm Cloud reclassified."),
        }),
      );
      const conditionIndex = markup.indexOf(condition);
      const calloutIndex = markup.indexOf("Deprecated Tech / Patch Note");
      const badgeIndex = markup.indexOf("DEPRECATED");
      assert.ok(conditionIndex >= 0, "condition text should render");
      assert.ok(calloutIndex > conditionIndex, "callout should follow the body");
      assert.ok(badgeIndex > calloutIndex, "badge should follow the callout");
      assert.match(markup, /Storm Cloud reclassified\./);
    },
  ],
  [
    "non-deprecated card renders no callout even when a row is supplied",
    () => {
      const markup = render(
        createElement(EntryCard, {
          href: "/interactions/example",
          entrySlug: "example",
          effectChip: "INTERRUPT",
          source: "Apollo",
          target: "Seven",
          condition: "Still correct.",
          badgeVariant: "verified",
          patch: "1.0",
          deprecatedCallout: row("0.9", "Historical note."),
        }),
      );
      assert.doesNotMatch(markup, /Deprecated Tech \/ Patch Note/);
      assert.doesNotMatch(markup, /Historical note\./);
      assert.match(markup, /PATCH-VERIFIED/);
    },
  ],
  [
    "deprecated true with empty patchHistory fails validation naming patchHistory",
    () => {
      const result = entrySchema.safeParse({
        slug: "deprecated-empty",
        kind: "interaction",
        title: "Deprecated without history",
        sourceRef: "test-hero",
        targetRef: "test-item",
        effects: ["block"],
        conditions: "Old behavior.",
        verifiedPatch: "0.9",
        patchHistory: [],
        deprecated: true,
      });
      assert.equal(result.success, false);
      if (!result.success) {
        const issue = result.error.issues.find((candidate) =>
          candidate.path.includes("patchHistory"),
        );
        assert.ok(issue, "expected an issue on patchHistory");
        assert.match(issue.message, /patchHistory/);
      }
    },
  ],
  [
    "loading content fails with a ContentError naming patchHistory",
    () => {
      const root = createFixture();
      try {
        writeJson(root, "entries/deprecated-empty.json", {
          slug: "deprecated-empty",
          kind: "interaction",
          title: "Deprecated without history",
          sourceRef: "test-hero",
          targetRef: "test-item",
          effects: ["block"],
          conditions: "Old behavior.",
          verifiedPatch: "0.9",
          patchHistory: [],
          deprecated: true,
        });
        const error = captureContentError(() => loadAllContent(root));
        assert.ok(
          error.filePath?.endsWith(path.join("entries", "deprecated-empty.json")),
        );
        assert.match(error.message, /patchHistory/);
      } finally {
        removeFixture(root);
      }
    },
  ],
  [
    "non-deprecated empty history still loads",
    () => {
      const root = createFixture();
      try {
        writeJson(root, "entries/fresh-empty.json", {
          slug: "fresh-empty",
          kind: "interaction",
          title: "Fresh entry without history",
          sourceRef: "test-hero",
          targetRef: "test-item",
          effects: ["ground"],
          conditions: "Current behavior.",
          verifiedPatch: "1.0",
          patchHistory: [],
        });
        const content = loadAllContent(root);
        const entry = content.entries.find(
          (candidate) => candidate.slug === "fresh-empty",
        );
        assert.ok(entry);
        assert.deepEqual(entry.patchHistory, []);
        assert.equal(latestPatchHistory(entry), undefined);
      } finally {
        removeFixture(root);
      }
    },
  ],
  [
    "DeprecatedCallout stays a server component",
    () => {
      const source = fs.readFileSync(
        path.resolve(process.cwd(), "components/deprecated-callout.tsx"),
        "utf8",
      );
      assert.doesNotMatch(source, /["']use client["']/);
    },
  ],
  [
    "deprecated interaction detail renders the callout after Conditions and before the badge",
    async () => {
      const element = await InteractionDetailPage({
        params: Promise.resolve({ slug: "apollo-riposte-vs-seven-storm-cloud" }),
      });
      const markup = render(element as ReactElement);
      const conditionsIndex = markup.indexOf("Conditions");
      const calloutIndex = markup.indexOf("Deprecated Tech / Patch Note");
      const badgeIndex = markup.indexOf("DEPRECATED");
      assert.ok(conditionsIndex >= 0, "Conditions block should render");
      assert.ok(calloutIndex > conditionsIndex, "callout should follow Conditions");
      assert.ok(badgeIndex > calloutIndex, "badge should follow the callout");
      assert.match(markup, />0\.9</);
      assert.match(
        markup,
        /Storm Cloud reclassified as a persistent area effect\./,
      );
    },
  ],
  [
    "interaction and matchup detail sources place the callout between Conditions and the badge",
    () => {
      for (const file of [
        "app/interactions/[slug]/page.tsx",
        "app/matchups/[slug]/page.tsx",
      ]) {
        const source = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
        const conditionsIndex = source.indexOf("Conditions");
        const calloutIndex = source.indexOf("<DeprecatedCallout");
        const badgeIndex = source.indexOf("<FlagOverlayBadge");
        assert.ok(conditionsIndex >= 0, `${file} should render Conditions`);
        assert.ok(calloutIndex > conditionsIndex, `${file} callout after Conditions`);
        assert.ok(badgeIndex > calloutIndex, `${file} callout before the badge`);
      }
    },
  ],
];

(async () => {
  let failures = 0;

  for (const [name, check] of checks) {
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
    console.error(`${failures} trust signal test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`All ${checks.length} trust signal checks passed.`);
  }
})();
