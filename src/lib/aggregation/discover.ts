import { enjoymentExecutionGap, type ReviewLandscape } from "./landscape";
import { workHref } from "../domain/labels";

export type DiscoverWork = {
  title: string;
  slug: string;
  workType: string;
  landscape: ReviewLandscape;
};

export type ShelfWork = {
  href: string;
  title: string;
  slug: string;
  workType: string;
  note: string;
  sampleSize: number;
};

export type EvidenceShelf = {
  id: "apart" | "divided" | "standards";
  title: string;
  description: string;
  works: ShelfWork[];
};

const MIN_SAMPLE = 4;
const GAP_POINTS = 20;
const DIVIDED_SCORE = 0.34;

function disagreementScore(landscape: ReviewLandscape): number {
  if (landscape.sampleSize < MIN_SAMPLE) return -1;
  const counts = [landscape.execution.positive, landscape.execution.mixed, landscape.execution.negative];
  const max = Math.max(...counts);
  return 1 - max / landscape.sampleSize;
}

function shelfWork(work: DiscoverWork, note: string): ShelfWork {
  return {
    href: workHref(work.workType, work.slug),
    title: work.title,
    slug: work.slug,
    workType: work.workType,
    note,
    sampleSize: work.landscape.sampleSize,
  };
}

function sampleLine(count: number): string {
  return `Based on ${count} evals.`;
}

export function evidenceShelves(works: DiscoverWork[]): EvidenceShelf[] {
  const eligible = works.filter((work) => work.landscape.sampleSize >= MIN_SAMPLE);

  const apart = eligible
    .map((work) => ({ work, gap: enjoymentExecutionGap(work.landscape) }))
    .filter((item): item is { work: DiscoverWork; gap: number } => item.gap !== null && Math.abs(item.gap) >= GAP_POINTS)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap) || a.work.title.localeCompare(b.work.title))
    .map(({ work, gap }) => {
      const points = Math.abs(gap);
      const direction =
        gap > 0
          ? `Enjoyment runs ${points} points ahead of execution.`
          : `Execution runs ${points} points ahead of enjoyment.`;
      return shelfWork(work, `${direction} ${sampleLine(work.landscape.sampleSize)}`);
    });

  const divided = eligible
    .map((work) => ({ work, score: disagreementScore(work.landscape) }))
    .filter((item) => item.score >= DIVIDED_SCORE)
    .sort((a, b) => b.score - a.score || a.work.title.localeCompare(b.work.title))
    .map(({ work }) =>
      shelfWork(
        work,
        `Execution judgments do not gather around a single stance. ${sampleLine(work.landscape.sampleSize)}`,
      ),
    );

  const standardsLine = "Reviewers who adjusted their expectations and reviewers who did not describe execution differently.";
  const standards = eligible
    .filter((work) => work.landscape.disagreement.some((line) => line.includes("expectations")))
    .sort((a, b) => b.landscape.sampleSize - a.landscape.sampleSize || a.title.localeCompare(b.title))
    .map((work) => shelfWork(work, `${standardsLine} ${sampleLine(work.landscape.sampleSize)}`));

  return [
    {
      id: "apart",
      title: "Enjoyment and execution come apart",
      description: `Works in this set where the share of positive enjoyment and the share of positive execution differ by at least ${GAP_POINTS} points. A work needs ${MIN_SAMPLE} or more evaluations to be included.`,
      works: apart,
    },
    {
      id: "divided",
      title: "Execution is divided",
      description: `Works in this set where no single execution stance holds the evaluations together. A work needs ${MIN_SAMPLE} or more evaluations to be included.`,
      works: divided,
    },
    {
      id: "standards",
      title: "Standards change the reading",
      description:
        "Works in this set where reviewers who adjusted their expectations and reviewers who did not describe execution differently.",
      works: standards,
    },
  ];
}
