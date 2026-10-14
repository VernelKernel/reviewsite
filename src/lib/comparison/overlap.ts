import type { StanceValue } from "@/lib/aggregation/landscape";
import type { PlacementJudgment } from "./placement";

export type OverlapEvaluation = {
  reviewerId: string;
  workId: string;
  title: string;
  workType: string;
  workSlug: string;
  reviewerSlug: string;
  enjoyment: StanceValue;
  execution: StanceValue;
  lens: string | null;
  standard: string | null;
  judgments: PlacementJudgment[];
};

export type OverlapFilter = {
  lens?: string;
  standard?: string;
};

export type ShelfWork = {
  workId: string;
  title: string;
  workType: string;
  workSlug: string;
  reviewerSlug: string;
};

export type SharedWork = {
  workId: string;
  title: string;
  workType: string;
  workSlug: string;
  yourSlug: string;
  theirSlug: string;
  enjoymentMatches: boolean;
  executionMatches: boolean;
  enjoymentLine: string;
  executionLine: string;
  dimensionLines: string[];
};

export type ReviewerOverlap = {
  shared: SharedWork[];
  onlyYou: ShelfWork[];
  onlyThem: ShelfWork[];
  summary: string;
};

export function compareReviewers(yours: OverlapEvaluation[], theirs: OverlapEvaluation[], filter: OverlapFilter = {}): ReviewerOverlap {
  const yourRows = yours.filter((row) => matches(row, filter));
  const theirRows = theirs.filter((row) => matches(row, filter));
  const yourByWork = new Map(yourRows.map((row) => [row.workId, row]));
  const theirByWork = new Map(theirRows.map((row) => [row.workId, row]));
  const shared: SharedWork[] = [];
  const onlyYou: ShelfWork[] = [];
  const onlyThem: ShelfWork[] = [];

  for (const row of yourRows) {
    const other = theirByWork.get(row.workId);
    if (!other) {
      onlyYou.push(shelf(row));
      continue;
    }
    shared.push(sharedRow(row, other));
  }
  for (const row of theirRows) {
    if (!yourByWork.has(row.workId)) onlyThem.push(shelf(row));
  }

  const byTitle = (left: { title: string }, right: { title: string }) => left.title.localeCompare(right.title);
  shared.sort(byTitle);
  onlyYou.sort(byTitle);
  onlyThem.sort(byTitle);
  const enjoymentMatches = shared.filter((row) => row.enjoymentMatches).length;
  const executionMatches = shared.filter((row) => row.executionMatches).length;
  return {
    shared,
    onlyYou,
    onlyThem,
    summary: overlapSummary(shared.length, enjoymentMatches, executionMatches),
  };
}

export function overlapSummary(sharedCount: number, enjoymentMatches: number, executionMatches: number): string {
  if (sharedCount === 0) return "No works in common.";
  const works = sharedCount === 1 ? "1 work in common" : `${sharedCount} works in common`;
  return `${works}. Enjoyment matches on ${enjoymentMatches}. Execution matches on ${executionMatches}.`;
}

function matches(row: OverlapEvaluation, filter: OverlapFilter): boolean {
  if (filter.lens && row.lens !== filter.lens) return false;
  if (filter.standard && row.standard !== filter.standard) return false;
  return true;
}

function shelf(row: OverlapEvaluation): ShelfWork {
  return {
    workId: row.workId,
    title: row.title,
    workType: row.workType,
    workSlug: row.workSlug,
    reviewerSlug: row.reviewerSlug,
  };
}

function sharedRow(yours: OverlapEvaluation, theirs: OverlapEvaluation): SharedWork {
  const enjoymentMatches = yours.enjoyment === theirs.enjoyment;
  const executionMatches = yours.execution === theirs.execution;
  const dimensionLines = yours.judgments.flatMap((judgment) => {
    const other = theirs.judgments.find((item) => item.slug === judgment.slug);
    if (!other || other.stance === judgment.stance) return [];
    return [`${judgment.name}: you are ${judgment.stance.toLowerCase()}, they are ${other.stance.toLowerCase()}.`];
  });
  return {
    workId: yours.workId,
    title: yours.title,
    workType: yours.workType,
    workSlug: yours.workSlug,
    yourSlug: yours.reviewerSlug,
    theirSlug: theirs.reviewerSlug,
    enjoymentMatches,
    executionMatches,
    enjoymentLine: fieldLine("Enjoyment", enjoymentMatches, yours.enjoyment, theirs.enjoyment),
    executionLine: fieldLine("Execution", executionMatches, yours.execution, theirs.execution),
    dimensionLines,
  };
}

function fieldLine(label: string, matchesStance: boolean, yours: StanceValue, theirs: StanceValue): string {
  if (matchesStance) return `${label} matches.`;
  return `${label} differs: you are ${yours.toLowerCase()}, they are ${theirs.toLowerCase()}.`;
}
