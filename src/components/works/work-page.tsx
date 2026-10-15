import { notFound } from "next/navigation";
import type { WorkType } from "@/generated/prisma/client";
import { CompareButton } from "@/components/comparison/compare-controls";
import { AudiencePlacementView } from "@/components/comparison/audience-placement";
import { CriticAlignmentPanel } from "@/components/comparison/critic-alignment-panel";
import { FollowedOnWork } from "@/components/comparison/followed-on-work";
import { PopulationGauges } from "@/components/evaluations/population-gauges";
import { FilterForm, type FilterGroup } from "@/components/works/filter-form";
import { HeroArt } from "@/components/works/work-art";
import { WorkReading } from "@/components/works/work-reading";
import { toReview } from "@/components/works/work-record";
import { splitLandscapes } from "@/lib/aggregation/landscape";
import { alignCritics, type CriticEvaluation } from "@/lib/comparison/critic-alignment";
import { placeAudience, type PlacementEvaluation } from "@/lib/comparison/placement";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import {
  audienceHref,
  completionLabel,
  criticsHref,
  detailsHref,
  evaluateHref,
  lensLabel,
  standardLabel,
  workTypeLabel,
} from "@/lib/domain/labels";
import { filterEvaluations } from "@/lib/works/filter-evaluations";
import { getWork, worksSharingCreator, type FullWork } from "@/lib/works/queries";
import {
  landscapesFor,
  relatedLinks,
  releaseYear,
  roleName,
  snapshotPeriod,
  toLandscapeInput,
  workArt,
} from "@/lib/works/present";

const lenses = ["EXECUTION", "EXPERIENCE", "MIXED"] as const;
const standards = ["ABSOLUTE", "CONTEXTUAL", "MIXED"] as const;
const completions = ["JUST_STARTED", "EARLY", "SUBSTANTIAL", "COMPLETED", "ENDGAME", "POST_GAME", "ABANDONED"] as const;
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function WorkPage({
  workType,
  slug,
  searchParams,
}: {
  workType: WorkType;
  slug: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const work = await getWork(workType, slug);
  if (!work || work.status !== "PUBLISHED") notFound();

  const lens = lenses.find((item) => item === one(searchParams.lens));
  const standard = standards.find((item) => item === one(searchParams.standard));
  const completion = completions.find((item) => item === one(searchParams.completion));
  const platformOptions = [...work.platforms]
    .map((item) => item.platform)
    .sort((left, right) => left.name.localeCompare(right.name));
  const platform = platformOptions.find((item) => item.slug === one(searchParams.platform))?.slug;
  const filtered = filterEvaluations(work.evaluations, { lens, standard, completion, platform });
  const landscape = splitLandscapes(filtered.map(toLandscapeInput));
  const overall = landscapesFor(work);
  const art = workArt(work.media);
  const year = releaseYear(work.releases);
  const developerIds = work.creators.filter((creator) => creator.role === "DEVELOPER").map((creator) => creator.creatorId);
  const sameCreator = await worksSharingCreator(work.id, developerIds);
  const related = relatedLinks(work, sameCreator);
  const base = `/${workType === "MOVIE" ? "movies" : "games"}/${work.slug}`;
  const filteredNote =
    filtered.length === work.evaluations.length
      ? undefined
      : `Showing ${filtered.length} of ${work.evaluations.length} published evaluations. These figures describe the filtered set.`;

  const shareParams = new URLSearchParams();
  if (lens) shareParams.set("lens", lens);
  if (standard) shareParams.set("standard", standard);
  if (completion) shareParams.set("completion", completion);
  if (platform) shareParams.set("platform", platform);
  const shareQuery = shareParams.toString();
  const platformName = platformOptions.find((item) => item.slug === platform)?.name;
  const activeFilters = [
    lens ? lensLabel[lens] : null,
    standard ? standardLabel[standard] : null,
    completion ? completionLabel[completion] : null,
    platformName ?? null,
  ].filter((item): item is string => Boolean(item));
  const filterGroups: FilterGroup[] = [
    { name: "lens", label: "Approach", anyLabel: "Any approach", value: lens, options: lenses.map((value) => ({ value, label: lensLabel[value] })) },
    {
      name: "standard",
      label: "Standard",
      anyLabel: "Any standard",
      value: standard,
      options: standards.map((value) => ({ value, label: standardLabel[value] })),
    },
    {
      name: "completion",
      label: "Experience",
      anyLabel: "Any experience",
      value: completion,
      options: completions.map((value) => ({ value, label: completionLabel[value] })),
    },
    ...(platformOptions.length > 0
      ? [
          {
            name: "platform",
            label: "Platform",
            anyLabel: "Any platform",
            value: platform,
            options: platformOptions.map((item) => ({ value: item.slug, label: item.name })),
          },
        ]
      : []),
  ];
  const reviews = filtered.map((evaluation) => toReview(work.workType, work.slug, evaluation));
  const viewer = await getCurrentUser();
  const viewerId = viewer?.profile?.id;
  const viewerEvaluation = viewerId
    ? work.evaluations.find((evaluation) => evaluation.population === "AUDIENCE" && evaluation.reviewer.id === viewerId)
    : undefined;
  const viewerInFilter = viewerEvaluation ? filtered.some((evaluation) => evaluation.id === viewerEvaluation.id) : false;
  const audiencePlacement =
    viewerEvaluation && viewerInFilter
      ? placeAudience(
          toPlacement(viewerEvaluation),
          filtered.filter((evaluation) => evaluation.population === "AUDIENCE").map(toPlacement),
        )
      : null;
  const criticRows = work.evaluations.filter((evaluation) => evaluation.population === "CRITIC").map(toCritic);
  const criticMetrics = viewerEvaluation && criticRows.length > 0 ? alignCritics(toPlacement(viewerEvaluation), criticRows) : [];
  const followedIds = viewer
    ? new Set(
        (
          await prisma.followedReviewer.findMany({
            where: { userId: viewer.id },
            select: { reviewerId: true },
          })
        ).map((row) => row.reviewerId),
      )
    : new Set<string>();
  const followedHere = work.evaluations
    .filter((evaluation) => followedIds.has(evaluation.reviewer.id))
    .map((evaluation) => ({
      reviewerSlug: evaluation.reviewer.slug,
      displayName: evaluation.reviewer.displayName,
      workType: work.workType,
      workSlug: work.slug,
      enjoyment: evaluation.enjoyment,
      execution: evaluation.execution,
      completion: evaluation.completion,
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": work.workType === "MOVIE" ? "Movie" : "VideoGame",
    name: work.title,
    description: work.synopsis ?? undefined,
    datePublished: year ? String(year) : undefined,
  };

  return (
    <article className="page shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="work-hero">
        <HeroArt art={art} />
        <div className="hero-copy">
          <p className="kicker">{workTypeLabel[work.workType]}</p>
          <h1 className="hero-title">{work.title}</h1>
          {work.synopsis ? <p className="lede">{work.synopsis}</p> : null}
          <dl className="fact-list">
            {year ? (
              <div>
                <dt>Released</dt>
                <dd>{year}</dd>
              </div>
            ) : null}
            {work.creators.length > 0 ? (
              <div>
                <dt>Creators</dt>
                <dd>{work.creators.map((creator) => `${creator.creator.name} (${roleName(creator.role)})`).join(", ")}</dd>
              </div>
            ) : null}
            {work.genres.length > 0 ? (
              <div>
                <dt>Genres</dt>
                <dd>
                  {[...work.genres]
                    .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary))
                    .map((genre) => genre.genre.name)
                    .join(", ")}
                </dd>
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
            {work.platforms.length > 0 ? (
              <div>
                <dt>Platforms</dt>
                <dd>{work.platforms.map((platform) => platform.platform.name).join(", ")}</dd>
              </div>
            ) : null}
          </dl>
          <PopulationGauges
            critics={overall.critics}
            audience={overall.audience}
            criticHref={criticsHref(work.workType, work.slug)}
            audienceHref={audienceHref(work.workType, work.slug)}
          />
        </div>
        <div className="hero-actions">
          <a className="btn btn-primary" href={evaluateHref(work.workType, work.slug)}>
            Evaluate this work
          </a>
          <a className="btn btn-secondary" href={audienceHref(work.workType, work.slug)}>
            Read evaluations
          </a>
          <a className="btn btn-secondary" href={detailsHref(work.workType, work.slug)}>
            Details
          </a>
          <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
        </div>
      </header>

      <FollowedOnWork evaluations={followedHere} />
      <WorkReading
        critics={landscape.critics}
        audience={landscape.audience}
        totalEvaluations={work.evaluations.length}
        clearHref={base}
        filteredNote={filteredNote}
        toolbar={<FilterForm key="filters" base={base} groups={filterGroups} />}
        share={{ title: work.title, path: shareQuery ? `${base}?${shareQuery}` : base }}
        card={{
          kind: workTypeLabel[work.workType],
          period: snapshotPeriod(filtered.map((evaluation) => evaluation.reviewedOn ?? evaluation.createdAt)),
          filters: activeFilters,
        }}
        criticReviews={reviews.filter((review) => review.population === "CRITIC")}
        audienceReviews={reviews.filter((review) => review.population !== "CRITIC")}
        criticHref={criticsHref(work.workType, work.slug)}
        audienceHref={audienceHref(work.workType, work.slug)}
      >
        {audiencePlacement ? <AudiencePlacementView placement={audiencePlacement} /> : null}
        {criticMetrics.length > 0 ? <CriticAlignmentPanel metrics={criticMetrics} /> : null}
      </WorkReading>

      {related.length > 0 ? (
        <section className="section">
          <h2>Related works</h2>
          <ul className="evidence-list">
            {related.map((item) => (
              <li key={`${item.phrase}-${item.href}`}>
                <a href={item.href}>
                  {item.phrase} {item.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function toPlacement(evaluation: FullWork["evaluations"][number]): PlacementEvaluation {
  return {
    reviewerId: evaluation.reviewer.id,
    enjoyment: evaluation.enjoyment,
    execution: evaluation.execution,
    lens: evaluation.lens,
    standard: evaluation.standard,
    judgments: [...evaluation.judgments]
      .sort((left, right) => left.dimension.sortOrder - right.dimension.sortOrder)
      .map((judgment) => ({
        slug: judgment.dimension.slug,
        name: judgment.dimension.name,
        stance: judgment.stance,
      })),
  };
}

function toCritic(evaluation: FullWork["evaluations"][number]): CriticEvaluation {
  const imported = evaluation.review?.importSourceName?.trim();
  return {
    outlet: imported || evaluation.reviewer.displayName,
    reviewerName: evaluation.reviewer.displayName,
    enjoyment: evaluation.enjoyment,
    execution: evaluation.execution,
    judgments: [...evaluation.judgments]
      .sort((left, right) => left.dimension.sortOrder - right.dimension.sortOrder)
      .map((judgment) => ({
        slug: judgment.dimension.slug,
        name: judgment.dimension.name,
        stance: judgment.stance,
      })),
  };
}
