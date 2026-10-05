import { ReviewScreen } from "@/app/games/[slug]/reviews/[reviewer]/page";

export default async function MovieReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; reviewer: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug, reviewer } = await params;
  const query = await searchParams;
  return <ReviewScreen workType="MOVIE" slug={slug} reviewer={reviewer} saved={query.saved === "1"} />;
}
