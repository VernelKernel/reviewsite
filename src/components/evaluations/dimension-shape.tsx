"use client";

import { useId, useState } from "react";
import { DistributionBar } from "@/components/evaluations/distribution-bar";
import {
  dimensionShapeReading,
  distributionLabel,
  dominantKey,
  pairedDimensions,
  type ReviewLandscape,
  type ShapeMode,
} from "@/lib/aggregation/landscape";

const MODES: { value: ShapeMode; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "audience", label: "Audience" },
  { value: "critics", label: "Critics" },
];

export function DimensionShape({
  critics,
  audience,
}: {
  critics: ReviewLandscape;
  audience: ReviewLandscape;
}) {
  const [mode, setMode] = useState<ShapeMode>("both");
  const readingId = useId();
  const axes = pairedDimensions(critics, audience)
    .filter((dimension) => dimension.audience.count > 0 || dimension.critics.count > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  if (axes.length < 3) return null;

  const reading = dimensionShapeReading(critics, audience, mode);
  const showAudience = mode !== "critics";
  const showCritics = mode !== "audience";

  return (
    <div className="dimension-shape">
      <div className="section-head">
        <h3>Where judgments land</h3>
        <div className="shape-segment" role="radiogroup" aria-label="Population">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={mode === item.value}
              onClick={() => setMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="shape-stage">
        <figure>
          <ShapeChart axes={axes} showAudience={showAudience} showCritics={showCritics} labelledBy={readingId} />
          <figcaption className="shape-note">
            Distance from the center is the share of positive judgments among people who judged that dimension. Dot color is the
            stance reading.
          </figcaption>
        </figure>
        <div className="panel shape-summary">
          {showAudience ? (
            <>
              <h3>Enjoyment</h3>
              <DistributionBar label="Audience" distribution={audience.enjoyment} />
              {showCritics ? <DistributionBar label="Critics" distribution={critics.enjoyment} unit="outlet" /> : null}
            </>
          ) : (
            <>
              <h3>Enjoyment</h3>
              <DistributionBar label="Critics" distribution={critics.enjoyment} unit="outlet" />
            </>
          )}
          <h3>Execution</h3>
          {showAudience ? <DistributionBar label="Audience" distribution={audience.execution} /> : null}
          {showCritics ? <DistributionBar label="Critics" distribution={critics.execution} unit="outlet" /> : null}
          {reading ? (
            <p className="shape-reading" id={readingId}>
              {reading}
            </p>
          ) : (
            <p className="shape-reading" id={readingId}>
              No published evaluations in this view yet.
            </p>
          )}
        </div>
      </div>
      <ShapeLegend showAudience={showAudience} showCritics={showCritics} />
    </div>
  );
}

function ShapeLegend({ showAudience, showCritics }: { showAudience: boolean; showCritics: boolean }) {
  return (
    <ul className="shape-legend">
      {showAudience ? (
        <li>
          <i className="shape-swatch shape-swatch-audience" />
          Audience · share of positive judgments
        </li>
      ) : null}
      {showCritics ? (
        <li>
          <i className="shape-swatch shape-swatch-critics" />
          Critics · share of positive judgments
        </li>
      ) : null}
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

type Axis = ReturnType<typeof pairedDimensions>[number];

function ShapeChart({
  axes,
  showAudience,
  showCritics,
  labelledBy,
}: {
  axes: Axis[];
  showAudience: boolean;
  showCritics: boolean;
  labelledBy: string;
}) {
  const width = 720;
  const height = 640;
  const cx = 360;
  const cy = 312;
  const radius = 176;

  return (
    <svg className="radar-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={labelledBy}>
      {[0.25, 0.5, 0.75, 1].map((tick) => (
        <circle key={tick} className="radar-ring" cx={cx} cy={cy} r={radius * tick} />
      ))}
      {[0.25, 0.5, 0.75].map((tick) => (
        <text key={tick} className="radar-tick" x={cx + 8} y={cy - radius * tick + 4}>
          {`${tick * 100}%`}
        </text>
      ))}
      {axes.map((axis, index) => {
        const end = polar(cx, cy, radius, index, axes.length, 1);
        return <line key={axis.slug} className="radar-spoke" x1={cx} y1={cy} x2={end.x} y2={end.y} />;
      })}
      {showCritics ? <ShapePolygon axes={axes} population="critics" cx={cx} cy={cy} radius={radius} /> : null}
      {showAudience ? <ShapePolygon axes={axes} population="audience" cx={cx} cy={cy} radius={radius} /> : null}
      {showCritics
        ? axes.map((axis, index) => (
            <ShapeDot key={`critics-${axis.slug}`} axis={axis} index={index} total={axes.length} population="critics" cx={cx} cy={cy} radius={radius} hollow={showAudience} />
          ))
        : null}
      {showAudience
        ? axes.map((axis, index) => (
            <ShapeDot key={`audience-${axis.slug}`} axis={axis} index={index} total={axes.length} population="audience" cx={cx} cy={cy} radius={radius} hollow={false} />
          ))
        : null}
      {axes.map((axis, index) => {
        const point = polar(cx, cy, radius + 56, index, axes.length, 1);
        const cos = Math.cos(point.angle);
        const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
        return (
          <text key={axis.slug} className="radar-label" x={point.x} y={point.y} textAnchor={anchor} dominantBaseline="middle">
            {axis.name}
          </text>
        );
      })}
    </svg>
  );
}

function ShapePolygon({
  axes,
  population,
  cx,
  cy,
  radius,
}: {
  axes: Axis[];
  population: "audience" | "critics";
  cx: number;
  cy: number;
  radius: number;
}) {
  const points = axes.flatMap((axis, index) => {
    const distribution = axis[population];
    if (distribution.count === 0) return [];
    const point = polar(cx, cy, radius, index, axes.length, distribution.positive / distribution.count);
    return [`${point.x},${point.y}`];
  });
  if (points.length < 3) return null;
  return <polygon className={population === "audience" ? "radar-audience" : "radar-critics"} points={points.join(" ")} />;
}

function ShapeDot({
  axis,
  index,
  total,
  population,
  cx,
  cy,
  radius,
  hollow,
}: {
  axis: Axis;
  index: number;
  total: number;
  population: "audience" | "critics";
  cx: number;
  cy: number;
  radius: number;
  hollow: boolean;
}) {
  const distribution = axis[population];
  if (distribution.count === 0) return null;
  const share = distribution.positive / distribution.count;
  const placed = share < 0.08 ? 0.08 : share;
  const point = polar(cx, cy, radius, index, total, placed);
  const tone = dotTone(distribution);
  return (
    <circle
      className={`radar-dot radar-dot-${tone}${hollow ? " radar-dot-hollow" : ""}`}
      cx={point.x}
      cy={point.y}
      r={hollow ? 7 : 5.5}
    >
      <title>{`${axis.name}, ${population}: ${distributionLabel(distribution)}`}</title>
    </circle>
  );
}

function dotTone(distribution: { positive: number; mixed: number; negative: number; count: number }): string {
  if (distribution.count < 4) return "divided";
  const key = dominantKey(distribution);
  if (!key) return "divided";
  if (distribution[key] / distribution.count < 0.5) return "divided";
  return key;
}

function polar(cx: number, cy: number, radius: number, index: number, total: number, value: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: cx + Math.cos(angle) * radius * value,
    y: cy + Math.sin(angle) * radius * value,
    angle,
  };
}
