export type EvaluationFilter = {
  lens?: string;
  standard?: string;
  completion?: string;
  platform?: string;
  population?: string;
};

export type FilterableEvaluation = {
  lens: string;
  standard: string;
  completion: string;
  platform: { slug: string } | null;
  population?: string;
};

export function filterEvaluations<T extends FilterableEvaluation>(evaluations: T[], filters: EvaluationFilter): T[] {
  return evaluations.filter((evaluation) => {
    if (filters.lens && evaluation.lens !== filters.lens) return false;
    if (filters.standard && evaluation.standard !== filters.standard) return false;
    if (filters.completion && evaluation.completion !== filters.completion) return false;
    if (filters.platform && evaluation.platform?.slug !== filters.platform) return false;
    if (filters.population && evaluation.population !== filters.population) return false;
    return true;
  });
}
