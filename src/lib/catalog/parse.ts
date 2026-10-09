import { parseSteamDate } from "./dates";

export type ReviewSummary = {
  label: string;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
};

export type AppDetails = {
  steamAppId: number;
  title: string;
  synopsis: string;
  headerImage: string | null;
  developers: string[];
  publishers: string[];
  releasedOn: string | null;
  comingSoon: boolean;
  type: string;
  genres: string[];
  categories: string[];
  windows: boolean;
};

export type SearchHit = { appId: number; releasedOn: string | null; tagIds: number[] };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function count(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.floor(number);
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function descriptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      return typeof record?.description === "string" ? record.description.trim() : "";
    })
    .filter((item) => item.length > 0);
}

export function stripHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseReviewSummary(payload: unknown): ReviewSummary | null {
  const root = asRecord(payload);
  const summary = asRecord(root?.query_summary);
  if (!summary) return null;
  const label = typeof summary.review_score_desc === "string" ? summary.review_score_desc.trim() : "";
  return {
    label: label.length > 0 ? label : "No user reviews",
    positiveCount: count(summary.total_positive),
    negativeCount: count(summary.total_negative),
    totalCount: count(summary.total_reviews),
  };
}

export function parsePlayerCount(payload: unknown): number {
  const response = asRecord(asRecord(payload)?.response);
  return count(response?.player_count);
}

export type SteamTitleHit = { appId: number; title: string };

export function parseSteamTitleHits(payload: unknown): SteamTitleHit[] {
  const root = asRecord(payload);
  const fromItems = steamItems(root);
  if (fromItems.length > 0) return fromItems;
  const html = typeof root?.results_html === "string" ? root.results_html : "";
  const hits: SteamTitleHit[] = [];
  const seen = new Set<number>();
  const anchors = html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi);
  for (const anchor of anchors) {
    const tag = anchor[1] ?? "";
    const inner = anchor[2] ?? "";
    if (!tag.includes("search_result_row")) continue;
    const idMatch = `${tag} ${inner}`.match(/data-ds-appid="(\d+)"/);
    const titleMatch = inner.match(/<span class="title">([^<]*)<\/span>/i);
    if (!idMatch || !titleMatch) continue;
    const appId = Number(idMatch[1]);
    const title = decodeSteamText(titleMatch[1] ?? "").trim();
    if (!Number.isInteger(appId) || appId <= 0 || !title || seen.has(appId)) continue;
    seen.add(appId);
    hits.push({ appId, title });
  }
  return hits;
}

function steamItems(root: Record<string, unknown> | null): SteamTitleHit[] {
  if (!root || !Array.isArray(root.items)) return [];
  const hits: SteamTitleHit[] = [];
  const seen = new Set<number>();
  for (const item of root.items) {
    const record = asRecord(item);
    const title = typeof record?.name === "string" ? record.name.trim() : "";
    const logo = typeof record?.logo === "string" ? record.logo : "";
    const idMatch = logo.match(/\/apps\/(\d+)\//);
    const appId = idMatch ? Number(idMatch[1]) : 0;
    if (!Number.isInteger(appId) || appId <= 0 || !title || seen.has(appId)) continue;
    seen.add(appId);
    hits.push({ appId, title });
  }
  return hits;
}

function decodeSteamText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseSearchPage(payload: unknown): { hits: SearchHit[]; total: number | null } {
  const root = asRecord(payload);
  const html = typeof root?.results_html === "string" ? root.results_html : "";
  const total = typeof root?.total_count === "number" ? root.total_count : null;
  if (!html) return { hits: [], total };
  const hits: SearchHit[] = [];
  const seen = new Set<number>();
  const rows = html.matchAll(/data-ds-appid="(\d+)"([\s\S]*?)search_released[^>]*>\s*([^<]*?)\s*</g);
  for (const row of rows) {
    const appId = Number(row[1]);
    if (seen.has(appId)) continue;
    seen.add(appId);
    const tags = row[2].match(/data-ds-tagids="\[([0-9,]+)\]"/);
    const tagIds = tags ? tags[1].split(",").map(Number).filter((id) => Number.isInteger(id)) : [];
    hits.push({ appId, releasedOn: parseSteamDate(row[3]), tagIds });
  }
  return { hits, total };
}

export function parsePopularTags(payload: unknown): Map<number, string> {
  if (!Array.isArray(payload)) return new Map();
  const tags = new Map<number, string>();
  for (const item of payload) {
    const record = asRecord(item);
    const id = Number(record?.tagid);
    const name = typeof record?.name === "string" ? record.name.trim() : "";
    if (Number.isInteger(id) && name) tags.set(id, name);
  }
  return tags;
}

export function parseAppDetails(appId: number, payload: unknown): AppDetails | null {
  const root = asRecord(payload);
  if (!root) return null;
  const envelope = asRecord(root[String(appId)]);
  const data = asRecord(envelope?.data) ?? (typeof root.name === "string" ? root : null);
  if (!data || envelope?.success === false) return null;
  const release = asRecord(data.release_date);
  const platforms = asRecord(data.platforms);
  const title = typeof data.name === "string" ? data.name.trim() : "";
  if (!title) return null;
  const synopsis = typeof data.short_description === "string" ? stripHtml(data.short_description) : "";
  const header = typeof data.header_image === "string" ? data.header_image : null;
  return {
    steamAppId: appId,
    title,
    synopsis,
    headerImage: header,
    developers: strings(data.developers),
    publishers: strings(data.publishers),
    releasedOn: typeof release?.date === "string" ? parseSteamDate(release.date) : null,
    comingSoon: release?.coming_soon === true,
    type: typeof data.type === "string" ? data.type : "",
    genres: descriptions(data.genres),
    categories: descriptions(data.categories),
    windows: platforms?.windows === true,
  };
}

export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug.length > 0 ? slug : "work";
}
