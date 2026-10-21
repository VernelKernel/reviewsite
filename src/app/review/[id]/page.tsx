import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DimensionReading } from "@/components/evaluations/dimension-reading";
import { IdentityGate } from "@/components/intake/identity-gate";
import { PersonalDownload } from "@/components/intake/personal-download";
import { PersonalShape } from "@/components/intake/personal-shape";
import { stanceClass, stanceLabel, workHref } from "@/lib/domain/labels";
import { loadOwnedIntake } from "@/lib/intake/access";
import { personalHeadline, readJudgments } from "@/lib/intake/judgments";
import { readStoredSections } from "@/lib/reviews/sections";
import { ReviewProse } from "@/components/reviews/review-prose";
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
  const byId = new Map(stored.map((judgment) => [judgment.dimensionId, judgment]));
  const readings = dimensions.flatMap((dimension) => {
    const judgment = byId.get(dimension.id);
    return judgment ? [{ name: dimension.name, stance: judgment.stance, mattered: judgment.mattered, family: dimension.family }] : [];
  });
  const axes = readings.filter((reading) => reading.family !== "ENJOYMENT");
  const enjoymentAxes = readings.filter((reading) => reading.family === "ENJOYMENT");
  const headline = personalHeadline(intake.enjoyment, intake.execution);
  const verified = Boolean(intake.user?.emailVerified);
  const headingId = "personal-chart-title";
  const noteSections = await intakeSections(intake.reviewSections);

  return (
    <main className="page shell">
      <section className="personal-chart" aria-labelledby={headingId}>
        <p className="kicker">Your evaluation</p>
        <h1 id={headingId}>{intake.rawTitle}</h1>
        <p className="lede">{headline}</p>
        <div className="personal-layout">
          <div>
            <PersonalShape axes={axes} labelledBy={headingId} />
          </div>
          <div className="personal-readings">
            <StanceMeter label="Enjoyment" stance={intake.enjoyment} />
            {enjoymentAxes.length > 0 ? (
              <ul className="dimension-breakdown" aria-label="Enjoyment dimensions">
                {enjoymentAxes.map((axis) => (
                  <li key={axis.name}>
                    <DimensionReading name={axis.name} stance={axis.stance} mattered={axis.mattered} />
                  </li>
                ))}
              </ul>
            ) : null}
            <StanceMeter label="Execution" stance={intake.execution} />
            {intake.rawPlatform ? <p className="meta">Platform: {intake.rawPlatform}</p> : null}
            {intake.rawGenre ? <p className="meta">Genre: {intake.rawGenre}</p> : null}
          </div>
        </div>
        {intake.reviewBody ? (
          <div className="personal-note">
            <ReviewProse body={intake.reviewBody} sections={noteSections} />
          </div>
        ) : null}
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
  const icon = label === "Enjoyment" ? "heart" : label === "Execution" ? "gear" : null;
  return (
    <div className="personal-reading">
      <div className="personal-reading-head">
        <strong>
          {icon ? <i className="flair-icon" data-icon={icon} aria-hidden="true" /> : null}
          {label}
        </strong>
        <span className={stanceClass(stance)}>{stanceLabel[stance] ?? stance}</span>
      </div>
      <div className="personal-meter" aria-hidden="true">
        <span className={`personal-meter-fill personal-meter-${stance.toLowerCase()}`} />
      </div>
    </div>
  );
}

async function intakeSections(value: unknown) {
  const stored = readStoredSections(value);
  const ids = stored.flatMap((section) => (section.dimensionId ? [section.dimensionId] : []));
  const dimensions = ids.length
    ? await prisma.dimension.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const names = new Map(dimensions.map((dimension) => [dimension.id, dimension.name]));
  return stored.map((section) => ({
    heading: section.dimensionId ? (names.get(section.dimensionId) ?? null) : null,
    body: section.body,
  }));
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
