import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { compareReviewers, type OverlapEvaluation } from "@/lib/comparison/overlap";
import { prisma } from "@/lib/db/client";
import { reviewHref, reviewerHref, workHref } from "@/lib/domain/labels";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const reviewer = await prisma.reviewerProfile.findUnique({ where: { slug }, select: { displayName: true } });
  if (!reviewer) return { title: "Compare" };
  return {
    title: `You and ${reviewer.displayName}`,
    description: `Where your published evaluations line up with ${reviewer.displayName}.`,
  };
}

export default async function CompareReviewerPage({ params }: { params: Promise<Params> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { slug } = await params;
  const reviewer = await prisma.reviewerProfile.findUnique({ where: { slug } });
  if (!reviewer) notFound();
  if (user.profile?.id === reviewer.id) redirect(reviewerHref(reviewer.slug));

  const [yours, theirs] = await Promise.all([
    user.profile ? loadEvaluations(user.profile.id) : Promise.resolve([]),
    loadEvaluations(reviewer.id),
  ]);
  const overlap = compareReviewers(yours, theirs);

  return (
    <main className="page shell">
      <p className="kicker">Comparison</p>
      <h1>You and {reviewer.displayName}</h1>
      <p className="lede" style={{ marginTop: "1rem" }}>
        {overlap.summary}
      </p>
      <p className="meta">
        <a href={reviewerHref(reviewer.slug)}>{reviewer.displayName}</a>
      </p>
      <Shelf title="Works you have both evaluated" empty="No published evaluations in common." count={overlap.shared.length}>
        {overlap.shared.map((row) => (
          <article className="review-card" key={row.workId}>
            <header>
              <a className="reviewer-link" href={workHref(row.workType, row.workSlug)}>
                {row.title}
              </a>
              <a className="quiet-link" href={reviewHref(row.workType, row.workSlug, row.yourSlug)}>
                Yours
              </a>
              <a className="quiet-link" href={reviewHref(row.workType, row.workSlug, row.theirSlug)}>
                Theirs
              </a>
            </header>
            <p>{row.enjoymentLine}</p>
            <p>{row.executionLine}</p>
            {row.dimensionLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </article>
        ))}
      </Shelf>
      <Shelf title="Works only you have evaluated" empty="None." count={overlap.onlyYou.length}>
        {overlap.onlyYou.map((row) => (
          <article className="review-card" key={row.workId}>
            <header>
              <a className="reviewer-link" href={workHref(row.workType, row.workSlug)}>
                {row.title}
              </a>
              <a className="quiet-link" href={reviewHref(row.workType, row.workSlug, row.reviewerSlug)}>
                Your evaluation
              </a>
            </header>
          </article>
        ))}
      </Shelf>
      <Shelf title={`Works only ${reviewer.displayName} has evaluated`} empty="None." count={overlap.onlyThem.length}>
        {overlap.onlyThem.map((row) => (
          <article className="review-card" key={row.workId}>
            <header>
              <a className="reviewer-link" href={workHref(row.workType, row.workSlug)}>
                {row.title}
              </a>
              <a className="quiet-link" href={reviewHref(row.workType, row.workSlug, row.reviewerSlug)}>
                Their evaluation
              </a>
            </header>
          </article>
        ))}
      </Shelf>
    </main>
  );
}

function Shelf({ title, empty, count, children }: { title: string; empty: string; count: number; children: ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {count === 0 ? <p className="empty">{empty}</p> : <div className="profile-list">{children}</div>}
    </section>
  );
}

async function loadEvaluations(reviewerId: string): Promise<OverlapEvaluation[]> {
  const rows = await prisma.evaluation.findMany({
    where: { reviewerId, status: "PUBLISHED" },
    include: {
      work: { select: { id: true, title: true, workType: true, slug: true } },
      reviewer: { select: { slug: true } },
      judgments: { include: { dimension: true } },
    },
  });
  return rows.map((row) => ({
    reviewerId,
    workId: row.work.id,
    title: row.work.title,
    workType: row.work.workType,
    workSlug: row.work.slug,
    reviewerSlug: row.reviewer.slug,
    enjoyment: row.enjoyment,
    execution: row.execution,
    judgments: [...row.judgments]
      .sort((left, right) => left.dimension.sortOrder - right.dimension.sortOrder)
      .map((judgment) => ({
        slug: judgment.dimension.slug,
        name: judgment.dimension.name,
        stance: judgment.stance,
      })),
  }));
}

