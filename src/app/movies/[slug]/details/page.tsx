import type { Metadata } from "next";
import { WorkRecordPage } from "@/components/works/work-record";
import { detailsHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("MOVIE", slug);
  if (!work) return { title: "Details" };
  return {
    title: `${work.title} details`,
    description: work.synopsis ?? `Release, creators, and genres for ${work.title}.`,
    alternates: { canonical: detailsHref(work.workType, work.slug) },
  };
}

export default async function MovieDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WorkRecordPage workType="MOVIE" slug={slug} view="details" searchParams={{}} />;
}