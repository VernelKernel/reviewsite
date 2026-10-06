import { CONSOLE_PLATFORMS, type ConsolePlatform } from "./config";

export type ConsoleRelease = { platform: ConsolePlatform; date: string };

const PLATFORMS = new Set<string>(CONSOLE_PLATFORMS);

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseConsoleReleases(payload: unknown): Record<number, ConsoleRelease[]> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const releases: Record<number, ConsoleRelease[]> = {};
  for (const [appId, value] of Object.entries(payload)) {
    const id = Number(appId);
    if (!Number.isInteger(id) || id <= 0 || !Array.isArray(value)) continue;
    const rows: ConsoleRelease[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      const platform = "platform" in item ? String(item.platform) : "";
      const date = "date" in item && typeof item.date === "string" ? item.date : "";
      if (!PLATFORMS.has(platform) || !validDate(date)) continue;
      rows.push({ platform: platform as ConsolePlatform, date });
    }
    if (rows.length > 0) releases[id] = rows;
  }
  return releases;
}
