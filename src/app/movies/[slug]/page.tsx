import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkPage } from "@/components/works/work-page";
import { workHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("MOVIE", slug);
  if (!work) return { title: "Work" };
  return {
    title: `${work.title} evaluations`,
    description: work.synopsis ?? `How reviewers evaluated ${work.title}.`,
    alternates: { canonical: workHref(work.workType, work.slug) },
  };
}

export default async function MoviePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const work = await getWork("MOVIE", slug);
  if (!work) notFound();
  return <WorkPage workType="MOVIE" slug={slug} searchParams={query} />;
}
