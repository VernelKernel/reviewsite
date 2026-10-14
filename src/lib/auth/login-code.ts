import { randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "../db/client";
import { DomainError } from "../domain/relations";
import { sendLoginCodeEmail } from "../mail/send";
import { clearChallengeCookie, readChallengeEmail, writeChallengeCookie } from "./challenge-cookie";
import { normalizeCode } from "./email";
import { assertAuthSendRate } from "./rate-limit";
import { ensureReviewerProfile, hashToken, openSession } from "./session";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;

function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}

async function latestPendingName(userId: string): Promise<string | null> {
  const previous = await prisma.emailLoginCode.findFirst({
    where: { userId, pendingDisplayName: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { pendingDisplayName: true },
  });
  return previous?.pendingDisplayName ?? null;
}

async function ensureEmailIdentity(userId: string, email: string) {
  await prisma.authenticationIdentity.upsert({
    where: { provider_providerAccountId: { provider: "EMAIL", providerAccountId: email } },
    create: { userId, provider: "EMAIL", providerAccountId: email },
    update: {},
  });
}

async function sendCodeForUser(input: { userId: string; email: string; pendingDisplayName: string | null }) {
  assertAuthSendRate(input.email);
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await prisma.emailLoginCode.deleteMany({ where: { userId: input.userId } });
  await prisma.emailLoginCode.create({
    data: {
      userId: input.userId,
      codeHash: hashToken(code),
      pendingDisplayName: input.pendingDisplayName,
      expiresAt: new Date(Date.now() + TEN_MINUTES_MS),
    },
  });
  const mail = await sendLoginCodeEmail({ to: input.email, code });
  if (!mail.sent && !mail.logged) {
    throw new DomainError("We could not send the code. Try again.");
  }
  await writeChallengeCookie(input.email);
}

export async function beginSignup(email: string, displayName: string): Promise<{ existing: boolean }> {
  let user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  const existing = Boolean(user);
  if (!user) {
    try {
      user = await prisma.user.create({
        data: {
          email,
          identities: { create: { provider: "EMAIL", providerAccountId: email } },
        },
        include: { profile: true },
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
      if (!user) throw error;
    }
  } else {
    await ensureEmailIdentity(user.id, email);
  }

  await sendCodeForUser({
    userId: user.id,
    email,
    pendingDisplayName: user.profile ? null : displayName,
  });
  return { existing: existing || Boolean(user.profile) };
}

export async function beginLogin(email: string): Promise<"missing" | "sent"> {
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) return "missing";
  await ensureEmailIdentity(user.id, email);
  const pending = user.profile ? null : await latestPendingName(user.id);
  await sendCodeForUser({ userId: user.id, email, pendingDisplayName: pending });
  return "sent";
}

export async function resendLoginCode(): Promise<void> {
  const email = await readChallengeEmail();
  if (!email) throw new DomainError("Request a new code from sign in.");
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) throw new DomainError("Request a new code from sign in.");
  const pending = user.profile ? null : await latestPendingName(user.id);
  await sendCodeForUser({ userId: user.id, email, pendingDisplayName: pending });
}

export async function confirmLoginCode(rawCode: string): Promise<void> {
  const email = await readChallengeEmail();
  if (!email) throw new DomainError("Request a new code from sign in.");
  const code = normalizeCode(rawCode);
  if (!code) throw new DomainError("Enter the 6-digit code.");

  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) throw new DomainError("Request a new code from sign in.");

  const challenge = await prisma.emailLoginCode.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge || challenge.attemptCount >= MAX_ATTEMPTS) {
    throw new DomainError("That code is no longer valid. Request another.");
  }

  if (!hashesMatch(challenge.codeHash, hashToken(code))) {
    const next = challenge.attemptCount + 1;
    await prisma.emailLoginCode.update({
      where: { id: challenge.id },
      data: { attemptCount: next, usedAt: next >= MAX_ATTEMPTS ? new Date() : null },
    });
    throw new DomainError(next >= MAX_ATTEMPTS ? "That code is no longer valid. Request another." : "That code does not match.");
  }

  const claimed = await prisma.emailLoginCode.updateMany({
    where: { id: challenge.id, usedAt: null, codeHash: hashToken(code) },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) throw new DomainError("That code is no longer valid. Request another.");

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: user.emailVerified ?? new Date() },
  });
  if (!user.profile) {
    const name = challenge.pendingDisplayName?.trim();
    await ensureReviewerProfile(user.id, name && name.length >= 2 ? name : "Reviewer");
  }
  await clearChallengeCookie();
  await openSession(user.id);
}
