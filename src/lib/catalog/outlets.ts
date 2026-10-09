import { slugify } from "./parse";
import { tierForPublishers } from "./publishers";

export type OutletKind = "core" | "extra" | "platform" | "specialist" | "indie";

export type OutletLookup = "html" | "sitemap";

export type Outlet = {
  slug: string;
  name: string;
  kind: OutletKind;
  host: string;
  searchUrl: (query: string) => string;
  /** HTML search pages are the default. A sitemap outlet reads its own post archive. */
  lookup: OutletLookup;
  /** Platform slug prefixes. A platform desk is searched only when the game matches one. */
  platforms?: string[];
  /** When set, a result must include this path fragment. */
  pathIncludes?: string;
};

const query = (value: string) => encodeURIComponent(value);

export const OUTLETS: Outlet[] = [
  outlet("ign", "IGN", "core", "www.ign.com", (q) => `https://www.ign.com/search?q=${query(q)}`),
  outlet("gamespot", "GameSpot", "core", "www.gamespot.com", (q) => `https://www.gamespot.com/search/?q=${query(q)}`),
  outlet("pc-gamer", "PC Gamer", "core", "www.pcgamer.com", (q) => `https://www.pcgamer.com/search/?searchTerm=${query(q)}`),
  outlet("polygon", "Polygon", "core", "www.polygon.com", (q) => `https://www.polygon.com/search?q=${query(q)}`),
  outlet("eurogamer", "Eurogamer", "core", "www.eurogamer.net", (q) => `https://www.eurogamer.net/search?q=${query(q)}`),
  outlet("destructoid", "Destructoid", "core", "www.destructoid.com", (q) => `https://www.destructoid.com/?s=${query(q)}`),
  outlet("kotaku", "Kotaku", "core", "kotaku.com", (q) => `https://kotaku.com/search?q=${query(q)}`),
  outlet("gamesradar", "GamesRadar+", "core", "www.gamesradar.com", (q) => `https://www.gamesradar.com/search/?searchTerm=${query(q)}`),
  outlet("vgc", "VGC", "core", "www.videogameschronicle.com", (q) => `https://www.videogameschronicle.com/?s=${query(q)}`),
  outlet("digital-trends", "Digital Trends", "core", "www.digitaltrends.com", (q) => `https://www.digitaltrends.com/?s=${query(q)}`),
  outlet("game-informer", "Game Informer", "extra", "www.gameinformer.com", (q) => `https://www.gameinformer.com/search?keyword=${query(q)}`),
  outlet("push-square", "Push Square", "platform", "www.pushsquare.com", (q) => `https://www.pushsquare.com/search?q=${query(q)}`, ["playstation"]),
  outlet("nintendo-life", "Nintendo Life", "platform", "www.nintendolife.com", (q) => `https://www.nintendolife.com/search?q=${query(q)}`, ["switch"]),
  outlet("pure-xbox", "Pure Xbox", "platform", "www.purexbox.com", (q) => `https://www.purexbox.com/search?q=${query(q)}`, ["xbox"]),
  outlet("edge", "Edge", "specialist", "www.gamesradar.com", (q) => `https://www.gamesradar.com/search/?searchTerm=${query(q)}`, undefined, "/edge"),
  outlet("pcgamesn", "PCGamesN", "specialist", "www.pcgamesn.com", (q) => `https://www.pcgamesn.com/?s=${query(q)}`),
  outlet("techraptor", "TechRaptor", "specialist", "techraptor.net", (q) => `https://techraptor.net/?s=${query(q)}`),
  outlet("rock-paper-shotgun", "Rock Paper Shotgun", "specialist", "www.rockpapershotgun.com", (q) => `https://www.rockpapershotgun.com/?s=${query(q)}`),
  archive("rpgfan", "RPGFan", "specialist", "www.rpgfan.com", "https://www.rpgfan.com/sitemap_index.xml"),
  outlet("shacknews", "Shacknews", "specialist", "www.shacknews.com", (q) => `https://www.shacknews.com/search?q=${query(q)}`),
  outlet(
    "the-escapist",
    "The Escapist",
    "specialist",
    "www.escapistmagazine.com",
    () => "https://www.escapistmagazine.com/wp-sitemap.xml",
    undefined,
    undefined,
    "sitemap",
  ),
  outlet("slant-magazine", "Slant Magazine", "specialist", "www.slantmagazine.com", (q) => `https://www.slantmagazine.com/?s=${query(q)}`),
  outlet("hardcore-gamer", "Hardcore Gamer", "specialist", "hardcoregamer.com", (q) => `https://hardcoregamer.com/?s=${query(q)}`),
  outlet("worthplaying", "WorthPlaying", "specialist", "worthplaying.com", (q) => `https://worthplaying.com/?s=${query(q)}`),
  outlet("mgg", "MGG", "specialist", "www.millenium.gg", (q) => `https://www.millenium.gg/?s=${query(q)}`),
  outlet("konsolifin", "KonsoliFIN", "specialist", "konsolifin.fi", (q) => `https://konsolifin.fi/?s=${query(q)}`),
  archive("indie-game-website", "The Indie Game Website", "indie", "www.indiegamewebsite.com", "https://www.indiegamewebsite.com/sitemap_index.xml"),
  outlet("indie-gamer-chick", "Indie Gamer Chick", "indie", "indiegamerchick.com", (q) => `https://indiegamerchick.com/?s=${query(q)}`),
  archive("rpg-site", "RPG Site", "specialist", "www.rpgsite.net", "https://www.rpgsite.net/sitemap.xml"),
  archive("digitally-downloaded", "Digitally Downloaded", "specialist", "www.digitallydownloaded.net", "https://www.digitallydownloaded.net/wp-sitemap.xml"),
  archive("thesixthaxis", "TheSixthAxis", "specialist", "www.thesixthaxis.com", "https://www.thesixthaxis.com/sitemap_index.xml"),
  archive("cogconnected", "COGconnected", "specialist", "cogconnected.com", "https://cogconnected.com/sitemap_index.xml"),
  archive("cgmagazine", "CGMagazine", "specialist", "www.cgmagonline.com", "https://www.cgmagonline.com/sitemap_index.xml"),
  archive("gamingtrend", "GamingTrend", "specialist", "gamingtrend.com", "https://gamingtrend.com/sitemap.xml"),
  archive("vooks", "Vooks", "platform", "www.vooks.net", "https://www.vooks.net/sitemap_index.xml", ["switch"]),
  archive("pure-nintendo", "Pure Nintendo", "platform", "purenintendo.com", "https://purenintendo.com/sitemap_index.xml", ["switch"]),
];

const INDIE_SLOTS = new Set(["NEW_INDIE", "RECENT_INDIE", "SETTLED_INDIE"]);

export function archiveOutlet(slug: string, name: string, host: string, sitemapUrl: string): Outlet {
  return archive(slug, name, "specialist", host, sitemapUrl);
}

export function mergeOutlets(base: Outlet[], extra: Outlet[]): Outlet[] {
  const seen = new Set(base.map((item) => item.slug));
  return [...base, ...extra.filter((item) => !seen.has(item.slug))];
}

export function outletsForGame(input: { platforms: string[]; slots: string[]; publishers: string[] }): Outlet[] {
  const indie =
    input.slots.some((slot) => INDIE_SLOTS.has(slot)) ||
    (input.slots.length === 0 && tierForPublishers(input.publishers) === "INDIE");
  return OUTLETS.filter((item) => {
    if (item.kind === "core" || item.kind === "extra" || item.kind === "specialist") return true;
    if (item.kind === "indie") return indie;
    return input.platforms.some((platform) =>
      (item.platforms ?? []).some((prefix) => platform === prefix || platform.startsWith(`${prefix}-`)),
    );
  });
}

export function pickReviewLink(html: string, item: Outlet, title: string): string | null {
  const slug = slugify(title);
  const tokens = slug.split("-").filter((token) => token.length > 2);
  let best: { href: string; score: number } | null = null;
  for (const match of html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi)) {
    const href = resolveLink(match[1].replace(/&amp;/g, "&"), item);
    if (!href) continue;
    const path = `${href.pathname}${href.search}`.toLowerCase();
    if (item.pathIncludes && !path.includes(item.pathIncludes)) continue;
    if (isSkippable(path)) continue;
    const score = scorePath(path, slug, tokens);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { href: href.toString(), score };
  }
  return best?.href ?? null;
}

export function sitemapLocations(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => match[1].replace(/&amp;/g, "&"));
}

/**
 * Article archives inside a sitemap index.
 * Yoast uses post-sitemap. WordPress core uses wp-sitemap-posts-post.
 * A few desks publish one articles file instead.
 * News, guides, pages, and tags stay out.
 */
export function postSitemapUrls(indexXml: string): string[] {
  return sitemapLocations(indexXml).filter((url) =>
    /\/(?:post-sitemap\d*|wp-sitemap-posts-post-\d+|sitemap-posts\d*|sitemap\/articles)\.xml(?:\?|$)/i.test(url),
  );
}

/** Locations that are articles. Child sitemap addresses are not articles. */
export function articleLocations(xml: string): string[] {
  return sitemapLocations(xml).filter((url) => !/\.xml(?:\?|#|$)/i.test(url));
}

function archive(
  slug: string,
  name: string,
  kind: OutletKind,
  host: string,
  sitemapUrl: string,
  platforms?: string[],
): Outlet {
  return outlet(slug, name, kind, host, () => sitemapUrl, platforms, undefined, "sitemap");
}

function outlet(
  slug: string,
  name: string,
  kind: OutletKind,
  host: string,
  searchUrl: (query: string) => string,
  platforms?: string[],
  pathIncludes?: string,
  lookup: OutletLookup = "html",
): Outlet {
  return { slug, name, kind, host, searchUrl, lookup, platforms, pathIncludes };
}

function resolveLink(href: string, item: Outlet): URL | null {
  try {
    const url = new URL(href, `https://${item.host}`);
    const host = url.hostname.replace(/^www\./, "");
    const expected = item.host.replace(/^www\./, "");
    if (host !== expected) return null;
    return url;
  } catch {
    return null;
  }
}

function isSkippable(path: string): boolean {
  return /\/(tag|tags|author|authors|category|categories|page|search|video|videos|login|account|newsletter)\b/.test(path);
}

function scorePath(path: string, slug: string, tokens: string[]): number {
  const compact = path.replace(/[^a-z0-9]+/g, "-");
  let score = 0;
  if (slug.length > 3 && compact.includes(slug)) score += 5;
  const hits = tokens.filter((token) => compact.includes(token)).length;
  if (tokens.length > 0 && hits / tokens.length >= 0.6) score += 3;
  else if (hits >= 2) score += 2;
  if (score === 0) return 0;
  if (/\breviews?\b/.test(path)) score += 4;
  if (/\b(news|trailer|preview|guide|walkthrough|tips|product)\b/.test(path)) score -= 3;
  return score;
}
