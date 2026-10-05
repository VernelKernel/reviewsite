import { notFound } from "next/navigation";
import { EvaluateScreen } from "@/app/games/[slug]/evaluate/page";
import { getWork } from "@/lib/works/queries";

export default async function EvaluateMoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await getWork("MOVIE", slug);
  if (!work || work.status !== "PUBLISHED") notFound();
  return <EvaluateScreen workType="MOVIE" slug={slug} title={work.title} />;
}
