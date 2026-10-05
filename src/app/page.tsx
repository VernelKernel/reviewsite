import { WorkCard } from "@/components/works/work-card";
import { reviewHref } from "@/lib/domain/labels";
import { listWorks, recentEvaluations } from "@/lib/works/queries";

export default async function HomePage() {
  const [works, recent] = await Promise.all([listWorks(), recentEvaluations(3)]);
  const games = works.filter((work) => work.workType === "GAME");
  const movies = works.filter((work) => work.workType === "MOVIE");
  const evaluationCount = works.reduce((sum, work) => sum + work.evaluations.length, 0);

  return (
    <main className="page shell">
      <section className="home-intro">
        <p className="kicker">Frame</p>
        <h1 className="display">What a rating actually means.</h1>
        <p className="lede">
          People can love a game and still think it is poorly executed. They can respect the craft and not enjoy it. Frame keeps those judgments apart, and keeps the standard that produced them visible.
        </p>
        <div className="counts">
          <span>{works.length} works</span>
          <span>{evaluationCount} published evaluations</span>
        </div>
        <p className="meta">
          <a href="/discover">Patterns within a genre</a>
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Games</h2>
          <p>A focused catalog. Enough disagreement to show why the distinction matters.</p>
        </div>
        <div className="grid-cards">
          {games.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </section>

      {movies.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <h2>The same system, outside games</h2>
            <p>Movies use different dimensions. The evaluation itself does not change.</p>
          </div>
          <div className="grid-cards">
            {movies.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section className="section">
          <h2>Recent written evaluations</h2>
          <ul className="evidence-list" style={{ marginTop: "1.25rem" }}>
            {recent.map((evaluation) => (
              <li key={evaluation.id}>
                <a href={reviewHref(evaluation.work.workType, evaluation.work.slug, evaluation.reviewer.slug)}>
                  {evaluation.reviewer.displayName} on {evaluation.work.title}
                </a>
                {evaluation.review?.body ? (
                  <p className="meta">
                    {evaluation.review.body.length > 180
                      ? `${evaluation.review.body.slice(0, 180).replace(/\s+\S*$/, "")}…`
                      : evaluation.review.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
