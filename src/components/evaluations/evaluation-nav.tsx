"use client";

import { useEffect, useState } from "react";

const LINKS = [
  ["#overview", "Overview"],
  ["#graph", "Graph"],
  ["#details", "Details"],
  ["#related", "Related reviews"],
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
      {LINKS.map(([href, label]) => (
        <a key={href} href={href} aria-current={current === href ? "location" : undefined} onClick={() => setCurrent(href)}>
          {label}
        </a>
      ))}
    </nav>
  );
}
