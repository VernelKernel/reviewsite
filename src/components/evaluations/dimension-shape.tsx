"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import { ShapeShare } from "@/components/evaluations/shape-share";
import {
  criticCoverage,
  distributionLabel,
  dominantKey,
  pairedDimensions,
  pairedEnjoymentDimensions,
  percentages,
  shapePoints,
  type DimensionLandscape,
  type Distribution,
  type ReviewLandscape,
  type ShapePoint,
} from "@/lib/aggregation/landscape";
import { fieldModelFrom, guideRings, paintField, type FieldPalette } from "@/lib/evaluations/field";
import { radarPoint } from "@/lib/evaluations/radar";

export type Focus = "critics" | "audience";

export type VertexFamily = "execution" | "enjoyment";

/** Per-graph vertex dots. Hidden until the reader turns a graph on. */
export type VertexPointSettings = Record<Focus, Record<VertexFamily, boolean>>;

export const hiddenVertexPoints: VertexPointSettings = {
  critics: { execution: false, enjoyment: false },
  audience: { execution: false, enjoyment: false },
};

const WIDTH = 560;
const HEIGHT = 460;
const CX = 280;
const CY = 220;
const RADIUS = 108;

const NAMES: Record<Focus, string> = { critics: "Critics", audience: "Audience" };

export function DimensionShape({
  critics,
  audience,
  rows,
  focus,
  onFocus,
  share,
  vertexPoints,
  onVertexPoints,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  rows: Focus[];
  focus: Focus | null;
  onFocus: (population: Focus) => void;
  share?: { title: string; path: string };
  vertexPoints: VertexPointSettings;
  onVertexPoints: (next: VertexPointSettings) => void;
}) {
  const points = useMemo(() => {
    const work = pairedDimensions(critics, audience);
    const enjoyment = pairedEnjoymentDimensions(critics, audience);
    return {
      critics: { execution: shapePoints(work, "critics"), enjoyment: shapePoints(enjoyment, "critics") },
      audience: { execution: shapePoints(work, "audience"), enjoyment: shapePoints(enjoyment, "audience") },
    };
  }, [critics, audience]);
  const selectable = rows.length > 1;

  return (
    <div className="dimension-shape">
      {rows.map((population) => {
        const landscape = population === "critics" ? critics : audience;
        return (
          <div key={population} className="shape-row">
            <PopulationStage
              population={population}
              landscape={landscape}
              execution={points[population].execution}
              enjoyment={points[population].enjoyment}
              selectable={selectable}
              focused={focus === population}
              onToggle={() => onFocus(population)}
              vertexPoints={vertexPoints[population]}
              onVertexFamily={(family, shown) =>
                onVertexPoints({
                  ...vertexPoints,
                  [population]: { ...vertexPoints[population], [family]: shown },
                })
              }
            />
            <GapPanel population={population} landscape={landscape} />
          </div>
        );
      })}
      {share ? <ShapeShare title={share.title} path={share.path} /> : null}
      <ShapeLegend />
    </div>
  );
}

function PopulationStage({
  population,
  landscape,
  execution,
  enjoyment,
  selectable,
  focused,
  onToggle,
  vertexPoints,
  onVertexFamily,
}: {
  population: Focus;
  landscape: ReviewLandscape;
  execution: ShapePoint[];
  enjoyment: ShapePoint[];
  selectable: boolean;
  focused: boolean;
  onToggle: () => void;
  vertexPoints: Record<VertexFamily, boolean>;
  onVertexFamily: (family: VertexFamily, shown: boolean) => void;
}) {
  const name = NAMES[population];
  const sample =
    population === "critics"
      ? `Based on ${criticCoverage(landscape.coverageCount)}`
      : `Based on ${landscape.sampleSize} ${landscape.sampleSize === 1 ? "review" : "reviews"}`;

  return (
    <figure
      className="population-stage"
      data-selectable={selectable ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      onClick={selectable ? onToggle : undefined}
    >
      <div className="shape-charts">
        <FamilyChart
          title={familyTitle("Execution", landscape.execution)}
          points={execution}
          showPoints={vertexPoints.execution}
          onShowPoints={(shown) => onVertexFamily("execution", shown)}
        />
        <FamilyChart
          title={familyTitle("Enjoyment", landscape.enjoyment)}
          points={enjoyment}
          showPoints={vertexPoints.enjoyment}
          onShowPoints={(shown) => onVertexFamily("enjoyment", shown)}
        />
      </div>
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

function FamilyChart({
  title,
  points,
  showPoints,
  onShowPoints,
}: {
  title: string;
  points: ShapePoint[];
  showPoints: boolean;
  onShowPoints: (shown: boolean) => void;
}) {
  const labelId = useId();
  return (
    <div className="shape-chart" role="group" aria-labelledby={labelId}>
      <div className="shape-chart-head">
        <p className="shape-chart-title" id={labelId}>
          {title}
        </p>
        {points.length > 0 ? (
          <button
            type="button"
            className="vertex-toggle"
            aria-pressed={showPoints}
            onClick={(event) => {
              event.stopPropagation();
              onShowPoints(!showPoints);
            }}
          >
            {showPoints ? "Hide points" : "Show points"}
          </button>
        ) : null}
      </div>
      {points.length > 0 ? (
        <ShapeChart points={points} label={title} showPoints={showPoints} />
      ) : (
        <p className="population-stage-empty">No dimensions judged.</p>
      )}
    </div>
  );
}

function ShapeChart({ points, label, showPoints }: { points: ShapePoint[]; label: string; showPoints: boolean }) {
  const closed = points.length >= 3;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !closed) return;
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
  }, [points, closed]);

  const tip = active === null ? null : points[active];
  const tipPoint = active === null ? null : radarPoint(CX, CY, RADIUS + 34, active, points.length, 1);

  return (
    <div className="evaluation-plot shape-plot">
      {closed ? <canvas ref={canvasRef} className="evaluation-field" width={WIDTH} height={HEIGHT} aria-hidden="true" /> : null}
      <svg className="radar-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary(label, points)}>
        {guideRings().map((ring) => (
          <circle key={ring} className="radar-ring" cx={CX} cy={CY} r={RADIUS * ring} />
        ))}
        {points.map((point, index) => {
          const end = radarPoint(CX, CY, RADIUS, index, points.length, 1);
          return <line key={`${point.slug}-spoke`} className="radar-spoke" x1={CX} y1={CY} x2={end.x} y2={end.y} />;
        })}
        {closed ? (
          <polygon
            className="radar-outline"
            points={points
              .map((point, index) => {
                const at = radarPoint(CX, CY, RADIUS, index, points.length, point.distance);
                return `${at.x},${at.y}`;
              })
              .join(" ")}
          />
        ) : null}
        {showPoints
          ? points.map((point, index) => {
              const at = radarPoint(CX, CY, RADIUS, index, points.length, point.distance);
              return (
                <circle key={`${point.slug}-dot`} className={`radar-dot radar-dot-${point.tone}`} cx={at.x} cy={at.y} r={6}>
                  <title>{`${point.name}: ${distributionLabel(point.distribution)}`}</title>
                </circle>
              );
            })
          : null}
        {points.map((point, index) => {
          const at = radarPoint(CX, CY, RADIUS + 34, index, points.length, 1);
          const cos = Math.cos(at.angle);
          const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
          const lines = labelLines(point.name);
          const above = Math.sin(at.angle) < -0.2;
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
              {lines.map((line, lineIndex) => (
                <tspan key={line} x={at.x} dy={lineIndex === 0 ? (above && lines.length > 1 ? "-1.1em" : 0) : "1.15em"}>
                  {line}
                </tspan>
              ))}
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

function GapPanel({ population, landscape }: { population: Focus; landscape: ReviewLandscape }) {
  const unit = population === "critics" ? "outlet" : "judgment";
  const executionDimensions = ordered(landscape.dimensions);
  const enjoymentDimensions = ordered(landscape.enjoymentDimensions);
  const headingId = `${population}-reading`;
  return (
    <section className="panel shape-gap" aria-labelledby={headingId}>
      <h3 id={headingId}>{NAMES[population]}</h3>
      <DistributionBar label="Enjoyment" distribution={landscape.enjoyment} unit={unit} layout="under" />
      {enjoymentDimensions.length > 0 ? (
        <DimensionBreakdown dimensions={enjoymentDimensions} />
      ) : null}
      <hr className="shape-section-rule" />
      <DistributionBar label="Execution" distribution={landscape.execution} unit={unit} layout="under" />
      {executionDimensions.length > 0 ? (
        <DimensionBreakdown dimensions={executionDimensions} />
      ) : null}
    </section>
  );
}

function DimensionBreakdown({ dimensions }: { dimensions: DimensionLandscape[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="shape-breakdown">
      <button
        type="button"
        className="shape-breakdown-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <BreakdownArrow up={open} />
        <span className="shape-breakdown-label">{open ? "Collapse" : "See breakdown"}</span>
      </button>
      {open ? (
        <div id={panelId} className="shape-breakdown-list">
          {dimensions.map((dimension) => (
            <DistributionBar
              key={dimension.slug}
              label={dimension.name}
              distribution={dimension.distribution}
              layout="under"
              countAs="participant"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function BreakdownArrow({ up }: { up: boolean }) {
  return (
    <svg className="shape-breakdown-arrow" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d={up ? "M2.2 7.6 L6 3.8 L9.8 7.6" : "M2.2 4.4 L6 8.2 L9.8 4.4"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    </ul>
  );
}

function ordered(dimensions: DimensionLandscape[]): DimensionLandscape[] {
  return [...dimensions].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

/** Headline stance, only once four or more evaluations share a dominant reading. */
function familyTitle(label: string, distribution: Distribution): string {
  if (distribution.count < 4) return label;
  const dominant = dominantKey(distribution);
  if (!dominant) return label;
  return `${label}: ${dominant.charAt(0).toUpperCase()}${dominant.slice(1)}`;
}

function summary(label: string, points: ShapePoint[]): string {
  if (points.length === 0) return `${label}. No dimensions judged.`;
  return [label, points.map((point) => `${point.name} ${distributionLabel(point.distribution)}`).join(", ")].join(". ");
}

function labelLines(name: string): string[] {
  if (!name.includes(" ") || name.length < 12) return [name];
  const words = name.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
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
    divided: read("--color-divided", "#FFF200"),
  };
}
