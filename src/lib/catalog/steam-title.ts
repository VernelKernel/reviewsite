import { parseAppDetails, parseSteamTitleHits, type AppDetails, type SteamTitleHit } from "./parse";

export class SteamLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SteamLookupError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchSteam(url: string): Promise<unknown> {
  let lastStatus = 0;
  let lastMessage = "Steam request failed";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      lastStatus = response.status;
      if (response.status === 429 || response.status >= 500) {
        lastMessage = `Steam returned ${response.status}`;
        await sleep(500 * 2 ** attempt);
        continue;
      }
      if (!response.ok) throw new SteamLookupError(`Steam returned ${response.status}`);
      return await response.json();
    } catch (error) {
      if (error instanceof SteamLookupError) throw error;
      lastMessage = error instanceof Error ? error.message : "Steam request failed";
      if (attempt === 3) break;
      await sleep(500 * 2 ** attempt);
    }
  }
  throw new SteamLookupError(lastStatus ? `Steam returned ${lastStatus} after retries` : lastMessage);
}

export function steamSearchUrl(title: string): string {
  const params = new URLSearchParams({
    json: "1",
    term: title,
    category1: "998",
    ndl: "1",
    cc: "US",
    l: "english",
    count: "10",
  });
  return `https://store.steampowered.com/search/results/?${params}`;
}

export async function fetchSteamSearch(title: string): Promise<unknown> {
  return fetchSteam(steamSearchUrl(title));
}

export async function searchSteamTitles(title: string): Promise<SteamTitleHit[]> {
  const payload = await fetchSteamSearch(title);
  return parseSteamTitleHits(payload).slice(0, 8);
}

export async function fetchSteamApp(appId: number): Promise<AppDetails | null> {
  const payload = await fetchSteam(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`);
  return parseAppDetails(appId, payload);
}
