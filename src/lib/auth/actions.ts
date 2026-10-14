"use server";

import { redirect } from "next/navigation";
import { DomainError } from "../domain/relations";
import { isValidEmail, normalizeEmail } from "./email";
import { beginLogin, beginSignup, confirmLoginCode, resendLoginCode } from "./login-code";
import { closeSession } from "./session";

export type AuthActionState = { error?: string; unknownEmail?: boolean };

function failure(error: unknown): AuthActionState {
  if (error instanceof DomainError) return { error: error.message };
  console.error(`Sign-in failed: ${error instanceof Error ? error.message : "unknown error"}`);
  return { error: "We could not send the code. Try again." };
}

export async function requestSignup(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length < 2 || displayName.length > 48) return { error: "Enter a display name." };
  if (!isValidEmail(email)) return { error: "Enter a valid email." };

  try {
    const result = await beginSignup(email, displayName);
    redirect(result.existing ? "/verify?notice=existing" : "/verify");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error);
  }
}

export async function requestLogin(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) return { error: "Enter a valid email." };

  try {
    const result = await beginLogin(email);
    if (result === "missing") {
      return { error: "No account for that email.", unknownEmail: true };
    }
    redirect("/verify");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error);
  }
}

export async function submitLoginCode(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    await confirmLoginCode(String(formData.get("code") ?? ""));
    redirect("/dashboard");
  } catch (error) {
    if (isRedirect(error)) throw error;
    if (error instanceof DomainError) return { error: error.message };
    console.error(`Code confirmation failed: ${error instanceof Error ? error.message : "unknown error"}`);
    return { error: "That code could not be confirmed. Try again." };
  }
}

export async function resendLoginCodeAction(_previous: AuthActionState, _formData: FormData): Promise<AuthActionState> {
  try {
    await resendLoginCode();
    return {};
  } catch (error) {
    return failure(error);
  }
}

export async function logout() {
  await closeSession();
  redirect("/");
}

function isRedirect(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
