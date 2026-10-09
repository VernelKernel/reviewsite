import { normalizeTitle } from "./normalize";

export type TitleCandidate = {
  id: string;
  title: string;
  score: number;
};

export type MatchDecision =
  | { kind: "match"; id: string }
  | { kind: "ambiguous"; ids: string[] }
  | { kind: "miss" };

const CLEAR = 0.66;
const GAP = 0.12;
const NEAR = 0.5;

export function decideMatch(normalized: string, candidates: TitleCandidate[]): MatchDecision {
  const byId = new Map<string, TitleCandidate>();
  for (const candidate of candidates) {
    const current = byId.get(candidate.id);
    if (!current || prefer(normalized, candidate, current)) byId.set(candidate.id, candidate);
  }
  const rows = [...byId.values()];
  const exact = rows.filter((row) => normalizeTitle(row.title) === normalized);
  if (exact.length === 1) return { kind: "match", id: exact[0].id };
  if (exact.length > 1) return { kind: "ambiguous", ids: exact.map((row) => row.id) };

  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  if (best && best.score >= CLEAR && (!second || best.score - second.score >= GAP)) {
    return { kind: "match", id: best.id };
  }
  const close = ranked.filter((row) => row.score >= NEAR).slice(0, 5);
  if (close.length >= 2) return { kind: "ambiguous", ids: close.map((row) => row.id) };
  return { kind: "miss" };
}

function prefer(normalized: string, next: TitleCandidate, current: TitleCandidate): boolean {
  const nextExact = normalizeTitle(next.title) === normalized;
  const currentExact = normalizeTitle(current.title) === normalized;
  if (nextExact !== currentExact) return nextExact;
  return next.score > current.score;
}
