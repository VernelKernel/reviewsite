export type StoredJudgment = {
  dimensionId: string;
  stance: "POSITIVE" | "MIXED" | "NEGATIVE";
};

const STANCES = new Set(["POSITIVE", "MIXED", "NEGATIVE"]);

export function readJudgments(value: unknown): StoredJudgment[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const judgments: StoredJudgment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { dimensionId?: unknown; stance?: unknown };
    const dimensionId = typeof record.dimensionId === "string" ? record.dimensionId : "";
    const stance = typeof record.stance === "string" ? record.stance : "";
    if (!dimensionId || !STANCES.has(stance) || seen.has(dimensionId)) continue;
    seen.add(dimensionId);
    judgments.push({ dimensionId, stance: stance as StoredJudgment["stance"] });
  }
  return judgments;
}

export function personalHeadline(enjoyment: string, execution: string): string {
  const enjoy: Record<string, string> = {
    POSITIVE: "Loved it",
    MIXED: "Mixed on enjoyment",
    NEGATIVE: "Didn't enjoy it",
  };
  const craft: Record<string, string> = {
    POSITIVE: "Well executed",
    MIXED: "Mixed execution",
    NEGATIVE: "Poorly executed",
  };
  return `${enjoy[enjoyment] ?? "Enjoyment recorded"}. ${craft[execution] ?? "Execution recorded"}.`;
}

export const STANCE_RADIUS = {
  POSITIVE: 1,
  MIXED: 0.62,
  NEGATIVE: 0.34,
} as const;
