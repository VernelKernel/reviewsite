import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { evaluateHref, reviewHref, reviewerCompareHref, reviewerHref, workHref } from "@/lib/domain/labels";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Frame account, public reviewer page, and reviews.",
};

function isEditor(role: string) {
  return role === "ADMIN" || role === "EDITOR";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [evaluations, intakes, followed] = await Promise.all([
    user.profile
      ? prisma.evaluation.findMany({
          where: { reviewerId: user.profile.id, status: { in: ["DRAFT", "PUBLISHED"] } },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            status: true,
            updatedAt: true,
            work: { select: { title: true, slug: true, workType: true } },
          },
        })
      : Promise.resolve([]),
    prisma.intake.findMany({
      where: { userId: user.id, evaluationId: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, rawTitle: true, draft: true, updatedAt: true },
    }),
    prisma.followedReviewer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { reviewer: { select: { slug: true, displayName: true } } },
    }),
  ]);

  const reviews = [
    ...evaluations.map((evaluation) => ({
      id: evaluation.id,
      title: evaluation.work.title,
      state: evaluation.status === "DRAFT" ? "Draft" : "Published",
      href:
        evaluation.status === "DRAFT"
          ? evaluateHref(evaluation.work.workType, evaluation.work.slug)
          : user.profile
            ? reviewHref(evaluation.work.workType, evaluation.work.slug, user.profile.slug)
            : workHref(evaluation.work.workType, evaluation.work.slug),
      updatedAt: evaluation.updatedAt.getTime(),
    })),
    ...intakes.map((intake) => ({
      id: intake.id,
      title: intake.rawTitle,
      state: intake.draft ? "Draft" : "Published",
      href: `/review/${intake.id}`,
      updatedAt: intake.updatedAt.getTime(),
    })),
  ].sort((left, right) => right.updatedAt - left.updatedAt);

  return (
    <main className="page shell">
      <div className="account-block account-block-wide">
        <p className="kicker">Account</p>
        <h1>{user.profile?.displayName ?? "Your account"}</h1>
        <p className="lede">{user.email}</p>
        <div className="hero-actions">
          {user.profile ? (
            <a className="btn btn-secondary" href={reviewerHref(user.profile.slug)}>
              Public profile
            </a>
          ) : null}
          <a className="btn btn-secondary" href="/settings">
            Settings
          </a>
        </div>

        <section className="account-section" aria-labelledby="reviews-heading">
          <h2 id="reviews-heading">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="empty">No reviews yet.</p>
          ) : (
            <div className="profile-list">
              {reviews.map((review) => (
                <article className="review-card account-review" key={review.id}>
                  <header>
                    <a className="reviewer-link" href={review.href}>
                      {review.title}
                    </a>
                    <span className="meta">{review.state}</span>
                  </header>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="account-section" aria-labelledby="followed-reviewers-heading">
          <h2 id="followed-reviewers-heading">Reviewers you follow</h2>
          {followed.length === 0 ? (
            <p className="empty">You are not following any reviewers yet.</p>
          ) : (
            <div className="profile-list">
              {followed.map((row) => (
                <article className="review-card" key={row.reviewerId}>
                  <header>
                    <a className="reviewer-link" href={reviewerHref(row.reviewer.slug)}>
                      {row.reviewer.displayName}
                    </a>
                    <a className="quiet-link" href={reviewerCompareHref(row.reviewer.slug)}>
                      Compare
                    </a>
                  </header>
                </article>
              ))}
            </div>
          )}
        </section>

        {isEditor(user.role) ? (
          <section className="account-section" aria-labelledby="tools-heading">
            <h2 id="tools-heading">Tools</h2>
            <div className="hero-actions">
              <a className="btn btn-secondary" href="/admin/outlets">
                Outlets
              </a>
              <a className="btn btn-secondary" href="/admin/email-preview">
                Email preview
              </a>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
