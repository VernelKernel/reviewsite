import { addStance, emptyDistribution, type Distribution, type StanceValue } from "@/lib/aggregation/landscape";
import { countPhrase, type PlacementJudgment } from "./placement";

export type CriticEvaluation = {
  outlet: string;
  reviewerName: string;
  enjoyment: StanceValue;
  execution: StanceValue;
  judgments: PlacementJudgment[];
};

export type OutletStance = {
  outlet: string;
  stance: StanceValue;
};

export type MetricAlignment = {
  key: string;
  label: string;
  yours: StanceValue;
  others: Distribution;
  omittedCount: number;
  aligned: string[];
  apart: OutletStance[];
  sentence: string;
  omittedSentence: string | null;
};

type Viewer = {
  enjoyment: StanceValue;
  execution: StanceValue;
  judgments: PlacementJudgment[];
};

export function alignCritics(viewer: Viewer, critics: CriticEvaluation[]): MetricAlignment[] {
  const labeled = labelOutlets(critics);
  const metrics: MetricAlignment[] = [
    metric("enjoyment", "Enjoyment", viewer.enjoyment, labeled, (row) => row.enjoyment, false),
    metric("execution", "Execution", viewer.execution, labeled, (row) => row.execution, false),
  ];
  for (const judgment of viewer.judgments) {
    const judged = labeled.some((row) => row.judgments.some((item) => item.slug === judgment.slug));
    if (!judged) continue;
    metrics.push(
      metric(
        `dimension:${judgment.slug}`,
        judgment.name,
        judgment.stance,
        labeled,
        (row) => row.judgments.find((item) => item.slug === judgment.slug)?.stance ?? null,
        true,
      ),
    );
  }
  return metrics;
}

function metric(
  key: string,
  label: string,
  yours: StanceValue,
  critics: CriticEvaluation[],
  read: (row: CriticEvaluation) => StanceValue | null,
  dimension: boolean,
): MetricAlignment {
  const judged = critics.flatMap((row) => {
    const stance = read(row);
    return stance ? [{ outlet: row.outlet, stance }] : [];
  });
  const others = judged.reduce((distribution, row) => addStance(distribution, row.stance), emptyDistribution());
  const omittedCount = critics.length - judged.length;
  const aligned = judged
    .filter((row) => row.stance === yours)
    .map((row) => row.outlet)
    .sort((a, b) => a.localeCompare(b));
  const apart = judged
    .filter((row) => row.stance !== yours)
    .sort((a, b) => a.outlet.localeCompare(b.outlet));
  return {
    key,
    label,
    yours,
    others,
    omittedCount,
    aligned,
    apart,
    sentence: criticSentence(label, yours, others, dimension),
    omittedSentence: dimension && omittedCount > 0 ? omittedLine(omittedCount, label) : null,
  };
}

function criticSentence(label: string, yours: StanceValue, others: Distribution, dimension: boolean): string {
  const lead = `Your ${label.toLowerCase()} is ${yours.toLowerCase()}.`;
  if (others.count === 0) return `${lead} No outlets judged ${label.toLowerCase()}.`;
  const unit = others.count === 1 ? "outlet" : "outlets";
  const scope = dimension ? `${others.count} ${unit} that judged ${label.toLowerCase()}` : `${others.count} ${unit}`;
  return `${lead} Of ${scope}, ${countPhrase(others)}.`;
}

function omittedLine(count: number, label: string): string {
  const unit = count === 1 ? "outlet" : "outlets";
  return `${count} ${unit} did not judge ${label.toLowerCase()}.`;
}

function labelOutlets(critics: CriticEvaluation[]): CriticEvaluation[] {
  const counts = new Map<string, number>();
  for (const critic of critics) counts.set(critic.outlet, (counts.get(critic.outlet) ?? 0) + 1);
  return critics.map((critic) => {
    const duplicate = (counts.get(critic.outlet) ?? 0) > 1;
    if (!duplicate || !critic.reviewerName || critic.reviewerName === critic.outlet) return critic;
    return { ...critic, outlet: `${critic.outlet} · ${critic.reviewerName}` };
  });
}
