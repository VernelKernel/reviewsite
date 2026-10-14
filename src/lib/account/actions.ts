"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { closeSession, ensureReviewerProfile, getCurrentUser } from "../auth/session";
import { prisma } from "../db/client";
import { parseDeletionReason } from "./deletion-reasons";
import { deleteUserAccount } from "./delete-user";

export type AccountActionState = { error?: string; saved?: boolean };

export async function updateProfile(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to change these details." };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const bioRaw = String(formData.get("bio") ?? "").trim();
  if (displayName.length < 2 || displayName.length > 48) return { error: "Enter a display name." };
  if (bioRaw.length > 600) return { error: "The biography is too long." };

  const profile = await ensureReviewerProfile(user.id, displayName);
  await prisma.reviewerProfile.update({
    where: { id: profile.id },
    data: { bio: bioRaw.length > 0 ? bioRaw : null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath(`/reviewers/${profile.slug}`);
  return { saved: true };
}

export async function deleteAccount(_previous: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to delete this account." };

  const reason = parseDeletionReason(String(formData.get("reason") ?? ""));
  if (!reason) return { error: "Choose a reason." };
  const otherRaw = String(formData.get("otherText") ?? "").trim();
  if (reason === "OTHER" && (otherRaw.length < 2 || otherRaw.length > 500)) {
    return { error: "Add a short note." };
  }

  await deleteUserAccount({
    userId: user.id,
    reason,
    otherText: reason === "OTHER" ? otherRaw : null,
  });
  await closeSession();
  redirect("/");
}
