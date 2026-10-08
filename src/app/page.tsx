export default function HomePage() {
  return (
    <main className="page shell home-entry">
      <div className="home-drift" aria-hidden="true">
        <span className="drift drift-a" />
        <span className="drift drift-b" />
        <span className="drift drift-c" />
      </div>
      <section className="home-intro">
        <p className="kicker">Frame</p>
        <h1 className="display">Create your review</h1>
        <p className="lede">
          State how you evaluated a game or a movie. You get a chart of your own judgments. The review joins the record once your email is verified and the title matches.
        </p>
        <div className="home-actions">
          <a className="btn btn-primary btn-large" href="/review/new?type=game">
            Games
          </a>
          <a className="btn btn-primary btn-large" href="/review/new?type=movie">
            Movies
          </a>
        </div>
        <p className="meta">
          <a href="/games">Browse the catalog</a>
          {" · "}
          <a href="/discover">Patterns within a genre</a>
        </p>
      </section>
      <div className="home-samples">
        <img
          className="home-sample home-sample-chart"
          src="/home/ace-combat-chart.png"
          alt="Personal chart for Ace Combat 8: Wings of Theve. Mixed on enjoyment and mixed on execution."
          width={1024}
          height={811}
        />
        <img
          className="home-sample home-sample-reading"
          src="/home/ace-combat-reading.png"
          alt="BonzoMan's evaluation of Ace Combat 8 on PC, with mixed enjoyment and execution."
          width={1024}
          height={542}
        />
      </div>
    </main>
  );
}
