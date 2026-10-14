"use client";

import { useState } from "react";
import type { MetricAlignment } from "@/lib/comparison/critic-alignment";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";
import { MarkedDistribution } from "./marked-distribution";

export function CriticAlignmentPanel({ metrics }: { metrics: MetricAlignment[] }) {
  const [key, setKey] = useState(metrics[0]?.key ?? "enjoyment");
  const current = metrics.find((metric) => metric.key === key) ?? metrics[0];
  if (!current) return null;

  return (
    <section className="section" aria-labelledby="critic-placement-heading">
      <div className="section-head">
        <div>
          <p className="kicker">Your evaluation</p>
          <h2 id="critic-placement-heading">Where you sit among critic outlets</h2>
        </div>
      </div>
      <div className="filters" role="group" aria-label="Metric">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            className="chip"
            aria-pressed={metric.key === current.key}
            onClick={() => setKey(metric.key)}
          >
            {metric.label}
          </button>
        ))}
      </div>
      <p>{current.sentence}</p>
      {current.others.count > 0 ? (
        <MarkedDistribution label={current.label} distribution={current.others} stance={current.yours} unit="outlet" />
      ) : null}
      <div className="alignment-groups">
        <div className="panel">
          <h3>With you</h3>
          {current.aligned.length === 0 ? (
            <p className="meta">No outlet shares this stance.</p>
          ) : (
            <ul className="evidence-list">
              {current.aligned.map((outlet) => (
                <li key={outlet}>
                  <span className={stanceClass(current.yours)}>{outlet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <h3>Apart</h3>
          {current.apart.length === 0 ? (
            <p className="meta">No outlet differs on this metric.</p>
          ) : (
            <ul className="evidence-list">
              {current.apart.map((outlet) => (
                <li key={outlet.outlet}>
                  {outlet.outlet} is <span className={stanceClass(outlet.stance)}>{stanceLabel[outlet.stance]?.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {current.omittedSentence ? <p className="meta">{current.omittedSentence}</p> : null}
    </section>
  );
}
