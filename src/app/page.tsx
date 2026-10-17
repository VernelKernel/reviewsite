import { HomeReviewStrip, type HomeReviewCard } from "@/components/home/review-strip";
import { reviewHref, workTypeLabel } from "@/lib/domain/labels";
import { releaseYear, workArt } from "@/lib/works/present";
import { homeRecentEvaluations } from "@/lib/works/queries";

const heroHref = "/games/darwin-s-paradox/reviews/ign";

export default async function HomePage() {
  const evaluations = await homeRecentEvaluations(12);
  const reviews: HomeReviewCard[] = evaluations.map((evaluation) => {
    const art = workArt(evaluation.work.media);
    const image = art.wide ?? art.tall;
    return {
      href: reviewHref(evaluation.work.workType, evaluation.work.slug, evaluation.reviewer.slug),
      title: evaluation.work.title,
      typeLabel: workTypeLabel[evaluation.work.workType] ?? "Work",
      year: releaseYear(evaluation.work.releases),
      reviewerName: evaluation.reviewer.displayName,
      artSrc: image?.src ?? null,
      enjoyment: evaluation.enjoyment,
      execution: evaluation.execution,
    };
  });

  return (
    <main className="page shell home-page">
      <div className="home-hero-band">
        <div className="home-sweep" aria-hidden="true">
          <svg viewBox="0 0 640 360" preserveAspectRatio="xMinYMax meet">
            <polygon points="0,150 190,90 250,230 30,300" fill="var(--color-accent)" opacity="0.07" />
            <polygon points="18,210 170,170 230,330 0,360" fill="var(--color-accent)" opacity="0.12" />
            <polygon points="80,250 250,210 290,360 50,360" fill="var(--color-accent)" opacity="0.05" />
            <polygon points="150,120 330,170 290,300 130,250" fill="var(--color-accent)" opacity="0.09" />
          </svg>
        </div>
        <section className="home-entry">
          <section className="home-intro">
            <p className="kicker">Games and movies</p>
            <h1 className="display">Show how you experienced it.</h1>
            <p className="lede">
              Turn your reviews on games and movies into a colorful, one-of-a-kind visual review that's yours to share, compare, and explore with everyone.
            </p>
            <div className="home-actions">
              <a className="btn btn-primary btn-large" href="/review/new?type=game">
                <i className="home-action-icon" data-icon="gamepad" aria-hidden="true" />
                Review a Game
              </a>
              <a className="btn btn-primary btn-large" href="/review/new?type=movie">
                <i className="home-action-icon" data-icon="clapper" aria-hidden="true" />
                Review a Movie
              </a>
            </div>
            <p className="home-links">
              <a href="/games">
                Browse the catalog <span aria-hidden="true">→</span>
              </a>
              <a href="/discover">
                Explore by genre <span aria-hidden="true">→</span>
              </a>
            </p>
          </section>
          <a className="home-hero-link" href={heroHref}>
            <img
              src="/home/darwins-paradox-ign.png"
              alt="IGN's evaluation of Darwin's Paradox!. Positive on enjoyment and mixed on execution."
              width={2160}
              height={3032}
            />
          </a>
        </section>
      </div>
      {reviews.length > 0 ? <HomeReviewStrip reviews={reviews} /> : null}
    </main>
  );
}
