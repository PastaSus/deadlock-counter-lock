import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  HERO_ARTWORK_TEXT_SHADOW,
  HeroArtworkBackdrop,
} from "../components/hero-artwork-backdrop";
import { HeroRosterTile } from "../components/hero-roster-tile";

const artwork = {
  imagePath: "/assets/heroes/haze/card.png",
  imageWebpPath: "/assets/heroes/haze/card.webp",
};

function renderTile(
  props: Partial<Parameters<typeof HeroRosterTile>[0]>,
): string {
  return renderToStaticMarkup(
    createElement(HeroRosterTile, {
      href: "/heroes/haze",
      name: "Haze",
      ...props,
    }),
  );
}

const checks: Array<[string, () => void]> = [
  [
    "artwork tile renders the image-set cover under the scrim",
    () => {
      const html = renderTile({ entryCount: 2, ...artwork });

      assert.ok(html.includes("image-set(url"));
      assert.ok(html.includes("/assets/heroes/haze/card.webp"));
      assert.ok(html.includes("/assets/heroes/haze/card.png"));
      assert.ok(html.includes("bg-cover"));
      assert.ok(
        html.includes(
          "linear-gradient(to top, var(--media-scrim-strong), var(--media-scrim-soft))",
        ),
      );
      assert.ok(html.includes("min-h-[132px]"));
    },
  ],
  [
    "a failed image load leaves the initial base visible under the artwork",
    () => {
      const html = renderTile({ entryCount: 2, ...artwork });

      assert.ok(html.includes("bg-surface-raised"));
      assert.ok(html.includes(">H<"));
      assert.ok(!html.includes("<img"));
    },
  ],
  [
    "tile text uses the artwork text shadow and real name text",
    () => {
      const html = renderTile({ entryCount: 2, ...artwork });

      assert.ok(html.includes(`text-shadow:${HERO_ARTWORK_TEXT_SHADOW}`));
      assert.ok(html.includes(">Haze<"));
      assert.ok(html.includes("text-text"));
    },
  ],
  [
    "entry counts feed the accessible tile label",
    () => {
      assert.ok(
        renderTile({ entryCount: 2, ...artwork }).includes(
          'aria-label="Haze, 2 entries"',
        ),
      );
      assert.ok(
        renderTile({ entryCount: 1, ...artwork }).includes(
          'aria-label="Haze, 1 entry"',
        ),
      );
    },
  ],
  [
    "zero-entry artwork tile keeps the full tile and the muted line",
    () => {
      const html = renderTile({ entryCount: 0, ...artwork });

      assert.ok(html.includes("image-set(url"));
      assert.ok(html.includes("min-h-[132px]"));
      assert.ok(html.includes("No entries yet"));
      assert.ok(html.includes("text-text-muted"));
      assert.ok(html.includes('aria-label="Haze, no entries yet"'));
    },
  ],
  [
    "missing artwork falls back to the surface-raised initial",
    () => {
      const html = renderTile({ name: "Doorman", entryCount: 0 });

      assert.ok(html.includes("bg-surface-raised"));
      assert.ok(html.includes(">D<"));
      assert.ok(html.includes(">Doorman<"));
      assert.ok(!html.includes("<img"));
      assert.ok(!html.includes("image-set(url"));
      assert.ok(!html.includes("linear-gradient"));
      assert.ok(html.includes('aria-label="Doorman, no entries yet"'));
    },
  ],
  [
    "selected state adds the accent tint and accent border",
    () => {
      const html = renderTile({ entryCount: 1, selected: true, ...artwork });

      assert.ok(html.includes("border-accent"));
      assert.ok(html.includes("bg-accent-dim/70"));
      assert.ok(html.includes("opacity-100"));
    },
  ],
  [
    "hover state keeps a visible surface-raised tint and border change",
    () => {
      const html = renderTile({ entryCount: 1, ...artwork });

      assert.ok(html.includes("group-hover:opacity-100"));
      assert.ok(html.includes("bg-surface-raised/60"));
      assert.ok(html.includes("hover:border-border-strong"));
    },
  ],
  [
    "backdrop is decorative and honours the header crop position",
    () => {
      const html = renderToStaticMarkup(
        createElement(HeroArtworkBackdrop, {
          name: "Haze",
          imagePosition: "center 20%",
          ...artwork,
        }),
      );

      assert.ok(html.includes('aria-hidden="true"'));
      assert.ok(html.includes("background-position:center 20%"));
      assert.ok(html.includes("pointer-events-none"));
      assert.ok(
        html.includes(
          "linear-gradient(to top, var(--media-scrim-strong), var(--media-scrim-soft))",
        ),
      );
    },
  ],
  [
    "backdrop without artwork shows the initial and no image",
    () => {
      const html = renderToStaticMarkup(
        createElement(HeroArtworkBackdrop, { name: "Doorman" }),
      );

      assert.ok(html.includes("bg-surface-raised"));
      assert.ok(html.includes(">D<"));
      assert.ok(!html.includes("image-set(url"));
      assert.ok(!html.includes("linear-gradient"));
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
  console.error(`${failures} hero artwork test(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${checks.length} hero artwork checks passed.`);
}
