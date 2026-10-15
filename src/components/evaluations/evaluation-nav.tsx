"use client";

import { useEffect, useState } from "react";

const LINKS = [
  ["#overview", "Overview", "overview"],
  ["#graph", "Graph", "graph"],
  ["#details", "Details", "list"],
  ["#related", "Related reviews", "speech"],
] as const;

export function EvaluationNav() {
  const [current, setCurrent] = useState("#overview");

  useEffect(() => {
    const apply = () => setCurrent(window.location.hash || "#overview");
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <nav className="evaluation-nav" aria-label="On this evaluation">
      {LINKS.map(([href, label, icon]) => (
        <a key={href} href={href} aria-current={current === href ? "location" : undefined} onClick={() => setCurrent(href)}>
          <i className="flair-icon" data-icon={icon} aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}
