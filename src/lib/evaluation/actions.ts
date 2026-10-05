"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { WorkType } from "@/generated/prisma/client";
import { establishReviewer } from "../auth/session";
import { prisma } from "../db/client";
import { DomainError } from "../domain/relations";
import { evaluateHref, reviewHref, workHref } from "../domain/labels";
import { parseEvaluationForm } from "../validation/evaluation";
import { assertSubmissionRate } from "./rate-limit";

export type ActionState = { error?: string };

export async function saveEvaluation(
  workType: WorkType,
  slug: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseEvaluationForm(formData);
  if (!parsed.ok) return { error: parsed.message };

  try {
    const input = parsed.data;
    assertSubmissionRate(input.email.toLowerCase());

    const work = await prisma.work.findUnique({
      where: { workType_slug: { workType, slug } },
      include: { platforms: true },
    });
    if (!work || work.status === "ARCHIVED" || work.status === "DRAFT") {
      return { error: "That work is not open for evaluation." };
    }

    if (input.platformId && !work.platforms.some((platform) => platform.platformId === input.platformId)) {
      return { error: "Choose a platform this work was actually evaluated on." };
    }

    const [dimensions, topics] = await Promise.all([
      prisma.dimension.findMany({ where: { appliesTo: { has: work.workType } } }),
      prisma.topic.findMany(),
    ]);
    const dimensionIds = new Set(dimensions.map((dimension) => dimension.id));
    const topicIds = new Set(topics.map((topic) => topic.id));
    if (input.judgments.some((judgment) => !dimensionIds.has(judgment.dimensionId))) {
      return { error: "One of those dimensions does not apply to this work." };
    }
    if (input.observations.some((observation) => !topicIds.has(observation.topicId))) {
      return { error: "One of those topics is not in the catalog." };
    }

    const reviewer = await establishReviewer({ email: input.email, displayName: input.displayName });
    const existing = await prisma.evaluation.findUnique({
      where: { reviewerId_workId: { reviewerId: reviewer.id, workId: work.id } },
    });
    if (existing && (existing.status === "HIDDEN" || existing.status === "REMOVED")) {
      return { error: "This evaluation is not open for changes." };
    }

    const evaluation = await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.evaluation.update({
            where: { id: existing.id },
            data: {
              status: "PUBLISHED",
              lens: input.lens,
              standard: input.standard,
              standardNote: input.standardNote ?? null,
              enjoyment: input.enjoyment,
              execution: input.execution,
              completion: input.completion,
              playtime: input.playtime ?? "UNKNOWN",
              ownership: input.ownership ?? null,
              platformId: input.platformId ?? null,
              reviewedOn: existing.reviewedOn ?? new Date(),
            },
          })
        : await tx.evaluation.create({
            data: {
              workId: work.id,
              reviewerId: reviewer.id,
              status: "PUBLISHED",
              lens: input.lens,
              standard: input.standard,
              standardNote: input.standardNote ?? null,
              enjoyment: input.enjoyment,
              execution: input.execution,
              completion: input.completion,
              playtime: input.playtime ?? "UNKNOWN",
              ownership: input.ownership ?? null,
              platformId: input.platformId ?? null,
              reviewedOn: new Date(),
            },
          });

      await tx.evaluationJudgment.deleteMany({ where: { evaluationId: saved.id } });
      if (input.judgments.length > 0) {
        await tx.evaluationJudgment.createMany({
          data: input.judgments.map((judgment) => ({
            evaluationId: saved.id,
            dimensionId: judgment.dimensionId,
            stance: judgment.stance,
          })),
        });
      }

      await tx.observation.deleteMany({ where: { evaluationId: saved.id } });
      if (input.observations.length > 0) {
        await tx.observation.createMany({
          data: input.observations.map((observation) => ({
            evaluationId: saved.id,
            topicId: observation.topicId,
            polarity: observation.polarity,
            content: observation.content,
          })),
        });
      }

      if (input.reviewBody) {
        await tx.review.upsert({
          where: { evaluationId: saved.id },
          create: {
            evaluationId: saved.id,
            title: input.reviewTitle ?? null,
            body: input.reviewBody,
            source: input.imported ? "IMPORTED" : "INTERNAL",
            importSourceName: input.imported ? (input.importSourceName ?? null) : null,
            importSourceUrl: input.imported ? (input.importSourceUrl ?? null) : null,
          },
          update: {
            title: input.reviewTitle ?? null,
            body: input.reviewBody,
            source: input.imported ? "IMPORTED" : "INTERNAL",
            importSourceName: input.imported ? (input.importSourceName ?? null) : null,
            importSourceUrl: input.imported ? (input.importSourceUrl ?? null) : null,
          },
        });
      } else {
        await tx.review.deleteMany({ where: { evaluationId: saved.id } });
      }

      return saved;
    });

    revalidatePath(workHref(work.workType, work.slug));
    revalidatePath(evaluateHref(work.workType, work.slug));
    revalidatePath(reviewHref(work.workType, work.slug, reviewer.slug));
    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/games");
    redirect(reviewHref(work.workType, work.slug, reviewer.slug) + `?saved=${evaluation.id ? "1" : "1"}`);
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    if (typeof error === "object" && error && "digest" in error) throw error;
    console.error(error);
    return { error: "We couldn't save this evaluation. Nothing was published." };
  }
}
