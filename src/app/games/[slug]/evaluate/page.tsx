import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvaluationForm } from "@/components/evaluations/evaluation-form";
import { getCurrentUser } from "@/lib/auth/session";
import { workArt } from "@/lib/works/present";
import { evaluationFormOptions, getWork, reviewerEvaluation } from "@/lib/works/queries";

export const metadata: Metadata = { title: "Evaluate" };

export default async function EvaluateGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await getWork("GAME", slug);
  if (!work || work.status !== "PUBLISHED") notFound();
  return <EvaluateScreen workType="GAME" slug={slug} title={work.title} />;
}

export async function EvaluateScreen({
  workType,
  slug,
  title,
}: {
  workType: "GAME" | "MOVIE";
  slug: string;
  title: string;
}) {
  const [work, user, options] = await Promise.all([
    getWork(workType, slug),
    getCurrentUser(),
    evaluationFormOptions(workType),
  ]);
  if (!work) notFound();
  const existing = user?.profile ? await reviewerEvaluation(work.id, user.profile.id) : null;
  const genres = [...work.genres]
    .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
    .map((item) => ({ name: item.genre.name, slug: item.genre.slug }));

  return (
    <main className="page shell">
      <EvaluationForm
        workType={workType}
        slug={slug}
        title={title}
        art={workArt(work.media)}
        genres={genres}
        canDraft={!existing || existing.status === "DRAFT"}
        hasEvaluation={Boolean(existing)}
        dimensions={options.dimensions.map((dimension) => ({
          id: dimension.id,
          name: dimension.name,
          family: dimension.family,
          description: dimension.description,
        }))}
        topics={options.topics.map((topic) => ({ id: topic.id, name: topic.name }))}
        platforms={work.platforms.map((platform) => ({ id: platform.platform.id, name: platform.platform.name }))}
        defaults={
          user?.profile
            ? {
                email: user.email,
                displayName: user.profile.displayName,
                lens: existing?.lens ?? "",
                standard: existing?.standard ?? "",
                standardNote: existing?.standardNote ?? "",
                enjoyment: existing?.enjoyment ?? "",
                execution: existing?.execution ?? "",
                completion: existing?.completion ?? "SUBSTANTIAL",
                playtime: existing?.playtime ?? "UNKNOWN",
                ownership: existing?.ownership ?? "",
                platformId: existing?.platformId ?? "",
                reviewTitle: existing?.review?.title ?? "",
                impression: existing?.review?.impression ?? "",
                reviewBody: existing?.review?.body ?? "",
                imported: existing?.review?.source === "IMPORTED",
                importSourceName: existing?.review?.importSourceName ?? "",
                importSourceUrl: existing?.review?.importSourceUrl ?? "",
                judgments: existing?.judgments.map((judgment) => ({ dimensionId: judgment.dimensionId, stance: judgment.stance })) ?? [],
                observations:
                  existing?.observations.map((observation) => ({
                    topicId: observation.topicId,
                    polarity: observation.polarity,
                    content: observation.content,
                  })) ?? [],
              }
            : null
        }
      />
    </main>
  );
}
