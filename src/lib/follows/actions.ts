"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export type FollowState = { error?: string };

export async function setReviewerFollow(_previous: FollowState, formData: FormData): Promise<FollowState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const reviewerId = String(formData.get("reviewerId") ?? "");
  const follow = formData.get("follow") === "1";
  const reviewer = await prisma.reviewerProfile.findUnique({
    where: { id: reviewerId },
    select: { id: true, slug: true, userId: true },
  });
  if (!reviewer) return { error: "That reviewer is not available." };
  if (reviewer.userId === user.id) return { error: "You cannot follow yourself." };

  if (follow) {
    await prisma.followedReviewer.upsert({
      where: { userId_reviewerId: { userId: user.id, reviewerId: reviewer.id } },
      create: { userId: user.id, reviewerId: reviewer.id },
      update: {},
    });
  } else {
    await prisma.followedReviewer.deleteMany({ where: { userId: user.id, reviewerId: reviewer.id } });
  }

  revalidatePath(`/reviewers/${reviewer.slug}`);
  revalidatePath(`/reviewers/${reviewer.slug}/compare`);
  revalidatePath("/dashboard");
  revalidatePath("/games", "layout");
  revalidatePath("/movies", "layout");
  return {};
}
