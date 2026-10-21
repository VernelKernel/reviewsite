"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { hashToken, ensureReviewerProfile, getCurrentUser } from "../auth/session";
import { prisma } from "../db/client";
import { DomainError } from "../domain/relations";
import { assertSubmissionRate } from "../evaluation/rate-limit";
import { loadOwnedIntake } from "./access";
import { writeIntakeSecret } from "./cookie";
import { normalizeTitle } from "./normalize";
import { isMattered, type MatteredName } from "../evaluations/mattered";
import { completionSchema, ownershipSchema } from "../validation/evaluation";
import { flattenSections, readSectionFields, readStoredSections } from "../reviews/sections";
import { readJudgments } from "./judgments";
import { resolveIntake } from "./resolve";

export type IntakeActionState = { error?: string; sent?: boolean; devLink?: string };

const STANCES = new Set(["POSITIVE", "MIXED", "NEGATIVE"]);
const TITLE_MAX = 140;
const NOTE_MAX = 8000;
const CONTEXT_MAX = 80;
const ANONYMOUS_MS = 14 * 24 * 60 * 60 * 1000;

export async function createIntake(_previous: IntakeActionState, formData: FormData): Promise<IntakeActionState> {
  const workType = formData.get("workType") === "MOVIE" ? "MOVIE" : formData.get("workType") === "GAME" ? "GAME" : null;
  if (!workType) return { error: "Choose games or movies." };

  const rawTitle = String(formData.get("title") ?? "").trim();
  if (rawTitle.length < 2 || rawTitle.length > TITLE_MAX) return { error: "Enter the title of the work." };
  const normalizedTitle = normalizeTitle(rawTitle);
  if (normalizedTitle.length < 2) return { error: "Enter the title of the work." };

  const drafting = formData.get("intent") === "draft";
  const enjoyment = stanceOf(formData.get("enjoyment"));
  const execution = stanceOf(formData.get("execution"));
  if (!drafting && (!enjoyment || !execution)) return { error: "Answer enjoyment and execution." };

  const platformText = optionalText(formData.get("platform"), CONTEXT_MAX);
  const genreValues = formData
    .getAll("genre")
    .map((value) => String(value).trim())
    .filter((value) => Boolean(value) && value !== "Not specified");
  const rawGenre = genreValues.join(", ");
  const sectional = formData.get("reviewMode") === "sections";
  const reviewSections = sectional ? readSectionFields(formData) : [];
  const reviewBody = sectional ? flattenSections(reviewSections) || null : optionalText(formData.get("reviewBody"), NOTE_MAX);
  if (reviewBody === undefined || platformText === undefined || rawGenre === undefined) {
    return { error: "One of those fields is too long." };
  }
  const rawPlatform = platformText && platformText !== "Not specified" ? platformText : null;
  if (!drafting && (!rawPlatform || genreValues.length === 0 || rawGenre.length > 240)) return { error: "Choose a platform and genre." };
  if (rawGenre.length > 240) return { error: "Choose a platform and genre." };
  const completion = completionSchema.safeParse(formData.get("completion"));
  if (!completion.success) return { error: "Choose how much of the work you experienced." };
  const ownershipText = String(formData.get("ownership") ?? "").trim();
  const ownership = ownershipText ? ownershipSchema.safeParse(ownershipText) : null;
  if (ownership && !ownership.success) return { error: "Choose how you had access." };
  const [platformMatch, genreCatalog] = await Promise.all([
    rawPlatform ? prisma.platform.findFirst({ where: { name: rawPlatform }, select: { id: true } }) : Promise.resolve(null),
    genreValues.length > 0 ? prisma.genre.findMany({ select: { name: true } }) : Promise.resolve([]),
  ]);
  const knownGenres = new Set(genreCatalog.map((genre) => genre.name));
  if (rawPlatform && !platformMatch) return { error: "Choose a platform and genre." };
  if (genreValues.some((name) => !knownGenres.has(name))) return { error: "Choose a platform and genre." };
  if (reviewBody && reviewBody.length > NOTE_MAX) return { error: "One of those fields is too long." };

  try {
    assertSubmissionRate(`intake:${await clientAddress()}`);
  } catch (error) {
    return { error: error instanceof DomainError ? error.message : "Try again later." };
  }

  const dimensions = await prisma.dimension.findMany({
    where: { appliesTo: { has: workType } },
    select: { id: true, family: true },
  });
  const allowedDimensions = new Set(dimensions.map((dimension) => dimension.id));
  if (reviewSections.some((section) => section.dimensionId && !allowedDimensions.has(section.dimensionId))) {
    return { error: "One of those dimensions does not apply to this work." };
  }
  const judgments: { dimensionId: string; stance: "POSITIVE" | "MIXED" | "NEGATIVE"; mattered: MatteredName }[] = [];
  for (const dimension of dimensions) {
    const stance = stanceOf(formData.get(`judgment:${dimension.id}`));
    if (!stance) continue;
    const mattered = matteredOf(formData.get(`mattered:${dimension.id}`));
    if (!mattered) return { error: "Say how much each judged dimension mattered." };
    judgments.push({ dimensionId: dimension.id, stance, mattered });
  }
  const enjoymentIds = new Set(dimensions.filter((dimension) => dimension.family === "ENJOYMENT").map((dimension) => dimension.id));
  const workIds = new Set(dimensions.filter((dimension) => dimension.family === "WORK").map((dimension) => dimension.id));
  const judgedEnjoyment = judgments.filter((judgment) => enjoymentIds.has(judgment.dimensionId)).length;
  const judgedWork = judgments.filter((judgment) => workIds.has(judgment.dimensionId)).length;
  if (!drafting && (judgedEnjoyment < 3 || judgedWork < 3)) {
    return { error: "At least three dimensions are required." };
  }

  const user = await getCurrentUser();
  const secret = randomBytes(32).toString("base64url");
  const intake = await prisma.intake.create({
    data: {
      secretHash: hashToken(secret),
      workType,
      rawTitle,
      normalizedTitle,
      rawPlatform,
      rawGenre: rawGenre || null,
      enjoyment,
      execution,
      draft: drafting,
      completion: completion.data,
      ownership: ownership?.data ?? null,
      reviewBody,
      reviewSections: readStoredSections(reviewSections) as Prisma.InputJsonValue,
      judgments: judgments as Prisma.InputJsonValue,
      userId: user?.id ?? null,
      expiresAt: user ? null : new Date(Date.now() + ANONYMOUS_MS),
    },
    select: { id: true },
  });
  await writeIntakeSecret(secret);
  if (user?.emailVerified && !drafting) {
    if (!user.profile) await ensureReviewerProfile(user.id, reviewerName(user.email));
    try {
      await resolveIntake(intake.id);
    } catch (error) {
      console.error(`Resolve after publish failed: ${error instanceof Error ? error.message : "resolve failed"}`);
    }
  }
  if (!user) redirect(`/login?next=${encodeURIComponent(`/review/${intake.id}`)}`);
  redirect(`/review/${intake.id}`);
}


export async function publishIntakeDraft(intakeId: string, _previous: IntakeActionState): Promise<IntakeActionState> {
  const intake = await loadOwnedIntake(intakeId);
  const user = await getCurrentUser();
  if (!intake?.draft || !user || intake.userId !== user.id) return { error: "This draft could not be found." };
  if (!user.emailVerified) return { error: "Verify your email before publishing." };
  if (!intake.enjoyment || !intake.execution || !intake.rawPlatform || !intake.rawGenre) {
    return { error: "Finish the review before publishing." };
  }

  const dimensions = await prisma.dimension.findMany({
    where: { appliesTo: { has: intake.workType } },
    select: { id: true, family: true },
  });
  const enjoymentIds = new Set(dimensions.filter((dimension) => dimension.family === "ENJOYMENT").map((dimension) => dimension.id));
  const workIds = new Set(dimensions.filter((dimension) => dimension.family === "WORK").map((dimension) => dimension.id));
  const judgments = readJudgments(intake.judgments);
  const judgedEnjoyment = judgments.filter((judgment) => enjoymentIds.has(judgment.dimensionId)).length;
  const judgedWork = judgments.filter((judgment) => workIds.has(judgment.dimensionId)).length;
  if (judgedEnjoyment < 3 || judgedWork < 3) return { error: "At least three dimensions are required." };

  await prisma.intake.update({ where: { id: intake.id }, data: { draft: false } });
  try {
    await resolveIntake(intake.id);
  } catch (error) {
    console.error(`Resolve after publishing a draft failed: ${error instanceof Error ? error.message : "resolve failed"}`);
  }
  revalidatePath("/dashboard");
  revalidatePath(`/review/${intake.id}`);
  redirect(`/review/${intake.id}`);
}

function reviewerName(email: string): string {
  const local = email.split("@")[0]?.replace(/[^a-zA-Z0-9]+/g, " ").trim() ?? "";
  return local.length >= 2 ? local.slice(0, 48) : "Reviewer";
}

function stanceOf(value: FormDataEntryValue | null): "POSITIVE" | "MIXED" | "NEGATIVE" | null {
  const stance = String(value ?? "");
  return STANCES.has(stance) ? (stance as "POSITIVE" | "MIXED" | "NEGATIVE") : null;
}

function matteredOf(value: FormDataEntryValue | null): MatteredName | null {
  const mattered = String(value ?? "");
  return isMattered(mattered) ? mattered : null;
}

function optionalText(value: FormDataEntryValue | null, max: number): string | null | undefined {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (text.length > max) return undefined;
  return text;
}

async function clientAddress(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? "local";
  return forwarded.split(",")[0]?.trim() || "local";
}
