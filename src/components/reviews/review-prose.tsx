"use client";

import { useState } from "react";

export type ReviewHeading = {
  heading: string | null;
  body: string;
};

export function ReviewProse({ body, sections = [] }: { body: string; sections?: ReviewHeading[] }) {
  const [straight, setStraight] = useState(false);
  const blocks = sections.filter((section) => section.body.trim());
  const headed = blocks.some((section) => section.heading);
  if (!headed) {
    return <div className="prose">{paragraphs(body)}</div>;
  }
  return (
    <div className="review-reading">
      <div className="shape-segment" role="radiogroup" aria-label="Review layout">
        <button type="button" aria-checked={!straight} onClick={() => setStraight(false)}>
          Headings
        </button>
        <button type="button" aria-checked={straight} onClick={() => setStraight(true)}>
          Straight through
        </button>
      </div>
      {straight ? (
        <div className="prose">{paragraphs(body)}</div>
      ) : (
        <div className="prose">
          {blocks.map((section, index) => (
            <section key={`${section.heading ?? "opening"}-${index}`}>
              {section.heading ? <h3>{section.heading}</h3> : null}
              {paragraphs(section.body)}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function paragraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>);
}
