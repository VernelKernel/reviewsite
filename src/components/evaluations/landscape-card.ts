import {
  criticCoverage,
  distributionLabel,
  pairedDimensions,
  percentages,
  shapePoints,
  summaryLines,
  type CountShare,
  type Distribution,
  type ReviewLandscape,
  type ShapeMode,
  type ShapePoint,
  type ShapeTone,
} from "@/lib/aggregation/landscape";
import { completionLabel } from "@/lib/domain/labels";
import { distributionStops } from "@/components/evaluations/distribution-bar";
import { nestExportLayout, paintNest, readNestPalette } from "@/components/evaluations/nest-paint";
import { diamondGeometry } from "@/components/evaluations/shape-mark";
import { loadCoverArt } from "@/components/works/emblem-export";
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
  /** Tall cover, when the work has one. The header paints it with the critic emblem. */
  coverSrc?: string | null;
  /** Impression-radar vertex dots, matching each population's Execution graph. Hidden when omitted. */
  showPoints?: Partial<Record<Population, boolean>>;
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
  divided: string;
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
  y = (await drawHeader(ctx, palette, input, y)) + 20;
  for (const population of rows) {
    const landscape = population === "critics" ? input.critics : input.audience;
    y =
      drawRow(
        ctx,
        palette,
        input.host,
        population,
        landscape,
        shapePoints(dimensions, population),
        input.showPoints?.[population] === true,
        y,
      ) + 20;
  }
  y = drawGlance(ctx, palette, input, rows, y) + 20;
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

async function drawHeader(ctx: CanvasRenderingContext2D, palette: Palette, input: LandscapeCardInput, y: number): Promise<number> {
  const x = PAD;
  const cover = input.coverSrc ? await loadCoverArt(input.coverSrc).catch(() => null) : null;
  const coverW = cover ? 112 : 0;
  const coverH = cover ? 168 : 0;
  const gutter = cover ? 20 : 0;
  const textX = x + 28 + coverW + gutter;
  const textWidth = Math.max(160, x + INNER - 40 - textX);
  const today = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const snapshot = [`Snapshot ${today}`, input.filters.length > 0 ? `Filtered to ${input.filters.join(", ")}` : null]
    .filter(Boolean)
    .join(" · ");
  ctx.font = `400 16px ${palette.body}`;
  const snapshotLines = wrapLines(ctx, snapshot, textWidth).slice(0, 2);
  const title = layoutTitle(ctx, input.title, textWidth, palette.display);
  const textBottom = 28 + 32 + 22 + title.lines.length * title.line + 22 + snapshotLines.length * 22 + 16;
  const height = Math.max(cover ? 28 + coverH + 28 : 148, textBottom);
  card(ctx, palette, x, y, INNER, height);

  if (cover) paintCover(ctx, cover, input, x + 28, y + 28, coverW, coverH);

  ctx.font = `700 15px ${palette.body}`;
  const badge = scopeLabel(input.scope);
  const badgeWidth = ctx.measureText(badge).width + 28;
  const badgeY = y + 28;
  roundRect(ctx, textX, badgeY, badgeWidth, 32, 16);
  ctx.fillStyle = palette.stage;
  ctx.fill();
  ctx.fillStyle = palette.label;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, textX + 14, badgeY + 16);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.fillText(input.kind.toUpperCase(), textX + badgeWidth + 14, badgeY + 16);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = palette.text;
  ctx.font = `650 ${title.size}px ${palette.display}`;
  title.lines.forEach((line, index) => ctx.fillText(line, textX, badgeY + 32 + 28 + index * title.line));

  ctx.fillStyle = palette.muted;
  ctx.font = `400 16px ${palette.body}`;
  const snapshotY = badgeY + 32 + 28 + title.lines.length * title.line + 8;
  snapshotLines.forEach((line, index) => ctx.fillText(line, textX, snapshotY + index * 22));
  return y + height;
}

function paintCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  input: LandscapeCardInput,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (image.naturalWidth < 2 || image.naturalHeight < 2) return;
  ctx.save();
  roundRect(ctx, x, y, width, height, 8);
  ctx.clip();
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const dw = image.naturalWidth * scale;
  const dh = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
  ctx.restore();

  const short = Math.min(width, height);
  const pad = Math.max(2, short * 0.02);
  const mark = short * 0.42 * 0.75 * 0.75;
  const nestScale = mark / nestExportLayout(1).size;
  const { size, frame } = nestExportLayout(nestScale);
  const emblem = document.createElement("canvas");
  emblem.width = size;
  emblem.height = size;
  const off = emblem.getContext("2d");
  if (!off) return;
  paintNest(off, frame, input.critics.execution, input.critics.enjoyment, readNestPalette(), false);
  ctx.drawImage(emblem, x + width - pad - mark, y + height - pad - mark, mark, mark);
}

function layoutTitle(
  ctx: CanvasRenderingContext2D,
  title: string,
  maxWidth: number,
  family: string,
): { size: number; line: number; lines: string[] } {
  let size = 28;
  const min = 18;
  while (size >= min) {
    ctx.font = `650 ${size}px ${family}`;
    const lines = wrapLines(ctx, title, maxWidth);
    const fits = lines.length <= 3 && lines.every((line) => ctx.measureText(line).width <= maxWidth + 1);
    if (fits) return { size, line: Math.round(size * 1.2), lines };
    size -= 1;
  }
  ctx.font = `650 ${min}px ${family}`;
  const lines = wrapLines(ctx, title, maxWidth).slice(0, 3);
  const last = lines[2];
  if (last && ctx.measureText(last).width > maxWidth) lines[2] = fit(ctx, last, maxWidth);
  return { size: min, line: Math.round(min * 1.2), lines };
}

function drawRow(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  host: string,
  population: Population,
  landscape: ReviewLandscape,
  points: ShapePoint[],
  showPoints: boolean,
  y: number,
): number {
  const stageWidth = 600;
  const height = 480;
  const gap = 16;
  drawStage(ctx, palette, host, population, landscape, points, showPoints, PAD, y, stageWidth, height);
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
  showPoints: boolean,
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
      divided: palette.divided,
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
    if (showPoints) {
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
    }
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
    population === "critics"
      ? `Based on ${criticCoverage(landscape.coverageCount)}`
      : `Based on ${landscape.sampleSize} ${landscape.sampleSize === 1 ? "review" : "reviews"}`;
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
  const inner = width - 48;
  const unit = population === "critics" ? "outlet" : "judgment";
  card(ctx, palette, x, y, width, height);
  ctx.fillStyle = palette.muted;
  ctx.font = `600 14px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText(`${NAMES[population].toUpperCase()} OVERALL`, x + 24, y + 36);
  const top = y + 58;
  const band = (height - (top - y) - 16) / 2;
  drawReading(ctx, palette, "Enjoyment", landscape.enjoyment, unit, x + 24, top, inner, band);
  drawReading(ctx, palette, "Execution", landscape.execution, unit, x + 24, top + band, inner, band);
}

function drawReading(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  label: string,
  distribution: Distribution,
  unit: "outlet" | "judgment",
  x: number,
  y: number,
  width: number,
  band: number,
) {
  drawBar(ctx, palette, label, distribution, unit, x, y, width);
  const captionBottom = y + 62;
  const room = y + band - captionBottom;
  const size = Math.min(width * 0.46, Math.max(0, room - 8));
  if (size < 56) return;
  const radius = size * 0.44;
  paintDiamond(ctx, palette, distribution, x + width / 2, captionBottom + room / 2, radius);
}

function paintDiamond(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  distribution: Distribution,
  cx: number,
  cy: number,
  radius: number,
) {
  if (!distribution.count) {
    traceDiamond(ctx, cx, cy, radius);
    ctx.fillStyle = palette.border;
    ctx.fill();
    return;
  }
  const model = fieldModelFrom(diamondGeometry(distribution), cx, cy, radius, {
    positive: palette.positive,
    mixed: palette.caution,
    negative: palette.negative,
  });
  if (!model) return;
  paintField(ctx, model, { scale: 2, edge: false });
}

function traceDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath();
  for (let index = 0; index < 4; index += 1) {
    const point = radarPoint(cx, cy, radius, index, 4, 1);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
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
  const top = y + 14;
  const barHeight = 8;
  const pct = percentages(distribution);
  paintDistribution(ctx, palette, pct, x, top, width, barHeight);
  ctx.fillStyle = palette.secondary;
  ctx.font = `400 15px ${palette.body}`;
  const caption =
    distribution.count === 0
      ? unit === "outlet"
        ? "No outlets yet"
        : "No reviewers yet"
      : `Positive ${pct.positive}% · Mixed ${pct.mixed}% · Negative ${pct.negative}%`;
  ctx.fillText(fit(ctx, caption, width), x, top + 36);
  return top + 36;
}

function drawGlance(ctx: CanvasRenderingContext2D, palette: Palette, input: LandscapeCardInput, rows: Population[], y: number): number {
  const items: { value: string; label: string }[] = [];
  if (rows.includes("critics")) items.push({ value: criticCoverage(input.critics.coverageCount), label: "Critic outlets" });
  if (rows.includes("audience")) items.push({ value: String(input.audience.sampleSize), label: "Audience evaluations" });
  const landscapes = rows.map((population) => (population === "critics" ? input.critics : input.audience));
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

function toneColor(tone: ShapeTone, palette: Palette): string {
  if (tone === "positive") return palette.positive;
  if (tone === "mixed") return palette.caution;
  if (tone === "negative") return palette.negative;
  return palette.divided;
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
    divided: read("--color-divided", "#FFF200"),
    label: read("--color-chart-label", "#F2F6FA"),
    body: getComputedStyle(document.body).fontFamily || "sans-serif",
    display: heading ? getComputedStyle(heading).fontFamily : getComputedStyle(document.body).fontFamily,
  };
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

function paintDistribution(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  share: { positive: number; mixed: number; negative: number },
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const colors = { positive: palette.positive, mixed: palette.caution, negative: palette.negative };
  ctx.save();
  roundRect(ctx, x, y, width, height, Math.min(4, height / 2));
  ctx.clip();
  ctx.fillStyle = palette.border;
  ctx.fillRect(x, y, width, height);
  const stops = distributionStops(share);
  if (stops.length > 0) {
    if (stops.every((stop) => stop.key === stops[0].key)) {
      ctx.fillStyle = colors[stops[0].key];
      ctx.fillRect(x, y, width, height);
    } else {
      const columns = Math.max(1, Math.ceil(width));
      for (let column = 0; column < columns; column += 1) {
        const rgb = sampleStop(stops, colors, (column / columns) * 100);
        ctx.fillStyle = `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
        ctx.fillRect(x + column, y, 1, height);
      }
    }
    const sheen = ctx.createLinearGradient(x, y, x, y + height);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.32, "rgba(255,255,255,0.42)");
    sheen.addColorStop(0.68, "rgba(255,255,255,0.42)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, width, height);
  }
  ctx.restore();
}

function sampleStop(
  stops: { at: number; key: "positive" | "mixed" | "negative" }[],
  colors: Record<"positive" | "mixed" | "negative", string>,
  at: number,
): Rgb {
  let previous = stops[0];
  let next = stops[stops.length - 1];
  for (let index = 1; index < stops.length; index += 1) {
    if (at <= stops[index].at) {
      previous = stops[index - 1];
      next = stops[index];
      break;
    }
  }
  const from = parseRgb(colors[previous.key]);
  const to = parseRgb(colors[next.key]);
  const span = next.at - previous.at;
  const t = span <= 0 ? 0 : Math.min(1, Math.max(0, (at - previous.at) / span));
  if (previous.key === next.key || t <= 0) return from;
  if (t >= 1) return to;
  return oklabToRgb(lerpLab(rgbToOklab(from), rgbToOklab(to), t));
}

type Rgb = { r: number; g: number; b: number };
type Lab = { L: number; a: number; b: number };

function parseRgb(input: string): Rgb {
  const hex = input.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const value = hex[1];
    return { r: Number.parseInt(value.slice(0, 2), 16), g: Number.parseInt(value.slice(2, 4), 16), b: Number.parseInt(value.slice(4, 6), 16) };
  }
  const channels = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (channels) return { r: Number(channels[1]), g: Number(channels[2]), b: Number(channels[3]) };
  return { r: 31, g: 122, b: 77 };
}

function rgbToOklab({ r, g, b }: Rgb): Lab {
  const lr = linearize(r);
  const lg = linearize(g);
  const lb = linearize(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToRgb({ L, a, b }: Lab): Rgb {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l * l * l;
  const m3 = m * m * m;
  const s3 = s * s * s;
  return {
    r: delinear(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: delinear(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: delinear(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
}

function lerpLab(from: Lab, to: Lab, t: number): Lab {
  return { L: from.L + (to.L - from.L) * t, a: from.a + (to.a - from.a) * t, b: from.b + (to.b - from.b) * t };
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function delinear(channel: number): number {
  const value = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, value)) * 255);
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
