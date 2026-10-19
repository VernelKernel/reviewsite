"use client";

import { useLayoutEffect, useRef } from "react";
import { distributionLabel, type Distribution } from "@/lib/aggregation/landscape";
import { nestGeometry } from "@/lib/evaluations/nest-geometry";
import type { SpinSource } from "@/lib/evaluations/field";
import {
  nestSpinSource,
  paintNest,
  paintNestSpin,
  readNestPalette,
  type NestFrame,
} from "@/components/evaluations/nest-paint";

const TURN_SECONDS = 16;

export function CriticNestEmblem({
  execution,
  enjoyment,
  compact = false,
  decorative = false,
  spin = false,
}: {
  execution: Distribution;
  enjoyment: Distribution;
  compact?: boolean;
  decorative?: boolean;
  spin?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const executionKey = signature(execution);
  const enjoymentKey = signature(enjoyment);
  const label = `Critics execution, ${distributionLabel(execution)}. Critics enjoyment, ${distributionLabel(enjoyment)}.`;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true;
    let frame: NestFrame | null = null;
    let executionSource: SpinSource | null = null;
    let enjoymentSource: SpinSource | null = null;
    let empty = "#D5DEE6";
    const started = performance.now();

    const measure = () => {
      const css = root.clientWidth;
      if (css < 8) return null;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const bitmap = Math.max(1, Math.round(css * dpr));
      const design = nestGeometry((css / 2) * dpr);
      const outerRadius = design.outerRadius - dpr;
      return {
        bitmap,
        frame: {
          cx: bitmap / 2,
          cy: bitmap / 2,
          outerRadius,
          holeRadius: outerRadius - design.frame,
          innerRadius: outerRadius - design.frame - 2 * design.gutter,
        } satisfies NestFrame,
      };
    };

    const rebuild = () => {
      const next = measure();
      if (!next) return;
      frame = next.frame;
      if (canvas.width !== next.bitmap) {
        canvas.width = next.bitmap;
        canvas.height = next.bitmap;
      }
      const palette = readNestPalette();
      empty = palette.empty;
      executionSource = nestSpinSource(execution, palette.field, frame.cx, frame.cy, frame.outerRadius);
      enjoymentSource = nestSpinSource(enjoyment, palette.field, frame.cx, frame.cy, frame.innerRadius);
    };

    const drawStatic = () => {
      if (!frame) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      paintNest(ctx, frame, execution, enjoyment, readNestPalette(), false);
    };

    const drawSpin = (now: number) => {
      if (!alive || !frame) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const turns = (now - started) / 1000 / TURN_SECONDS;
      paintNestSpin(ctx, frame, {
        execution: executionSource,
        enjoyment: enjoymentSource,
        executionAngle: turns * Math.PI * 2,
        enjoymentAngle: (turns + 0.5) * Math.PI * 2,
        empty,
      });
    };

    const motion = () => spin && !reduce.matches && (execution.count > 0 || enjoyment.count > 0);

    rebuild();
    if (motion()) drawSpin(started);
    else drawStatic();

    const job = (now: number) => {
      if (!motion()) return;
      drawSpin(now);
    };
    if (motion()) watch(job);

    const refresh = () => {
      rebuild();
      if (motion()) drawSpin(performance.now());
      else drawStatic();
    };
    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood", "data-mode"] });
    const resize = new ResizeObserver(refresh);
    resize.observe(root);
    const onReduce = () => {
      if (reduce.matches) {
        jobs.delete(job);
        drawStatic();
        return;
      }
      if (motion()) watch(job);
    };
    reduce.addEventListener("change", onReduce);

    return () => {
      alive = false;
      jobs.delete(job);
      observer.disconnect();
      resize.disconnect();
      reduce.removeEventListener("change", onReduce);
      if (jobs.size === 0 && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
  }, [spin, execution, enjoyment, executionKey, enjoymentKey]);

  return (
    <div
      ref={rootRef}
      className={compact ? "nest-emblem nest-emblem-compact" : "nest-emblem"}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <canvas ref={canvasRef} className="nest-emblem-canvas" aria-hidden="true" />
    </div>
  );
}

function signature(distribution: Distribution) {
  return `${distribution.positive},${distribution.mixed},${distribution.negative},${distribution.count}`;
}

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
