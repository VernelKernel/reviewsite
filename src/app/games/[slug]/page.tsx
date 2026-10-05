import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkPage } from "@/components/works/work-page";
import { workHref } from "@/lib/domain/labels";
import { getWork } from "@/lib/works/queries";

type Params = { slug: string };
type Search = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork("GAME", slug);
  if (!work) return { title: "Work" };
  return {
    title: `${work.title} evaluations`,
    description: work.synopsis ?? `How reviewers evaluated ${work.title}, including enjoyment, execution, and standards.`,
    alternates: { canonical: workHref(work.workType, work.slug) },
    openGraph: {
      title: `${work.title} evaluations`,
      description: work.synopsis ?? undefined,
    },
  };
}

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const work = await getWork("GAME", slug);
  if (!work) notFound();
  return <WorkPage workType="GAME" slug={slug} searchParams={query} />;
}
