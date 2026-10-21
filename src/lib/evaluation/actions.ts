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

export type ActionState = { error?: string; draftSaved?: boolean };

export async function saveEvaluation(
  workType: WorkType,
  slug: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseEvaluationForm(formData);
  if (!parsed.ok) return { error: parsed.message };
  const publishing = parsed.intent === "publish";

  try {
    const input = parsed.data;
    assertSubmissionRate(input.email.toLowerCase());

    const work = await prisma.work.findUnique({
      where: { workType_slug: { workType, slug } },
      include: { platforms: true },
    });
    if (!work || work.status === "ARCHIVED" || work.status === "DRAFT") {
      return { error: "That work is not open for review." };
    }

    if (input.platformId && !work.platforms.some((platform) => platform.platformId === input.platformId)) {
      return { error: "Choose a platform this work was actually evaluated on." };
    }

    const dimensions = await prisma.dimension.findMany({ where: { appliesTo: { has: work.workType } } });
    const dimensionIds = new Set(dimensions.map((dimension) => dimension.id));
    if (input.judgments.some((judgment) => !dimensionIds.has(judgment.dimensionId))) {
      return { error: "One of those dimensions does not apply to this work." };
    }
    if (input.sections.some((section) => section.dimensionId && !dimensionIds.has(section.dimensionId))) {
      return { error: "One of those dimensions does not apply to this work." };
    }

    const reviewer = await establishReviewer({ email: input.email, displayName: input.displayName });
    const existing = await prisma.evaluation.findUnique({
      where: { reviewerId_workId: { reviewerId: reviewer.id, workId: work.id } },
    });
    if (existing && (existing.status === "HIDDEN" || existing.status === "REMOVED")) {
      return { error: "This review is not open for changes." };
    }
    if (!publishing && existing && existing.status !== "DRAFT") {
      return { error: "This review is already published. Update it to keep it published." };
    }

    const status = publishing ? "PUBLISHED" : "DRAFT";
    const reviewedOn = publishing ? (existing?.reviewedOn ?? new Date()) : (existing?.reviewedOn ?? null);
    const savedFields = {
      status,
      enjoyment: input.enjoyment,
      execution: input.execution,
      completion: input.completion,
      playtime: input.playtime ?? "UNKNOWN",
      ownership: input.ownership ?? null,
      platformId: input.platformId ?? null,
      reviewedOn,
    } as const;

    await prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.evaluation.update({
            where: { id: existing.id },
            data: savedFields,
          })
        : await tx.evaluation.create({
            data: {
              workId: work.id,
              reviewerId: reviewer.id,
              ...savedFields,
            },
          });

      await tx.evaluationJudgment.deleteMany({ where: { evaluationId: saved.id } });
      if (input.judgments.length > 0) {
        await tx.evaluationJudgment.createMany({
          data: input.judgments.map((judgment) => ({
            evaluationId: saved.id,
            dimensionId: judgment.dimensionId,
            stance: judgment.stance,
            mattered: judgment.mattered,
          })),
        });
      }

      if (input.reviewBody || input.impression) {
        const review = await tx.review.upsert({
          where: { evaluationId: saved.id },
          create: {
            evaluationId: saved.id,
            title: input.reviewTitle ?? null,
            impression: input.impression ?? null,
            body: input.reviewBody ?? "",
            source: "INTERNAL",
            importSourceName: null,
            importSourceUrl: null,
          },
          update: {
            title: input.reviewTitle ?? null,
            impression: input.impression ?? null,
            body: input.reviewBody ?? "",
            source: "INTERNAL",
            importSourceName: null,
            importSourceUrl: null,
          },
        });
        await tx.reviewSection.deleteMany({ where: { reviewId: review.id } });
        if (input.sections.length > 0) {
          await tx.reviewSection.createMany({
            data: input.sections.map((section, index) => ({
              reviewId: review.id,
              dimensionId: section.dimensionId,
              body: section.body,
              sortOrder: index,
            })),
          });
        }
      } else {
        await tx.review.deleteMany({ where: { evaluationId: saved.id } });
      }

      return saved;
    });

    revalidatePath(evaluateHref(work.workType, work.slug));
    if (!publishing) return { draftSaved: true };

    revalidatePath(workHref(work.workType, work.slug));
    revalidatePath(reviewHref(work.workType, work.slug, reviewer.slug));
    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/games");
    redirect(reviewHref(work.workType, work.slug, reviewer.slug) + "?saved=1");
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    if (typeof error === "object" && error && "digest" in error) throw error;
    console.error(error);
    return { error: publishing ? "We couldn't save this review. Nothing was published." : "We couldn't save this draft. Nothing was saved." };
  }
}
