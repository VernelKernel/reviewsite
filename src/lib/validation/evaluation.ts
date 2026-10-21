import { z } from "zod";
import { flattenSections, readSectionFields, type StoredSection } from "../reviews/sections";

export const stanceSchema = z.enum(["POSITIVE", "MIXED", "NEGATIVE"]);
export const matteredSchema = z.enum(["A_LITTLE", "QUITE_A_BIT", "MATTERS_A_LOT"]);
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

const evaluationShape = {
  enjoyment: stanceSchema,
  execution: stanceSchema,
  completion: completionSchema,
  playtime: z.preprocess(emptyToUndefined, playtimeSchema.optional()),
  ownership: z.preprocess(emptyToUndefined, ownershipSchema.optional()),
  platformId: z.preprocess(emptyToUndefined, z.string().optional()),
  reviewTitle: z.preprocess(emptyToUndefined, z.string().max(140).optional()),
  impression: z.preprocess(emptyToUndefined, z.string().max(80, "Keep the overall impression to 80 characters.").optional()),
  reviewBody: z.preprocess(emptyToUndefined, z.string().max(20000).optional()),
  judgments: z.array(z.object({ dimensionId: z.string().min(1), stance: stanceSchema, mattered: matteredSchema })).max(24),
  sections: z
    .array(
      z.object({
        dimensionId: z.string().min(1).nullable(),
        body: z.string().trim().min(1).max(20000),
      }),
    )
    .max(25),
};

function refineEvaluation(
  value: { judgments: { dimensionId: string }[]; sections: StoredSection[]; reviewBody?: string },
  context: z.RefinementCtx,
) {
  const dimensionIds = value.judgments.map((judgment) => judgment.dimensionId);
  if (new Set(dimensionIds).size !== dimensionIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Each dimension can only be judged once in a review.",
      path: ["judgments"],
    });
  }
  const sectionIds = value.sections.flatMap((section) => (section.dimensionId ? [section.dimensionId] : []));
  if (new Set(sectionIds).size !== sectionIds.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Each dimension can only be written once in a review.",
      path: ["sections"],
    });
  }
  if (value.reviewBody && value.reviewBody.length < 20) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "If you write a review, give it enough room to say what worked and what did not.",
      path: ["reviewBody"],
    });
  }
}

export const evaluationInputSchema = z.object(evaluationShape).superRefine(refineEvaluation);

export const evaluationDraftSchema = z.object(evaluationShape).superRefine(refineEvaluation);

export type EvaluationInput = z.infer<typeof evaluationInputSchema>;
export type EvaluationDraftInput = z.infer<typeof evaluationDraftSchema>;
export type EvaluationIntent = "publish" | "draft";

export function parseEvaluationForm(formData: FormData) {
  const judgments = [...formData.entries()]
    .filter(([key, value]) => key.startsWith("judgment:") && String(value))
    .map(([key, value]) => {
      const dimensionId = key.slice("judgment:".length);
      return {
        dimensionId,
        stance: String(value),
        mattered: String(formData.get(`mattered:${dimensionId}`) ?? ""),
      };
    });
  if (judgments.some((judgment) => !matteredSchema.safeParse(judgment.mattered).success)) {
    return { ok: false as const, message: "Say how much each judged dimension mattered." };
  }

  const intent: EvaluationIntent = formData.get("intent") === "draft" ? "draft" : "publish";
  const schema = intent === "draft" ? evaluationDraftSchema : evaluationInputSchema;
  const sectional = formData.get("reviewMode") === "sections";
  const sections = sectional ? readSectionFields(formData) : [];
  const flattened = sectional ? flattenSections(sections) : undefined;
  const parsed = schema.safeParse({
    enjoyment: formData.get("enjoyment"),
    execution: formData.get("execution"),
    completion: formData.get("completion"),
    playtime: formData.get("playtime"),
    ownership: formData.get("ownership"),
    platformId: formData.get("platformId"),
    reviewTitle: formData.get("reviewTitle"),
    impression: formData.get("impression"),
    reviewBody: sectional ? flattened : formData.get("reviewBody"),
    judgments,
    sections,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Check the review and try again.";
    return { ok: false as const, message };
  }
  return { ok: true as const, intent, data: parsed.data };
}
