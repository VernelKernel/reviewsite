import { AppearanceControl } from "./appearance-control";
import { NavLinks } from "./nav-links";

export function SiteHeader({ mood, mode, editor = false }: { mood: string; mode: string; editor?: boolean }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/">
          <span className="brand-name">FRAME</span>
          <span className="brand-kicker">Evaluations, not scores</span>
        </a>
        <NavLinks />
        <div className="header-tools">
          <form className="search-form" action="/search" method="get" role="search">
            <label className="sr-only" htmlFor="q" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Search works
            </label>
            <input id="q" name="q" type="search" placeholder="Search works" />
            <button className="btn btn-secondary" type="submit">
              Search
            </button>
          </form>
          {editor ? (
            <a className="btn btn-ghost" href="/admin/outlets">
              Outlets
            </a>
          ) : null}
          <AppearanceControl mood={mood} mode={mode} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>Frame keeps enjoyment, execution, and the reviewer’s standard visible.</p>
        <p>A small catalog, on purpose. Pages get better when evaluations accumulate.</p>
      </div>
    </footer>
  );
}
