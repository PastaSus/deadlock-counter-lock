import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import {
  archetypesSchema,
  configSchema,
  entrySchema,
  heroSchema,
  itemsSchema,
  type Archetype,
  type Config,
  type Entry,
  type Hero,
  type Item,
} from "../schema";

export type EntityKind = "hero" | "ability" | "item" | "archetype";

export interface RegistryEntry {
  slug: string;
  kind: EntityKind;
  name: string;
  heroSlug?: string;
}

export type ContentRegistry = Record<string, RegistryEntry>;

export interface AllContent {
  config: Config;
  heroes: Hero[];
  items: Item[];
  archetypes: Archetype[];
  entries: Entry[];
  registry: ContentRegistry;
}

export interface ContentIssue {
  path: readonly PropertyKey[];
  message: string;
}

export class ContentError extends Error {
  readonly filePath?: string;
  readonly issues: readonly ContentIssue[];

  constructor(
    message: string,
    options: { filePath?: string; issues?: readonly ContentIssue[] } = {},
  ) {
    super(message);
    this.name = "ContentError";
    this.filePath = options.filePath;
    this.issues = options.issues ?? [];
  }
}

function resolveContentRoot(contentRoot?: string): string {
  return contentRoot
    ? path.resolve(contentRoot)
    : path.resolve(process.cwd(), "content");
}

function readJsonFile(filePath: string): unknown {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    throw new ContentError(`Unable to read content file: ${filePath}`, {
      filePath,
    });
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ContentError(`${filePath}: invalid JSON: ${message}`, {
      filePath,
    });
  }
}

function parseFile<T>(filePath: string, schema: z.ZodType<T>): T {
  const result = schema.safeParse(readJsonFile(filePath));

  if (!result.success) {
    const details = z.prettifyError(result.error);
    throw new ContentError(
      `${filePath}: content validation failed\n${details}`,
      {
        filePath,
        issues: result.error.issues,
      },
    );
  }

  return result.data;
}

function readJsonFiles(directory: string): string[] {
  let names: string[];
  try {
    names = fs.readdirSync(directory);
  } catch {
    throw new ContentError(`Content directory not found: ${directory}`, {
      filePath: directory,
    });
  }

  return names
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(directory, name))
    .sort();
}

function assertFileSlug(filePath: string, slug: string): void {
  const fileSlug = path.basename(filePath, ".json");
  if (fileSlug !== slug) {
    throw new ContentError(
      `${filePath}: slug "${slug}" does not match file name "${fileSlug}"`,
      { filePath },
    );
  }
}

function assertUniqueSlugs(filePath: string, entries: { slug: string }[]): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry.slug)) {
      throw new ContentError(
        `${filePath}: duplicate slug "${entry.slug}"`,
        { filePath },
      );
    }
    seen.add(entry.slug);
  }
}

function loadJsonArray<T>(
  filePath: string,
  schema: z.ZodType<T[]>,
  label: string,
): T[] {
  const parsed = parseFile(filePath, schema);
  assertUniqueSlugs(filePath, parsed as { slug: string }[]);
  if (parsed.length === 0) {
    throw new ContentError(`${filePath}: no ${label} defined`, { filePath });
  }
  return parsed;
}

export function loadConfig(contentRoot?: string): Config {
  const root = resolveContentRoot(contentRoot);
  return parseFile(
    path.join(root, "config", "current-patch.json"),
    configSchema,
  );
}

export function loadHeroes(contentRoot?: string): Hero[] {
  const root = resolveContentRoot(contentRoot);
  const files = readJsonFiles(path.join(root, "heroes"));
  const heroes = files.map((filePath) => {
    const hero = parseFile(filePath, heroSchema);
    assertFileSlug(filePath, hero.slug);
    return hero;
  });

  assertUniqueSlugs(path.join(root, "heroes"), heroes);
  return heroes.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadItems(contentRoot?: string): Item[] {
  const root = resolveContentRoot(contentRoot);
  return loadJsonArray(
    path.join(root, "items", "items.json"),
    itemsSchema,
    "items",
  ).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadArchetypes(contentRoot?: string): Archetype[] {
  const root = resolveContentRoot(contentRoot);
  return loadJsonArray(
    path.join(root, "archetypes", "archetypes.json"),
    archetypesSchema,
    "archetypes",
  ).sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadEntries(contentRoot?: string): Entry[] {
  const root = resolveContentRoot(contentRoot);
  const files = readJsonFiles(path.join(root, "entries"));
  const entries = files.map((filePath) => {
    const entry = parseFile(filePath, entrySchema);
    assertFileSlug(filePath, entry.slug);
    return entry;
  });

  assertUniqueSlugs(path.join(root, "entries"), entries);
  return entries.sort((a, b) => a.slug.localeCompare(b.slug));
}

function register(
  registry: ContentRegistry,
  entity: RegistryEntry,
): void {
  const existing = registry[entity.slug];
  if (existing) {
    throw new ContentError(
      `Entity slug "${entity.slug}" is defined more than once: ${existing.kind} and ${entity.kind}`,
    );
  }
  registry[entity.slug] = entity;
}

export function buildRegistry(
  heroes: Hero[],
  items: Item[],
  archetypes: Archetype[],
): ContentRegistry {
  const registry: ContentRegistry = {};

  for (const hero of heroes) {
    register(registry, { slug: hero.slug, kind: "hero", name: hero.name });
    for (const ability of hero.abilities) {
      register(registry, {
        slug: ability.slug,
        kind: "ability",
        name: ability.name,
        heroSlug: hero.slug,
      });
    }
  }

  for (const item of items) {
    register(registry, { slug: item.slug, kind: "item", name: item.name });
  }

  for (const archetype of archetypes) {
    register(registry, {
      slug: archetype.slug,
      kind: "archetype",
      name: archetype.name,
    });
  }

  return registry;
}

function assertReferences(entries: Entry[], contentRoot: string, registry: ContentRegistry): void {
  for (const entry of entries) {
    const refs = [
      ["sourceRef", entry.sourceRef],
      ["targetRef", entry.targetRef],
    ] as const;
    const unresolved = refs.filter(([, slug]) => !registry[slug]);

    if (unresolved.length > 0) {
      const filePath = path.join(
        contentRoot,
        "entries",
        `${entry.slug}.json`,
      );
      const detail = unresolved
        .map(([field, slug]) => `${field} "${slug}" does not resolve against the entity registry`)
        .join("; ");
      throw new ContentError(`${filePath}: ${detail}`, { filePath });
    }
  }
}

export function loadAllContent(contentRoot?: string): AllContent {
  const root = resolveContentRoot(contentRoot);
  const config = loadConfig(root);
  const heroes = loadHeroes(root);
  const items = loadItems(root);
  const archetypes = loadArchetypes(root);
  const entries = loadEntries(root);
  const registry = buildRegistry(heroes, items, archetypes);

  assertReferences(entries, root, registry);

  return { config, heroes, items, archetypes, entries, registry };
}
