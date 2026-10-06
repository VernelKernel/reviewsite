import { CriticReading } from "@/components/evaluations/critic-reading";
import { StanceLine } from "@/components/evaluations/stance-line";
import type { ReviewCardModel } from "@/components/reviews/review-card";
import { reviewHref, reviewerHref } from "@/lib/domain/labels";
import { formatDate } from "@/lib/works/present";

const PREVIEW_LIMIT = 3;

export function ReceptionColumns({
  critics,
  audience,
  criticHref,
  audienceHref,
}: {
  critics: ReviewCardModel[];
  audience: ReviewCardModel[];
  criticHref: string;
  audienceHref: string;
}) {
  return (
    <section className="reception-columns" aria-label="Reviews">
      <ReviewColumn
        title="Critics"
        href={criticHref}
        reviews={recent(critics)}
        empty="No core outlets have a reading in this view yet."
        kind="critic"
      />
      <ReviewColumn
        title="Audience"
        href={audienceHref}
        reviews={recent(audience)}
        empty="No audience evaluations in this view yet."
        kind="audience"
      />
    </section>
  );
}

function ReviewColumn({
  title,
  href,
  reviews,
  empty,
  kind,
}: {
  title: string;
  href: string;
  reviews: ReviewCardModel[];
  empty: string;
  kind: "critic" | "audience";
}) {
  const shown = reviews.slice(0, PREVIEW_LIMIT);

  return (
    <div>
      <div className="column-head">
        <h2>{title}</h2>
        <a className="column-more" href={href}>
          View all
        </a>
      </div>
      {shown.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <div className="excerpt-list">
          {shown.map((review) =>
            kind === "critic" ? (
              <CriticReading key={review.reviewerSlug} review={review} />
            ) : (
              <AudienceExcerpt key={review.reviewerSlug} review={review} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function AudienceExcerpt({ review }: { review: ReviewCardModel }) {
  const date = formatDate(review.reviewedOn);
  const body = review.review?.body ? excerpt(review.review.body) : null;
  const observation = review.observations[0];
  const imported = review.review?.source === "IMPORTED";

  return (
    <article className="excerpt-card">
      <header>
        <a className="reviewer-link" href={reviewerHref(review.reviewerSlug)}>
          {review.reviewerName}
        </a>
        {date ? <time className="meta">{date}</time> : null}
      </header>
      <StanceLine
        items={[
          { label: "Enjoyment", stance: review.enjoyment },
          { label: "Execution", stance: review.execution },
        ]}
      />
      {body ? (
        <p className="excerpt-body">{body}</p>
      ) : observation ? (
        <p className="excerpt-body">{observation.content}</p>
      ) : (
        <p className="meta">No written review.</p>
      )}
      <footer className="excerpt-foot">
        <a href={reviewHref(review.workType, review.workSlug, review.reviewerSlug)}>Read evaluation</a>
        {review.platform ? <span className="meta">{review.platform}</span> : null}
      </footer>
      {imported ? (
        <p className="provenance">
          Imported{review.review?.importSourceName ? ` from ${review.review.importSourceName}` : ""}. This text was not written on Frame.
        </p>
      ) : null}
    </article>
  );
}

function recent(reviews: ReviewCardModel[]): ReviewCardModel[] {
  return [...reviews].sort((left, right) => (right.reviewedOn?.getTime() ?? 0) - (left.reviewedOn?.getTime() ?? 0));
}

function excerpt(text: string, limit = 220): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= limit) return flat;
  const cut = flat.slice(0, limit);
  const last = cut.lastIndexOf(" ");
  return `${(last > 80 ? cut.slice(0, last) : cut).trimEnd()}…`;
}
