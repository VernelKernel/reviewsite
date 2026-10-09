import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../db/client";
import { slugify } from "../domain/slug";

export const SESSION_COOKIE = "frame_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getCurrentReviewer() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { profile: true, preferences: true },
      },
    },
  });
  if (!session || session.expiresAt.getTime() < Date.now() || !session.user.profile) return null;
  return session.user.profile;
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { profile: true, preferences: true } } },
  });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

async function uniqueSlug(displayName: string): Promise<string> {
  const base = slugify(displayName);
  let slug = base;
  let suffix = 2;
  while (await prisma.reviewerProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function ensureReviewerProfile(userId: string, displayName: string) {
  const name = displayName.trim();
  const existing = await prisma.reviewerProfile.findUnique({ where: { userId } });
  if (!existing) {
    return prisma.reviewerProfile.create({
      data: { userId, slug: await uniqueSlug(name), displayName: name },
    });
  }
  if (existing.displayName !== name) {
    return prisma.reviewerProfile.update({ where: { id: existing.id }, data: { displayName: name } });
  }
  return existing;
}

export async function openSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + THIRTY_DAYS_MS),
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS_MS / 1000,
  });
}

export async function establishReviewer(input: { email: string; displayName: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email,
        identities: {
          create: { provider: "EMAIL", providerAccountId: email },
        },
      },
    }));

  const profile = await ensureReviewerProfile(user.id, input.displayName);
  await openSession(user.id);
  return profile;
}
