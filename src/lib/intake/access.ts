import { prisma } from "../db/client";
import { getCurrentUser } from "../auth/session";
import { readIntakeSecret, secretMatches } from "./cookie";

export async function loadOwnedIntake(id: string) {
  const intake = await prisma.intake.findUnique({
    where: { id },
    include: {
      user: true,
      work: { select: { id: true, title: true, slug: true, workType: true, status: true } },
    },
  });
  if (!intake) return null;
  if (intake.expiresAt && intake.expiresAt.getTime() < Date.now() && !intake.userId) return null;
  const secret = await readIntakeSecret();
  if (secretMatches(secret, intake.secretHash)) return intake;
  const user = await getCurrentUser();
  if (user && intake.userId === user.id) return intake;
  return null;
}
