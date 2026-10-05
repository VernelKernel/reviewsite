export default function NotFound() {
  return (
    <main className="page shell">
      <p className="kicker">Missing</p>
      <h1>That page is not in the catalog.</h1>
      <p className="lede" style={{ marginTop: "1rem" }}>
        <a href="/games">Browse works</a> or <a href="/search">search</a>.
      </p>
    </main>
  );
}
