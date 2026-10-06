import type { Metadata } from "next";
import { WorkRecordPage } from "@/components/works/work-record";
import { criticsHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("GAME", slug);
  if (!work) return { title: "Critic reviews" };
  return {
    title: `${work.title} critic reviews`,
    description: `Critic readings of ${work.title}, kept separate from audience evaluations.`,
    alternates: { canonical: criticsHref(work.workType, work.slug) },
  };
}

export default async function GameCriticsPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  return <WorkRecordPage workType="GAME" slug={slug} view="critics" searchParams={await searchParams} />;
}
