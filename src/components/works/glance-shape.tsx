"use client";

import { useEffect, useRef } from "react";
import type { ShapePoint } from "@/lib/aggregation/landscape";
import { fieldModelFrom, paintField, type FieldPalette } from "@/lib/evaluations/field";
import { radarPoint } from "@/lib/evaluations/radar";

const WIDTH = 480;
const HEIGHT = 320;
const CX = 240;
const CY = 160;
const RADIUS = 102;
const LABEL_RADIUS = RADIUS + 30;

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
    divided: read("--color-divided", "#FFF200"),
  };
}

/** Shape only: the painted field and its labels. No stage, rings, or spokes. */
export function GlanceShape({
  points,
  summary,
  labels = true,
}: {
  points: ShapePoint[];
  summary: string;
  labels?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const outline = points
    .map((point, index) => {
      const at = radarPoint(CX, CY, RADIUS, index, points.length, point.distance);
      return `${at.x.toFixed(1)},${at.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="list-four-plot">
      <canvas ref={canvasRef} className="list-four-field" width={WIDTH} height={HEIGHT} aria-hidden="true" />
      <svg className="list-four-radar" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={summary}>
        <polygon className="list-four-outline" points={outline} />
        {labels
          ? points.map((point, index) => {
          const at = radarPoint(CX, CY, LABEL_RADIUS, index, points.length, 1);
          const cos = Math.cos(at.angle);
          const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
          const lines = labelLines(point.name);
          const above = Math.sin(at.angle) < -0.2;
          return (
            <text
              key={point.slug}
              className="list-four-label"
              x={at.x}
              y={at.y}
              fontSize="16"
              textAnchor={anchor}
              dominantBaseline="middle"
            >
              {lines.map((line, lineIndex) => (
                <tspan key={line} x={at.x} dy={lineIndex === 0 ? (above && lines.length > 1 ? "-1.05em" : 0) : "1.1em"}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })
          : null}
      </svg>
    </div>
  );
}
