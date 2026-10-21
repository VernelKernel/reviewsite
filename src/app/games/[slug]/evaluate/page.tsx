import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EvaluationForm } from "@/components/evaluations/evaluation-form";
import { getCurrentUser } from "@/lib/auth/session";
import { evaluateHref } from "@/lib/domain/labels";
import { workArt } from "@/lib/works/present";
import { evaluationFormOptions, getWork, reviewerEvaluation } from "@/lib/works/queries";

export const metadata: Metadata = { title: "Create your review" };

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
        platforms={work.platforms.map((platform) => ({ id: platform.platform.id, name: platform.platform.name }))}
        signedIn={Boolean(user)}
        returnPath={evaluateHref(workType, slug)}
        defaults={
          user?.profile
            ? {
                enjoyment: existing?.enjoyment ?? "",
                execution: existing?.execution ?? "",
                completion: existing?.completion ?? "SUBSTANTIAL",
                playtime: existing?.playtime ?? "UNKNOWN",
                ownership: existing?.ownership ?? "",
                platformId: existing?.platformId ?? "",
                reviewTitle: existing?.review?.title ?? "",
                impression: existing?.review?.impression ?? "",
                reviewBody: existing?.review?.body ?? "",
                reviewSections:
                  existing?.review?.sections.map((section) => ({
                    dimensionId: section.dimensionId,
                    body: section.body,
                  })) ?? [],
                judgments:
                  existing?.judgments.map((judgment) => ({
                    dimensionId: judgment.dimensionId,
                    stance: judgment.stance,
                    mattered: judgment.mattered,
                  })) ?? [],
              }
            : null
        }
      />
    </main>
  );
}
