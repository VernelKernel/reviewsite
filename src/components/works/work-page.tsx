import { notFound } from "next/navigation";
import type { WorkType } from "@/generated/prisma/client";
import { CompareButton } from "@/components/comparison/compare-controls";
import { PopulationGauges } from "@/components/evaluations/population-gauges";
import { ReviewLandscapeView } from "@/components/evaluations/review-landscape";
import { ReceptionColumns } from "@/components/works/reception-columns";
import { toReview } from "@/components/works/work-record";
import { splitLandscapes } from "@/lib/aggregation/landscape";
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
import { getWork, worksSharingCreator } from "@/lib/works/queries";
import {
  landscapesFor,
  primaryArt,
  relatedLinks,
  releaseYear,
  roleName,
  toLandscapeInput,
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
  const art = primaryArt(work.media);
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
  const reviews = filtered.map((evaluation) => toReview(work.workType, work.slug, evaluation));
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
        <div className="key-art-frame">
          {art ? <img className="key-art" src={art.src} alt={art.alt} /> : <div className="key-art" />}
        </div>
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

      <FilterBar
        base={base}
        lens={lens}
        standard={standard}
        completion={completion}
        platform={platform}
        platforms={platformOptions}
      />
      <ReviewLandscapeView
        critics={landscape.critics}
        audience={landscape.audience}
        filteredNote={filteredNote}
        share={{ title: work.title, path: shareQuery ? `${base}?${shareQuery}` : base }}
      />
      <ReceptionColumns
        critics={reviews.filter((review) => review.population === "CRITIC")}
        audience={reviews.filter((review) => review.population !== "CRITIC")}
        criticHref={criticsHref(work.workType, work.slug)}
        audienceHref={audienceHref(work.workType, work.slug)}
      />

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

function FilterBar({
  base,
  lens,
  standard,
  completion,
  platform,
  platforms,
}: {
  base: string;
  lens?: string;
  standard?: string;
  completion?: string;
  platform?: string;
  platforms: { slug: string; name: string }[];
}) {
  const current = { lens, standard, completion, platform };
  return (
    <div className="filters" aria-label="Filter evaluations">
      <a className="chip" href={href(base, current, "lens")} aria-current={!lens ? "true" : undefined}>
        Any approach
      </a>
      {lenses.map((value) => (
        <a key={value} className="chip" href={href(base, current, "lens", value)} aria-current={lens === value ? "true" : undefined}>
          {lensLabel[value]}
        </a>
      ))}
      {standards.map((value) => (
        <a
          key={value}
          className="chip"
          href={href(base, current, "standard", value)}
          aria-current={standard === value ? "true" : undefined}
        >
          {standardLabel[value]}
        </a>
      ))}
      {completions.map((value) => (
        <a
          key={value}
          className="chip"
          href={href(base, current, "completion", value)}
          aria-current={completion === value ? "true" : undefined}
        >
          {completionLabel[value]}
        </a>
      ))}
      {platforms.length > 0 ? (
        <a className="chip" href={href(base, current, "platform")} aria-current={!platform ? "true" : undefined}>
          Any platform
        </a>
      ) : null}
      {platforms.map((item) => (
        <a
          key={item.slug}
          className="chip"
          href={href(base, current, "platform", item.slug)}
          aria-current={platform === item.slug ? "true" : undefined}
        >
          {item.name}
        </a>
      ))}
    </div>
  );
}

function href(
  base: string,
  current: { lens?: string; standard?: string; completion?: string; platform?: string },
  key: string,
  value?: string,
) {
  const params = new URLSearchParams();
  for (const [name, existing] of Object.entries(current)) {
    if (existing && name !== key) params.set(name, existing);
  }
  if (value) params.set(key, value);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
