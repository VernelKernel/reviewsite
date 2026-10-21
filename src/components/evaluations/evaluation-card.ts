import { stanceLabel } from "@/lib/domain/labels";
import { fieldModel, guideRings, paintField } from "@/lib/evaluations/field";
import { axisDistance, radarPoint, stanceDistance, type RadarAxis, type StanceName } from "@/lib/evaluations/radar";
import { shareFileName } from "@/lib/share/targets";

export type EvaluationCardInput = {
  title: string;
  host: string;
  path: string;
  glance: { value: string; label: string }[];
  enjoyment: StanceName;
  execution: StanceName;
  axes: RadarAxis[];
};

type Palette = {
  canvas: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  positive: string;
  caution: string;
  negative: string;
  positiveSoft: string;
  negativeSoft: string;
  stage: string;
  stageEnd: string;
  grid: string;
  label: string;
  body: string;
};

export async function renderEvaluationCard(input: EvaluationCardInput): Promise<File> {
  await document.fonts.ready;
  const width = 1080;
  const palette = readPalette();
  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = width * dpr;
  canvas.height = 2200 * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.scale(dpr, dpr);
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, width, 2200);

  let y = 36;
  y = drawGraph(ctx, palette, input, 36, y, width - 72);
  y += 28;
  if (input.glance.length > 0) {
    y = drawGlance(ctx, palette, input.glance, 36, y, width - 72);
    y += 20;
  }
  y = drawImpressions(ctx, palette, input, 36, y, width - 72);
  y += 20;
  if (input.axes.length > 0) {
    y = drawDimensions(ctx, palette, input.axes, 36, y, width - 72);
    y += 20;
  }

  const height = Math.ceil(y);
  const out = document.createElement("canvas");
  out.width = width * dpr;
  out.height = height * dpr;
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Canvas is unavailable.");
  outCtx.drawImage(canvas, 0, 0, width * dpr, height * dpr, 0, 0, width * dpr, height * dpr);
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the image.");
  return new File([blob], shareFileName(input.path), { type: "image/png" });
}

function drawGraph(ctx: CanvasRenderingContext2D, palette: Palette, input: EvaluationCardInput, x: number, y: number, width: number): number {
  const height = input.axes.length >= 3 ? 560 : 200;
  roundRect(ctx, x, y, width, height, 28);
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, palette.stage);
  fill.addColorStop(1, palette.stageEnd);
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.fillStyle = palette.label;
  ctx.font = `600 18px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("IMPRESSION", x + 28, y + 40);
  ctx.font = `500 16px ${palette.body}`;
  ctx.textAlign = "right";
  ctx.fillText(input.host, x + width - 28, y + 40);
  ctx.textAlign = "left";

  if (input.axes.length >= 3) {
    const cx = x + width / 2;
    const cy = y + height / 2 + 8;
    const radius = 168;
    const field = fieldModel(input.axes, cx, cy, radius, {
      positive: palette.positive,
      mixed: palette.caution,
      negative: palette.negative,
    });
    if (field) paintField(ctx, field);
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1.25;
    ctx.globalAlpha = 1;
    for (const ring of guideRings()) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * ring, 0, Math.PI * 2);
      ctx.stroke();
    }
    input.axes.forEach((axis, index) => {
      const end = radarPoint(cx, cy, radius, index, input.axes.length, 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
    ctx.beginPath();
    input.axes.forEach((axis, index) => {
      const next = radarPoint(cx, cy, radius, index, input.axes.length, axisDistance(axis));
      if (index === 0) ctx.moveTo(next.x, next.y);
      else ctx.lineTo(next.x, next.y);
    });
    ctx.closePath();
    ctx.strokeStyle = palette.label;
    ctx.lineWidth = 2;
    ctx.stroke();
    input.axes.forEach((axis, index) => {
      const dot = radarPoint(cx, cy, radius, index, input.axes.length, axisDistance(axis));
      ctx.beginPath();
      ctx.fillStyle = stanceColor(palette, axis.stance);
      ctx.arc(dot.x, dot.y, 7, 0, Math.PI * 2);
      ctx.fill();
      const label = radarPoint(cx, cy, radius + 36, index, input.axes.length, 1);
      ctx.fillStyle = palette.label;
      ctx.font = `600 18px ${palette.body}`;
      ctx.textAlign = Math.cos(label.angle) > 0.35 ? "left" : Math.cos(label.angle) < -0.35 ? "right" : "center";
      ctx.textBaseline = "middle";
      ctx.fillText(axis.name, label.x, label.y);
    });
  } else {
    const cx = x + width / 2;
    const cy = y + 120;
    const radius = 64;
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1.25;
    input.axes.forEach((axis, index) => {
      const end = radarPoint(cx, cy, radius, index, Math.max(input.axes.length, 1), 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      const dot = radarPoint(cx, cy, radius, index, Math.max(input.axes.length, 1), axisDistance(axis));
      ctx.beginPath();
      ctx.fillStyle = stanceColor(palette, axis.stance);
      ctx.arc(dot.x, dot.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  return y + height;
}

function drawGlance(ctx: CanvasRenderingContext2D, palette: Palette, glance: { value: string; label: string }[], x: number, y: number, width: number): number {
  const height = 118;
  card(ctx, palette, x, y, width, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText("AT A GLANCE", x + 24, y + 32);
  const column = width / glance.length;
  glance.forEach((item, index) => {
    const left = x + 24 + column * index;
    ctx.fillStyle = palette.text;
    ctx.font = `650 20px ${palette.body}`;
    ctx.fillText(fit(ctx, item.value, column - 28), left, y + 68);
    ctx.fillStyle = palette.muted;
    ctx.font = `400 14px ${palette.body}`;
    ctx.fillText(fit(ctx, item.label, column - 28), left, y + 92);
  });
  return y + height;
}

function drawImpressions(ctx: CanvasRenderingContext2D, palette: Palette, input: EvaluationCardInput, x: number, y: number, width: number): number {
  const height = 196;
  card(ctx, palette, x, y, width, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText("KEY IMPRESSIONS", x + 24, y + 32);
  meter(ctx, palette, "Enjoyment", input.enjoyment, x + 24, y + 64, width - 48);
  meter(ctx, palette, "Execution", input.execution, x + 24, y + 124, width - 48);
  return y + height;
}

function drawDimensions(ctx: CanvasRenderingContext2D, palette: Palette, axes: RadarAxis[], x: number, y: number, width: number): number {
  const columns = axes.length > 3 ? 2 : 1;
  const rows = Math.ceil(axes.length / columns);
  const height = 56 + rows * 42;
  card(ctx, palette, x, y, width, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText("DIMENSION BREAKDOWN", x + 24, y + 32);
  const columnWidth = (width - 48) / columns;
  axes.forEach((axis, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const left = x + 24 + column * columnWidth;
    const top = y + 58 + row * 42;
    ctx.beginPath();
    ctx.fillStyle = stanceColor(palette, axis.stance);
    ctx.arc(left + 6, top + 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = palette.text;
    ctx.font = `600 18px ${palette.body}`;
    ctx.fillText(axis.name, left + 22, top + 14);
    ctx.fillStyle = stanceColor(palette, axis.stance);
    ctx.textAlign = "right";
    ctx.fillText(stanceLabel[axis.stance] ?? axis.stance, left + columnWidth - 16, top + 14);
    ctx.textAlign = "left";
  });
  return y + height;
}

function meter(ctx: CanvasRenderingContext2D, palette: Palette, label: string, stance: StanceName, x: number, y: number, width: number) {
  ctx.fillStyle = palette.text;
  ctx.font = `650 22px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.fillStyle = stanceColor(palette, stance);
  ctx.textAlign = "right";
  ctx.fillText(stanceLabel[stance] ?? stance, x + width, y);
  ctx.textAlign = "left";
  roundRect(ctx, x, y + 14, width, 14, 7);
  ctx.fillStyle = palette.border;
  ctx.fill();
  const amount = Math.max(0.08, stanceDistance(stance));
  roundRect(ctx, x, y + 14, width * amount, 14, 7);
  ctx.fillStyle = stanceColor(palette, stance);
  ctx.fill();
}

function card(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number, width: number, height: number) {
  roundRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = palette.surface;
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function stanceColor(palette: Palette, stance: StanceName): string {
  if (stance === "POSITIVE") return palette.positive;
  if (stance === "NEGATIVE") return palette.negative;
  return palette.caution;
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    canvas: read("--color-canvas", "#F7F7F5"),
    surface: read("--color-surface", "#FFFFFF"),
    text: read("--color-text-primary", "#17191C"),
    muted: read("--color-text-muted", "#737981"),
    border: read("--color-border", "#D9DCE0"),
    positive: read("--color-positive", "#1F7A4D"),
    caution: read("--color-caution", "#9A6700"),
    negative: read("--color-negative", "#B42318"),
    positiveSoft: read("--color-positive-soft", "#E5F4EC"),
    negativeSoft: read("--color-negative-soft", "#FBECEA"),
    stage: read("--color-chart-stage", "#1B3A5C"),
    stageEnd: read("--color-chart-stage-end", "#10243C"),
    grid: read("--color-chart-grid", "#D5DEE6"),
    label: read("--color-chart-label", "#F2F6FA"),
    body: getComputedStyle(document.body).fontFamily || "sans-serif",
  };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) clipped = clipped.slice(0, -1);
  return `${clipped}…`;
}
