import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ContentError, loadAllContent } from "../lib/loaders";

interface Fixture {
  root: string;
  write: (relativePath: string, data: unknown) => void;
}

function writeJson(root: string, relativePath: string, data: unknown): void {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function createFixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "counterlock-content-"));
  const write = (relativePath: string, data: unknown) =>
    writeJson(root, relativePath, data);

  write("config/current-patch.json", { currentPatch: "1.0" });
  write("heroes/test-hero.json", {
    slug: "test-hero",
    name: "Test Hero",
    abilities: [{ slug: "test-hero-blast", name: "Blast" }],
  });
  write("heroes/zero-entry-hero.json", {
    slug: "zero-entry-hero",
    name: "Zero Entry Hero",
    abilities: [],
  });
  write("items/items.json", [{ slug: "test-item", name: "Test Item" }]);
  write("archetypes/archetypes.json", [
    { slug: "test-archetype", name: "Test Archetype" },
  ]);
  write("entries/valid-interaction.json", {
    slug: "valid-interaction",
    kind: "interaction",
    title: "Test Hero Blast interrupts Test Item",
    sourceRef: "test-hero-blast",
    targetRef: "test-item",
    effects: ["interrupt"],
    conditions: "The blast must land before the item is used.",
    verifiedPatch: "1.0",
    patchHistory: [
      {
        patch: "0.9",
        note: "Interrupt window widened.",
        effectChange: "interrupt window widened",
      },
    ],
  });
  write("entries/empty-history.json", {
    slug: "empty-history",
    kind: "interaction",
    title: "Test Hero Blast grounds Test Item",
    sourceRef: "test-hero-blast",
    targetRef: "test-item",
    effects: ["ground"],
    conditions: "Any direct hit grounds the target.",
    verifiedPatch: "1.0",
    patchHistory: [],
  });
  write("entries/deprecated-entry.json", {
    slug: "deprecated-entry",
    kind: "interaction",
    title: "Old interaction stays published",
    sourceRef: "test-hero-blast",
    targetRef: "test-item",
    effects: ["block"],
    conditions: "This interaction no longer works but remains documented.",
    verifiedPatch: "0.9",
    patchHistory: [
      {
        patch: "0.9",
        note: "Block removed after a rework.",
        effectChange: "block removed",
      },
    ],
    deprecated: true,
  });

  return { root, write };
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

const checks: [string, () => void][] = [
  [
    "valid corpus loads",
    () => {
      const fixture = createFixture();
      try {
        const content = loadAllContent(fixture.root);
        assert.equal(content.config.currentPatch, "1.0");
        assert.equal(content.heroes.length, 2);
        assert.equal(content.items.length, 1);
        assert.equal(content.archetypes.length, 1);
        assert.equal(content.entries.length, 3);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "malformed entry fails with path and missing field",
    () => {
      const fixture = createFixture();
      try {
        fixture.write("entries/broken-entry.json", {
          slug: "broken-entry",
          kind: "interaction",
          sourceRef: "test-hero-blast",
          targetRef: "test-item",
          effects: ["interrupt"],
          conditions: "Missing title.",
          verifiedPatch: "1.0",
          patchHistory: [],
        });

        const error = captureContentError(() =>
          loadAllContent(fixture.root),
        );
        assert.ok(
          error.filePath?.endsWith(
            path.join("entries", "broken-entry.json"),
          ),
          `expected entry path, received ${String(error.filePath)}`,
        );
        assert.match(error.message, /title/);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "malformed entry fails with invalid effect field",
    () => {
      const fixture = createFixture();
      try {
        fixture.write("entries/invalid-effect.json", {
          slug: "invalid-effect",
          kind: "interaction",
          title: "Invalid effect value",
          sourceRef: "test-hero-blast",
          targetRef: "test-item",
          effects: ["sleep"],
          conditions: "Invalid effect token.",
          verifiedPatch: "1.0",
          patchHistory: [],
        });

        const error = captureContentError(() =>
          loadAllContent(fixture.root),
        );
        assert.ok(
          error.filePath?.endsWith(
            path.join("entries", "invalid-effect.json"),
          ),
          `expected entry path, received ${String(error.filePath)}`,
        );
        assert.match(error.message, /effects/);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "dangling ref fails with entry path and unresolved ref",
    () => {
      const fixture = createFixture();
      try {
        fixture.write("entries/dangling-entry.json", {
          slug: "dangling-entry",
          kind: "interaction",
          title: "Dangling reference",
          sourceRef: "missing-ability",
          targetRef: "test-item",
          effects: ["interrupt"],
          conditions: "The source does not exist.",
          verifiedPatch: "1.0",
          patchHistory: [],
        });

        const error = captureContentError(() =>
          loadAllContent(fixture.root),
        );
        assert.ok(
          error.filePath?.endsWith(
            path.join("entries", "dangling-entry.json"),
          ),
          `expected entry path, received ${String(error.filePath)}`,
        );
        assert.match(error.message, /missing-ability/);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "zero-entry hero validates and stays in registry",
    () => {
      const fixture = createFixture();
      try {
        const content = loadAllContent(fixture.root);
        assert.equal(content.registry["zero-entry-hero"]?.kind, "hero");
        const involvingZeroEntry = content.entries.filter(
          (entry) =>
            entry.sourceRef === "zero-entry-hero" ||
            entry.targetRef === "zero-entry-hero",
        );
        assert.equal(involvingZeroEntry.length, 0);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "empty patch history validates",
    () => {
      const fixture = createFixture();
      try {
        const content = loadAllContent(fixture.root);
        const entry = content.entries.find(
          (candidate) => candidate.slug === "empty-history",
        );
        assert.ok(entry);
        assert.deepEqual(entry.patchHistory, []);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "deprecated entry validates and is retained",
    () => {
      const fixture = createFixture();
      try {
        const content = loadAllContent(fixture.root);
        const entry = content.entries.find(
          (candidate) => candidate.slug === "deprecated-entry",
        );
        assert.ok(entry);
        assert.equal(entry.deprecated, true);
      } finally {
        removeFixture(fixture.root);
      }
    },
  ],
  [
    "seed corpus has required count, examples, and zero-entry Doorman",
    () => {
      const content = loadAllContent();
      assert.ok(
        content.entries.length >= 25 && content.entries.length <= 40,
        `expected 25 to 40 entries, received ${content.entries.length}`,
      );

      const expectedSlugs = [
        "haze-sleep-dagger-vs-lash-death-slam",
        "paradox-swap-vs-lash-death-slam",
        "slowing-hex-vs-danny-crash",
        "knockdown-vs-vindicta-flight",
        "disarm-vs-silver",
        "suppressor-vs-wraith",
        "apollo-riposte-vs-seven-storm-cloud",
        "solomon-vs-flier-comps",
      ];

      for (const slug of expectedSlugs) {
        assert.ok(
          content.entries.some((entry) => entry.slug === slug),
          `missing seed entry ${slug}`,
        );
      }

      const deprecated = content.entries.find(
        (entry) => entry.slug === "apollo-riposte-vs-seven-storm-cloud",
      );
      assert.equal(deprecated?.deprecated, true);

      assert.equal(content.registry.doorman?.kind, "hero");
      const doormanEntries = content.entries.filter(
        (entry) =>
          entry.sourceRef === "doorman" ||
          entry.targetRef === "doorman" ||
          entry.sourceRef.startsWith("doorman-") ||
          entry.targetRef.startsWith("doorman-"),
      );
      assert.equal(doormanEntries.length, 0);
    },
  ],
];

let failures = 0;

for (const [name, check] of checks) {
  try {
    check();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  console.error(`${failures} content test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${checks.length} content checks passed.`);
}
