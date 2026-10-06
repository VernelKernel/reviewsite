import { StanceLine } from "@/components/evaluations/stance-line";
import type { ReviewCardModel } from "@/components/reviews/review-card";

export function CriticReading({ review }: { review: ReviewCardModel }) {
  const outlet = review.review?.importSourceName || review.reviewerName;
  const href = review.review?.importSourceUrl;

  return (
    <article className="critic-reading">
      <header className="critic-reading-head">
        <strong>{outlet}</strong>
        {review.reviewerName !== outlet ? <span className="meta">{review.reviewerName}</span> : null}
      </header>
      <StanceLine
        items={[
          { label: "Enjoyment", stance: review.enjoyment },
          { label: "Execution", stance: review.execution },
          ...review.judgments.map((judgment) => ({ label: judgment.name, stance: judgment.stance })),
        ]}
      />
      {href ? (
        <a href={href}>Full review at {outlet}</a>
      ) : (
        <p className="meta">Full review link unavailable.</p>
      )}
    </article>
  );
}
