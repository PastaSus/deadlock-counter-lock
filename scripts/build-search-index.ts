import fs from "node:fs";
import path from "node:path";

import { buildSearchIndex } from "../lib/search-index";

const OUT_DIR = path.resolve(process.cwd(), "public");
const OUT_FILE = path.join(OUT_DIR, "search-index.json");

function main(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = buildSearchIndex();
  fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2), "utf8");
  const total =
    index.heroes.length +
    index.abilities.length +
    index.items.length +
    index.entries.length;
  console.log(`Search index written to ${OUT_FILE} (${total} items)`);
}

main();
