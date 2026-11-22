import { z } from "zod";

export const PATCH_PATTERN = /^\d+\.\d+$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ASSET_ID_PATTERN = /^\d+$/;
export const CLASS_NAME_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
export const ASSET_PATH_PATTERN = /^\/assets\/(?:heroes|abilities|items)\//;

export const patchSchema = z
  .string()
  .regex(PATCH_PATTERN, "Patch must use X.Y format");

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(SLUG_PATTERN, "Slug must be kebab-case");

export const effectSchema = z.enum([
  "interrupt",
  "ground",
  "silence",
  "block",
  "extend",
]);

export const entryKindSchema = z.enum([
  "interaction",
  "matchup",
  "archetype-warning",
]);

export const configSchema = z.strictObject({
  currentPatch: patchSchema,
});

export const assetIdSchema = z
  .string()
  .regex(ASSET_ID_PATTERN, "assetId must be the numeric Deadlock Assets API id");

export const classNameSchema = z
  .string()
  .regex(
    CLASS_NAME_PATTERN,
    "className must be the official API class_name (lowercase words separated by underscores)",
  );

export const summarySchema = z
  .string()
  .trim()
  .min(1, "Summary must not be blank")
  .optional();

export const abilitySchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Ability name is required"),
  assetId: assetIdSchema.optional(),
  className: classNameSchema.optional(),
  summary: summarySchema,
});

export const heroSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Hero name is required"),
  abilities: z.array(abilitySchema),
  assetId: assetIdSchema.optional(),
  className: classNameSchema.optional(),
  summary: summarySchema,
});

export const itemSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Item name is required"),
  assetId: assetIdSchema.optional(),
  className: classNameSchema.optional(),
  summary: summarySchema,
});

export const archetypeSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Archetype name is required"),
});

export const patchHistoryEntrySchema = z.strictObject({
  patch: patchSchema,
  note: z.string().trim().min(1, "Patch history note is required"),
  effectChange: z.string().trim().min(1, "Effect change is required"),
});

export function comparePatches(a: string, b: string): number {
  const [aMajor, aMinor] = a.split(".").map(Number);
  const [bMajor, bMinor] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}

export const entrySchema = z
  .strictObject({
    slug: slugSchema,
    kind: entryKindSchema,
    title: z.string().trim().min(1, "Title is required"),
    sourceRef: slugSchema,
    targetRef: slugSchema,
    effects: z.array(effectSchema),
    conditions: z.string().trim().min(1, "Conditions are required"),
    verifiedPatch: patchSchema,
    patchHistory: z.array(patchHistoryEntrySchema),
    deprecated: z.boolean().optional(),
  })
  .superRefine((entry, ctx) => {
    if (entry.kind === "interaction" && entry.effects.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["effects"],
        message: "Interaction entries must declare at least one effect",
      });
    }

    for (let index = 1; index < entry.patchHistory.length; index += 1) {
      const previous = entry.patchHistory[index - 1];
      const current = entry.patchHistory[index];
      if (comparePatches(previous.patch, current.patch) > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["patchHistory", index, "patch"],
          message: `Patch history must be ordered ascending, ${current.patch} follows ${previous.patch}`,
        });
      }
    }
  });

export const itemsSchema = z.array(itemSchema);
export const archetypesSchema = z.array(archetypeSchema);

export type Config = z.infer<typeof configSchema>;
export type Ability = z.infer<typeof abilitySchema>;
export type Hero = z.infer<typeof heroSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type EntryKind = z.infer<typeof entryKindSchema>;
export type PatchHistoryEntry = z.infer<typeof patchHistoryEntrySchema>;
export type Entry = z.infer<typeof entrySchema>;

export const assetTierSchema = z.enum([
  "tier-1",
  "tier-2",
  "tier-3",
  "tier-4",
]);

export const assetFamilySchema = z.enum(["heroes", "abilities", "items"]);

const assetPathSchema = z
  .string()
  .regex(
    ASSET_PATH_PATTERN,
    "Asset paths must be root-relative under /assets/{heroes,abilities,items}/",
  );

export const manifestRecordSchema = z.strictObject({
  slug: slugSchema,
  type: z.enum(["hero", "ability", "item"]),
  assetId: assetIdSchema,
  className: classNameSchema,
  name: z.string().trim().min(1, "Asset name is required"),
  family: assetFamilySchema,
  imagePath: assetPathSchema,
  imageWebpPath: assetPathSchema.optional(),
  portraitPath: assetPathSchema.optional(),
  portraitWebpPath: assetPathSchema.optional(),
  sourceUrl: z.string().url("sourceUrl must be an absolute URL"),
  fetchDate: z.string().datetime("fetchDate must be ISO-8601"),
  description: z.string().trim().min(1, "Description must not be blank").optional(),
  tier: assetTierSchema.optional(),
});

export const manifestSchema = z.strictObject({
  families: z.record(
    assetFamilySchema,
    z.strictObject({
      sourceUrl: z.string().url("family sourceUrl must be an absolute URL"),
      attribution: z.string().trim().min(1, "family attribution is required"),
      license: z.string().trim().min(1, "family license is required"),
    }),
  ),
  records: z.array(manifestRecordSchema),
  generatedAt: z.string().datetime("generatedAt must be ISO-8601"),
});

export type AssetTier = z.infer<typeof assetTierSchema>;
export type AssetFamily = z.infer<typeof assetFamilySchema>;
export type ManifestRecord = z.infer<typeof manifestRecordSchema>;
export type Manifest = z.infer<typeof manifestSchema>;
