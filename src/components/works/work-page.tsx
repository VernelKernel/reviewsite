import { notFound } from "next/navigation";
import type { WorkType } from "@/generated/prisma/client";
import { CompareButton } from "@/components/comparison/compare-controls";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { ReviewLandscapeView } from "@/components/evaluations/review-landscape";
import { ReviewCard, type ReviewCardModel } from "@/components/reviews/review-card";
import { buildLandscape } from "@/lib/aggregation/landscape";
import {
  completionLabel,
  evaluateHref,
  lensLabel,
  standardLabel,
  workTypeLabel,
} from "@/lib/domain/labels";
import { getWork, worksSharingCreator } from "@/lib/works/queries";
import {
  creatorLine,
  formatDate,
  landscapeFor,
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
  const filtered = work.evaluations.filter((evaluation) => {
    if (lens && evaluation.lens !== lens) return false;
    if (standard && evaluation.standard !== standard) return false;
    if (completion && evaluation.completion !== completion) return false;
    return true;
  });
  const landscape = buildLandscape(filtered.map(toLandscapeInput));
  const overall = landscapeFor(work);
  const art = primaryArt(work.media);
  const year = releaseYear(work.releases);
  const developerIds = work.creators.filter((creator) => creator.role === "DEVELOPER").map((creator) => creator.creatorId);
  const sameCreator = await worksSharingCreator(work.id, developerIds);
  const related = relatedLinks(work, sameCreator);
  const base = `/${workType === "MOVIE" ? "movies" : "games"}/${work.slug}`;
  const filteredNote =
    filtered.length === work.evaluations.length
      ? overall.sampleNote
      : `Showing ${filtered.length} of ${work.evaluations.length} published evaluations. These figures describe the filtered set.`;

  const reviews: ReviewCardModel[] = filtered.map((evaluation) => ({
    workType: work.workType,
    workSlug: work.slug,
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
    reviewedOn: evaluation.reviewedOn,
    judgments: evaluation.judgments
      .slice()
      .sort((a, b) => a.dimension.sortOrder - b.dimension.sortOrder)
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
  }));

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
        {art ? <img className="key-art" src={art.src} alt={art.alt} /> : <div className="key-art" />}
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
                <dd>{work.genres.map((genre) => genre.genre.name).join(", ")}</dd>
              </div>
            ) : null}
            {work.platforms.length > 0 ? (
              <div>
                <dt>Platforms</dt>
                <dd>{work.platforms.map((platform) => platform.platform.name).join(", ")}</dd>
              </div>
            ) : null}
          </dl>
          <DistributionBar label="Enjoyment" distribution={overall.enjoyment} />
          <DistributionBar label="Execution" distribution={overall.execution} />
          <p className="sample-note">{overall.sampleNote}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={evaluateHref(work.workType, work.slug)}>
              Evaluate this work
            </a>
            <a className="btn btn-secondary" href="#reviews">
              Read evaluations
            </a>
            <CompareButton workType={work.workType} slug={work.slug} title={work.title} />
          </div>
        </div>
      </header>

      <ReviewLandscapeView landscape={landscape} filteredNote={filteredNote} />

      <section className="section" id="reviews">
        <div className="section-head">
          <h2>Evaluations</h2>
          <p>{creatorLine(work.creators) ? `${work.title} · ${creatorLine(work.creators)}` : work.title}</p>
        </div>
        <FilterBar base={base} lens={lens} standard={standard} completion={completion} />
        {reviews.length === 0 ? (
          <p className="empty">No evaluations in this filter. The work page is waiting on a different lens, or on a first evaluation.</p>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <ReviewCard key={`${review.reviewerSlug}-${formatDate(review.reviewedOn)}`} review={review} />
            ))}
          </div>
        )}
      </section>

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
}: {
  base: string;
  lens?: string;
  standard?: string;
  completion?: string;
}) {
  const current = { lens, standard, completion };
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
    </div>
  );
}

function href(base: string, current: { lens?: string; standard?: string; completion?: string }, key: string, value?: string) {
  const params = new URLSearchParams();
  for (const [name, existing] of Object.entries(current)) {
    if (existing && name !== key) params.set(name, existing);
  }
  if (value) params.set(key, value);
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
