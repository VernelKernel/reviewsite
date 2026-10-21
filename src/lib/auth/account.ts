import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../db/client";
import { DomainError } from "../domain/relations";
import { claimPendingIntake, settleAccountReview } from "../intake/claim";
import { accountVerificationUrl, sendAccountVerificationEmail } from "../mail/send";
import { readChallengeEmail, writeChallengeCookie } from "./challenge-cookie";
import { passwordError, splitUsername, usernameError } from "./credentials";
import { isValidEmail, normalizeEmail } from "./email";
import { hashPassword, verifyPassword } from "./password";
import { assertAuthSendRate, assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "./rate-limit";
import { safeReturnPath } from "./return-path";
import { hashToken, openSession } from "./session";

const TOKEN_MS = 24 * 60 * 60 * 1000;
export const ACCOUNT_VERIFY_COOKIE = "frame_dev_account_verify";

let dummyHash: Promise<string> | null = null;

function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword("not-a-real-password");
  return dummyHash;
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "P2002";
}

async function rememberDevLink(url: string) {
  if (process.env.NODE_ENV === "production") return;
  const store = await cookies();
  store.set(ACCOUNT_VERIFY_COOKIE, url, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: TOKEN_MS / 1000,
  });
}

async function issueVerification(userId: string, email: string, returnPath: string | null): Promise<{ sent: boolean; devLink?: string }> {
  assertAuthSendRate(email);
  const raw = randomBytes(32).toString("base64url");
  await prisma.emailVerification.deleteMany({ where: { userId } });
  await prisma.emailVerification.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      returnPath,
      expiresAt: new Date(Date.now() + TOKEN_MS),
    },
  });
  const url = accountVerificationUrl(raw);
  await rememberDevLink(url);
  let mail = { sent: false, logged: true };
  try {
    mail = await sendAccountVerificationEmail({ to: email, url });
  } catch (error) {
    console.error(`Account verification mail failed: ${error instanceof Error ? error.message : "send failed"}`);
  }
  const devLink = process.env.NODE_ENV === "production" ? undefined : url;
  return { sent: mail.sent || Boolean(devLink), devLink };
}

export async function registerAccount(input: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  returnPath: string | null;
}): Promise<{ sent: boolean }> {
  const nameProblem = usernameError(input.username);
  if (nameProblem) throw new DomainError(nameProblem);
  const parsed = splitUsername(input.username);
  if (!parsed) throw new DomainError("Enter a username.");
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) throw new DomainError("Enter a valid email.");
  const passwordProblem = passwordError(input.password);
  if (passwordProblem) throw new DomainError(passwordProblem);
  if (input.password !== input.confirmPassword) throw new DomainError("Those passwords do not match.");

  const [byName, bySlug, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { username: parsed.username }, select: { id: true } }),
    prisma.reviewerProfile.findUnique({ where: { slug: parsed.username }, select: { id: true } }),
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
  ]);
  if (byName || bySlug) throw new DomainError("That username is taken.");
  if (byEmail) throw new DomainError("An account already uses that email.");

  const passwordHash = await hashPassword(input.password);
  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        email,
        username: parsed.username,
        identities: { create: { provider: "EMAIL", providerAccountId: email, passwordHash } },
        profile: { create: { slug: parsed.username, displayName: parsed.displayName } },
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (isUniqueConflict(error)) throw new DomainError("That username or email is already in use.");
    throw error;
  }

  await writeChallengeCookie(email);
  await claimPendingIntake(userId);
  const issued = await issueVerification(userId, email, input.returnPath);
  return { sent: issued.sent };
}

export async function loginWithPassword(input: { identifier: string; password: string; returnPath: string | null }): Promise<"ok" | "unverified"> {
  const identifier = input.identifier.trim();
  if (!identifier) throw new DomainError("Enter your username or email.");
  if (!input.password) throw new DomainError("Enter your password.");

  const emailLike = identifier.includes("@");
  const key = emailLike ? normalizeEmail(identifier) : identifier.toLowerCase();
  assertLoginAllowed(key);

  const user = emailLike
    ? await prisma.user.findUnique({ where: { email: key }, include: { identities: true } })
    : await prisma.user.findUnique({ where: { username: key }, include: { identities: true } });
  const passwordHash = user?.identities.find((identity) => identity.provider === "EMAIL")?.passwordHash;
  const matches = await verifyPassword(input.password, passwordHash ?? (await dummyPasswordHash()));
  if (!user || !passwordHash || !matches) {
    recordLoginFailure(key);
    throw new DomainError("Those details do not match an account.");
  }

  clearLoginFailures(key);
  if (!user.emailVerified) {
    await claimPendingIntake(user.id);
    if (input.returnPath) {
      await prisma.emailVerification.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { returnPath: input.returnPath },
      });
    }
    await writeChallengeCookie(user.email);
    return "unverified";
  }

  await settleAccountReview(user.id, input.returnPath);
  await openSession(user.id);
  return "ok";
}

export async function confirmAccountEmail(rawToken: string): Promise<string> {
  const token = await prisma.emailVerification.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });
  if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) {
    throw new DomainError("This link is no longer valid.");
  }
  const claimed = await prisma.emailVerification.updateMany({
    where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) throw new DomainError("This link is no longer valid.");

  await prisma.user.update({
    where: { id: token.userId },
    data: { emailVerified: token.user.emailVerified ?? new Date() },
  });
  const returnPath = safeReturnPath(token.returnPath);
  await settleAccountReview(token.userId, returnPath);
  await openSession(token.userId);
  return returnPath ?? "/dashboard";
}

export async function resendAccountVerification(): Promise<{ sent: boolean; devLink?: string; alreadyVerified?: boolean }> {
  const email = await readChallengeEmail();
  if (!email) throw new DomainError("Start again from account creation.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new DomainError("Start again from account creation.");
  if (user.emailVerified) return { sent: true, alreadyVerified: true };
  const previous = await prisma.emailVerification.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { returnPath: true },
  });
  return issueVerification(user.id, user.email, safeReturnPath(previous?.returnPath));
}

export async function resendAccountVerificationFromToken(rawToken: string): Promise<{ sent: boolean; devLink?: string; alreadyVerified?: boolean }> {
  const token = await prisma.emailVerification.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: true },
  });
  if (!token) throw new DomainError("This link is not valid.");
  if (token.user.emailVerified) return { sent: true, alreadyVerified: true };
  await writeChallengeCookie(token.user.email);
  return issueVerification(token.userId, token.user.email, safeReturnPath(token.returnPath));
}

export async function accountTokenState(rawToken: string) {
  if (!rawToken) return { status: "missing" as const };
  const token = await prisma.emailVerification.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { emailVerified: true } } },
  });
  if (!token) return { status: "missing" as const };
  if (token.usedAt || token.user.emailVerified) return { status: "used" as const };
  if (token.expiresAt.getTime() < Date.now()) return { status: "expired" as const };
  return { status: "ready" as const };
}
