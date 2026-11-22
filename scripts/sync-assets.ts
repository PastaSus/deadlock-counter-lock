import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  manifestSchema,
  type AssetFamily,
  type AssetTier,
  type Hero,
  type Item,
  type Manifest,
  type ManifestRecord,
} from "../lib/schema";
import { loadHeroes, loadItems } from "../lib/loaders";
import { writeManifest } from "../lib/assets";

const API_BASE = "https://api.deadlock-api.com/v1/assets";
const ASSETS_DIR = path.resolve(process.cwd(), "public/assets");
const HEROES_DIR = path.resolve(process.cwd(), "content/heroes");
const ITEMS_PATH = path.resolve(process.cwd(), "content/items/items.json");

const FETCH_TIMEOUT_MS = 20_000;

interface HeroApiRecord {
  id: number;
  class_name: string;
  name: string;
  description?: Record<string, unknown>;
  images?: Record<string, string | undefined>;
}

interface ItemApiRecord {
  id: number;
  class_name: string;
  name: string;
  type: "ability" | "weapon" | "upgrade";
  image?: string;
  image_webp?: string;
  shop_image?: string;
  shop_image_webp?: string;
  item_tier?: number;
  description?: Record<string, unknown>;
}

const FAMILIES: Record<AssetFamily, Manifest["families"][AssetFamily]> = {
  heroes: {
    sourceUrl: `${API_BASE}/heroes`,
    attribution:
      "Hero artwork mirrored from the community-run Deadlock Assets API (api.deadlock-api.com).",
    license:
      "Deadlock and its artwork are property of Valve Corporation. Shown for non-commercial fan reference only.",
  },
  abilities: {
    sourceUrl: `${API_BASE}/items/by-hero-id/{heroId}`,
    attribution:
      "Ability artwork mirrored from the community-run Deadlock Assets API (api.deadlock-api.com).",
    license:
      "Deadlock and its artwork are property of Valve Corporation. Shown for non-commercial fan reference only.",
  },
  items: {
    sourceUrl: `${API_BASE}/items`,
    attribution:
      "Shop item artwork mirrored from the community-run Deadlock Assets API (api.deadlock-api.com).",
    license:
      "Deadlock and its artwork are property of Valve Corporation. Shown for non-commercial fan reference only.",
  },
};

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`API ${url} -> ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadImage(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(
        `Image ${url} -> ${response.status} ${response.statusText}`,
      );
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extensionFromUrl(url: string): string {
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return extension || ".png";
}

interface SavedImage {
  publicPath: string;
  sourceUrl: string;
}

function webpPath(
  primary: SavedImage | null,
  webp: SavedImage | null,
): string | undefined {
  if (!primary || !webp) return undefined;
  return primary.publicPath === webp.publicPath ? undefined : webp.publicPath;
}

async function saveImage(
  url: string | undefined,
  family: AssetFamily,
  entitySlug: string,
  baseName: string,
): Promise<SavedImage | null> {
  if (!url) return null;

  const extension = extensionFromUrl(url);
  const directory = path.join(ASSETS_DIR, family, entitySlug);
  const fileName = `${baseName}${extension}`;
  const filePath = path.join(directory, fileName);
  const publicPath = `/assets/${family}/${entitySlug}/${fileName}`;

  try {
    const buffer = await downloadImage(url);
    ensureDir(directory);
    fs.writeFileSync(filePath, buffer);
    return { publicPath, sourceUrl: url };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`  skipped image ${url}: ${message}`);
    return null;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function plainText(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,!?;:])/g, "$1")
      .trim(),
  );
}

function firstSentence(
  html: string | undefined,
  maxLength = 180,
): string | undefined {
  if (!html) return undefined;
  const cleaned = plainText(html);
  if (!cleaned) return undefined;
  const match = cleaned.match(/^.*?[.!?](?:\s|$)/);
  const sentence = (match?.[0] ?? cleaned).trim();
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength - 3).trimEnd()}...`;
}

function descriptionSummary(
  description: Record<string, unknown> | undefined,
): string | undefined {
  if (!description) return undefined;
  for (const key of ["role", "playstyle", "lore", "desc", "desc2"]) {
    const value = description[key];
    if (typeof value === "string") {
      const sentence = firstSentence(value);
      if (sentence) return sentence;
    }
  }
  return undefined;
}

function tierFromNumber(value: number | undefined): AssetTier | undefined {
  if (value === undefined) return undefined;
  if (value >= 1 && value <= 4) {
    return `tier-${value}` as AssetTier;
  }
  return undefined;
}

function writeHeroFile(hero: Hero): void {
  const lines: string[] = ["{", `  "slug": ${JSON.stringify(hero.slug)},`];
  lines.push(`  "name": ${JSON.stringify(hero.name)},`);
  if (hero.assetId) lines.push(`  "assetId": ${JSON.stringify(hero.assetId)},`);
  if (hero.className) {
    lines.push(`  "className": ${JSON.stringify(hero.className)},`);
  }
  if (hero.summary) lines.push(`  "summary": ${JSON.stringify(hero.summary)},`);

  const abilities = hero.abilities.map((ability) => {
    const parts = [
      `"slug": ${JSON.stringify(ability.slug)}`,
      `"name": ${JSON.stringify(ability.name)}`,
    ];
    if (ability.assetId) parts.push(`"assetId": ${JSON.stringify(ability.assetId)}`);
    if (ability.className) {
      parts.push(`"className": ${JSON.stringify(ability.className)}`);
    }
    if (ability.summary) parts.push(`"summary": ${JSON.stringify(ability.summary)}`);
    return `    { ${parts.join(", ")} }`;
  });

  lines.push('  "abilities": [');
  lines.push(abilities.join(",\n"));
  lines.push("  ]");
  lines.push("}");

  fs.writeFileSync(
    path.join(HEROES_DIR, `${hero.slug}.json`),
    `${lines.join("\n")}\n`,
  );
}

function writeItemsFile(items: Item[]): void {
  const lines = items.map((item) => {
    const parts = [
      `"slug": ${JSON.stringify(item.slug)}`,
      `"name": ${JSON.stringify(item.name)}`,
    ];
    if (item.assetId) parts.push(`"assetId": ${JSON.stringify(item.assetId)}`);
    if (item.className) {
      parts.push(`"className": ${JSON.stringify(item.className)}`);
    }
    if (item.summary) parts.push(`"summary": ${JSON.stringify(item.summary)}`);
    return `  { ${parts.join(", ")} }`;
  });

  fs.writeFileSync(ITEMS_PATH, `[\n${lines.join(",\n")}\n]\n`);
}

async function syncHeroes(
  records: ManifestRecord[],
  fetchDate: string,
): Promise<void> {
  const apiHeroes = (await fetchJson(`${API_BASE}/heroes`)) as HeroApiRecord[];
  const contentHeroes = loadHeroes();
  const matched = new Set<string>();

  console.log(`Processing ${contentHeroes.length} content heroes...`);

  for (const hero of apiHeroes) {
    const content = contentHeroes.find(
      (candidate) =>
        candidate.name === hero.name || candidate.slug === slugify(hero.name),
    );
    if (!content) continue;
    matched.add(content.slug);

    const images = hero.images ?? {};
    const cardUrl = images.icon_hero_card ?? images.icon_image_small;
    const cardWebpUrl =
      images.icon_hero_card_webp ?? images.icon_image_small_webp;
    const portraitUrl = images.icon_image_small;
    const portraitWebpUrl = images.icon_image_small_webp;

    const [card, cardWebp, portrait, portraitWebp] = await Promise.all([
      saveImage(cardUrl, "heroes", content.slug, "card"),
      saveImage(cardWebpUrl, "heroes", content.slug, "card"),
      saveImage(portraitUrl, "heroes", content.slug, "portrait"),
      saveImage(portraitWebpUrl, "heroes", content.slug, "portrait"),
    ]);

    if (card) {
      records.push({
        slug: content.slug,
        type: "hero",
        assetId: String(hero.id),
        className: hero.class_name,
        name: content.name,
        family: "heroes",
        imagePath: card.publicPath,
        imageWebpPath: webpPath(card, cardWebp),
        portraitPath: portrait?.publicPath,
        portraitWebpPath: webpPath(portrait, portraitWebp),
        sourceUrl: card.sourceUrl,
        fetchDate,
        description: descriptionSummary(hero.description),
      });

      content.assetId = String(hero.id);
      content.className = hero.class_name;
    }

    const apiAbilities = (await fetchJson(
      `${API_BASE}/items/by-hero-id/${hero.id}`,
    )) as ItemApiRecord[];

    for (const ability of content.abilities) {
      const apiAbility = apiAbilities.find(
        (candidate) => candidate.name === ability.name,
      );
      if (!apiAbility) continue;

      const [icon, iconWebp] = await Promise.all([
        saveImage(apiAbility.image, "abilities", ability.slug, "icon"),
        saveImage(apiAbility.image_webp, "abilities", ability.slug, "icon"),
      ]);

      if (!icon) continue;

      records.push({
        slug: ability.slug,
        type: "ability",
        assetId: String(apiAbility.id),
        className: apiAbility.class_name,
        name: ability.name,
        family: "abilities",
        imagePath: icon.publicPath,
        imageWebpPath: webpPath(icon, iconWebp),
        sourceUrl: icon.sourceUrl,
        fetchDate,
        description: descriptionSummary(apiAbility.description),
      });

      ability.assetId = String(apiAbility.id);
      ability.className = apiAbility.class_name;
    }

    writeHeroFile(content);
    console.log(`  ${content.name}: synced (${content.abilities.length} abilities checked)`);
  }

  for (const hero of contentHeroes) {
    if (!matched.has(hero.slug)) {
      console.warn(
        `  ${hero.slug}: no API hero with a matching official name; artwork stays on the placeholder path.`,
      );
    }
  }
}

async function syncItems(
  records: ManifestRecord[],
  fetchDate: string,
): Promise<void> {
  const apiItems = (await fetchJson(`${API_BASE}/items`)) as ItemApiRecord[];
  const contentItems = loadItems();

  console.log(`Processing ${contentItems.length} content items...`);

  for (const item of contentItems) {
    const apiItem = apiItems.find(
      (candidate) =>
        candidate.name === item.name && candidate.type === "upgrade",
    );
    if (!apiItem) {
      console.warn(
        `  ${item.slug}: no API shop item with a matching official name; artwork stays on the placeholder path.`,
      );
      continue;
    }

    const [icon, iconWebp] = await Promise.all([
      saveImage(
        apiItem.shop_image ?? apiItem.image,
        "items",
        item.slug,
        "icon",
      ),
      saveImage(
        apiItem.shop_image_webp ?? apiItem.image_webp,
        "items",
        item.slug,
        "icon",
      ),
    ]);

    if (!icon) continue;

    const tier = tierFromNumber(apiItem.item_tier);
    if (apiItem.item_tier !== undefined && !tier) {
      throw new Error(
        `Item "${item.name}" has item_tier ${apiItem.item_tier}; the DESIGN system only defines tier-1..tier-4. Surface this gap before syncing.`,
      );
    }

    records.push({
      slug: item.slug,
      type: "item",
      assetId: String(apiItem.id),
      className: apiItem.class_name,
      name: item.name,
      family: "items",
      imagePath: icon.publicPath,
      imageWebpPath: webpPath(icon, iconWebp),
      sourceUrl: icon.sourceUrl,
      fetchDate,
      description: descriptionSummary(apiItem.description),
      tier,
    });

    item.assetId = String(apiItem.id);
    item.className = apiItem.class_name;
  }

  writeItemsFile(contentItems);
}

function assertUniqueRecords(records: ManifestRecord[]): void {
  const seen = new Set<string>();
  for (const record of records) {
    const key = `${record.type}:${record.assetId}`;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate manifest record for ${record.type} assetId ${record.assetId} (${record.slug}).`,
      );
    }
    seen.add(key);
  }
}

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}

function pruneUnreferencedImages(records: ManifestRecord[]): void {
  if (!fs.existsSync(ASSETS_DIR)) return;

  const referenced = new Set<string>();
  for (const record of records) {
    for (const publicPath of [
      record.imagePath,
      record.imageWebpPath,
      record.portraitPath,
      record.portraitWebpPath,
    ]) {
      if (publicPath) referenced.add(publicPath);
    }
  }

  let removed = 0;
  for (const filePath of listFiles(ASSETS_DIR)) {
    const relativePath = path
      .relative(ASSETS_DIR, filePath)
      .split(path.sep)
      .join("/");
    if (!referenced.has(`/assets/${relativePath}`)) {
      fs.rmSync(filePath);
      removed += 1;
    }
  }

  if (removed > 0) {
    console.log(`Pruned ${removed} stale asset file(s) no longer in the manifest.`);
  }
}

export async function syncAssets(): Promise<void> {
  const startedAt = new Date().toISOString();
  console.log("Syncing Deadlock assets...");

  const records: ManifestRecord[] = [];
  await syncHeroes(records, startedAt);
  await syncItems(records, startedAt);
  assertUniqueRecords(records);

  const manifest: Manifest = {
    families: FAMILIES,
    records,
    generatedAt: new Date().toISOString(),
  };

  manifestSchema.parse(manifest);
  writeManifest(manifest);
  pruneUnreferencedImages(records);

  console.log(
    `Done. Wrote ${records.length} manifest records and images under ${ASSETS_DIR}.`,
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  syncAssets().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}


