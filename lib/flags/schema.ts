import { z } from "zod";

import { slugSchema } from "../schema";

export const flagVerdictSchema = z.enum(["verified", "outdated"]);

export const submissionSlugSchema = slugSchema.max(
  100,
  "Entry slug must be 100 characters or fewer",
);

export const flagSubmissionSchema = z.strictObject({
  entrySlug: submissionSlugSchema,
  verdict: flagVerdictSchema,
  note: z
    .string()
    .trim()
    .max(200, "Note must be 200 characters or fewer")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export const flagStatusSchema = z.enum(["pending", "reviewed"]);

export const flagRecordSchema = z.strictObject({
  id: z.string().min(1),
  entrySlug: slugSchema,
  verdict: flagVerdictSchema,
  note: z.string().max(200).optional(),
  createdAt: z.iso.datetime(),
  status: flagStatusSchema,
});

export type FlagVerdict = z.infer<typeof flagVerdictSchema>;
export type FlagSubmission = z.infer<typeof flagSubmissionSchema>;
export type FlagStatus = z.infer<typeof flagStatusSchema>;
export type FlagRecord = z.infer<typeof flagRecordSchema>;
