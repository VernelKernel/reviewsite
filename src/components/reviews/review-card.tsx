import {
  completionLabel,
  lensLabel,
  ownershipLabel,
  playtimeLabel,
  reviewerHref,
  reviewHref,
  workHref,
  stanceClass,
  stanceLabel,
  standardLabel,
} from "@/lib/domain/labels";
import { formatDate } from "@/lib/works/present";

export type ReviewCardModel = {
  workType: string;
  workSlug: string;
  reviewerName: string;
  reviewerSlug: string;
  lens: string;
  standard: string;
  standardNote: string | null;
  enjoyment: string;
  execution: string;
  completion: string;
  playtime: string;
  ownership: string | null;
  platform: string | null;
  platformSlug: string | null;
  population: "CRITIC" | "AUDIENCE";
  reviewedOn: Date | null;
  judgments: { name: string; stance: string }[];
  observations: { topic: string; polarity: string; content: string }[];
  review: {
    title: string | null;
    body: string;
    source: string;
    importSourceName: string | null;
    importSourceUrl: string | null;
  } | null;
};

export function ReviewCard({ review, linked = true }: { review: ReviewCardModel; linked?: boolean }) {
  const context = [
    lensLabel[review.lens],
    standardLabel[review.standard],
    completionLabel[review.completion],
    review.playtime !== "UNKNOWN" ? playtimeLabel[review.playtime] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="review-card">
      <header>
        <a className="reviewer-link" href={reviewerHref(review.reviewerSlug)}>
          {review.reviewerName}
        </a>
        {linked ? (
          <a className="quiet-link" href={reviewHref(review.workType, review.workSlug, review.reviewerSlug)}>
            Evaluation
          </a>
        ) : null}
      </header>
      {review.platform && review.platformSlug ? (
        <p className="review-platform">
          <a className="chip" href={`${workHref(review.workType, review.workSlug)}?platform=${encodeURIComponent(review.platformSlug)}`}>
            {review.platform}
          </a>
        </p>
      ) : null}
      <p className="context-line">{context}</p>
      <table className="judgment-table">
        <tbody>
          <tr>
            <th scope="row">Enjoyment</th>
            <td className={stanceClass(review.enjoyment)}>{stanceLabel[review.enjoyment]}</td>
          </tr>
          <tr>
            <th scope="row">Execution</th>
            <td className={stanceClass(review.execution)}>{stanceLabel[review.execution]}</td>
          </tr>
          {review.judgments.map((judgment) => (
            <tr key={judgment.name}>
              <th scope="row">{judgment.name}</th>
              <td className={stanceClass(judgment.stance)}>{stanceLabel[judgment.stance]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {review.standardNote ? <p className="context-line">Standard note: {review.standardNote}</p> : null}
      {review.ownership ? <p className="context-line">Access: {ownershipLabel[review.ownership]}</p> : null}
      {review.review ? (
        <div className="prose">
          {review.review.title ? <h3>{review.review.title}</h3> : null}
          {review.review.body.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="meta">No written review. The structured judgments above are the evaluation.</p>
      )}
      {review.observations.map((observation) => (
        <div className="observation" key={`${observation.topic}-${observation.content}`}>
          <strong>
            {observation.topic} · {observation.polarity === "PRAISE" ? "Praise" : "Criticism"}
          </strong>
          <p>{observation.content}</p>
        </div>
      ))}
      {review.review?.source === "IMPORTED" ? (
        <p className="provenance">
          Imported
          {review.review.importSourceName ? ` from ${review.review.importSourceName}` : ""}. This text was not originally written on Frame.
          {review.review.importSourceUrl ? (
            <>
              {" "}
              <a href={review.review.importSourceUrl} rel="noreferrer noopener">
                {review.review.importSourceName === "Steam" ? "View on Steam" : "View source"}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {review.reviewedOn ? <p className="provenance">{formatDate(review.reviewedOn)}</p> : null}
    </article>
  );
}
