import fs from "node:fs";
import path from "node:path";

import { manifestSchema, type Manifest } from "../schema";

export const MANIFEST_PATH = path.resolve(
  process.cwd(),
  "lib/assets/manifest.json",
);

export class ManifestError extends Error {
  readonly filePath: string;

  constructor(message: string, filePath: string) {
    super(message);
    this.name = "ManifestError";
    this.filePath = filePath;
  }
}

export function loadManifest(manifestPath = MANIFEST_PATH): Manifest {
  let raw: string;
  try {
    raw = fs.readFileSync(/* turbopackIgnore: true */ manifestPath, "utf8");
  } catch {
    throw new ManifestError(
      `Assets manifest is missing: ${manifestPath}. Run "npm run sync:assets" and commit the generated manifest and images.`,
      manifestPath,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ManifestError(
      `Assets manifest is not valid JSON: ${manifestPath}: ${message}`,
      manifestPath,
    );
  }

  const result = manifestSchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const location = issue.path.length > 0 ? issue.path.join(".") : "manifest";
        return `  ${location}: ${issue.message}`;
      })
      .join("\n");
    throw new ManifestError(
      `Assets manifest validation failed: ${manifestPath}\n${details}\nRun "npm run sync:assets" to regenerate it.`,
      manifestPath,
    );
  }

  return result.data;
}

export function writeManifest(manifest: Manifest): void {
  const validated = manifestSchema.parse(manifest);
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(validated, null, 2)}\n`);
}

export type { Manifest };
