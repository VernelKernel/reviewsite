"use client";

import { useLayoutEffect, useRef } from "react";
import type { Distribution } from "@/lib/aggregation/landscape";
import { fieldModelFrom, paintField, type FieldPalette } from "@/lib/evaluations/field";

const SIZE = 64;
const cache = new Map<string, HTMLCanvasElement>();

/** Diamond picture of one row's stance mix, painted with the evaluation field's colors. */
export function ShapeMark({ distribution }: { distribution: Distribution }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const empty = distribution.count === 0;
  const signature = `${distribution.positive},${distribution.mixed},${distribution.negative},${distribution.count}`;

  useLayoutEffect(() => {
    if (empty) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const palette = readPalette();
      const key = `v2|${palette.positive}|${palette.mixed}|${palette.negative}|${signature}`;
      const source = cache.get(key) ?? renderMark(signature, palette);
      if (!source) return;
      cache.set(key, source);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = source.width;
      canvas.height = source.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0);
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood", "data-mode"] });
    return () => observer.disconnect();
  }, [signature, empty]);

  if (empty) return <span className="shape-mark shape-mark-empty" aria-hidden="true" />;
  return <canvas ref={canvasRef} className="shape-mark" width={SIZE} height={SIZE} aria-hidden="true" />;
}

function renderMark(signature: string, palette: FieldPalette): HTMLCanvasElement | null {
  const [positive, mixed, negative, count] = signature.split(",").map(Number);
  if (!count) return null;
  const distribution = { positive, mixed, negative, count };
  const geometry = diamondGeometry(distribution);
  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, SIZE, SIZE);
  const model = fieldModelFrom(geometry, SIZE / 2, SIZE / 2, SIZE * 0.44, palette);
  if (!model) return null;
  paintField(ctx, model, { scale: 1, edge: false });
  return canvas;
}

/** Four diamond vertices. The largest share fills the field; the next share tints a corner when it is real. */
function diamondGeometry(distribution: Distribution): { distance: number; t: number }[] {
  const count = distribution.count;
  const bands = [
    { t: 1, share: distribution.positive / count },
    { t: 0.5, share: distribution.mixed / count },
    { t: 0, share: distribution.negative / count },
  ].sort((left, right) => right.share - left.share);
  const primary = bands[0]?.t ?? 0.5;
  const secondary = bands[1] && bands[1].share >= 0.05 ? bands[1] : null;
  const tint = secondary ? (secondary.share >= 0.28 ? 2 : 1) : 0;
  const stance = [primary, primary, primary, primary];
  if (tint > 0 && secondary) stance[2] = secondary.t;
  if (tint > 1 && secondary) stance[1] = secondary.t;
  return stance.map((t) => ({ distance: 1, t }));
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
