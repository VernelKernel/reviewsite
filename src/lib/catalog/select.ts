import {
  BUZZ_PLAYERS,
  BUZZ_REVIEWS,
  CAMPAIGN_FLOOR,
  CONSOLE_PLATFORMS,
  GENRE_CAP,
  NEWEST_DAYS,
  RECENT_END_DAYS,
  RECENT_START_DAYS,
  SETTLED_END_DAYS,
  SETTLED_START_DAYS,
  SLOT_QUOTAS,
  WIDEN_DAYS,
  WIDEN_LIMIT,
  type Slot,
  type Tier,
} from "./config";
import { addDays } from "./dates";
import { isCanonicalGenre } from "./genres";

export type Candidate = {
  steamAppId: number;
  releasedOn: string;
  tier: Tier;
  primaryGenre: string;
  reviewCount: number;
  currentPlayers: number;
  platforms: string[];
};

export type Placement = {
  steamAppId: number;
  slot: Slot;
  primaryGenre: string;
  windowWidened: boolean;
  buzzMet: boolean | null;
  releasedOn: string;
};

export type Shortfall = { slot: Slot; missing: number };

export type SelectionInput = {
  anchor: string;
  floor?: string;
  candidates: Candidate[];
  excludedAppIds?: number[];
  catalogGenreCounts?: Record<string, number>;
};

export type Selection = {
  placements: Placement[];
  shortfalls: Shortfall[];
  nextAnchor: string;
  campaignComplete: boolean;
};

export type DiscoveryBand = "new" | "recent" | "settled" | "campaign";

const CONSOLES = new Set<string>(CONSOLE_PLATFORMS);

const SLOT_TIER: Partial<Record<Slot, Tier>> = {
  NEW_AAA: "AAA",
  NEW_INDIE: "INDIE",
  RECENT_AAA: "AAA",
  RECENT_AA: "AA",
  RECENT_INDIE: "INDIE",
  SETTLED_AAA: "AAA",
  SETTLED_AA: "AA",
  SETTLED_INDIE: "INDIE",
};

const FILL_ORDER: Slot[] = [
  "NEW_AAA",
  "NEW_INDIE",
  "RECENT_AAA",
  "RECENT_AA",
  "RECENT_INDIE",
  "SETTLED_AAA",
  "SETTLED_AA",
  "SETTLED_INDIE",
  "MULTIPLATFORM",
  "GENRE_DEBT",
];

type Window = { start: string; end: string };

export function meetsBuzz(candidate: Pick<Candidate, "reviewCount" | "currentPlayers">): boolean {
  return candidate.reviewCount >= BUZZ_REVIEWS || candidate.currentPlayers >= BUZZ_PLAYERS;
}

export function isMultiplatform(platforms: string[]): boolean {
  return platforms.includes("pc") && platforms.some((platform) => CONSOLES.has(platform));
}

function unclipped(slot: Slot, anchor: string, floor: string): Window {
  if (slot === "NEW_AAA" || slot === "NEW_INDIE") return { start: addDays(anchor, -NEWEST_DAYS), end: anchor };
  if (slot === "RECENT_AAA" || slot === "RECENT_AA" || slot === "RECENT_INDIE") {
    return { start: addDays(anchor, -RECENT_END_DAYS), end: addDays(anchor, -RECENT_START_DAYS) };
  }
  if (slot === "SETTLED_AAA" || slot === "SETTLED_AA" || slot === "SETTLED_INDIE") {
    return { start: addDays(anchor, -SETTLED_END_DAYS), end: addDays(anchor, -SETTLED_START_DAYS) };
  }
  return { start: floor, end: anchor };
}

export function slotWindow(slot: Slot, anchor: string, floor: string, widen = 0): Window | null {
  const base = unclipped(slot, anchor, floor);
  const start = addDays(base.start, -WIDEN_DAYS * widen);
  const end = addDays(base.end, WIDEN_DAYS * widen);
  const clippedStart = start < floor ? floor : start;
  const clippedEnd = end > anchor ? anchor : end;
  if (clippedStart > clippedEnd) return null;
  return { start: clippedStart, end: clippedEnd };
}

function inWindow(date: string, window: Window | null): boolean {
  return window !== null && date >= window.start && date <= window.end;
}

export function discoveryBand(releasedOn: string, anchor: string, floor = CAMPAIGN_FLOOR): DiscoveryBand | null {
  if (releasedOn < floor || releasedOn > anchor) return null;
  if (inWindow(releasedOn, slotWindow("NEW_AAA", anchor, floor))) return "new";
  if (inWindow(releasedOn, slotWindow("RECENT_AAA", anchor, floor))) return "recent";
  if (inWindow(releasedOn, slotWindow("SETTLED_AAA", anchor, floor))) return "settled";
  return "campaign";
}

export function sampleSpread<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  const picked: T[] = [];
  const seen = new Set<number>();
  for (let index = 0; index < limit; index += 1) {
    const at = Math.min(items.length - 1, Math.floor((index * items.length) / limit));
    if (seen.has(at)) continue;
    seen.add(at);
    picked.push(items[at]);
  }
  return picked;
}

function byDateDesc(a: Candidate, b: Candidate): number {
  if (a.releasedOn !== b.releasedOn) return a.releasedOn < b.releasedOn ? 1 : -1;
  return a.steamAppId - b.steamAppId;
}

function byBuzz(a: Candidate, b: Candidate): number {
  if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
  if (a.currentPlayers !== b.currentPlayers) return b.currentPlayers - a.currentPlayers;
  return byDateDesc(a, b);
}

export function selectCatalogBatch(input: SelectionInput): Selection {
  const floor = input.floor ?? CAMPAIGN_FLOOR;
  const anchor = input.anchor;
  const excluded = new Set(input.excludedAppIds ?? []);
  const seen = new Set<number>();
  const pool = input.candidates.filter((candidate) => {
    if (excluded.has(candidate.steamAppId) || seen.has(candidate.steamAppId)) return false;
    seen.add(candidate.steamAppId);
    if (candidate.releasedOn < floor || candidate.releasedOn > anchor) return false;
    return isCanonicalGenre(candidate.primaryGenre);
  });

  const chosen = new Set<number>();
  const batchGenreCounts: Record<string, number> = {};
  const catalogCounts = { ...(input.catalogGenreCounts ?? {}) };
  const placements: Placement[] = [];
  const shortfalls: Shortfall[] = [];

  function place(candidate: Candidate, slot: Slot, windowWidened: boolean, buzzMet: boolean | null) {
    chosen.add(candidate.steamAppId);
    batchGenreCounts[candidate.primaryGenre] = (batchGenreCounts[candidate.primaryGenre] ?? 0) + 1;
    placements.push({
      steamAppId: candidate.steamAppId,
      slot,
      primaryGenre: candidate.primaryGenre,
      windowWidened,
      buzzMet,
      releasedOn: candidate.releasedOn,
    });
  }

  function eligible(candidate: Candidate): boolean {
    return !chosen.has(candidate.steamAppId) && (batchGenreCounts[candidate.primaryGenre] ?? 0) < GENRE_CAP;
  }

  function fillDated(slot: Slot) {
    const tier = SLOT_TIER[slot];
    const quota = SLOT_QUOTAS[slot];
    const base = slotWindow(slot, anchor, floor, 0);
    let picked = 0;
    let widen = 0;
    while (picked < quota && widen <= WIDEN_LIMIT) {
      const window = slotWindow(slot, anchor, floor, widen);
      if (window && tier) {
        const matches = pool
          .filter((candidate) => eligible(candidate) && candidate.tier === tier && inWindow(candidate.releasedOn, window))
          .filter((candidate) => slot !== "NEW_INDIE" || meetsBuzz(candidate))
          .sort(slot === "NEW_INDIE" ? byBuzz : byDateDesc);
        for (const candidate of matches) {
          if (picked >= quota) break;
          if (!eligible(candidate)) continue;
          place(candidate, slot, widen > 0, slot === "NEW_INDIE" ? true : null);
          picked += 1;
        }
      }
      if (picked >= quota || widen === WIDEN_LIMIT) break;
      widen += 1;
    }
    if (slot === "NEW_INDIE" && picked < quota) {
      const fallbackWindow = slotWindow(slot, anchor, floor, WIDEN_LIMIT);
      const matches = pool
        .filter(
          (candidate) =>
            eligible(candidate) &&
            candidate.tier === "INDIE" &&
            inWindow(candidate.releasedOn, fallbackWindow) &&
            !meetsBuzz(candidate),
        )
        .sort(byBuzz);
      for (const candidate of matches) {
        if (picked >= quota) break;
        if (!eligible(candidate)) continue;
        const widened = base === null || candidate.releasedOn < base.start || candidate.releasedOn > base.end;
        place(candidate, slot, widened, false);
        picked += 1;
      }
    }
    if (picked < quota) shortfalls.push({ slot, missing: quota - picked });
  }

  function fillMulti() {
    const quota = SLOT_QUOTAS.MULTIPLATFORM;
    const window = slotWindow("MULTIPLATFORM", anchor, floor, 0);
    const matches = pool
      .filter((candidate) => eligible(candidate) && isMultiplatform(candidate.platforms) && inWindow(candidate.releasedOn, window))
      .sort(byDateDesc);
    let picked = 0;
    for (const candidate of matches) {
      if (picked >= quota) break;
      if (!eligible(candidate)) continue;
      place(candidate, "MULTIPLATFORM", false, null);
      picked += 1;
    }
    if (picked < quota) shortfalls.push({ slot: "MULTIPLATFORM", missing: quota - picked });
  }

  function fillDebt() {
    const quota = SLOT_QUOTAS.GENRE_DEBT;
    const window = slotWindow("GENRE_DEBT", anchor, floor, 0);
    let picked = 0;
    for (let index = 0; index < quota; index += 1) {
      const matches = pool.filter((candidate) => eligible(candidate) && inWindow(candidate.releasedOn, window));
      if (matches.length === 0) break;
      const genres = [...new Set(matches.map((candidate) => candidate.primaryGenre))].sort((left, right) => {
        const thinLeft = (catalogCounts[left] ?? 0) + (batchGenreCounts[left] ?? 0);
        const thinRight = (catalogCounts[right] ?? 0) + (batchGenreCounts[right] ?? 0);
        if (thinLeft !== thinRight) return thinLeft - thinRight;
        return left.localeCompare(right);
      });
      const genre = genres[0];
      const candidate = matches.filter((item) => item.primaryGenre === genre).sort(byDateDesc)[0];
      if (!candidate) break;
      place(candidate, "GENRE_DEBT", false, null);
      picked += 1;
    }
    if (picked < quota) shortfalls.push({ slot: "GENRE_DEBT", missing: quota - picked });
  }

  for (const slot of FILL_ORDER) {
    if (slot === "MULTIPLATFORM") fillMulti();
    else if (slot === "GENRE_DEBT") fillDebt();
    else fillDated(slot);
  }

  const newest = placements.filter((placement) => placement.slot === "NEW_AAA" || placement.slot === "NEW_INDIE");
  let nextAnchor = addDays(anchor, -NEWEST_DAYS);
  if (newest.length > 0) {
    const earliest = [...newest].sort((left, right) => (left.releasedOn < right.releasedOn ? -1 : 1))[0].releasedOn;
    const dayBefore = addDays(earliest, -1);
    if (dayBefore < nextAnchor) nextAnchor = dayBefore;
  }

  return {
    placements,
    shortfalls,
    nextAnchor,
    campaignComplete: nextAnchor <= floor,
  };
}
