import { z } from "zod";

export const stanceSchema = z.enum(["POSITIVE", "MIXED", "NEGATIVE"]);
export const lensSchema = z.enum(["EXPERIENCE", "EXECUTION", "MIXED"]);
export const standardSchema = z.enum(["ABSOLUTE", "CONTEXTUAL", "MIXED"]);
export const completionSchema = z.enum([
  "JUST_STARTED",
  "EARLY",
  "SUBSTANTIAL",
  "COMPLETED",
  "ENDGAME",
  "POST_GAME",
  "ABANDONED",
  "UNKNOWN",
]);
export const playtimeSchema = z.enum([
  "LESS_THAN_ONE_HOUR",
  "ONE_TO_FIVE_HOURS",
  "FIVE_TO_TEN_HOURS",
  "TEN_TO_TWENTY_HOURS",
  "TWENTY_TO_FIFTY_HOURS",
  "FIFTY_PLUS_HOURS",
  "UNKNOWN",
]);
export const ownershipSchema = z.enum([
  "OWNED",
  "GIFTED",
  "SUBSCRIPTION",
  "BORROWED",
  "REVIEW_COPY",
  "FREE",
  "OTHER",
]);

const emptyToUndefined = (value: unknown) => {
  if (value == null) return undefined;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

export const evaluationInputSchema = z
  .object({
    email: z.string().trim().email("Enter an email so this evaluation can stay attached to you."),
    displayName: z.string().trim().min(2, "Use a name of at least 2 characters.").max(48),
    lens: lensSchema,
    standard: standardSchema,
    standardNote: z.preprocess(emptyToUndefined, z.string().max(280).optional()),
    enjoyment: stanceSchema,
    execution: stanceSchema,
    completion: completionSchema,
    playtime: z.preprocess(emptyToUndefined, playtimeSchema.optional()),
    ownership: z.preprocess(emptyToUndefined, ownershipSchema.optional()),
    platformId: z.preprocess(emptyToUndefined, z.string().optional()),
    reviewTitle: z.preprocess(emptyToUndefined, z.string().max(140).optional()),
    reviewBody: z.preprocess(emptyToUndefined, z.string().max(20000).optional()),
    imported: z.boolean(),
    importSourceName: z.preprocess(emptyToUndefined, z.string().max(120).optional()),
    importSourceUrl: z.preprocess(emptyToUndefined, z.string().url("Enter a full source URL, including https://").optional()),
    judgments: z
      .array(z.object({ dimensionId: z.string().min(1), stance: stanceSchema }))
      .max(24),
    observations: z
      .array(
        z.object({
          topicId: z.string().min(1),
          polarity: z.enum(["PRAISE", "CRITICISM"]),
          content: z.string().trim().min(8, "An observation needs a sentence, not a label.").max(500),
        }),
      )
      .max(8),
  })
  .superRefine((value, context) => {
    const dimensionIds = value.judgments.map((judgment) => judgment.dimensionId);
    if (new Set(dimensionIds).size !== dimensionIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each dimension can only be judged once in an evaluation.",
        path: ["judgments"],
      });
    }
    if (value.imported && !value.reviewBody) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Paste the review you are importing.",
        path: ["reviewBody"],
      });
    }
    if (value.reviewBody && value.reviewBody.length < 20) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "If you write a review, give it enough room to say what worked and what did not.",
        path: ["reviewBody"],
      });
    }
  });

export type EvaluationInput = z.infer<typeof evaluationInputSchema>;

export function parseEvaluationForm(formData: FormData) {
  const judgments = [...formData.entries()]
    .filter(([key, value]) => key.startsWith("judgment:") && String(value))
    .map(([key, value]) => ({
      dimensionId: key.slice("judgment:".length),
      stance: String(value),
    }));

  const topicIds = formData.getAll("observationTopic").map(String);
  const polarities = formData.getAll("observationPolarity").map(String);
  const contents = formData.getAll("observationContent").map(String);
  const observations = topicIds
    .map((topicId, index) => ({
      topicId,
      polarity: polarities[index] ?? "",
      content: contents[index] ?? "",
    }))
    .filter((observation) => observation.content.trim() || observation.topicId);

  const parsed = evaluationInputSchema.safeParse({
    email: formData.get("email"),
    displayName: formData.get("displayName"),
    lens: formData.get("lens"),
    standard: formData.get("standard"),
    standardNote: formData.get("standardNote"),
    enjoyment: formData.get("enjoyment"),
    execution: formData.get("execution"),
    completion: formData.get("completion"),
    playtime: formData.get("playtime"),
    ownership: formData.get("ownership"),
    platformId: formData.get("platformId"),
    reviewTitle: formData.get("reviewTitle"),
    reviewBody: formData.get("reviewBody"),
    imported: formData.get("imported") === "on",
    importSourceName: formData.get("importSourceName"),
    importSourceUrl: formData.get("importSourceUrl"),
    judgments,
    observations: observations.filter((observation) => observation.content.trim()),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the evaluation and try again.";
    return { ok: false as const, message };
  }
  return { ok: true as const, data: parsed.data };
}
