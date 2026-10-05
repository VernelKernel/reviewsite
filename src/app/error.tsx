"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page shell">
      <h1>This page didn’t load</h1>
      <p className="lede" style={{ margin: "1rem 0" }}>
        The evaluations could not be read. If you are running the site locally, check that PostgreSQL is running.
      </p>
      <button className="btn btn-primary" type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
