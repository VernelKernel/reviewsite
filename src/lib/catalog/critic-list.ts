import { slugify } from "../domain/slug";

export type ListedPublication = { name: string; host: string };

export type CriticSearchHit = { id: number; name: string; dist: number | null };

const SKIP_HOSTS = new Set([
  "opencritic.com",
  "metacritic.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
  "facebook.com",
  "instagram.com",
  "twitch.tv",
  "reddit.com",
  "wikipedia.org",
  "store.steampowered.com",
]);

export function hostKey(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

export function archiveCandidates(host: string): string[] {
  const base = `https://${hostKey(host)}`;
  return [`${base}/sitemap_index.xml`, `${base}/wp-sitemap.xml`, `${base}/sitemap.xml`];
}

export function criticSearchHits(payload: unknown): CriticSearchHit[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const id = typeof record.id === "number" ? record.id : Number(record.id);
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!Number.isInteger(id) || id <= 0 || !name) return [];
    const dist = typeof record.dist === "number" ? record.dist : null;
    return [{ id, name, dist }];
  });
}

/** Exact title match only, so a nearby game does not donate its publications. */
export function pickCriticGame(hits: CriticSearchHit[], title: string): CriticSearchHit | null {
  const wanted = slugify(title);
  return hits.find((hit) => slugify(hit.name) === wanted) ?? null;
}

export function publicationsFromCriticList(payload: unknown): ListedPublication[] {
  const items = reviewItems(payload);
  const found = new Map<string, ListedPublication>();
  for (const item of items) {
    const publication = publicationFromReview(item);
    if (!publication || SKIP_HOSTS.has(publication.host)) continue;
    if (!found.has(publication.host)) found.set(publication.host, publication);
  }
  return [...found.values()];
}

export function missingPublications(
  known: { hosts: Set<string>; names: Set<string>; slugs: Set<string> },
  listed: ListedPublication[],
): ListedPublication[] {
  return listed.filter((item) => {
    const slug = slugify(item.name);
    return !known.hosts.has(item.host) && !known.names.has(item.name.toLowerCase()) && !known.slugs.has(slug);
  });
}

function reviewItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const reviews = (payload as { reviews?: unknown }).reviews;
  return Array.isArray(reviews) ? reviews : [];
}

function publicationFromReview(item: unknown): ListedPublication | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const outlet = record.Outlet ?? record.outlet;
  const outletRecord = outlet && typeof outlet === "object" ? (outlet as Record<string, unknown>) : null;
  const name =
    typeof outlet === "string"
      ? outlet.trim()
      : typeof outletRecord?.name === "string"
        ? outletRecord.name.trim()
        : "";
  const rawUrl = firstUrl(record.externalUrl, record.url, outletRecord?.url, outletRecord?.homepage, outletRecord?.externalUrl);
  if (!name || !rawUrl) return null;
  try {
    const host = hostKey(new URL(rawUrl).hostname);
    if (!host || host.endsWith("opencritic.com")) return null;
    return { name, host };
  } catch {
    return null;
  }
}

function firstUrl(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && /^https?:\/\//i.test(value)) return value;
  }
  return "";
}
