"use client";

import { useEffect, useId, useRef, useState } from "react";
import { stanceLabel } from "@/lib/domain/labels";
import { fieldModel, guideRings, paintField, type FieldPalette } from "@/lib/evaluations/field";
import { radarPoint, stanceDistance, type RadarAxis } from "@/lib/evaluations/radar";

const WIDTH = 640;
const HEIGHT = 520;
const CX = 320;
const CY = 258;
const RADIUS = 156;

export function EvaluationGraph({ axes }: { axes: RadarAxis[] }) {
  const noteId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const closed = axes.length >= 3;

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
    <figure className="evaluation-stage" id="graph">
      <figcaption className="evaluation-stage-label">Impression</figcaption>
      <div className="evaluation-plot">
        {closed ? <canvas ref={canvasRef} className="evaluation-field" width={WIDTH} height={HEIGHT} aria-hidden="true" /> : null}
        <svg className="radar-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={noteId}>
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
            const selected = active === index;
            return (
              <g key={`${axis.name}-dot`}>
                <circle
                  className={`radar-dot radar-dot-${axis.stance.toLowerCase()}${selected ? " radar-dot-active" : ""}`}
                  cx={point.x}
                  cy={point.y}
                  r={selected ? 8 : 6}
                  tabIndex={0}
                  role="button"
                  aria-label={`${axis.name}: ${label}`}
                  aria-pressed={selected}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive((current) => (current === index ? null : current))}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive((current) => (current === index ? null : current))}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setActive(null);
                  }}
                >
                  <title>{`${axis.name}: ${label}`}</title>
                </circle>
              </g>
            );
          })}
          {axes.map((axis, index) => {
            const point = radarPoint(CX, CY, RADIUS + 36, index, axes.length, 1);
            const cos = Math.cos(point.angle);
            const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
            return (
              <text key={`${axis.name}-label`} className="radar-label" x={point.x} y={point.y} textAnchor={anchor} dominantBaseline="middle">
                {axis.name}
              </text>
            );
          })}
        </svg>
      </div>
      <p className="evaluation-stage-note" id={noteId}>
        <strong>Distance shows strength. Color shows sentiment.</strong>
        <span>
          {active !== null
            ? `${axes[active].name}: ${stanceLabel[axes[active].stance]}.`
            : "Unjudged dimensions are hidden. Select a point for details."}
        </span>
      </p>
    </figure>
  );
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
