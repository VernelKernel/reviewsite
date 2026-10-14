import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FollowReviewerButton } from "@/components/comparison/follow-reviewer-button";
import { distributionLabel } from "@/lib/aggregation/landscape";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { lensLabel, reviewHref, reviewerCompareHref, standardLabel, workHref } from "@/lib/domain/labels";
import { getReviewer } from "@/lib/works/queries";
import { landscapeFor } from "@/lib/works/present";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const reviewer = await getReviewer(slug);
  if (!reviewer) return { title: "Reviewer" };
  return {
    title: reviewer.displayName,
    description: reviewer.bio ?? `Evaluations by ${reviewer.displayName}.`,
    alternates: { canonical: `/reviewers/${reviewer.slug}` },
  };
}

const STEAM_PROFILE_BIO = /^Reviews imported from their Steam profile:\s+(https:\/\/steamcommunity\.com\/profiles\/\d+\/?)\s*$/;

function steamProfileFromBio(bio: string | null): string | null {
  if (!bio) return null;
  return bio.match(STEAM_PROFILE_BIO)?.[1] ?? null;
}

export default async function ReviewerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const reviewer = await getReviewer(slug);
  if (!reviewer) notFound();
  const viewer = await getCurrentUser();
  const isSelf = viewer?.profile?.id === reviewer.id;
  const following = viewer && !isSelf
    ? Boolean(
        await prisma.followedReviewer.findUnique({
          where: { userId_reviewerId: { userId: viewer.id, reviewerId: reviewer.id } },
        }),
      )
    : false;
  const steamProfile = steamProfileFromBio(reviewer.bio);
  const bio = steamProfile ? null : reviewer.bio;

  return (
    <main className="page shell">
      <p className="kicker">Reviewer</p>
      <h1>{reviewer.displayName}</h1>
      {viewer && !isSelf ? (
        <div className="hero-actions">
          <FollowReviewerButton reviewerId={reviewer.id} following={following} />
          {following ? (
            <a className="btn btn-secondary" href={reviewerCompareHref(reviewer.slug)}>
              Compare evaluations
            </a>
          ) : null}
        </div>
      ) : null}
      {!viewer ? (
        <p className="meta" style={{ marginTop: "1rem" }}>
          <a href="/login">Sign in</a> to follow this reviewer.
        </p>
      ) : null}
      {bio ? (
        <p className="lede" style={{ marginTop: "1rem" }}>
          {bio}
        </p>
      ) : null}
      <p className="sample-note" style={{ marginTop: "1rem" }}>
        {reviewer.evaluations.length} published {reviewer.evaluations.length === 1 ? "evaluation" : "evaluations"}.
      </p>
      <div className="profile-list" style={{ marginTop: "2rem" }}>
        {reviewer.evaluations.map((evaluation) => {
          const landscape = landscapeFor(evaluation.work);
          return (
            <article className="review-card" key={evaluation.id}>
              <header>
                <a className="reviewer-link" href={workHref(evaluation.work.workType, evaluation.work.slug)}>
                  {evaluation.work.title}
                </a>
                <a className="quiet-link" href={reviewHref(evaluation.work.workType, evaluation.work.slug, reviewer.slug)}>
                  Evaluation
                </a>
              </header>
              <p className="context-line">
                {[
                  evaluation.lens ? lensLabel[evaluation.lens] : null,
                  evaluation.standard ? standardLabel[evaluation.standard] : null,
                  `Enjoyment ${evaluation.enjoyment.toLowerCase()}`,
                  `Execution ${evaluation.execution.toLowerCase()}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="meta">
                Audience evaluations: enjoyment {distributionLabel(landscape.enjoyment).toLowerCase()}, execution{" "}
                {distributionLabel(landscape.execution).toLowerCase()}.
              </p>
              {evaluation.review?.body ? <p style={{ marginTop: "1rem" }}>{evaluation.review.body.slice(0, 280)}</p> : null}
              {steamProfile ? (
                <p className="provenance">
                  Reviews imported from their Steam profile:{" "}
                  <a href={steamProfile} rel="noreferrer noopener">
                    {steamProfile}
                  </a>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}
