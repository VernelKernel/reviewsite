"use server";

import { prisma } from "../db/client";
import { getCurrentUser } from "../auth/session";
import { isColorMode, isThemeId } from "@/design-system/theme-types";

export async function saveAppearance(mood: string, mode: string): Promise<void> {
  if (!isThemeId(mood) || !isColorMode(mode)) return;
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, theme: mood, colorMode: mode },
    update: { theme: mood, colorMode: mode },
  });
}
