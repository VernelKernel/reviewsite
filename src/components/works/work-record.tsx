import { notFound } from "next/navigation";
import type { WorkType } from "@/generated/prisma/client";
import { GapCallouts } from "@/components/comparison/gap-callouts";
import { CriticReading } from "@/components/evaluations/critic-reading";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { ReviewCard, type ReviewCardModel } from "@/components/reviews/review-card";
import { criticCoverage, splitLandscapes } from "@/lib/aggregation/landscape";
import { audienceHref, criticsHref, detailsHref, workHref } from "@/lib/domain/labels";
import { filterEvaluations } from "@/lib/works/filter-evaluations";
import { getWork } from "@/lib/works/queries";
import { formatDate, primaryArt, releaseYear, roleName, toLandscapeInput } from "@/lib/works/present";

export type RecordView = "critics" | "audience" | "details";

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function WorkRecordPage({
  workType,
  slug,
  view,
  searchParams,
}: {
  workType: WorkType;
  slug: string;
  view: RecordView;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const work = await getWork(workType, slug);
  if (!work || work.status !== "PUBLISHED") notFound();

  const platformOptions = [...work.platforms]
    .map((item) => item.platform)
    .sort((left, right) => left.name.localeCompare(right.name));
  const platform = platformOptions.find((item) => item.slug === one(searchParams.platform))?.slug;
  const population = view === "details" ? undefined : view === "critics" ? "CRITIC" : "AUDIENCE";
  const filtered = filterEvaluations(work.evaluations, { platform, population });
  const landscape = splitLandscapes(filtered.map(toLandscapeInput));
  const art = primaryArt(work.media);
  const base = view === "critics" ? criticsHref(work.workType, work.slug) : audienceHref(work.workType, work.slug);
  const reviews = filtered.map((evaluation) => toReview(work.workType, work.slug, evaluation));

  return (
    <article className="page shell">
      <p className="kicker">
        <a href={workHref(work.workType, work.slug)}>{work.title}</a>
      </p>
      <header className="record-head">
        {art ? <img className="record-thumb" src={art.src} alt="" /> : null}
        <h1>{recordTitle(work.title, view)}</h1>
      </header>
      <nav className="record-tabs" aria-label="Work record">
        <a href={criticsHref(work.workType, work.slug)} aria-current={view === "critics" ? "page" : undefined}>
          Critics
        </a>
        <a href={audienceHref(work.workType, work.slug)} aria-current={view === "audience" ? "page" : undefined}>
          Audience
        </a>
        <a href={detailsHref(work.workType, work.slug)} aria-current={view === "details" ? "page" : undefined}>
          Details
        </a>
      </nav>

      {view === "details" ? (
        <Details work={work} />
      ) : (
        <RecordList
          view={view}
          reviews={reviews}
          critics={landscape.critics}
          audience={landscape.audience}
          base={base}
          platform={platform}
          platforms={platformOptions}
        />
      )}
    </article>
  );
}

function recordTitle(title: string, view: RecordView): string {
  if (view === "critics") return `${title} critic reviews`;
  if (view === "audience") return `${title} audience reviews`;
  return `${title} details`;
}

function RecordList({
  view,
  reviews,
  critics,
  audience,
  base,
  platform,
  platforms,
}: {
  view: "critics" | "audience";
  reviews: ReviewCardModel[];
  critics: ReturnType<typeof splitLandscapes>["critics"];
  audience: ReturnType<typeof splitLandscapes>["audience"];
  base: string;
  platform?: string;
  platforms: { slug: string; name: string }[];
}) {
  const landscape = view === "critics" ? critics : audience;
  const showing =
    view === "critics"
      ? `Showing ${criticCoverage(landscape.sampleSize)}`
      : `Showing ${landscape.sampleSize} audience ${landscape.sampleSize === 1 ? "evaluation" : "evaluations"}`;

  return (
    <div className="record-body">
      {platforms.length > 0 ? (
        <div className="filters" aria-label="Filter by platform">
          <a className="chip" href={base} aria-current={!platform ? "true" : undefined}>
            Any platform
          </a>
          {platforms.map((item) => (
            <a
              key={item.slug}
              className="chip"
              href={`${base}?platform=${encodeURIComponent(item.slug)}`}
              aria-current={platform === item.slug ? "true" : undefined}
            >
              {item.name}
            </a>
          ))}
        </div>
      ) : null}
      <div className="record-gauges">
        <DistributionBar
          label="Enjoyment"
          distribution={landscape.enjoyment}
          unit={view === "critics" ? "outlet" : "judgment"}
        />
        <DistributionBar
          label="Execution"
          distribution={landscape.execution}
          unit={view === "critics" ? "outlet" : "judgment"}
        />
        {view === "audience" ? <GapCallouts landscape={audience} /> : null}
      </div>
      <p className="sample-note">{showing}</p>
      {reviews.length === 0 ? (
        <p className="empty">
          {view === "critics"
            ? "No core outlets have a reading in this view yet."
            : "No audience evaluations in this view yet."}
        </p>
      ) : (
        <div className="review-list">
          {reviews.map((review) =>
            view === "critics" ? (
              <CriticReading key={review.reviewerSlug} review={review} />
            ) : (
              <ReviewCard key={review.reviewerSlug} review={review} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function Details({ work }: { work: NonNullable<Awaited<ReturnType<typeof getWork>>> }) {
  const year = releaseYear(work.releases);
  const dated = work.releases
    .map((release) => release.releasedOn)
    .filter((date): date is Date => date instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime());
  const released = dated[0] ? formatDate(dated[0]) : year ? String(year) : null;
  const developers = work.creators.filter((creator) => creator.role === "DEVELOPER" || creator.role === "DIRECTOR");
  const publishers = work.creators.filter((creator) => creator.role === "PUBLISHER");
  const others = work.creators.filter(
    (creator) => creator.role !== "DEVELOPER" && creator.role !== "DIRECTOR" && creator.role !== "PUBLISHER",
  );
  const genres = [...work.genres].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary));

  return (
    <div className="record-body">
      {work.synopsis ? (
        <p className="lede">{work.synopsis}</p>
      ) : (
        <p className="meta">No description is stored for this work yet.</p>
      )}
      <dl className="fact-list record-facts">
        {work.platforms.length > 0 ? (
          <div>
            <dt>Platforms</dt>
            <dd>{work.platforms.map((item) => item.platform.name).join(", ")}</dd>
          </div>
        ) : null}
        {released ? (
          <div>
            <dt>Released</dt>
            <dd>{released}</dd>
          </div>
        ) : null}
        {developers.length > 0 ? (
          <div>
            <dt>{developers.length === 1 ? roleName(developers[0].role) : "Creators"}</dt>
            <dd>{developers.map((creator) => creator.creator.name).join(", ")}</dd>
          </div>
        ) : null}
        {publishers.length > 0 ? (
          <div>
            <dt>{publishers.length === 1 ? "Publisher" : "Publishers"}</dt>
            <dd>{publishers.map((creator) => creator.creator.name).join(", ")}</dd>
          </div>
        ) : null}
        {others.length > 0 ? (
          <div>
            <dt>Also credited</dt>
            <dd>{others.map((creator) => `${creator.creator.name} (${roleName(creator.role)})`).join(", ")}</dd>
          </div>
        ) : null}
        {genres.length > 0 ? (
          <div>
            <dt>Genres</dt>
            <dd>{genres.map((genre) => genre.genre.name).join(", ")}</dd>
          </div>
        ) : null}
        {work.steamReception ? (
          <div>
            <dt>On Steam</dt>
            <dd>
              {work.steamReception.label}
              {work.steamReception.totalCount > 0
                ? ` · ${work.steamReception.totalCount.toLocaleString("en-US")} reviews`
                : ""}
              <span className="steam-links">
                <a href={work.steamReception.storeUrl}>Store page</a>
                <a href={work.steamReception.reviewsUrl}>Read the reviews on Steam</a>
              </span>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function toReview(
  workType: string,
  workSlug: string,
  evaluation: NonNullable<Awaited<ReturnType<typeof getWork>>>["evaluations"][number],
): ReviewCardModel {
  return {
    workType,
    workSlug,
    reviewerName: evaluation.reviewer.displayName,
    reviewerSlug: evaluation.reviewer.slug,
    lens: evaluation.lens,
    standard: evaluation.standard,
    standardNote: evaluation.standardNote,
    enjoyment: evaluation.enjoyment,
    execution: evaluation.execution,
    completion: evaluation.completion,
    playtime: evaluation.playtime,
    ownership: evaluation.ownership,
    platform: evaluation.platform?.name ?? null,
    platformSlug: evaluation.platform?.slug ?? null,
    population: evaluation.population === "CRITIC" ? "CRITIC" : "AUDIENCE",
    reviewedOn: evaluation.reviewedOn,
    judgments: evaluation.judgments
      .slice()
      .sort((left, right) => left.dimension.sortOrder - right.dimension.sortOrder)
      .map((judgment) => ({ name: judgment.dimension.name, stance: judgment.stance })),
    observations: evaluation.observations.map((observation) => ({
      topic: observation.topic.name,
      polarity: observation.polarity,
      content: observation.content,
    })),
    review: evaluation.review
      ? {
          title: evaluation.review.title,
          body: evaluation.review.body,
          source: evaluation.review.source,
          importSourceName: evaluation.review.importSourceName,
          importSourceUrl: evaluation.review.importSourceUrl,
        }
      : null,
  };
}
