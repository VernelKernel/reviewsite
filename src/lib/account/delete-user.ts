import { prisma } from "../db/client";
import type { AccountDeletionReasonValue } from "./deletion-reasons";

export async function deleteUserAccount(input: {
  userId: string;
  reason: AccountDeletionReasonValue;
  otherText: string | null;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.accountDeletionFeedback.create({
      data: { reason: input.reason, otherText: input.otherText },
    });
    await tx.session.deleteMany({ where: { userId: input.userId } });
    await tx.followedReviewer.deleteMany({ where: { userId: input.userId } });
    await tx.emailLoginCode.deleteMany({ where: { userId: input.userId } });
    await tx.verificationToken.deleteMany({ where: { userId: input.userId } });
    await tx.userPreference.deleteMany({ where: { userId: input.userId } });
    await tx.authenticationIdentity.deleteMany({ where: { userId: input.userId } });

    const evaluationCount = await tx.evaluation.count({ where: { reviewer: { userId: input.userId } } });
    if (evaluationCount === 0) {
      await tx.report.deleteMany({ where: { reporterId: input.userId } });
      await tx.reviewerProfile.deleteMany({ where: { userId: input.userId } });
      await tx.user.delete({ where: { id: input.userId } });
      return;
    }

    await tx.user.update({
      where: { id: input.userId },
      data: {
        email: `retired-${input.userId}@retired.invalid`,
        emailVerified: null,
      },
    });
  });
}
