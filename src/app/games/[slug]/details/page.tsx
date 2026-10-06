import type { Metadata } from "next";
import { WorkRecordPage } from "@/components/works/work-record";
import { detailsHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("GAME", slug);
  if (!work) return { title: "Details" };
  return {
    title: `${work.title} details`,
    description: work.synopsis ?? `Release, creators, platforms, and genres for ${work.title}.`,
    alternates: { canonical: detailsHref(work.workType, work.slug) },
  };
}

export default async function GameDetailsPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return <WorkRecordPage workType="GAME" slug={slug} view="details" searchParams={{}} />;
}
