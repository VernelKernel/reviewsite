export type EvaluationFilter = {
  completion?: string;
  platform?: string;
  population?: string;
};

export type FilterableEvaluation = {
  completion: string;
  platform: { slug: string } | null;
  population?: string;
};

export function filterEvaluations<T extends FilterableEvaluation>(evaluations: T[], filters: EvaluationFilter): T[] {
  return evaluations.filter((evaluation) => {
    if (filters.completion && evaluation.completion !== filters.completion) return false;
    if (filters.platform && evaluation.platform?.slug !== filters.platform) return false;
    if (filters.population && evaluation.population !== filters.population) return false;
    return true;
  });
}
