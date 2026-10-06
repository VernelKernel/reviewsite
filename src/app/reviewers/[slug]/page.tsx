import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { distributionLabel } from "@/lib/aggregation/landscape";
import { lensLabel, reviewHref, standardLabel, workHref } from "@/lib/domain/labels";
import { getReviewer } from "@/lib/works/queries";
import { landscapeFor } from "@/lib/works/present";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const reviewer = await getReviewer(slug);
  if (!reviewer) return { title: "Reviewer" };
  return {
    title: reviewer.displayName,
    description: reviewer.bio ?? `Evaluations by ${reviewer.displayName}.`,
    alternates: { canonical: `/reviewers/${reviewer.slug}` },
  };
}

export default async function ReviewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const reviewer = await getReviewer(slug);
  if (!reviewer) notFound();

  return (
    <main className="page shell">
      <p className="kicker">Reviewer</p>
      <h1>{reviewer.displayName}</h1>
      {reviewer.bio ? (
        <p className="lede" style={{ marginTop: "1rem" }}>
          {reviewer.bio}
        </p>
      ) : null}
      <p className="sample-note" style={{ marginTop: "1rem" }}>
        {reviewer.evaluations.length} published {reviewer.evaluations.length === 1 ? "evaluation" : "evaluations"}. The profile is the public identity. The account behind it stays private.
      </p>
      <div className="profile-list" style={{ marginTop: "2rem" }}>
        {reviewer.evaluations.map((evaluation) => {
          const landscape = landscapeFor(evaluation.work);
          return (
            <article className="review-card" key={evaluation.id}>
              <header>
                <a className="reviewer-link" href={workHref(evaluation.work.workType, evaluation.work.slug)}>
                  {evaluation.work.title}
                </a>
                <a className="quiet-link" href={reviewHref(evaluation.work.workType, evaluation.work.slug, reviewer.slug)}>
                  Evaluation
                </a>
              </header>
              <p className="context-line">
                {lensLabel[evaluation.lens]} · {standardLabel[evaluation.standard]} · Enjoyment {evaluation.enjoyment.toLowerCase()} · Execution{" "}
                {evaluation.execution.toLowerCase()}
              </p>
              <p className="meta">
                Audience evaluations: enjoyment {distributionLabel(landscape.enjoyment).toLowerCase()}, execution{" "}
                {distributionLabel(landscape.execution).toLowerCase()}.
              </p>
              {evaluation.review?.body ? <p style={{ marginTop: "1rem" }}>{evaluation.review.body.slice(0, 280)}</p> : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}
