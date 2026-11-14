import { z } from "zod";

export const PATCH_PATTERN = /^\d+\.\d+$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

export const abilitySchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Ability name is required"),
});

export const heroSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Hero name is required"),
  abilities: z.array(abilitySchema),
});

export const itemSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1, "Item name is required"),
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
