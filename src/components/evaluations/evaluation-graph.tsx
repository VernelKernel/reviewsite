"use client";

import { useEffect, useId, useRef, useState } from "react";
import { stanceLabel } from "@/lib/domain/labels";
import { fieldModel, guideRings, paintField, type FieldPalette } from "@/lib/evaluations/field";
import { radarPoint, stanceDistance, type RadarAxis, type StanceName } from "@/lib/evaluations/radar";

const WIDTH = 560;
const HEIGHT = 460;
const CX = 280;
const CY = 220;
const RADIUS = 108;

export type EvaluationField = {
  label: string;
  stance: StanceName | null;
  axes: RadarAxis[];
};

export function EvaluationGraph({ fields }: { fields: EvaluationField[] }) {
  const [active, setActive] = useState<{ field: number; index: number } | null>(null);

  return (
    <figure className="evaluation-stage" id="graph">
      <div className="evaluation-charts">
        {fields.map((field, fieldIndex) => (
          <RadarField
            key={field.label}
            field={field}
            activeIndex={active?.field === fieldIndex ? active.index : null}
            onActive={(index) => setActive(index === null ? null : { field: fieldIndex, index })}
          />
        ))}
      </div>
    </figure>
  );
}

function RadarField({
  field,
  activeIndex,
  onActive,
}: {
  field: EvaluationField;
  activeIndex: number | null;
  onActive: (index: number | null) => void;
}) {
  const labelId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { axes } = field;
  const closed = axes.length >= 3;
  const title = field.stance ? `${field.label}: ${stanceLabel[field.stance]}` : field.label;
  const summary = [
    title,
    axes.length > 0
      ? axes.map((axis) => `${axis.name} ${stanceLabel[axis.stance]}`).join(", ")
      : "No dimensions judged",
  ].join(". ");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !closed) return;
    const draw = () => {
      const palette = readPalette();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = WIDTH * dpr;
      canvas.height = HEIGHT * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const model = fieldModel(axes, CX, CY, RADIUS, palette);
      if (model) paintField(ctx, model);
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood", "data-mode"] });
    return () => observer.disconnect();
  }, [axes, closed]);

  return (
    <div className="evaluation-chart" role="group" aria-labelledby={labelId}>
      <p className="evaluation-chart-title" id={labelId}>
        {title}
      </p>
      {axes.length > 0 ? (
        <div className="evaluation-plot">
          {closed ? <canvas ref={canvasRef} className="evaluation-field" width={WIDTH} height={HEIGHT} aria-hidden="true" /> : null}
          <svg className="radar-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary}>
            {guideRings().map((ring) => (
              <circle key={ring} className="radar-ring" cx={CX} cy={CY} r={RADIUS * ring} />
            ))}
            {axes.map((axis, index) => {
              const end = radarPoint(CX, CY, RADIUS, index, axes.length, 1);
              return <line key={`${axis.name}-spoke`} className="radar-spoke" x1={CX} y1={CY} x2={end.x} y2={end.y} />;
            })}
            {closed ? (
              <polygon
                className="radar-outline"
                points={axes
                  .map((axis, index) => {
                    const point = radarPoint(CX, CY, RADIUS, index, axes.length, stanceDistance(axis.stance));
                    return `${point.x},${point.y}`;
                  })
                  .join(" ")}
              />
            ) : null}
            {axes.map((axis, index) => {
              const point = radarPoint(CX, CY, RADIUS, index, axes.length, stanceDistance(axis.stance));
              const label = stanceLabel[axis.stance] ?? axis.stance;
              const selected = activeIndex === index;
              return (
                <g key={`${axis.name}-dot`}>
                  <circle
                    className={`radar-dot radar-dot-${axis.stance.toLowerCase()}${selected ? " radar-dot-active" : ""}`}
                    cx={point.x}
                    cy={point.y}
                    r={selected ? 8 : 6}
                    tabIndex={0}
                    role="button"
                    aria-label={`${field.label}, ${axis.name}: ${label}`}
                    aria-pressed={selected}
                    onMouseEnter={() => onActive(index)}
                    onMouseLeave={() => onActive(null)}
                    onFocus={() => onActive(index)}
                    onBlur={() => onActive(null)}
                    onClick={() => onActive(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") onActive(null);
                    }}
                  >
                    <title>{`${axis.name}: ${label}`}</title>
                  </circle>
                </g>
              );
            })}
            {axes.map((axis, index) => {
              const point = radarPoint(CX, CY, RADIUS + 34, index, axes.length, 1);
              const cos = Math.cos(point.angle);
              const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
              const lines = labelLines(axis.name);
              const above = Math.sin(point.angle) < -0.2;
              return (
                <text key={`${axis.name}-label`} className="radar-label" x={point.x} y={point.y} textAnchor={anchor} dominantBaseline="middle">
                  {lines.map((line, lineIndex) => (
                    <tspan
                      key={line}
                      x={point.x}
                      dy={lineIndex === 0 ? (above && lines.length > 1 ? "-1.1em" : 0) : "1.15em"}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}
          </svg>
        </div>
      ) : (
        <p className="evaluation-chart-empty">No dimensions judged.</p>
      )}
    </div>
  );
}

function labelLines(name: string): string[] {
  if (!name.includes(" ") || name.length < 12) return [name];
  const words = name.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
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
