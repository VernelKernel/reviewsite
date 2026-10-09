"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../auth/session";
import { expandOutlets, type ExpandResult } from "../catalog/expand-outlets";
import { prisma } from "../db/client";

export type EnableState = { error?: string; enabled?: number } | null;

async function requireEditor() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return null;
  }
  return user;
}

export async function enableOutletPass(_prev: EnableState, formData: FormData): Promise<EnableState> {
  if (!(await requireEditor())) return { error: "Editors only." };
  const listed = formData.getAll("listed").filter((value): value is string => typeof value === "string");
  const selected = new Set(formData.getAll("workId").filter((value): value is string => typeof value === "string"));
  const works = await prisma.work.findMany({
    where: { id: { in: listed }, workType: "GAME", status: "PUBLISHED" },
    select: { id: true },
  });
  for (const work of works) {
    const enabled = selected.has(work.id);
    await prisma.outletExpansion.upsert({
      where: { workId: work.id },
      create: { workId: work.id, enabled },
      update: { enabled },
    });
  }
  revalidatePath("/admin/outlets");
  return { enabled: works.filter((work) => selected.has(work.id)).length };
}

export async function addMissingPublications(_prev: ExpandResult | null): Promise<ExpandResult> {
  if (!(await requireEditor())) {
    return { error: "Editors only.", checkedGames: 0, unmatched: [], added: [], deferred: 0 };
  }
  const enabled = await prisma.outletExpansion.findMany({ where: { enabled: true }, select: { workId: true } });
  if (enabled.length === 0) {
    return { error: "Enable at least one game first.", checkedGames: 0, unmatched: [], added: [], deferred: 0 };
  }
  const result = await expandOutlets(prisma, enabled.map((item) => item.workId));
  revalidatePath("/admin/outlets");
  return result;
}
