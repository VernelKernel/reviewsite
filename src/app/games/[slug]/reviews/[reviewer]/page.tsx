import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/reviews/copy-link";
import { ReviewCard, type ReviewCardModel } from "@/components/reviews/review-card";
import { reviewHref, workHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; reviewer: string }>;
}): Promise<Metadata> {
  const { slug, reviewer } = await params;
  const work = await getWork("GAME", slug);
  const evaluation = work?.evaluations.find((item) => item.reviewer.slug === reviewer);
  if (!work || !evaluation) return { title: "Evaluation" };
  return {
    title: `${evaluation.reviewer.displayName} on ${work.title}`,
    description: `How ${evaluation.reviewer.displayName} evaluated ${work.title}, including lens, standard, enjoyment, and execution.`,
    alternates: { canonical: reviewHref(work.workType, work.slug, evaluation.reviewer.slug) },
  };
}

export default async function GameReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; reviewer: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug, reviewer } = await params;
  const query = await searchParams;
  return <ReviewScreen workType="GAME" slug={slug} reviewer={reviewer} saved={query.saved === "1"} />;
}

export async function ReviewScreen({
  workType,
  slug,
  reviewer,
  saved,
}: {
  workType: "GAME" | "MOVIE";
  slug: string;
  reviewer: string;
  saved: boolean;
}) {
  const work = await getWork(workType, slug);
  const evaluation = work?.evaluations.find((item) => item.reviewer.slug === reviewer);
  if (!work || !evaluation) notFound();

  const review: ReviewCardModel = {
    workType: work.workType,
    workSlug: work.slug,
    reviewerName: evaluation.reviewer.displayName,
    reviewerSlug: evaluation.reviewer.slug,
    lens: evaluation.lens,
    standard: evaluation.standard,
    standardNote: evaluation.standardNote,
    enjoyment: evaluation.enjoyment,
    execution: evaluation.execution,
    completion: evaluation.completion,
    playtime: evaluation.playtime,
    ownership: evaluation.ownership,
    platform: evaluation.platform?.name ?? null,
    reviewedOn: evaluation.reviewedOn,
    judgments: evaluation.judgments
      .slice()
      .sort((a, b) => a.dimension.sortOrder - b.dimension.sortOrder)
      .map((judgment) => ({ name: judgment.dimension.name, stance: judgment.stance })),
    observations: evaluation.observations.map((observation) => ({
      topic: observation.topic.name,
      polarity: observation.polarity,
      content: observation.content,
    })),
    review: evaluation.review
      ? {
          title: evaluation.review.title,
          body: evaluation.review.body,
          source: evaluation.review.source,
          importSourceName: evaluation.review.importSourceName,
          importSourceUrl: evaluation.review.importSourceUrl,
        }
      : null,
  };

  const path = reviewHref(work.workType, work.slug, evaluation.reviewer.slug);

  return (
    <main className="page shell two-col">
      <div>
        {saved ? <p className="form-error">Published. This page is the evaluation, structure and prose together.</p> : null}
        <p className="kicker">
          <a href={workHref(work.workType, work.slug)}>{work.title}</a>
        </p>
        <h1 style={{ marginBottom: "1.5rem" }}>How {evaluation.reviewer.displayName} evaluated it</h1>
        <ReviewCard review={review} linked={false} />
      </div>
      <aside className="panel">
        <h2>Share the judgment</h2>
        <p className="meta" style={{ marginBottom: "1rem" }}>
          The useful thing to pass on is the lens and the standard, not a number standing in for both.
        </p>
        <CopyLink path={path} />
      </aside>
    </main>
  );
}
