import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { reviewHref, reviewerCompareHref, reviewerHref, workHref } from "@/lib/domain/labels";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Frame account, public reviewer page, and published evaluations.",
};

function isEditor(role: string) {
  return role === "ADMIN" || role === "EDITOR";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [evaluations, followed] = await Promise.all([
    user.profile
      ? prisma.evaluation.findMany({
          where: { reviewerId: user.profile.id, status: "PUBLISHED" },
          orderBy: { reviewedOn: "desc" },
          select: { id: true, work: { select: { title: true, slug: true, workType: true } } },
        })
      : Promise.resolve([]),
    prisma.followedReviewer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { reviewer: { select: { slug: true, displayName: true } } },
    }),
  ]);

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

        <section className="account-section" aria-labelledby="evaluations-heading">
          <h2 id="evaluations-heading">Published evaluations</h2>
          {evaluations.length === 0 || !user.profile ? (
            <p className="empty">No published evaluations yet.</p>
          ) : (
            <div className="profile-list">
              {evaluations.map((evaluation) => (
                <article className="review-card" key={evaluation.id}>
                  <header>
                    <a className="reviewer-link" href={workHref(evaluation.work.workType, evaluation.work.slug)}>
                      {evaluation.work.title}
                    </a>
                    <a className="quiet-link" href={reviewHref(evaluation.work.workType, evaluation.work.slug, user.profile!.slug)}>
                      Evaluation
                    </a>
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
