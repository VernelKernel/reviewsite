import { cookies } from "next/headers";
import { hashToken } from "../auth/session";

export const INTAKE_COOKIE = "frame_intake";
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

export async function readIntakeSecret(): Promise<string | null> {
  const store = await cookies();
  return store.get(INTAKE_COOKIE)?.value ?? null;
}

export async function writeIntakeSecret(secret: string) {
  const store = await cookies();
  store.set(INTAKE_COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS_S,
  });
}

export function secretMatches(secret: string | null, secretHash: string): boolean {
  if (!secret) return false;
  return hashToken(secret) === secretHash;
}
