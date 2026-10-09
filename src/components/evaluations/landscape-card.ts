import {
  dominantKey,
  pairedSampleNote,
  percentages,
  type Distribution,
  type ReviewLandscape,
} from "@/lib/aggregation/landscape";
import { shareFileName, WATERMARK_LINE, WATERMARK_NAME } from "@/lib/share/targets";

export type ShareAxis = {
  name: string;
  audience: Distribution;
  critics: Distribution;
};

type CardInput = {
  title: string;
  url: string;
  path: string;
  axes: ShareAxis[];
  audience: ReviewLandscape;
  critics: ReviewLandscape;
  showAudience: boolean;
  showCritics: boolean;
};

type Palette = {
  canvas: string;
  surface: string;
  text: string;
  secondary: string;
  muted: string;
  border: string;
  borderStrong: string;
  accent: string;
  positive: string;
  caution: string;
  negative: string;
  body: string;
  display: string;
};

const NOTE =
  "Distance from the center is the share of positive judgments among people who judged that dimension. Dot color is the stance reading.";

export async function renderLandscapeCard(input: CardInput): Promise<File> {
  await document.fonts.ready;
  const palette = readPalette();
  const width = 1280;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const scratch = document.createElement("canvas");
  scratch.width = width * dpr;
  scratch.height = 1500 * dpr;
  const ctx = scratch.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.scale(dpr, dpr);
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, width, 1500);
  ctx.textBaseline = "top";

  const pad = 48;
  let y = 44;
  ctx.fillStyle = palette.text;
  ctx.font = `600 34px ${palette.display}`;
  y += drawFitted(ctx, input.title, pad, y, width - pad * 2, palette.display) + 12;
  ctx.fillStyle = palette.muted;
  ctx.font = `16px ${palette.body}`;
  const sample = `${viewLabel(input.showAudience, input.showCritics)}. ${pairedSampleNote(input.critics, input.audience)}`;
  y += wrap(ctx, sample, pad, y, width - pad * 2, 22) + 20;

  const chartTop = y;
  const chartHeight = 560;
  drawRadar(ctx, palette, input, pad, chartTop, 680, chartHeight);
  drawBars(ctx, palette, input, 760, chartTop, 472);
  y = chartTop + chartHeight + 8;

  ctx.fillStyle = palette.muted;
  ctx.font = `15px ${palette.body}`;
  y += wrap(ctx, NOTE, pad, y, width - pad * 2, 22) + 16;
  y += drawLegend(ctx, palette, input, pad, y, width - pad * 2) + 22;

  const footer = 92;
  ctx.fillStyle = palette.text;
  ctx.fillRect(0, y, width, footer);
  ctx.fillStyle = palette.canvas;
  ctx.font = `700 18px ${palette.display}`;
  ctx.fillText(WATERMARK_NAME, pad, y + 18);
  const nameWidth = ctx.measureText(WATERMARK_NAME).width;
  ctx.font = `16px ${palette.body}`;
  ctx.fillText(WATERMARK_LINE, pad + nameWidth + 14, y + 20);
  ctx.font = `15px ${palette.body}`;
  drawFitted(ctx, input.url, pad, y + 50, width - pad * 2, palette.body, 15);
  y += footer;

  const used = Math.ceil(y);
  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = used * dpr;
  const out = canvas.getContext("2d");
  if (!out) throw new Error("Could not prepare the image.");
  out.drawImage(scratch, 0, 0, width * dpr, used * dpr, 0, 0, width * dpr, used * dpr);
  out.strokeStyle = palette.border;
  out.lineWidth = dpr;
  out.strokeRect(dpr / 2, dpr / 2, width * dpr - dpr, used * dpr - dpr);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not prepare the image."))), "image/png");
  });
  return new File([blob], shareFileName(input.path), { type: "image/png" });
}

function viewLabel(showAudience: boolean, showCritics: boolean): string {
  if (showAudience && showCritics) return "Audience and critics";
  if (showAudience) return "Audience";
  return "Critics";
}

function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const heading = document.querySelector("h1");
  return {
    canvas: read("--color-canvas", "#F7F7F5"),
    surface: read("--color-surface", "#FFFFFF"),
    text: read("--color-text-primary", "#17191C"),
    secondary: read("--color-text-secondary", "#34383D"),
    muted: read("--color-text-muted", "#737981"),
    border: read("--color-border", "#D9DCE0"),
    borderStrong: read("--color-border-strong", "#B7BCC3"),
    accent: read("--color-accent", "#3157D5"),
    positive: read("--color-positive", "#1F7A4D"),
    caution: read("--color-caution", "#9A6700"),
    negative: read("--color-negative", "#B42318"),
    body: getComputedStyle(document.body).fontFamily,
    display: heading ? getComputedStyle(heading).fontFamily : getComputedStyle(document.body).fontFamily,
  };
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  input: CardInput,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const axes = input.axes;
  if (axes.length < 3) return;
  const cx = x + width / 2;
  const cy = y + height / 2 - 8;
  const radius = 188;
  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.fillStyle = palette.muted;
  ctx.font = `12px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const tick of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * tick, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const tick of [0.25, 0.5, 0.75]) {
    ctx.fillText(`${tick * 100}%`, cx + 8, cy - radius * tick);
  }
  for (let index = 0; index < axes.length; index += 1) {
    const end = polar(cx, cy, radius, index, axes.length, 1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  if (input.showCritics) drawPolygon(ctx, palette, axes, "critics", cx, cy, radius);
  if (input.showAudience) drawPolygon(ctx, palette, axes, "audience", cx, cy, radius);
  if (input.showCritics) {
    axes.forEach((axis, index) => drawDot(ctx, palette, axis, index, axes.length, "critics", cx, cy, radius, input.showAudience));
  }
  if (input.showAudience) {
    axes.forEach((axis, index) => drawDot(ctx, palette, axis, index, axes.length, "audience", cx, cy, radius, false));
  }
  ctx.fillStyle = palette.text;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textBaseline = "middle";
  axes.forEach((axis, index) => {
    const point = polar(cx, cy, radius + 58, index, axes.length, 1);
    const cos = Math.cos(point.angle);
    ctx.textAlign = cos > 0.35 ? "left" : cos < -0.35 ? "right" : "center";
    ctx.fillText(axis.name, point.x, point.y);
  });
  ctx.restore();
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  axes: ShareAxis[],
  population: "audience" | "critics",
  cx: number,
  cy: number,
  radius: number,
) {
  const points = axes.flatMap((axis, index) => {
    const distribution = axis[population];
    if (distribution.count === 0) return [];
    return [polar(cx, cy, radius, index, axes.length, distribution.positive / distribution.count)];
  });
  if (points.length < 3) return;
  ctx.beginPath();
  points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
  ctx.closePath();
  if (population === "audience") {
    ctx.fillStyle = withAlpha(palette.accent, 0.18);
    ctx.fill();
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 2.25;
    ctx.setLineDash([]);
  } else {
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = 1.75;
    ctx.setLineDash([5, 4]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  axis: ShareAxis,
  index: number,
  total: number,
  population: "audience" | "critics",
  cx: number,
  cy: number,
  radius: number,
  hollow: boolean,
) {
  const distribution = axis[population];
  if (distribution.count === 0) return;
  const share = distribution.positive / distribution.count;
  const point = polar(cx, cy, radius, index, total, share < 0.08 ? 0.08 : share);
  const color = toneColor(dotTone(distribution), palette);
  ctx.beginPath();
  ctx.arc(point.x, point.y, hollow ? 7 : 5.5, 0, Math.PI * 2);
  ctx.fillStyle = hollow ? palette.surface : color;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  input: CardInput,
  x: number,
  y: number,
  width: number,
) {
  const rows = barRows(input);
  const height = 30 + rows.reduce((sum, row) => sum + (row.kind === "heading" ? 34 : 70), 0);
  roundRect(ctx, x, y, width, height, 8);
  ctx.fillStyle = palette.surface;
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  let cursor = y + 22;
  const inner = x + 22;
  const innerWidth = width - 44;
  for (const row of rows) {
    if (row.kind === "heading") {
      ctx.fillStyle = palette.text;
      ctx.font = `600 20px ${palette.display}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(row.label, inner, cursor);
      cursor += 34;
      continue;
    }
    ctx.fillStyle = palette.text;
    ctx.font = `600 15px ${palette.body}`;
    ctx.textAlign = "left";
    ctx.fillText(row.label, inner, cursor);
    ctx.fillStyle = palette.muted;
    ctx.font = `14px ${palette.body}`;
    ctx.textAlign = "right";
    ctx.fillText(row.count, inner + innerWidth, cursor);
    cursor += 24;
    const pct = percentages(row.distribution);
    if (row.distribution.count === 0) {
      roundRect(ctx, inner, cursor, innerWidth, 8, 4);
      ctx.fillStyle = palette.border;
      ctx.fill();
    } else {
      stackedBar(ctx, inner, cursor, innerWidth, 8, pct, palette);
    }
    cursor += 16;
    ctx.fillStyle = palette.secondary;
    ctx.font = `14px ${palette.body}`;
    ctx.textAlign = "left";
    const caption =
      row.distribution.count === 0
        ? row.unit === "outlet"
          ? "No outlets yet"
          : "No judgments yet"
        : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;
    ctx.fillText(caption, inner, cursor);
    cursor += 28;
  }
}

function barRows(input: CardInput): Array<
  | { kind: "heading"; label: string }
  | { kind: "bar"; label: string; count: string; unit: "judgment" | "outlet"; distribution: Distribution }
> {
  const rows: Array<
    | { kind: "heading"; label: string }
    | { kind: "bar"; label: string; count: string; unit: "judgment" | "outlet"; distribution: Distribution }
  > = [];
  for (const heading of ["Enjoyment", "Execution"] as const) {
    const key = heading === "Enjoyment" ? "enjoyment" : "execution";
    rows.push({ kind: "heading", label: heading });
    if (input.showAudience) {
      rows.push({
        kind: "bar",
        label: "Audience",
        count: countLabel(input.audience[key].count, "judgment"),
        unit: "judgment",
        distribution: input.audience[key],
      });
    }
    if (input.showCritics) {
      rows.push({
        kind: "bar",
        label: "Critics",
        count: countLabel(input.critics[key].count, "outlet"),
        unit: "outlet",
        distribution: input.critics[key],
      });
    }
  }
  return rows;
}

function stackedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pct: { positive: number; mixed: number; negative: number },
  palette: Palette,
) {
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.save();
  ctx.clip();
  let cursor = x;
  for (const segment of [
    { width: (pct.positive / 100) * width, color: palette.positive },
    { width: (pct.mixed / 100) * width, color: palette.caution },
    { width: (pct.negative / 100) * width, color: palette.negative },
  ]) {
    if (segment.width <= 0) continue;
    ctx.fillStyle = segment.color;
    ctx.fillRect(cursor, y, segment.width + 0.5, height);
    cursor += segment.width;
  }
  ctx.restore();
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  input: CardInput,
  x: number,
  y: number,
  width: number,
): number {
  const items: { kind: "line" | "dash" | "dot"; color: string; label: string }[] = [];
  if (input.showAudience) items.push({ kind: "line", color: palette.accent, label: "Audience · share of positive judgments" });
  if (input.showCritics) items.push({ kind: "dash", color: palette.text, label: "Critics · share of positive judgments" });
  items.push(
    { kind: "dot", color: palette.positive, label: "Positive reading" },
    { kind: "dot", color: palette.caution, label: "Mixed reading" },
    { kind: "dot", color: palette.negative, label: "Negative reading" },
    { kind: "dot", color: palette.borderStrong, label: "Divided, or fewer than 4" },
  );
  ctx.font = `14px ${palette.body}`;
  ctx.textBaseline = "middle";
  let cursorX = x;
  let cursorY = y + 8;
  let rows = 1;
  for (const item of items) {
    const itemWidth = 22 + ctx.measureText(item.label).width + 18;
    if (cursorX > x && cursorX + itemWidth > x + width) {
      cursorX = x;
      cursorY += 26;
      rows += 1;
    }
    if (item.kind === "dot") {
      ctx.beginPath();
      ctx.arc(cursorX + 5, cursorY, 5, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      ctx.setLineDash(item.kind === "dash" ? [4, 3] : []);
      ctx.moveTo(cursorX, cursorY);
      ctx.lineTo(cursorX + 16, cursorY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = palette.secondary;
    ctx.textAlign = "left";
    ctx.fillText(item.label, cursorX + 22, cursorY);
    cursorX += itemWidth;
  }
  return rows * 26;
}

function drawFitted(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  family: string,
  size = 34,
): number {
  let next = size;
  ctx.font = `600 ${next}px ${family}`;
  while (next > 16 && ctx.measureText(text).width > maxWidth) {
    next -= 1;
    ctx.font = `600 ${next}px ${family}`;
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y, maxWidth);
  return next + 4;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(" ");
  let line = "";
  let drawn = 0;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      ctx.fillText(line, x, y + drawn);
      line = word;
      drawn += lineHeight;
    } else {
      line = next;
    }
  }
  if (line) {
    ctx.fillText(line, x, y + drawn);
    drawn += lineHeight;
  }
  return drawn;
}

function countLabel(count: number, unit: "judgment" | "outlet"): string {
  if (count === 1) return unit === "outlet" ? "1 outlet" : "1 judgment";
  return unit === "outlet" ? `${count} outlets` : `${count} judgments`;
}

function dotTone(distribution: Distribution): "positive" | "mixed" | "negative" | "divided" {
  if (distribution.count < 4) return "divided";
  const key = dominantKey(distribution);
  if (!key) return "divided";
  if (distribution[key] / distribution.count < 0.5) return "divided";
  return key;
}

function toneColor(tone: "positive" | "mixed" | "negative" | "divided", palette: Palette): string {
  if (tone === "positive") return palette.positive;
  if (tone === "mixed") return palette.caution;
  if (tone === "negative") return palette.negative;
  return palette.borderStrong;
}

function polar(cx: number, cy: number, radius: number, index: number, total: number, value: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: cx + Math.cos(angle) * radius * value,
    y: cy + Math.sin(angle) * radius * value,
    angle,
  };
}

function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return color;
  const value = match[1];
  return `rgba(${parseInt(value.slice(0, 2), 16)}, ${parseInt(value.slice(2, 4), 16)}, ${parseInt(value.slice(4, 6), 16)}, ${alpha})`;
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
