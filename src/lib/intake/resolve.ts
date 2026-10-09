import type { WorkType } from "@/generated/prisma/client";
import { parseSteamTitleHits } from "../catalog/parse";
import { SteamLookupError, fetchSteamSearch } from "../catalog/steam-title";
import { prisma } from "../db/client";
import { attachIntakeToWork, ensureSteamWork, markIntake, SteamNotAGame } from "./attach";
import { chooseCandidate, type ChoiceCandidate } from "./choose";
import { decideMatch, type TitleCandidate } from "./match";
import { normalizeTitle, trigramSimilarity } from "./normalize";

type Resolvable = {
  id: string;
  rawTitle: string;
  normalizedTitle: string;
  rawPlatform: string | null;
  rawGenre: string | null;
  enjoyment: "POSITIVE" | "MIXED" | "NEGATIVE";
  execution: "POSITIVE" | "MIXED" | "NEGATIVE";
  completion: "JUST_STARTED" | "EARLY" | "SUBSTANTIAL" | "COMPLETED" | "ENDGAME" | "POST_GAME" | "ABANDONED" | "UNKNOWN";
  reviewBody: string | null;
  judgments: unknown;
  workType: WorkType;
  user: { profile: { id: string } | null };
};

export async function resolvePendingIntakes() {
  const removed = await prisma.intake.deleteMany({
    where: { userId: null, expiresAt: { lt: new Date() } },
  });
  if (removed.count > 0) console.info(`Removed ${removed.count} expired anonymous intakes.`);

  const rows = await prisma.intake.findMany({
    where: { matchStatus: { in: ["PENDING", "AMBIGUOUS"] }, user: { emailVerified: { not: null } } },
    select: { id: true },
  });
  for (const row of rows) {
    try {
      await resolveIntake(row.id);
    } catch (error) {
      console.error(`Intake ${row.id} was left pending: ${error instanceof Error ? error.message : "resolve failed"}`);
    }
  }
}

export async function resolveIntake(intakeId: string): Promise<void> {
  const intake = await prisma.intake.findUnique({
    where: { id: intakeId },
    include: { user: { include: { profile: true } } },
  });
  if (!intake?.user?.emailVerified || !intake.user.profile || !intake.userId) return;
  if (intake.matchStatus === "MATCHED" || intake.matchStatus === "FAILED" || intake.matchStatus === "UNMATCHED") return;

  const resolvable: Resolvable = { ...intake, user: { profile: intake.user.profile } };
  let local: TitleCandidate[] = [];
  try {
    local = await findLocalCandidates(intake.workType, intake.normalizedTitle);
  } catch (error) {
    console.error(`Title search failed: ${error instanceof Error ? error.message : "query failed"}`);
    await markIntake(intake.id, "PENDING", "Title matching will retry.");
    return;
  }

  const decision = decideMatch(intake.normalizedTitle, local);
  if (decision.kind === "match") {
    await safeAttach(resolvable, decision.id);
    return;
  }
  if (decision.kind === "ambiguous") {
    const works = await prisma.work.findMany({
      where: { id: { in: decision.ids } },
      select: { id: true, title: true },
    });
    const titles = new Map(works.map((work) => [work.id, work.title]));
    await chooseAndAttach(
      resolvable,
      decision.ids.map((id) => ({ key: `work:${id}`, label: titles.get(id) ?? id })),
    );
    return;
  }

  if (intake.workType !== "GAME") {
    await markIntake(intake.id, "UNMATCHED", "No catalog title matched.");
    return;
  }

  let hits: { appId: number; title: string }[];
  try {
    hits = await steamHits(intake.normalizedTitle, intake.rawTitle);
  } catch (error) {
    console.error(`Steam lookup failed: ${error instanceof Error ? error.message : "request failed"}`);
    await markIntake(intake.id, "PENDING", "Steam lookup will retry.");
    return;
  }

  const steamDecision = decideMatch(
    intake.normalizedTitle,
    hits.map((hit) => ({
      id: String(hit.appId),
      title: hit.title,
      score: trigramSimilarity(intake.normalizedTitle, normalizeTitle(hit.title)),
    })),
  );
  if (steamDecision.kind === "match") {
    await attachSteam(resolvable, Number(steamDecision.id));
    return;
  }
  if (steamDecision.kind === "ambiguous") {
    const titles = new Map(hits.map((hit) => [String(hit.appId), hit.title]));
    await chooseAndAttach(
      resolvable,
      steamDecision.ids.map((id) => ({ key: `steam:${id}`, label: titles.get(id) ?? id })),
    );
    return;
  }
  await markIntake(intake.id, "UNMATCHED", "No catalog title matched.");
}

async function chooseAndAttach(intake: Resolvable, candidates: ChoiceCandidate[]) {
  const choice = await chooseCandidate({
    rawTitle: intake.rawTitle,
    normalizedTitle: intake.normalizedTitle,
    platform: intake.rawPlatform,
    genre: intake.rawGenre,
    candidates,
  });
  if (choice.status === "skipped") {
    await markIntake(intake.id, "AMBIGUOUS", "A few titles are close. Matching will retry.");
    return;
  }
  if (choice.status !== "chosen") {
    await markIntake(intake.id, "UNMATCHED", "None of the close titles was the same work.");
    return;
  }
  if (choice.key.startsWith("work:")) {
    await safeAttach(intake, choice.key.slice("work:".length));
    return;
  }
  if (choice.key.startsWith("steam:")) {
    const appId = Number(choice.key.slice("steam:".length));
    if (!Number.isInteger(appId)) {
      await markIntake(intake.id, "UNMATCHED", "None of the close titles was the same work.");
      return;
    }
    await attachSteam(intake, appId);
    return;
  }
  await markIntake(intake.id, "UNMATCHED", "None of the close titles was the same work.");
}

async function attachSteam(intake: Resolvable, appId: number) {
  try {
    const workId = await ensureSteamWork(appId);
    await safeAttach(intake, workId);
  } catch (error) {
    if (error instanceof SteamNotAGame) {
      await markIntake(intake.id, "UNMATCHED", "Steam did not return a game for that title.");
      return;
    }
    console.error(`Steam work was not saved: ${error instanceof Error ? error.message : "request failed"}`);
    await markIntake(intake.id, "PENDING", "Steam lookup will retry.");
  }
}

async function safeAttach(intake: Resolvable, workId: string) {
  const reviewerId = intake.user.profile?.id;
  if (!reviewerId) return;
  try {
    await attachIntakeToWork(intake, workId, reviewerId);
  } catch (error) {
    console.error(`Attach will retry: ${error instanceof Error ? error.message : "write failed"}`);
    await markIntake(intake.id, "PENDING", "Saving the review onto the work will retry.");
  }
}

async function findLocalCandidates(workType: WorkType, normalized: string): Promise<TitleCandidate[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string; title: string; score: number }>>`
    SELECT id, title, score FROM (
      SELECT w.id, w.title, similarity(lower(w.title), ${normalized}) AS score
      FROM "Work" w
      WHERE w."workType"::text = ${workType}
        AND w.status::text <> 'ARCHIVED'
        AND similarity(lower(w.title), ${normalized}) > 0.24
      UNION ALL
      SELECT w.id, t.title, similarity(lower(t.title), ${normalized}) AS score
      FROM "WorkTitle" t
      JOIN "Work" w ON w.id = t."workId"
      WHERE w."workType"::text = ${workType}
        AND w.status::text <> 'ARCHIVED'
        AND similarity(lower(t.title), ${normalized}) > 0.24
    ) candidates
    ORDER BY score DESC
    LIMIT 12
  `;
  return rows.map((row) => ({ id: row.id, title: row.title, score: Number(row.score) }));
}

const STEAM_CACHE_VERSION = 2;

async function steamHits(normalized: string, rawTitle: string) {
  const cached = await prisma.steamLookupCache.findUnique({ where: { normalizedTitle: normalized } });
  const cachedPayload = cached ? readVersionedPayload(cached.payload) : null;
  // A finished lookup is kept. Later reviews of the same missing title do not call Steam again.
  if (cachedPayload) return parseSteamTitleHits(cachedPayload).slice(0, 8);
  try {
    const payload = await fetchSteamSearch(rawTitle);
    const stored = { version: STEAM_CACHE_VERSION, payload };
    await prisma.steamLookupCache.upsert({
      where: { normalizedTitle: normalized },
      update: { payload: stored, fetchedAt: new Date() },
      create: { normalizedTitle: normalized, payload: stored, fetchedAt: new Date() },
    });
    return parseSteamTitleHits(payload).slice(0, 8);
  } catch (error) {
    if (error instanceof SteamLookupError) throw error;
    throw new SteamLookupError(error instanceof Error ? error.message : "Steam request failed");
  }
}

function readVersionedPayload(payload: unknown): unknown | null {
  const record = payload !== null && typeof payload === "object" ? (payload as { version?: unknown; payload?: unknown }) : null;
  if (!record || record.version !== STEAM_CACHE_VERSION) return null;
  return record.payload ?? null;
}
