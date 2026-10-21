import { prisma } from "../db/client";
import { hashToken } from "../auth/session";
import { clearIntakeSecret, readIntakeSecret } from "./cookie";
import { resolveIntake } from "./resolve";

function intakeIdFromReturnPath(returnPath: string | null): string | null {
  if (!returnPath) return null;
  const match = /^\/review\/([a-z0-9]+)$/i.exec(returnPath);
  return match?.[1] ?? null;
}

export async function claimPendingIntake(userId: string): Promise<void> {
  const secret = await readIntakeSecret();
  if (!secret) return;
  const intake = await prisma.intake.findFirst({
    where: { secretHash: hashToken(secret) },
    select: { id: true, userId: true, draft: true },
  });
  if (!intake || (intake.userId && intake.userId !== userId)) return;
  if (!intake.userId) {
    await prisma.intake.update({
      where: { id: intake.id },
      data: { userId, expiresAt: null },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, profile: { select: { id: true } } },
  });
  if (!user?.emailVerified || !user.profile) return;
  if (!intake.draft) await resolveOwnedIntake(intake.id);
  await clearIntakeSecret();
}

export async function settleAccountReview(userId: string, returnPath: string | null): Promise<void> {
  await claimPendingIntake(userId);
  const reviewId = intakeIdFromReturnPath(returnPath);
  if (!reviewId) return;
  const intake = await prisma.intake.findFirst({
    where: { id: reviewId, userId, draft: false },
    select: { id: true },
  });
  if (!intake) return;
  await resolveOwnedIntake(intake.id);
}

async function resolveOwnedIntake(intakeId: string) {
  try {
    await resolveIntake(intakeId);
  } catch (error) {
    console.error(`Resolve after sign-in failed: ${error instanceof Error ? error.message : "resolve failed"}`);
  }
}
