import type { Metadata } from "next";
import { WorkRecordPage } from "@/components/works/work-record";
import { audienceHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("GAME", slug);
  if (!work) return { title: "Audience reviews" };
  return {
    title: `${work.title} audience reviews`,
    description: `Audience evaluations of ${work.title}, kept separate from critic readings.`,
    alternates: { canonical: audienceHref(work.workType, work.slug) },
  };
}

export default async function GameAudiencePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  return <WorkRecordPage workType="GAME" slug={slug} view="audience" searchParams={await searchParams} />;
}
