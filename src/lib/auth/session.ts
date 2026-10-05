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

export async function establishReviewer(input: { email: string; displayName: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        email,
        identities: {
          create: { provider: "EMAIL", providerAccountId: email },
        },
      },
      include: { profile: true },
    }));

  const profile =
    user.profile ??
    (await prisma.reviewerProfile.create({
      data: {
        userId: user.id,
        slug: await uniqueSlug(input.displayName),
        displayName: input.displayName.trim(),
      },
    }));

  if (user.profile && user.profile.displayName !== input.displayName.trim()) {
    await prisma.reviewerProfile.update({
      where: { id: profile.id },
      data: { displayName: input.displayName.trim() },
    });
  }

  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId: user.id,
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

  return prisma.reviewerProfile.findUniqueOrThrow({ where: { id: profile.id } });
}
