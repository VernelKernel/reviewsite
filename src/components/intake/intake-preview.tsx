"use client";

import type { ReactNode } from "react";
import { DimensionReading } from "@/components/evaluations/dimension-reading";
import { EvaluationGraph } from "@/components/evaluations/evaluation-graph";
import { isStance } from "@/components/evaluations/evaluation-preview";
import type { PersonalAxis } from "@/components/intake/personal-shape";
import { stanceClass, stanceLabel } from "@/lib/domain/labels";

export type IntakeGlanceItem = { value: string; label: string; icon: "gamepad" | "replay" | "lock" };

export function IntakePreview({
  title,
  byline,
  enjoyment,
  execution,
  workAxes,
  enjoymentAxes,
  glance,
  alert,
  children,
}: {
  title: string;
  byline: string[];
  enjoyment: string;
  execution: string;
  workAxes: PersonalAxis[];
  enjoymentAxes: PersonalAxis[];
  glance: IntakeGlanceItem[];
  alert?: string | null;
  children?: ReactNode;
}) {
  return (
    <aside className="builder-preview" id="preview" aria-label="Live preview">
      <div className="panel builder-preview-scroll">
        <div>
          <p className="builder-work-title" id="intake-preview-title">
            {title}
          </p>
          {byline.length > 0 ? (
            <p className="evaluation-byline">
              {byline.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </p>
          ) : null}
        </div>
        <EvaluationGraph
          fields={[
            { label: "Execution", stance: isStance(execution) ? execution : null, axes: workAxes },
            { label: "Enjoyment", stance: isStance(enjoyment) ? enjoyment : null, axes: enjoymentAxes },
          ]}
        />
        <section className="evaluation-panel" aria-labelledby="intake-key-impressions">
          <h2 id="intake-key-impressions">Key impressions</h2>
          <div className="preview-group">
            {isStance(enjoyment) ? <StanceMeter label="Enjoyment" stance={enjoyment} /> : <p className="meta">Enjoyment not selected</p>}
            {isStance(enjoyment) && enjoymentAxes.length > 0 ? (
              <div className="preview-breakdown">
                <h2 className="preview-dimension-label" id="intake-enjoyment-dimension">
                  Dimension
                </h2>
                <ul className="dimension-breakdown" aria-label="Enjoyment dimensions">
                  {enjoymentAxes.map((axis) => (
                    <BreakdownRow key={axis.name} axis={axis} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="preview-group">
            {isStance(execution) ? <StanceMeter label="Execution" stance={execution} /> : <p className="meta">Execution not selected</p>}
            {isStance(execution) && workAxes.length > 0 ? (
              <div className="preview-breakdown">
                <h2 className="preview-dimension-label" id="intake-dimension-breakdown">
                  Dimension
                </h2>
                <ul className="dimension-breakdown">
                  {workAxes.map((axis) => (
                    <BreakdownRow key={axis.name} axis={axis} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
        {glance.length > 0 ? (
          <section className="evaluation-panel" aria-labelledby="intake-glance">
            <h2 id="intake-glance">At a glance</h2>
            <ul className="glance-list">
              {glance.map((item) => (
                <li key={item.label}>
                  <i className="flair-icon" data-icon={item.icon} aria-hidden="true" />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {alert || children ? (
          <div className="builder-publish">
            {alert ? (
              <p className="form-error" id="chart-requirements" role="alert">
                {alert}
              </p>
            ) : null}
            {children}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function BreakdownRow({ axis }: { axis: PersonalAxis }) {
  return (
    <li>
      <DimensionReading name={axis.name} stance={axis.stance} mattered={axis.mattered} />
    </li>
  );
}

function StanceMeter({ label, stance }: { label: string; stance: PersonalAxis["stance"] }) {
  const icon = label === "Enjoyment" ? "heart" : "gear";
  return (
    <div className="stance-meter">
      <div className="stance-meter-head">
        <strong>
          <i className="flair-icon" data-icon={icon} aria-hidden="true" />
          {label}
        </strong>
        <span className={stanceClass(stance)}>{stanceLabel[stance]}</span>
      </div>
    </div>
  );
}
