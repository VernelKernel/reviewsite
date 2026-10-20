import { diamondGeometry } from "@/components/evaluations/shape-mark";
import type { Distribution } from "@/lib/aggregation/landscape";
import { clusterOuterRadius, nestGeometry } from "@/lib/evaluations/nest-geometry";
import { fieldModelFrom, paintField, paintSpinSource, type FieldPalette, type SpinSource } from "@/lib/evaluations/field";
import { radarPoint } from "@/lib/evaluations/radar";

export type NestPalette = { field: FieldPalette; empty: string };

export type NestFrame = {
  cx: number;
  cy: number;
  outerRadius: number;
  holeRadius: number;
  innerRadius: number;
};

const REM = 16;

export function readNestPalette(): NestPalette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    field: {
      positive: read("--color-positive", "#1F7A4D"),
      mixed: read("--color-caution", "#E7B008"),
      negative: read("--color-negative", "#E15A4A"),
    },
    empty: read("--color-border", "#D5DEE6"),
  };
}

/** Bitmap for a download. A few pixels of padding keep the tips intact. */
export function nestExportLayout(scale: number) {
  const geometry = nestGeometry(clusterOuterRadius(scale, REM));
  const pad = 2;
  const size = Math.ceil(geometry.outerRadius * 2 + pad * 2);
  const frame: NestFrame = {
    cx: size / 2,
    cy: size / 2,
    outerRadius: geometry.outerRadius,
    holeRadius: geometry.holeRadius,
    innerRadius: geometry.innerRadius,
  };
  return { size, frame };
}

export function nestSpinSource(
  distribution: Distribution,
  palette: FieldPalette,
  cx: number,
  cy: number,
  radius: number,
): SpinSource | null {
  if (!distribution.count || radius < 2) return null;
  const model = fieldModelFrom(diamondGeometry(distribution), cx, cy, radius, palette);
  if (!model) return null;
  return paintSpinSource(model);
}

export function paintNest(
  ctx: CanvasRenderingContext2D,
  frame: NestFrame,
  execution: Distribution,
  enjoyment: Distribution,
  palette: NestPalette,
  edge = false,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  fillDiamond(ctx, execution, palette, frame.cx, frame.cy, frame.outerRadius, edge);
  punchDiamond(ctx, frame.cx, frame.cy, frame.holeRadius);
  fillDiamond(ctx, enjoyment, palette, frame.cx, frame.cy, frame.innerRadius, edge);
}

export function paintNestSpin(
  ctx: CanvasRenderingContext2D,
  frame: NestFrame,
  layers: {
    execution: SpinSource | null;
    enjoyment: SpinSource | null;
    executionAngle: number;
    enjoymentAngle: number;
    /** Color-field zoom. 1 is the still emblem. */
    scale?: number;
    empty: string;
  },
) {
  const scale = layers.scale ?? 1;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (layers.execution) drawRotated(ctx, layers.execution, layers.executionAngle, scale, () => clipRing(ctx, frame));
  else fillClipped(ctx, layers.empty, () => clipRing(ctx, frame), frame.cx, frame.cy, frame.outerRadius);
  if (layers.enjoyment) drawRotated(ctx, layers.enjoyment, layers.enjoymentAngle, scale, () => clipInner(ctx, frame));
  else fillClipped(ctx, layers.empty, () => clipInner(ctx, frame), frame.cx, frame.cy, frame.innerRadius);
}

function fillDiamond(
  ctx: CanvasRenderingContext2D,
  distribution: Distribution,
  palette: NestPalette,
  cx: number,
  cy: number,
  radius: number,
  edge: boolean,
) {
  if (radius < 2) return;
  if (!distribution.count) {
    traceDiamond(ctx, cx, cy, radius);
    ctx.fillStyle = palette.empty;
    ctx.fill();
    return;
  }
  const model = fieldModelFrom(diamondGeometry(distribution), cx, cy, radius, palette.field);
  if (!model) return;
  const small = radius < 400;
  paintField(ctx, model, { scale: small ? 2 : 1, edge: edge && !small });
}

function punchDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  if (radius < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  traceDiamond(ctx, cx, cy, radius);
  ctx.fill();
  ctx.restore();
}

function drawRotated(ctx: CanvasRenderingContext2D, source: SpinSource, angle: number, scale: number, clip: () => void) {
  ctx.save();
  clip();
  ctx.translate(source.cx, source.cy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.translate(-source.cx, -source.cy);
  ctx.drawImage(source.canvas, source.left, source.top);
  ctx.restore();
}

function fillClipped(
  ctx: CanvasRenderingContext2D,
  color: string,
  clip: () => void,
  cx: number,
  cy: number,
  radius: number,
) {
  ctx.save();
  clip();
  ctx.fillStyle = color;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

function clipRing(ctx: CanvasRenderingContext2D, frame: NestFrame) {
  ctx.beginPath();
  addDiamond(ctx, frame.cx, frame.cy, frame.outerRadius);
  addDiamond(ctx, frame.cx, frame.cy, frame.holeRadius);
  ctx.clip("evenodd");
}

function clipInner(ctx: CanvasRenderingContext2D, frame: NestFrame) {
  ctx.beginPath();
  addDiamond(ctx, frame.cx, frame.cy, frame.innerRadius);
  ctx.clip();
}

function traceDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  addDiamond(ctx, cx, cy, radius);
}

function addDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  for (let index = 0; index < 4; index += 1) {
    const point = radarPoint(cx, cy, radius, index, 4, 1);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
}
