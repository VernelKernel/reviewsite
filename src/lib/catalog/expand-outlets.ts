import type { PrismaClient } from "../../generated/prisma/client";
import { slugify } from "../domain/slug";
import {
  archiveCandidates,
  criticSearchHits,
  hostKey,
  missingPublications,
  pickCriticGame,
  publicationsFromCriticList,
  type ListedPublication,
} from "./critic-list";
import { OUTLETS, postSitemapUrls } from "./outlets";

const RAPID_HOST = "opencritic-api.p.rapidapi.com";
const REVIEW_PAGE = 20;
const REVIEW_PAGE_CAP = 8;
const PROBE_BUDGET = 12;

export type ExpandResult = {
  error?: string;
  checkedGames: number;
  unmatched: string[];
  added: { name: string; host: string; archive: boolean }[];
  deferred: number;
};

type TrackedRow = {
  id: string;
  slug: string;
  name: string;
  host: string;
  lookup: string;
  archiveUrl: string | null;
  archiveChecked: boolean;
};

export async function expandOutlets(db: PrismaClient, workIds: string[], env: NodeJS.ProcessEnv = process.env): Promise<ExpandResult> {
  const works = await db.work.findMany({
    where: { id: { in: workIds }, workType: "GAME", status: "PUBLISHED" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
  const tracked = await db.trackedOutlet.findMany();
  const known = knownPublications(tracked);
  const unmatched: string[] = [];
  const discovered = new Map<string, ListedPublication>();
  const key = env.OPENCRITIC_API_KEY?.trim() ?? "";

  if (!key && works.length > 0) {
    return {
      error: "Set OPENCRITIC_API_KEY to read a critic list. No publications were added.",
      checkedGames: works.length,
      unmatched,
      added: [],
      deferred: 0,
    };
  }

  for (const work of works) {
    let hits: ReturnType<typeof criticSearchHits> = [];
    try {
      hits = criticSearchHits(await criticGet(`/game/search?criteria=${encodeURIComponent(work.title)}`, key));
    } catch (error) {
      unmatched.push(work.title);
      console.error(`${work.title} · critic search failed: ${error instanceof Error ? error.message : "request failed"}`);
      continue;
    }
    const match = pickCriticGame(hits, work.title);
    if (!match) {
      unmatched.push(work.title);
      continue;
    }
    try {
      const listed = publicationsFromCriticList(await criticReviews(match.id, key));
      for (const item of missingPublications(known, listed)) {
        if (!discovered.has(item.host)) discovered.set(item.host, item);
      }
      for (const item of listed) remember(known, item);
    } catch (error) {
      unmatched.push(work.title);
      console.error(`${work.title} · critic list failed: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  const added: ExpandResult["added"] = [];
  for (const item of discovered.values()) {
    const slug = await uniqueSlug(db, slugify(item.name), item.host);
    await db.trackedOutlet.create({
      data: { slug, name: item.name, host: item.host, lookup: "unresolved", archiveChecked: false },
    });
    remember(known, item);
    known.slugs.add(slug);
    added.push({ name: item.name, host: item.host, archive: false });
  }

  const pending = await db.trackedOutlet.findMany({
    where: { archiveChecked: false },
    orderBy: { createdAt: "asc" },
  });
  let probes = 0;
  for (const row of pending) {
    if (probes >= PROBE_BUDGET) break;
    const archiveUrl = await findArchive(row.host);
    probes += 1;
    const archive = Boolean(archiveUrl);
    await db.trackedOutlet.update({
      where: { id: row.id },
      data: { archiveChecked: true, lookup: archive ? "sitemap" : "unresolved", archiveUrl },
    });
    const listed = added.find((item) => item.host === row.host);
    if (listed) listed.archive = archive;
  }

  return {
    checkedGames: works.length,
    unmatched,
    added,
    deferred: pending.length > probes ? pending.length - probes : 0,
  };
}

function knownPublications(tracked: TrackedRow[]) {
  const hosts = new Set<string>();
  const names = new Set<string>();
  const slugs = new Set<string>();
  for (const outlet of OUTLETS) {
    hosts.add(hostKey(outlet.host));
    names.add(outlet.name.toLowerCase());
    slugs.add(outlet.slug);
  }
  for (const outlet of tracked) {
    hosts.add(hostKey(outlet.host));
    names.add(outlet.name.toLowerCase());
    slugs.add(outlet.slug);
  }
  return { hosts, names, slugs };
}

function remember(known: { hosts: Set<string>; names: Set<string>; slugs: Set<string> }, item: ListedPublication) {
  known.hosts.add(item.host);
  known.names.add(item.name.toLowerCase());
  known.slugs.add(slugify(item.name));
}

async function uniqueSlug(db: PrismaClient, base: string, host: string): Promise<string> {
  let slug = base || "outlet";
  const taken = async (value: string) =>
    OUTLETS.some((item) => item.slug === value) || Boolean(await db.trackedOutlet.findUnique({ where: { slug: value } }));
  if (!(await taken(slug))) return slug;
  const suffix = host.split(".")[0]?.replace(/[^a-z0-9]+/g, "") || "outlet";
  slug = `${base}-${suffix}`;
  let count = 2;
  while (await taken(slug)) {
    slug = `${base}-${suffix}-${count}`;
    count += 1;
  }
  return slug;
}

async function criticReviews(id: number, key: string): Promise<unknown[]> {
  const reviews: unknown[] = [];
  for (let page = 0; page < REVIEW_PAGE_CAP; page += 1) {
    const payload = await criticGet(`/reviews/game/${id}?skip=${page * REVIEW_PAGE}`, key);
    const items = publicationsPage(payload);
    reviews.push(...items);
    if (items.length < REVIEW_PAGE) break;
    await sleep(200);
  }
  return reviews;
}

function publicationsPage(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const reviews = (payload as { reviews?: unknown }).reviews;
  return Array.isArray(reviews) ? reviews : [];
}

async function criticGet(path: string, key: string): Promise<unknown> {
  const response = await fetch(`https://${RAPID_HOST}${path}`, {
    headers: {
      Accept: "application/json",
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": RAPID_HOST,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} for ${path}`);
  return response.json();
}

async function findArchive(host: string): Promise<string | null> {
  for (const url of archiveCandidates(host)) {
    await sleep(250);
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/xml,text/xml", "User-Agent": "FrameCatalog/0.1 (outlet archive)" },
        redirect: "follow",
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) continue;
      const xml = await response.text();
      if (postSitemapUrls(xml).length > 0) return url;
    } catch {
      continue;
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
