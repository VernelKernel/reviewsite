import type { Metadata } from "next";
import { WorkRecordPage } from "@/components/works/work-record";
import { criticsHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("MOVIE", slug);
  if (!work) return { title: "Critic reviews" };
  return {
    title: `${work.title} critic reviews`,
    description: `Critic readings of ${work.title}, kept separate from audience evaluations.`,
    alternates: { canonical: criticsHref(work.workType, work.slug) },
  };
}

export default async function MovieCriticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  return <WorkRecordPage workType="MOVIE" slug={slug} view="critics" searchParams={await searchParams} />;
}
