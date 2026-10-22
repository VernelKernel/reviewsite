import { splitLandscapes, type PopulatedEvaluation, type StanceValue } from "@/lib/aggregation/landscape";

/** Illustrative readings for the share-card mockup. Not catalog data. */

const DIMENSIONS = [
  ["gameplay", "Gameplay", 1],
  ["story", "Story", 2],
  ["music", "Music", 3],
  ["art-direction", "Art direction", 4],
  ["technical-quality", "Technical quality", 5],
  ["controls", "Controls", 7],
  ["atmosphere", "Atmosphere", 8],
  ["game-design", "Game Design", 9],
] as const;

type Mark = "P" | "M" | "N";

const STANCE: Record<Mark, StanceValue> = {
  P: "POSITIVE",
  M: "MIXED",
  N: "NEGATIVE",
};

/** Eight marks, in DIMENSIONS order: P positive, M mixed, N negative. */
const CRITICS: { outlet: string; enjoyment: Mark; execution: Mark; marks: string }[] = [
  { outlet: "IGN", enjoyment: "P", execution: "P", marks: "PPPPPPPP" },
  { outlet: "GameSpot", enjoyment: "P", execution: "P", marks: "PPPPPPPM" },
  { outlet: "PC Gamer", enjoyment: "P", execution: "P", marks: "PMPPPPPM" },
  { outlet: "Polygon", enjoyment: "P", execution: "P", marks: "PMPPPPPP" },
  { outlet: "Eurogamer", enjoyment: "P", execution: "M", marks: "PNPPMMPM" },
  { outlet: "Kotaku", enjoyment: "M", execution: "M", marks: "MNPMMNPN" },
];

const AUDIENCE: { enjoyment: Mark; execution: Mark; completion: string; marks: string }[] = [
  { enjoyment: "P", execution: "P", completion: "COMPLETED", marks: "PPPPPPPP" },
  { enjoyment: "P", execution: "P", completion: "COMPLETED", marks: "PPPPPPPP" },
  { enjoyment: "P", execution: "P", completion: "COMPLETED", marks: "PNPPNPPM" },
  { enjoyment: "P", execution: "M", completion: "COMPLETED", marks: "PMPPNPPP" },
  { enjoyment: "P", execution: "M", completion: "COMPLETED", marks: "PMPPNMPM" },
  { enjoyment: "P", execution: "M", completion: "COMPLETED", marks: "PMPPNPPM" },
  { enjoyment: "P", execution: "N", completion: "COMPLETED", marks: "PNPPNPPN" },
  { enjoyment: "P", execution: "N", completion: "SUBSTANTIAL", marks: "MNPMMNPN" },
  { enjoyment: "M", execution: "P", completion: "COMPLETED", marks: "PPPPMPPP" },
  { enjoyment: "M", execution: "P", completion: "COMPLETED", marks: "PPPPMPPM" },
  { enjoyment: "M", execution: "M", completion: "SUBSTANTIAL", marks: "PPMMMMMM" },
  { enjoyment: "N", execution: "M", completion: "EARLY", marks: "NNPNNNMN" },
];

function judgments(marks: string) {
  return DIMENSIONS.map(([slug, name, sortOrder], index) => ({
    dimensionSlug: slug,
    dimensionName: name,
    stance: STANCE[marks[index] as Mark],
    sortOrder,
    family: "WORK" as const,
  }));
}

function criticRow(row: (typeof CRITICS)[number]): PopulatedEvaluation {
  return {
    population: "CRITIC",
    outletName: row.outlet,
    enjoyment: STANCE[row.enjoyment],
    execution: STANCE[row.execution],
    completion: "COMPLETED",
    judgments: judgments(row.marks),
  };
}

function audienceRow(row: (typeof AUDIENCE)[number]): PopulatedEvaluation {
  return {
    population: "AUDIENCE",
    enjoyment: STANCE[row.enjoyment],
    execution: STANCE[row.execution],
    completion: row.completion,
    judgments: judgments(row.marks),
  };
}

export const belmontCard = {
  title: "Castlevania: Belmont's Curse",
  kind: "Game",
  path: "/games/castlevania-belmonts-curse",
  url: "https://frame.example/games/castlevania-belmonts-curse",
  host: "frame.example",
  period: "March 2026 to October 2026",
  filters: [] as string[],
};

export function belmontLandscapes() {
  return splitLandscapes([...CRITICS.map(criticRow), ...AUDIENCE.map(audienceRow)]);
}
