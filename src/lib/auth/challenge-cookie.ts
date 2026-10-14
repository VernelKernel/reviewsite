import { cookies } from "next/headers";
import { normalizeEmail } from "./email";

export const CHALLENGE_COOKIE = "frame_email_challenge";
const FIFTEEN_MINUTES = 15 * 60;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function writeChallengeCookie(email: string) {
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, email, cookieOptions(FIFTEEN_MINUTES));
}

export async function readChallengeEmail(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(CHALLENGE_COOKIE)?.value;
  if (!value) return null;
  return normalizeEmail(value);
}

export async function clearChallengeCookie() {
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, "", cookieOptions(0));
}
