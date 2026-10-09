import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IdentityGate } from "@/components/intake/identity-gate";
import { PersonalDownload } from "@/components/intake/personal-download";
import { PersonalShape } from "@/components/intake/personal-shape";
import { stanceClass, stanceLabel, workHref } from "@/lib/domain/labels";
import { loadOwnedIntake } from "@/lib/intake/access";
import { personalHeadline, readJudgments } from "@/lib/intake/judgments";
import { prisma } from "@/lib/db/client";

export const metadata: Metadata = { title: "Your review" };

export default async function ReviewChartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const intake = await loadOwnedIntake(id);
  if (!intake) notFound();

  const stored = readJudgments(intake.judgments);
  const dimensions = stored.length
    ? await prisma.dimension.findMany({
        where: { id: { in: stored.map((judgment) => judgment.dimensionId) } },
        orderBy: { sortOrder: "asc" },
      })
    : [];
  const stanceById = new Map(stored.map((judgment) => [judgment.dimensionId, judgment.stance]));
  const axes = dimensions.flatMap((dimension) => {
    const stance = stanceById.get(dimension.id);
    return stance ? [{ name: dimension.name, stance }] : [];
  });
  const headline = personalHeadline(intake.enjoyment, intake.execution);
  const verified = Boolean(intake.user?.emailVerified);
  const headingId = "personal-chart-title";

  return (
    <main className="page shell">
      <section className="personal-chart" aria-labelledby={headingId}>
        <p className="kicker">Your evaluation</p>
        <h1 id={headingId}>{intake.rawTitle}</h1>
        <p className="lede">{headline}</p>
        <div className="personal-layout">
          <div>
            <PersonalShape axes={axes} labelledBy={headingId} />
            <p className="meta">Distance from the center is this evaluation’s stance. Unjudged dimensions are left off.</p>
          </div>
          <div className="personal-readings">
            <StanceMeter label="Enjoyment" stance={intake.enjoyment} />
            <StanceMeter label="Execution" stance={intake.execution} />
            {intake.rawPlatform ? <p className="meta">Platform: {intake.rawPlatform}</p> : null}
            {intake.rawGenre ? <p className="meta">Genre: {intake.rawGenre}</p> : null}
          </div>
        </div>
        {intake.reviewBody ? <p className="personal-note">{intake.reviewBody}</p> : null}
        <MatchNote
          status={intake.matchStatus}
          note={intake.matchNote}
          work={intake.work ? { title: intake.work.title, href: intake.work.status === "PUBLISHED" ? workHref(intake.work.workType, intake.work.slug) : null } : null}
          verified={verified}
        />
        <PersonalDownload
          title={intake.rawTitle}
          headline={headline}
          enjoyment={intake.enjoyment}
          execution={intake.execution}
          axes={axes}
          enabled={verified}
        />
      </section>
      {verified ? null : <IdentityGate intakeId={intake.id} emailPending={Boolean(intake.userId)} />}
    </main>
  );
}

function StanceMeter({ label, stance }: { label: string; stance: string }) {
  return (
    <div className="personal-reading">
      <div className="personal-reading-head">
        <strong>{label}</strong>
        <span className={stanceClass(stance)}>{stanceLabel[stance] ?? stance}</span>
      </div>
      <div className="personal-meter" aria-hidden="true">
        <span className={`personal-meter-fill personal-meter-${stance.toLowerCase()}`} />
      </div>
    </div>
  );
}

function MatchNote({
  status,
  note,
  work,
  verified,
}: {
  status: string;
  note: string | null;
  work: { title: string; href: string | null } | null;
  verified: boolean;
}) {
  if (!verified) {
    return <p className="meta">Matching this title to a work waits until your email is verified.</p>;
  }
  if (status === "MATCHED" && work) {
    return (
      <p className="meta">
        {work.href ? (
          <>
            This review is part of {work.title}. <a href={work.href}>Open the work</a>
          </>
        ) : (
          <>This review is part of {work.title}. The public page appears when that work is published.</>
        )}
      </p>
    );
  }
  if (status === "UNMATCHED") return <p className="meta">{note ?? "This title is not confirmed yet. The chart is still yours."}</p>;
  if (status === "FAILED") return <p className="meta">{note ?? "This review could not be added to a work."}</p>;
  if (status === "AMBIGUOUS") return <p className="meta">{note ?? "A few titles are close. The review is held until one is clearly the same work."}</p>;
  return <p className="meta">{note ?? "Matching this title to a work."}</p>;
}
