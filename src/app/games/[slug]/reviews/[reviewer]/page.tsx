import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvaluationRecord } from "@/components/evaluations/evaluation-record";
import { reviewHref } from "@/lib/domain/labels";
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
    description:
      evaluation.review?.impression ||
      `How ${evaluation.reviewer.displayName} evaluated ${work.title}, including enjoyment and execution.`,
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
  return <EvaluationRecord work={work} evaluation={evaluation} saved={saved} />;
}
