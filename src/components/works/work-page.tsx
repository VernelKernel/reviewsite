import { notFound } from "next/navigation";
import type { WorkType } from "@/generated/prisma/client";
import { AudiencePlacementView } from "@/components/comparison/audience-placement";
import { CriticAlignmentPanel } from "@/components/comparison/critic-alignment-panel";
import { FollowedOnWork } from "@/components/comparison/followed-on-work";
import { FilterForm, type FilterGroup } from "@/components/works/filter-form";
import { HeroArt } from "@/components/works/work-art";
import { WorkNav } from "@/components/works/work-nav";
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
  evaluateHref,
  workTypeLabel,
} from "@/lib/domain/labels";
import { filterEvaluations } from "@/lib/works/filter-evaluations";
import { getWork, worksSharingCreator, type FullWork } from "@/lib/works/queries";
import {
  relatedLinks,
  releaseYear,
  roleName,
  snapshotPeriod,
  toLandscapeInput,
  workArt,
} from "@/lib/works/present";

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

  const completion = completions.find((item) => item === one(searchParams.completion));
  const platformOptions = [...work.platforms]
    .map((item) => item.platform)
    .sort((left, right) => left.name.localeCompare(right.name));
  const platform = platformOptions.find((item) => item.slug === one(searchParams.platform))?.slug;
  const filtered = filterEvaluations(work.evaluations, { completion, platform });
  const landscape = splitLandscapes(filtered.map(toLandscapeInput));
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
  if (completion) shareParams.set("completion", completion);
  if (platform) shareParams.set("platform", platform);
  const shareQuery = shareParams.toString();
  const platformName = platformOptions.find((item) => item.slug === platform)?.name;
  const activeFilters = [completion ? completionLabel[completion] : null, platformName ?? null].filter((item): item is string => Boolean(item));
  const filterGroups: FilterGroup[] = [
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

  const hasFacts = Boolean(year || work.creators.length || work.genres.length || work.platforms.length);
  const personal = Boolean(audiencePlacement || criticMetrics.length > 0);

  return (
    <article className="page shell work-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="work-frame">
        <div className="work-rail">
          <HeroArt art={art} className="work-poster" />
          <WorkNav workType={work.workType} slug={work.slug} title={work.title} />
        </div>
        <div className="work-main">
          <header className="work-intro">
            <div className="hero-copy">
              <p className="kicker">{workTypeLabel[work.workType]}</p>
              <h1>{work.title}</h1>
              {work.synopsis ? <p className="lede">{work.synopsis}</p> : null}
              <a className="btn btn-primary" href={evaluateHref(work.workType, work.slug)}>
                Evaluate this work
              </a>
            </div>
            {hasFacts ? (
              <aside className="fact-card">
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
                  {work.platforms.length > 0 ? (
                    <div>
                      <dt>Platforms</dt>
                      <dd>{work.platforms.map((item) => item.platform.name).join(", ")}</dd>
                    </div>
                  ) : null}
                </dl>
              </aside>
            ) : null}
          </header>
          {followedHere.length > 0 ? (
            <div className="reading-measure">
              <FollowedOnWork evaluations={followedHere} />
            </div>
          ) : null}
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
              coverSrc: art.tall?.src ?? art.wide?.src ?? null,
            }}
            criticReviews={reviews.filter((review) => review.population === "CRITIC")}
            audienceReviews={reviews.filter((review) => review.population !== "CRITIC")}
            criticHref={criticsHref(work.workType, work.slug)}
            audienceHref={audienceHref(work.workType, work.slug)}
          >
            {personal ? (
              <div className="reading-measure">
                {audiencePlacement ? <AudiencePlacementView placement={audiencePlacement} /> : null}
                {criticMetrics.length > 0 ? <CriticAlignmentPanel metrics={criticMetrics} /> : null}
              </div>
            ) : null}
          </WorkReading>

          {related.length > 0 ? (
            <section className="section reading-measure">
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
        </div>
      </div>
    </article>
  );
}

function toPlacement(evaluation: FullWork["evaluations"][number]): PlacementEvaluation {
  return {
    reviewerId: evaluation.reviewer.id,
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
