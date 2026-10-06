import { stripHtml } from "./parse";
import type { PlaytimeBucket } from "./evaluation-fields";

export type SteamReview = {
  recommendationId: string;
  steamId: string;
  body: string;
  language: string;
  votedUp: boolean;
  createdAt: number | null;
  playtimeMinutes: number | null;
  steamPurchase: boolean;
  receivedForFree: boolean;
  earlyAccess: boolean;
};

const STORED_REVIEW_LIMIT = 20000;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function minutes(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.floor(number);
}

export function reviewBody(value: string): string {
  const withLinks = value.replace(/\[url=[^\]]+\]([\s\S]*?)\[\/url\]/gi, "$1");
  const withoutTags = withLinks.replace(/\[[^\]]{1,60}\]/g, "");
  return stripHtml(withoutTags).slice(0, STORED_REVIEW_LIMIT);
}

export function steamReviewUrl(steamId: string, appId: number): string {
  return `https://steamcommunity.com/profiles/${steamId}/recommended/${appId}/`;
}

export function steamProfileUrl(steamId: string): string {
  return `https://steamcommunity.com/profiles/${steamId}/`;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parseSteamPersona(xml: string): string | null {
  const match = xml.match(/<steamID><!\[CDATA\[([\s\S]*?)\]\]><\/steamID>/i) ?? xml.match(/<steamID>([^<]+)<\/steamID>/i);
  const name = decodeEntities(match?.[1] ?? "").replace(/\s+/g, " ").trim();
  if (!name || name.length < 2) return null;
  return name.slice(0, 48);
}

export function playtimeBucket(minutesPlayed: number | null): PlaytimeBucket {
  if (minutesPlayed === null) return "UNKNOWN";
  const hours = minutesPlayed / 60;
  if (hours < 1) return "LESS_THAN_ONE_HOUR";
  if (hours < 5) return "ONE_TO_FIVE_HOURS";
  if (hours < 10) return "FIVE_TO_TEN_HOURS";
  if (hours < 20) return "TEN_TO_TWENTY_HOURS";
  if (hours < 50) return "TWENTY_TO_FIFTY_HOURS";
  return "FIFTY_PLUS_HOURS";
}

export function ownershipFromSteam(review: { steamPurchase: boolean; receivedForFree: boolean }): "OWNED" | "FREE" | "OTHER" {
  if (review.receivedForFree) return "FREE";
  if (review.steamPurchase) return "OWNED";
  return "OTHER";
}

export function parseSteamReviews(payload: unknown): SteamReview[] {
  const root = asRecord(payload);
  const reviews = Array.isArray(root?.reviews) ? root.reviews : [];
  const parsed: SteamReview[] = [];
  for (const item of reviews) {
    const record = asRecord(item);
    const author = asRecord(record?.author);
    const steamId = typeof author?.steamid === "string" ? author.steamid : "";
    const raw = typeof record?.review === "string" ? record.review : "";
    const body = reviewBody(raw);
    if (!/^\d{5,20}$/.test(steamId) || body.length === 0) continue;
    const created = Number(record?.timestamp_created);
    parsed.push({
      recommendationId: typeof record?.recommendationid === "string" ? record.recommendationid : String(record?.recommendationid ?? ""),
      steamId,
      body,
      language: typeof record?.language === "string" ? record.language : "",
      votedUp: record?.voted_up === true,
      createdAt: Number.isFinite(created) && created > 0 ? Math.floor(created) : null,
      playtimeMinutes: minutes(author?.playtime_at_review) ?? minutes(author?.playtime_forever),
      steamPurchase: record?.steam_purchase === true,
      receivedForFree: record?.received_for_free === true,
      earlyAccess: record?.written_during_early_access === true,
    });
  }
  return parsed;
}

export function reviewsStillNeeded(existing: number, target: number): number {
  return Math.max(0, target - existing);
}

export function reviewPageState(payload: unknown): { cursor: string | null; total: number | null } {
  const root = asRecord(payload);
  const summary = asRecord(root?.query_summary);
  const totalValue = summary?.total_reviews;
  const total = typeof totalValue === "number" && Number.isFinite(totalValue) ? Math.max(0, Math.floor(totalValue)) : null;
  const reviews = Array.isArray(root?.reviews) ? root.reviews.length : 0;
  const cursor = typeof root?.cursor === "string" ? root.cursor.trim() : "";
  return { cursor: reviews > 0 && cursor.length > 0 ? cursor : null, total };
}

export function selectSteamReviews(reviews: SteamReview[], limit: number, minChars: number): SteamReview[] {
  const chosen: SteamReview[] = [];
  const seen = new Set<string>();
  for (const review of reviews) {
    if (seen.has(review.steamId)) continue;
    if (review.language !== "english") continue;
    if (review.body.length < minChars) continue;
    seen.add(review.steamId);
    chosen.push(review);
    if (chosen.length >= limit) break;
  }
  return chosen;
}
