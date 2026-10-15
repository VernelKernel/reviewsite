"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { ShapeShare } from "@/components/evaluations/shape-share";
import {
  criticCoverage,
  distributionLabel,
  gapSentence,
  pairedDimensions,
  percentages,
  shapePoints,
  type ReviewLandscape,
  type ShapePoint,
} from "@/lib/aggregation/landscape";
import { fieldModelFrom, guideRings, paintField, type FieldPalette } from "@/lib/evaluations/field";
import { radarPoint } from "@/lib/evaluations/radar";

export type Focus = "critics" | "audience";

const WIDTH = 640;
const HEIGHT = 520;
const CX = 320;
const CY = 258;
const RADIUS = 156;

const NAMES: Record<Focus, string> = { critics: "Critics", audience: "Audience" };

export function DimensionShape({
  critics,
  audience,
  rows,
  focus,
  onFocus,
  share,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  rows: Focus[];
  focus: Focus | null;
  onFocus: (population: Focus) => void;
  share?: { title: string; path: string };
}) {
  const noteId = useId();
  const points = useMemo(() => {
    const dimensions = pairedDimensions(critics, audience);
    return { critics: shapePoints(dimensions, "critics"), audience: shapePoints(dimensions, "audience") };
  }, [critics, audience]);
  const selectable = rows.length > 1;

  return (
    <div className="dimension-shape">
      <h3>Where judgments land</h3>
      {rows.map((population) => {
        const landscape = population === "critics" ? critics : audience;
        return (
          <div key={population} className="shape-row">
            <PopulationStage
              population={population}
              landscape={landscape}
              points={points[population]}
              selectable={selectable}
              focused={focus === population}
              onToggle={() => onFocus(population)}
              noteId={noteId}
            />
            <GapPanel population={population} landscape={landscape} />
          </div>
        );
      })}
      <p className="shape-note" id={noteId}>
        Distance from the center is the share of positive judgments among people who judged that dimension. Color is the stance
        reading.
        {selectable ? " Select a graph to focus the share card and the evaluations below on that group." : null}
      </p>
      {share ? <ShapeShare title={share.title} path={share.path} /> : null}
      <ShapeLegend />
    </div>
  );
}

function PopulationStage({
  population,
  landscape,
  points,
  selectable,
  focused,
  onToggle,
  noteId,
}: {
  population: Focus;
  landscape: ReviewLandscape;
  points: ShapePoint[];
  selectable: boolean;
  focused: boolean;
  onToggle: () => void;
  noteId: string;
}) {
  const name = NAMES[population];
  const sample =
    population === "critics" ? `Based on ${criticCoverage(landscape.coverageCount)}` : landscape.sampleNote.replace(/\.$/, "");

  return (
    <figure
      className="population-stage"
      data-selectable={selectable ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      onClick={selectable ? onToggle : undefined}
    >
      <figcaption className="population-stage-label">Impression</figcaption>
      {points.length >= 3 ? (
        <ShapeChart points={points} label={`${name} shape`} describedBy={noteId} />
      ) : (
        <ShapeList points={points} />
      )}
      <div className="population-stage-foot">
        {selectable ? (
          <button
            type="button"
            className="population-chip"
            aria-pressed={focused}
            aria-label={`Focus on ${name.toLowerCase()}`}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {name}
          </button>
        ) : (
          <span className="population-chip">{name}</span>
        )}
        <span className="population-sample">{sample}</span>
      </div>
    </figure>
  );
}

function ShapeChart({ points, label, describedBy }: { points: ShapePoint[]; label: string; describedBy: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const model = fieldModelFrom(points, CX, CY, RADIUS, readPalette());
      if (model) paintField(ctx, model);
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood", "data-mode"] });
    return () => observer.disconnect();
  }, [points]);

  const tip = active === null ? null : points[active];
  const tipPoint = active === null ? null : radarPoint(CX, CY, RADIUS + 36, active, points.length, 1);

  return (
    <div className="evaluation-plot shape-plot">
      <canvas ref={canvasRef} className="evaluation-field" width={WIDTH} height={HEIGHT} aria-hidden="true" />
      <svg className="radar-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} aria-describedby={describedBy}>
        {guideRings().map((ring) => (
          <circle key={ring} className="radar-ring" cx={CX} cy={CY} r={RADIUS * ring} />
        ))}
        {points.map((point, index) => {
          const end = radarPoint(CX, CY, RADIUS, index, points.length, 1);
          return <line key={`${point.slug}-spoke`} className="radar-spoke" x1={CX} y1={CY} x2={end.x} y2={end.y} />;
        })}
        <polygon
          className="radar-outline"
          points={points
            .map((point, index) => {
              const at = radarPoint(CX, CY, RADIUS, index, points.length, point.distance);
              return `${at.x},${at.y}`;
            })
            .join(" ")}
        />
        {points.map((point, index) => {
          const at = radarPoint(CX, CY, RADIUS, index, points.length, point.distance);
          return (
            <circle key={`${point.slug}-dot`} className={`radar-dot radar-dot-${point.tone}`} cx={at.x} cy={at.y} r={6}>
              <title>{`${point.name}: ${distributionLabel(point.distribution)}`}</title>
            </circle>
          );
        })}
        {points.map((point, index) => {
          const at = radarPoint(CX, CY, RADIUS + 36, index, points.length, 1);
          const cos = Math.cos(at.angle);
          const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
          return (
            <text
              key={`${point.slug}-label`}
              className="radar-label radar-label-hit"
              x={at.x}
              y={at.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              tabIndex={0}
              role="button"
              aria-label={`${point.name}: ${percentLine(point)}`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive((current) => (current === index ? null : current))}
              onFocus={() => setActive(index)}
              onBlur={() => setActive((current) => (current === index ? null : current))}
              onClick={(event) => {
                event.stopPropagation();
                setActive((current) => (current === index ? null : index));
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setActive(null);
              }}
            >
              {point.name}
            </text>
          );
        })}
      </svg>
      {tip && tipPoint ? (
        <div
          className="shape-tip"
          aria-hidden="true"
          style={{ left: `${(tipPoint.x / WIDTH) * 100}%`, top: `${(tipPoint.y / HEIGHT) * 100}%` }}
        >
          {percentLine(tip)}
        </div>
      ) : null}
    </div>
  );
}

function ShapeList({ points }: { points: ShapePoint[] }) {
  if (points.length === 0) return <p className="population-stage-empty">No dimension judgments in this view yet.</p>;
  return (
    <div className="population-stage-list">
      <p>A shape needs three judged dimensions. These are the readings so far.</p>
      <ul>
        {points.map((point) => (
          <li key={point.slug}>
            <span>{point.name}</span>
            <span>{distributionLabel(point.distribution)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GapPanel({ population, landscape }: { population: Focus; landscape: ReviewLandscape }) {
  const unit = population === "critics" ? "outlet" : "judgment";
  return (
    <div className="panel shape-gap">
      <h3>
        {NAMES[population]} · Enjoyment and execution
      </h3>
      <DistributionBar label="Enjoyment" distribution={landscape.enjoyment} unit={unit} />
      <DistributionBar label="Execution" distribution={landscape.execution} unit={unit} />
      <p className="shape-gap-note">{gapSentence(landscape) ?? "Fewer than four evaluations, so the gap is not shown."}</p>
    </div>
  );
}

function ShapeLegend() {
  return (
    <ul className="shape-legend">
      <li>
        <i className="shape-swatch shape-swatch-positive" />
        Positive reading
      </li>
      <li>
        <i className="shape-swatch shape-swatch-mixed" />
        Mixed reading
      </li>
      <li>
        <i className="shape-swatch shape-swatch-negative" />
        Negative reading
      </li>
      <li>
        <i className="shape-swatch shape-swatch-divided" />
        Divided, or fewer than 4
      </li>
    </ul>
  );
}

function percentLine(point: ShapePoint): string {
  const pct = percentages(point.distribution);
  return `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;
}

function readPalette(): FieldPalette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    positive: read("--color-positive", "#1F7A4D"),
    mixed: read("--color-caution", "#E7B008"),
    negative: read("--color-negative", "#E15A4A"),
  };
}
