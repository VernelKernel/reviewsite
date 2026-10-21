"use server";

import { redirect } from "next/navigation";
import { DomainError } from "../domain/relations";
import {
  confirmAccountEmail,
  loginWithPassword,
  registerAccount,
  resendAccountVerification,
  resendAccountVerificationFromToken,
} from "./account";
import { safeReturnPath } from "./return-path";
import { closeSession } from "./session";

export type AuthActionState = { error?: string; sent?: boolean; devLink?: string };

function failure(error: unknown, fallback: string): AuthActionState {
  if (error instanceof DomainError) return { error: error.message };
  console.error(`${fallback} ${error instanceof Error ? error.message : "unknown error"}`);
  return { error: fallback };
}

export async function requestSignup(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const result = await registerAccount({
      username: String(formData.get("username") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
      returnPath: safeReturnPath(String(formData.get("next") ?? "")),
    });
    redirect(result.sent ? "/verify" : "/verify?notice=unsent");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error, "The account could not be created. Try again.");
  }
}

export async function requestLogin(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const next = safeReturnPath(String(formData.get("next") ?? ""));
  try {
    const result = await loginWithPassword({
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
      returnPath: next,
    });
    if (result === "unverified") redirect("/verify?notice=unverified");
    redirect(next ?? "/dashboard");
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error, "Sign-in failed. Try again.");
  }
}

export async function confirmAccountEmailAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const next = await confirmAccountEmail(String(formData.get("token") ?? ""));
    redirect(next);
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error, "That link could not be confirmed. Try again.");
  }
}

export async function resendAccountVerificationAction(_previous: AuthActionState, _formData: FormData): Promise<AuthActionState> {
  try {
    const result = await resendAccountVerification();
    if (result.alreadyVerified) redirect("/login");
    if (!result.sent) return { error: "We could not send the email. Try again." };
    return { sent: true, devLink: result.devLink };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error, "We could not send the email. Try again.");
  }
}

export async function resendAccountVerificationFromTokenAction(_previous: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const result = await resendAccountVerificationFromToken(String(formData.get("token") ?? ""));
    if (result.alreadyVerified) redirect("/login");
    if (!result.sent) return { error: "We could not send the email. Try again." };
    return { sent: true, devLink: result.devLink };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return failure(error, "We could not send the email. Try again.");
  }
}

export async function logout() {
  await closeSession();
  redirect("/");
}

function isRedirect(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}
