"use client";

import { useLayoutEffect, useRef } from "react";
import type { Distribution } from "@/lib/aggregation/landscape";
import { fieldModelFrom, paintField, paintSpinSource, type FieldPalette, type SpinSource } from "@/lib/evaluations/field";

const SIZE = 64;
const cache = new Map<string, HTMLCanvasElement>();

/** Diamond picture of one row's stance mix, painted with the evaluation field's colors. */
export function ShapeMark({
  distribution,
  spin = false,
  phase = 0,
}: {
  distribution: Distribution;
  /** Turn the painted field inside the diamond. Sandbox only. */
  spin?: boolean;
  /** Starting turn, 0 to 1, so neighboring polygons do not match. */
  phase?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const empty = distribution.count === 0;
  const signature = `${distribution.positive},${distribution.mixed},${distribution.negative},${distribution.count}`;

  useLayoutEffect(() => {
    if (!spin || empty) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    let source: SpinSource | null = null;
    let alive = true;

    const rebuild = () => {
      const palette = readPalette();
      const key = `spin|${palette.positive}|${palette.mixed}|${palette.negative}|${signature}`;
      source = spinCache.get(key) ?? renderSpin(signature, palette);
      if (source) spinCache.set(key, source);
    };

    const paint = (angle: number) => {
      if (!source) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = 2;
      if (canvas.width !== SIZE * dpr) {
        canvas.width = SIZE * dpr;
        canvas.height = SIZE * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save();
      traceDiamond(ctx, source.vertices);
      ctx.clip();
      ctx.translate(source.cx, source.cy);
      ctx.rotate(angle);
      ctx.translate(-source.cx, -source.cy);
      ctx.drawImage(source.canvas, source.left, source.top);
      ctx.restore();
    };

    rebuild();
    const start = ((phase % 1) + 1) % 1;
    const started = performance.now();
    const job = (now: number) => {
      if (!alive || !source) return;
      const turns = start + (now - started) / 1000 / TURN_SECONDS;
      paint(turns * Math.PI * 2);
    };
    const observer = new MutationObserver(() => {
      rebuild();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood", "data-mode"] });
    const onReduce = () => {
      if (!reduce.matches) return;
      jobs.delete(job);
    };
    reduce.addEventListener("change", onReduce);
    const visibility = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) watch(job);
      else jobs.delete(job);
    });
    visibility.observe(canvas);
    watch(job);

    return () => {
      alive = false;
      jobs.delete(job);
      observer.disconnect();
      visibility.disconnect();
      reduce.removeEventListener("change", onReduce);
      if (jobs.size === 0 && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
  }, [spin, empty, phase, signature]);

  useLayoutEffect(() => {
    const reduced = spin && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (empty || (spin && !reduced)) return;
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
  }, [spin, signature, empty]);

  if (empty) return <span className="shape-mark shape-mark-empty" aria-hidden="true" />;
  return <canvas ref={canvasRef} className="shape-mark" width={SIZE} height={SIZE} aria-hidden="true" />;
}

const TURN_SECONDS = 16;
const spinCache = new Map<string, SpinSource>();
const jobs = new Set<(now: number) => void>();
let rafId = 0;

function watch(job: (now: number) => void) {
  jobs.add(job);
  if (rafId) return;
  const loop = (now: number) => {
    for (const paint of jobs) paint(now);
    rafId = jobs.size > 0 ? requestAnimationFrame(loop) : 0;
  };
  rafId = requestAnimationFrame(loop);
}

function renderSpin(signature: string, palette: FieldPalette): SpinSource | null {
  const geometry = diamondGeometry(parseSignature(signature));
  const model = fieldModelFrom(geometry, SIZE / 2, SIZE / 2, SIZE * 0.44, palette);
  if (!model) return null;
  return paintSpinSource(model);
}

function traceDiamond(ctx: CanvasRenderingContext2D, vertices: { x: number; y: number }[]) {
  ctx.beginPath();
  vertices.forEach((vertex, index) => {
    if (index === 0) ctx.moveTo(vertex.x, vertex.y);
    else ctx.lineTo(vertex.x, vertex.y);
  });
  ctx.closePath();
}

function parseSignature(signature: string): Distribution {
  const [positive, mixed, negative, count] = signature.split(",").map(Number);
  return { positive, mixed, negative, count };
}

function renderMark(signature: string, palette: FieldPalette): HTMLCanvasElement | null {
  const distribution = parseSignature(signature);
  if (!distribution.count) return null;
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
