import { stanceLabel } from "@/lib/domain/labels";
import type { ReviewCardModel } from "@/components/reviews/review-card";

export function CriticReading({ review }: { review: ReviewCardModel }) {
  const outlet = review.review?.importSourceName || review.reviewerName;
  const href = review.review?.importSourceUrl;
  const stances = [
    `Enjoyment ${stanceLabel[review.enjoyment]?.toLowerCase() ?? review.enjoyment.toLowerCase()}`,
    `Execution ${stanceLabel[review.execution]?.toLowerCase() ?? review.execution.toLowerCase()}`,
    ...review.judgments.map(
      (judgment) => `${judgment.name} ${stanceLabel[judgment.stance]?.toLowerCase() ?? judgment.stance.toLowerCase()}`,
    ),
  ];

  return (
    <article className="critic-reading">
      <header className="critic-reading-head">
        <strong>{outlet}</strong>
        {review.reviewerName !== outlet ? <span className="meta">{review.reviewerName}</span> : null}
      </header>
      <p>{stances.join(" · ")}</p>
      {href ? (
        <a href={href}>Full review at {outlet}</a>
      ) : (
        <p className="meta">Full review link unavailable.</p>
      )}
    </article>
  );
}
