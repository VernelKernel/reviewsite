"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { distributionLabel, type Distribution } from "@/lib/aggregation/landscape";
import { nestGeometry, nestShares } from "@/lib/evaluations/nest-geometry";
import type { SpinSource } from "@/lib/evaluations/field";
import {
  nestSpinSource,
  paintNest,
  paintNestSpin,
  readNestPalette,
  type NestFrame,
} from "@/components/evaluations/nest-paint";
import { useSpinEpoch } from "@/components/evaluations/spin-clock";

const TURN_SECONDS = 16;
const SHARE = nestShares();

function readingTip(name: "Execution" | "Enjoyment", distribution: Distribution): string {
  return `${name} · ${distributionLabel(distribution)}`;
}

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
  const spinEpoch = useSpinEpoch();
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
      executionSource = nestSpinSource(
        execution,
        palette.field,
        frame.cx,
        frame.cy,
        frame.outerRadius,
        frame.outerRadius > 0 ? frame.holeRadius / frame.outerRadius : 0,
      );
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
      const elapsed = (now - started) / 1000;
      const angle = (elapsed / TURN_SECONDS) * Math.PI * 2;
      paintNestSpin(ctx, frame, {
        execution: executionSource,
        enjoyment: enjoymentSource,
        executionAngle: angle,
        enjoymentAngle: angle,
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
  }, [spin, execution, enjoyment, executionKey, enjoymentKey, spinEpoch]);

  const geometry = {
    "--nest-hole": SHARE.hole,
    "--nest-inner": SHARE.inner,
  } as CSSProperties;
  const executionTip = readingTip("Execution", execution);
  const enjoymentTip = readingTip("Enjoyment", enjoyment);

  return (
    <div
      ref={rootRef}
      className={compact ? "nest-emblem nest-emblem-compact" : "nest-emblem"}
      style={geometry}
      role={decorative ? undefined : "group"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
    >
      <canvas ref={canvasRef} className="nest-emblem-canvas" aria-hidden="true" />
      {decorative ? null : (
        <div className="nest-targets">
          <span className="nest-target nest-target-execution tip" tabIndex={0} role="img" aria-label={executionTip} data-tooltip={executionTip}>
            <span className="nest-target-face" />
          </span>
          <span className="nest-target nest-target-hole" aria-hidden="true" />
          <span className="nest-target nest-target-enjoyment tip" tabIndex={0} role="img" aria-label={enjoymentTip} data-tooltip={enjoymentTip}>
            <span className="nest-target-face" />
          </span>
        </div>
      )}
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
