import {
  criticCoverage,
  distributionLabel,
  gapSentence,
  pairedDimensions,
  percentages,
  shapePoints,
  shapeTone,
  summaryLines,
  type CountShare,
  type Distribution,
  type ReviewLandscape,
  type ShapeMode,
  type ShapePoint,
  type ShapeTone,
} from "@/lib/aggregation/landscape";
import { completionLabel, lensLabel } from "@/lib/domain/labels";
import { fieldModelFrom, guideRings, paintField } from "@/lib/evaluations/field";
import { radarPoint } from "@/lib/evaluations/radar";
import { shareFileName, WATERMARK_LINE, WATERMARK_NAME } from "@/lib/share/targets";

type Population = "critics" | "audience";

export type LandscapeCardInput = {
  title: string;
  kind: string;
  url: string;
  path: string;
  host: string;
  scope: ShapeMode;
  critics: ReviewLandscape;
  audience: ReviewLandscape;
  /** Month span of the evaluations behind the card. */
  period: string | null;
  /** Active filter labels, so the card says which slice it describes. */
  filters: string[];
};

type Palette = {
  canvas: string;
  surface: string;
  text: string;
  secondary: string;
  muted: string;
  border: string;
  positive: string;
  caution: string;
  negative: string;
  stage: string;
  stageEnd: string;
  grid: string;
  label: string;
  body: string;
  display: string;
};

const WIDTH = 1080;
const PAD = 36;
const INNER = WIDTH - PAD * 2;
const SCRATCH_HEIGHT = 3600;
const NAMES: Record<Population, string> = { critics: "Critics", audience: "Audience" };

export async function renderLandscapeCard(input: LandscapeCardInput): Promise<File> {
  await document.fonts.ready;
  const palette = readPalette();
  const dpr = 2;
  const scratch = document.createElement("canvas");
  scratch.width = WIDTH * dpr;
  scratch.height = SCRATCH_HEIGHT * dpr;
  const ctx = scratch.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.scale(dpr, dpr);
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, WIDTH, SCRATCH_HEIGHT);

  const rows = populationsFor(input);
  const dimensions = pairedDimensions(input.critics, input.audience);

  let y = PAD;
  y = drawHeader(ctx, palette, input, rows, y) + 20;
  for (const population of rows) {
    const landscape = population === "critics" ? input.critics : input.audience;
    y = drawRow(ctx, palette, input.host, population, landscape, shapePoints(dimensions, population), y) + 20;
  }
  y = drawGlance(ctx, palette, input, rows, y) + 20;
  const breakdown = dimensions
    .filter((dimension) => rows.some((population) => dimension[population].count > 0))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .slice(0, 10);
  if (breakdown.length > 0) {
    y = drawBreakdown(ctx, palette, rows, breakdown, y) + 20;
  }
  y = drawSummary(ctx, palette, input, rows, y) + 28;
  y = drawFooter(ctx, palette, input.url, y);

  const height = Math.ceil(y);
  const out = document.createElement("canvas");
  out.width = WIDTH * dpr;
  out.height = height * dpr;
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Could not prepare the image.");
  outCtx.drawImage(scratch, 0, 0, WIDTH * dpr, height * dpr, 0, 0, WIDTH * dpr, height * dpr);
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not prepare the image.");
  return new File([blob], shareFileName(input.path), { type: "image/png" });
}

export function scopeLabel(scope: ShapeMode): string {
  if (scope === "critics") return "FRAME Critics";
  if (scope === "audience") return "FRAME Audience";
  return "FRAME Community";
}

function populationsFor(input: LandscapeCardInput): Population[] {
  const rows: Population[] = [];
  if (input.scope !== "audience" && input.critics.sampleSize > 0) rows.push("critics");
  if (input.scope !== "critics" && input.audience.sampleSize > 0) rows.push("audience");
  return rows;
}

function countLine(input: LandscapeCardInput, rows: Population[]): string {
  return rows
    .map((population) =>
      population === "critics"
        ? `Critics: ${criticCoverage(input.critics.coverageCount)}`
        : `Audience: ${input.audience.sampleSize} ${input.audience.sampleSize === 1 ? "evaluation" : "evaluations"}`,
    )
    .join(" · ");
}

function drawHeader(ctx: CanvasRenderingContext2D, palette: Palette, input: LandscapeCardInput, rows: Population[], y: number): number {
  const x = PAD;
  const textWidth = INNER - 56;
  const today = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const snapshot = [
    `Snapshot ${today}`,
    input.period ? `Evaluations from ${input.period}` : null,
    input.filters.length > 0 ? `Filtered to ${input.filters.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  ctx.font = `400 17px ${palette.body}`;
  const snapshotLines = wrapLines(ctx, snapshot, textWidth).slice(0, 2);
  const height = 196 + snapshotLines.length * 24;
  card(ctx, palette, x, y, INNER, height);

  ctx.font = `700 15px ${palette.body}`;
  const badge = scopeLabel(input.scope);
  const badgeWidth = ctx.measureText(badge).width + 28;
  roundRect(ctx, x + 28, y + 26, badgeWidth, 32, 16);
  ctx.fillStyle = palette.stage;
  ctx.fill();
  ctx.fillStyle = palette.label;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, x + 42, y + 43);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.fillText(input.kind.toUpperCase(), x + 28 + badgeWidth + 14, y + 43);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = palette.text;
  fitFont(ctx, input.title, textWidth, palette.display, 46, 26);
  ctx.fillText(input.title, x + 28, y + 112, textWidth);

  ctx.fillStyle = palette.secondary;
  ctx.font = `600 19px ${palette.body}`;
  ctx.fillText(fit(ctx, countLine(input, rows), textWidth), x + 28, y + 150);

  ctx.fillStyle = palette.muted;
  ctx.font = `400 17px ${palette.body}`;
  snapshotLines.forEach((line, index) => ctx.fillText(line, x + 28, y + 182 + index * 24));
  return y + height;
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  host: string,
  population: Population,
  landscape: ReviewLandscape,
  points: ShapePoint[],
  y: number,
): number {
  const stageWidth = 600;
  const height = 480;
  const gap = 16;
  drawStage(ctx, palette, host, population, landscape, points, PAD, y, stageWidth, height);
  drawGap(ctx, palette, population, landscape, PAD + stageWidth + gap, y, INNER - stageWidth - gap, height);
  return y + height;
}

function drawStage(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  host: string,
  population: Population,
  landscape: ReviewLandscape,
  points: ShapePoint[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  roundRect(ctx, x, y, width, height, 24);
  const fill = ctx.createLinearGradient(x, y, x, y + height);
  fill.addColorStop(0, palette.stage);
  fill.addColorStop(1, palette.stageEnd);
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.fillStyle = palette.label;
  ctx.font = `600 15px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("IMPRESSION", x + 24, y + 36);
  ctx.font = `500 14px ${palette.body}`;
  ctx.textAlign = "right";
  ctx.fillText(host, x + width - 24, y + 36);
  ctx.textAlign = "left";

  const cx = x + width / 2;
  const cy = y + height / 2 - 6;
  const radius = 140;
  if (points.length >= 3) {
    const model = fieldModelFrom(points, cx, cy, radius, {
      positive: palette.positive,
      mixed: palette.caution,
      negative: palette.negative,
      divided: palette.grid,
    });
    if (model) paintField(ctx, model);
    ctx.strokeStyle = palette.grid;
    ctx.lineWidth = 1.25;
    for (const ring of guideRings()) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * ring, 0, Math.PI * 2);
      ctx.stroke();
    }
    points.forEach((_, index) => {
      const end = radarPoint(cx, cy, radius, index, points.length, 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
    ctx.beginPath();
    points.forEach((point, index) => {
      const at = radarPoint(cx, cy, radius, index, points.length, point.distance);
      if (index === 0) ctx.moveTo(at.x, at.y);
      else ctx.lineTo(at.x, at.y);
    });
    ctx.closePath();
    ctx.strokeStyle = palette.label;
    ctx.lineWidth = 2;
    ctx.stroke();
    points.forEach((point, index) => {
      const at = radarPoint(cx, cy, radius, index, points.length, point.distance);
      ctx.beginPath();
      ctx.arc(at.x, at.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = toneColor(point.tone, palette);
      ctx.fill();
      ctx.strokeStyle = palette.label;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.fillStyle = palette.label;
    ctx.font = `600 16px ${palette.body}`;
    ctx.textBaseline = "middle";
    points.forEach((point, index) => {
      const at = radarPoint(cx, cy, radius + 28, index, points.length, 1);
      const cos = Math.cos(at.angle);
      ctx.textAlign = cos > 0.35 ? "left" : cos < -0.35 ? "right" : "center";
      ctx.fillText(fit(ctx, point.name, 128), at.x, at.y);
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  } else {
    ctx.fillStyle = palette.grid;
    ctx.font = `400 16px ${palette.body}`;
    ctx.fillText(
      points.length === 0 ? "No dimension judgments yet." : "A shape needs three judged dimensions. Readings so far:",
      x + 24,
      y + 90,
    );
    points.forEach((point, index) => {
      const top = y + 136 + index * 36;
      ctx.fillStyle = palette.label;
      ctx.font = `600 18px ${palette.body}`;
      ctx.fillText(point.name, x + 24, top);
      ctx.textAlign = "right";
      ctx.fillText(distributionLabel(point.distribution), x + width - 24, top);
      ctx.textAlign = "left";
    });
  }

  ctx.font = `700 15px ${palette.body}`;
  const chip = NAMES[population];
  const chipWidth = ctx.measureText(chip).width + 24;
  roundRect(ctx, x + 20, y + height - 52, chipWidth, 32, 8);
  ctx.fillStyle = palette.surface;
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.textBaseline = "middle";
  ctx.fillText(chip, x + 32, y + height - 36);
  ctx.fillStyle = palette.grid;
  ctx.font = `400 15px ${palette.body}`;
  const sample =
    population === "critics" ? `Based on ${criticCoverage(landscape.coverageCount)}` : landscape.sampleNote.replace(/\.$/, "");
  ctx.fillText(sample, x + 20 + chipWidth + 12, y + height - 36);
  ctx.textBaseline = "alphabetic";
}

function drawGap(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  population: Population,
  landscape: ReviewLandscape,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  card(ctx, palette, x, y, width, height);
  const inner = width - 48;
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText(`${NAMES[population].toUpperCase()} · ENJOYMENT AND EXECUTION`, x + 24, y + 36);
  const unit = population === "critics" ? "outlet" : "judgment";
  let cursor = y + 84;
  for (const [label, distribution] of [
    ["Enjoyment", landscape.enjoyment],
    ["Execution", landscape.execution],
  ] as const) {
    cursor = drawBar(ctx, palette, label, distribution, unit, x + 24, cursor, inner) + 28;
  }
  ctx.fillStyle = palette.text;
  ctx.font = `400 17px ${palette.body}`;
  const sentence = gapSentence(landscape) ?? "Fewer than four evaluations, so the gap is not shown.";
  wrapLines(ctx, sentence, inner)
    .slice(0, 4)
    .forEach((line, index) => ctx.fillText(line, x + 24, cursor + 8 + index * 24));
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  label: string,
  distribution: Distribution,
  unit: "outlet" | "judgment",
  x: number,
  y: number,
  width: number,
): number {
  ctx.fillStyle = palette.text;
  ctx.font = `650 21px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.fillStyle = palette.muted;
  ctx.font = `400 15px ${palette.body}`;
  ctx.textAlign = "right";
  ctx.fillText(countLabel(distribution.count, unit), x + width, y);
  ctx.textAlign = "left";
  const top = y + 14;
  roundRect(ctx, x, top, width, 12, 6);
  ctx.fillStyle = palette.border;
  ctx.fill();
  const pct = percentages(distribution);
  if (distribution.count > 0) {
    ctx.save();
    roundRect(ctx, x, top, width, 12, 6);
    ctx.clip();
    let cursor = x;
    for (const segment of [
      { share: pct.positive, color: palette.positive },
      { share: pct.mixed, color: palette.caution },
      { share: pct.negative, color: palette.negative },
    ]) {
      const segmentWidth = (segment.share / 100) * width;
      if (segmentWidth <= 0) continue;
      ctx.fillStyle = segment.color;
      ctx.fillRect(cursor, top, segmentWidth + 0.5, 12);
      cursor += segmentWidth;
    }
    ctx.restore();
  }
  ctx.fillStyle = palette.secondary;
  ctx.font = `400 15px ${palette.body}`;
  const caption =
    distribution.count === 0
      ? unit === "outlet"
        ? "No outlets yet"
        : "No judgments yet"
      : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;
  ctx.fillText(fit(ctx, caption, width), x, top + 36);
  return top + 36;
}

function drawGlance(ctx: CanvasRenderingContext2D, palette: Palette, input: LandscapeCardInput, rows: Population[], y: number): number {
  const items: { value: string; label: string }[] = [];
  if (rows.includes("critics")) items.push({ value: criticCoverage(input.critics.coverageCount), label: "Critic outlets" });
  if (rows.includes("audience")) items.push({ value: String(input.audience.sampleSize), label: "Audience evaluations" });
  const landscapes = rows.map((population) => (population === "critics" ? input.critics : input.audience));
  const lens = topShare(landscapes.map((landscape) => landscape.lenses));
  if (lens) items.push({ value: lensLabel[lens] ?? lens, label: "Most common approach" });
  const completion = topShare(landscapes.map((landscape) => landscape.completions));
  if (completion) items.push({ value: completionLabel[completion] ?? completion, label: "Most common experience" });
  if (items.length === 0) return y - 20;

  const height = 118;
  card(ctx, palette, PAD, y, INNER, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText("AT A GLANCE", PAD + 24, y + 32);
  const column = (INNER - 48) / items.length;
  items.forEach((item, index) => {
    const left = PAD + 24 + column * index;
    ctx.fillStyle = palette.text;
    ctx.font = `650 20px ${palette.body}`;
    ctx.fillText(fit(ctx, item.value, column - 20), left, y + 68);
    ctx.fillStyle = palette.muted;
    ctx.font = `400 14px ${palette.body}`;
    ctx.fillText(fit(ctx, item.label, column - 20), left, y + 92);
  });
  return y + height;
}

function drawBreakdown(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  rows: Population[],
  dimensions: ReturnType<typeof pairedDimensions>,
  y: number,
): number {
  const lineHeight = 38;
  const height = 70 + (rows.length > 1 ? 26 : 0) + dimensions.length * lineHeight;
  card(ctx, palette, PAD, y, INNER, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText("DIMENSION BREAKDOWN", PAD + 24, y + 32);
  const columnWidth = 260;
  const columnRight = (index: number) => PAD + INNER - 24 - (rows.length - 1 - index) * columnWidth;
  let top = y + 66;
  if (rows.length > 1) {
    ctx.textAlign = "right";
    rows.forEach((population, index) => ctx.fillText(NAMES[population].toUpperCase(), columnRight(index), top));
    ctx.textAlign = "left";
    top += 26;
  }
  for (const dimension of dimensions) {
    ctx.fillStyle = palette.text;
    ctx.font = `600 18px ${palette.body}`;
    ctx.textAlign = "left";
    ctx.fillText(fit(ctx, dimension.name, INNER - 48 - rows.length * columnWidth), PAD + 24, top + 6);
    rows.forEach((population, index) => {
      const distribution = dimension[population];
      const right = columnRight(index);
      const text = distribution.count === 0 ? "Not judged" : distributionLabel(distribution);
      const tone: ShapeTone = distribution.count === 0 ? "divided" : shapeTone(distribution);
      ctx.font = `600 17px ${palette.body}`;
      ctx.textAlign = "right";
      ctx.fillStyle = tone === "divided" ? palette.muted : toneColor(tone, palette);
      ctx.fillText(text, right, top + 6);
      const textWidth = ctx.measureText(text).width;
      if (distribution.count > 0) {
        ctx.beginPath();
        ctx.arc(right - textWidth - 14, top, 6, 0, Math.PI * 2);
        ctx.fillStyle = toneColor(tone, palette);
        ctx.fill();
      }
    });
    top += lineHeight;
  }
  ctx.textAlign = "left";
  return y + height;
}

function drawSummary(ctx: CanvasRenderingContext2D, palette: Palette, input: LandscapeCardInput, rows: Population[], y: number): number {
  const showCritics = rows.includes("critics");
  const showAudience = rows.includes("audience");
  const sample = (showCritics ? input.critics.sampleSize : 0) + (showAudience ? input.audience.sampleSize : 0);
  if (sample < 4) {
    const note = noteLines(ctx, palette, ["Too few evaluations to summarize. A small sample is not a consensus."], INNER);
    drawNote(ctx, palette, "WHAT THESE EVALUATIONS SAY", note.lines, PAD, y, INNER, note.height);
    return y + note.height;
  }
  const lines = summaryLines(input.critics, input.audience, showCritics, showAudience);
  const gap = 16;
  const width = (INNER - gap) / 2;
  const agree = noteLines(
    ctx,
    palette,
    lines.agreement.length > 0 ? lines.agreement : ["There is no stable agreement to report from this set."],
    width,
  );
  const split = noteLines(ctx, palette, lines.disagreement.length > 0 ? lines.disagreement : ["This set does not show a clear split."], width);
  const height = Math.max(agree.height, split.height);
  drawNote(ctx, palette, "WHERE THEY AGREE", agree.lines, PAD, y, width, height);
  drawNote(ctx, palette, "WHERE THEY SPLIT", split.lines, PAD + width + gap, y, width, height);
  return y + height;
}

type NoteLine = { part: string; first: boolean };

function noteLines(ctx: CanvasRenderingContext2D, palette: Palette, lines: string[], width: number): { lines: NoteLine[]; height: number } {
  ctx.font = `400 16px ${palette.body}`;
  const wrapped = lines
    .slice(0, 4)
    .flatMap((line) => wrapLines(ctx, line, width - 40).slice(0, 2).map((part, index) => ({ part, first: index === 0 })));
  const starts = wrapped.filter((item) => item.first).length;
  return { lines: wrapped, height: 62 + wrapped.length * 22 + Math.max(0, starts - 1) * 8 + 16 };
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  title: string,
  lines: NoteLine[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  card(ctx, palette, x, y, width, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `700 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText(title, x + 20, y + 32);
  ctx.fillStyle = palette.text;
  ctx.font = `400 16px ${palette.body}`;
  let lineY = y + 62;
  lines.forEach((item, index) => {
    if (item.first && index > 0) lineY += 8;
    ctx.fillText(item.part, x + 20, lineY);
    lineY += 22;
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, palette: Palette, url: string, y: number): number {
  const height = 92;
  ctx.fillStyle = palette.text;
  ctx.fillRect(0, y, WIDTH, height);
  ctx.fillStyle = palette.canvas;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `700 18px ${palette.display}`;
  ctx.fillText(WATERMARK_NAME, PAD, y + 18);
  const nameWidth = ctx.measureText(WATERMARK_NAME).width;
  ctx.font = `400 16px ${palette.body}`;
  ctx.fillText(WATERMARK_LINE, PAD + nameWidth + 14, y + 20);
  ctx.font = `400 15px ${palette.body}`;
  ctx.fillText(fit(ctx, url, INNER), PAD, y + 52);
  ctx.textBaseline = "alphabetic";
  return y + height;
}

function topShare(groups: CountShare[][]): string | null {
  const totals = new Map<string, number>();
  for (const group of groups) {
    for (const item of group) totals.set(item.key, (totals.get(item.key) ?? 0) + item.count);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of totals) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function countLabel(count: number, unit: "judgment" | "outlet"): string {
  if (count === 1) return unit === "outlet" ? "1 outlet" : "1 judgment";
  return unit === "outlet" ? `${count} outlets` : `${count} judgments`;
}

function toneColor(tone: ShapeTone, palette: Palette): string {
  if (tone === "positive") return palette.positive;
  if (tone === "mixed") return palette.caution;
  if (tone === "negative") return palette.negative;
  return palette.grid;
}

function card(ctx: CanvasRenderingContext2D, palette: Palette, x: number, y: number, width: number, height: number) {
  roundRect(ctx, x, y, width, height, 18);
  ctx.fillStyle = palette.surface;
  ctx.fill();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.stroke();
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
    positive: read("--color-positive", "#1F7A4D"),
    caution: read("--color-caution", "#9A6700"),
    negative: read("--color-negative", "#B42318"),
    stage: read("--color-chart-stage", "#1B3A5C"),
    stageEnd: read("--color-chart-stage-end", "#10243C"),
    grid: read("--color-chart-grid", "#D5DEE6"),
    label: read("--color-chart-label", "#F2F6FA"),
    body: getComputedStyle(document.body).fontFamily || "sans-serif",
    display: heading ? getComputedStyle(heading).fontFamily : getComputedStyle(document.body).fontFamily,
  };
}

function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, family: string, size: number, min: number) {
  let next = size;
  ctx.font = `600 ${next}px ${family}`;
  while (next > min && ctx.measureText(text).width > maxWidth) {
    next -= 1;
    ctx.font = `600 ${next}px ${family}`;
  }
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let clipped = text;
  while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) clipped = clipped.slice(0, -1);
  return `${clipped}…`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
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
