import { completionLabel, reviewHref, stanceLabel } from "@/lib/domain/labels";

export type FollowedEvaluation = {
  reviewerSlug: string;
  displayName: string;
  workType: string;
  workSlug: string;
  enjoyment: string;
  execution: string;
  completion: string;
};

export function FollowedOnWork({ evaluations }: { evaluations: FollowedEvaluation[] }) {
  if (evaluations.length === 0) return null;
  return (
    <section className="section" aria-labelledby="followed-heading">
      <div className="section-head">
        <div>
          <p className="kicker">People you follow</p>
          <h2 id="followed-heading">Their evaluations of this work</h2>
        </div>
      </div>
      <ul className="evidence-list">
        {evaluations.map((evaluation) => (
          <li key={evaluation.reviewerSlug}>
            <a href={reviewHref(evaluation.workType, evaluation.workSlug, evaluation.reviewerSlug)}>{evaluation.displayName}</a>
            {" · "}
            Enjoyment {stanceLabel[evaluation.enjoyment]?.toLowerCase() ?? evaluation.enjoyment.toLowerCase()}
            {" · "}
            Execution {stanceLabel[evaluation.execution]?.toLowerCase() ?? evaluation.execution.toLowerCase()}
            {" · "}
            {completionLabel[evaluation.completion] ?? evaluation.completion}
          </li>
        ))}
      </ul>
    </section>
  );
}
