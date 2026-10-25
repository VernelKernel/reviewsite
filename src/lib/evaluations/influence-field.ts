import { percentages, type Distribution } from "@/lib/aggregation/landscape";
import { fieldModelFrom, shadeField, type FieldPalette, type Lab, type SpinSource } from "./field";
import { radarPoint } from "./radar";

/**
 * Artistic placement of the three influences. y increases toward the bottom tip.
 * Mixed is lower and tighter so a minority gold share can reach the same purity
 * at its focus that negative already reaches. A wide center wash stops near an
 * even blend with green, and that blend is olive rather than gold.
 */
export const INFLUENCE_SOURCES = {
  positive: [
    { cx: 0, cy: -0.58, sx: 0.82, sy: 0.52, gain: 1.2 },
    { cx: -0.62, cy: -0.16, sx: 0.46, sy: 0.52, gain: 0.88 },
    { cx: 0.62, cy: -0.16, sx: 0.46, sy: 0.52, gain: 0.88 },
  ],
  mixed: [{ cx: 0, cy: 0.48, sx: 0.3, sy: 0.26, gain: 1.35 }],
  negative: [{ cx: 0, cy: 0.7, sx: 0.44, sy: 0.38, gain: 1 }],
} as const;

const FIT_TOLERANCE = 0.001;
const FIT_ITERATIONS = 48;

export type InfluenceWeights = {
  positive: number;
  mixed: number;
  negative: number;
};

export type InfluenceDiagnostic = {
  target: InfluenceWeights;
  achieved: InfluenceWeights;
  maxError: number;
  iterations: number;
  converged: boolean;
};

export type InfluenceChannel = "color" | "positive" | "mixed" | "negative";

type Gaussian = { cx: number; cy: number; sx: number; sy: number; gain: number };
type SourceEnergy = InfluenceWeights;
type Key = keyof InfluenceWeights;

const KEYS: Key[] = ["positive", "mixed", "negative"];

export function gaussian2D(x: number, y: number, cx: number, cy: number, sx: number, sy: number): number {
  const dx = (x - cx) / sx;
  const dy = (y - cy) / sy;
  return Math.exp(-0.5 * (dx * dx + dy * dy));
}

function energy(x: number, y: number, blobs: readonly Gaussian[]): number {
  let sum = 0;
  for (const blob of blobs) sum += blob.gain * gaussian2D(x, y, blob.cx, blob.cy, blob.sx, blob.sy);
  return sum;
}

/** Three nonnegative source fields on a diamond normalized to [-1, 1]. */
export function sentimentSources(x: number, y: number): SourceEnergy {
  return {
    positive: energy(x, y, INFLUENCE_SOURCES.positive),
    mixed: energy(x, y, INFLUENCE_SOURCES.mixed),
    negative: energy(x, y, INFLUENCE_SOURCES.negative),
  };
}

export function shareOf(distribution: Distribution): InfluenceWeights {
  const pct = percentages(distribution);
  return { positive: pct.positive / 100, mixed: pct.mixed / 100, negative: pct.negative / 100 };
}

function emptyWeights(): InfluenceWeights {
  return { positive: 0, mixed: 0, negative: 0 };
}

function activeKeys(target: InfluenceWeights): Key[] {
  return KEYS.filter((key) => target[key] > 1e-8);
}

/** Normalized influences for one pixel. A zero share stays identically zero. */
export function influenceAt(source: SourceEnergy, scale: InfluenceWeights, active: Key[]): InfluenceWeights {
  if (active.length === 1) {
    const weights = emptyWeights();
    weights[active[0]] = 1;
    return weights;
  }
  let denom = 0;
  for (const key of active) denom += scale[key] * source[key];
  const weights = emptyWeights();
  if (denom < 1e-18) {
    const share = 1 / active.length;
    for (const key of active) weights[key] = share;
    return weights;
  }
  for (const key of active) weights[key] = (scale[key] * source[key]) / denom;
  return weights;
}

export type InfluenceSample = { x: number; y: number; source: SourceEnergy };

/** Pixel centers inside a normalized diamond. `hole` is the inner L1 radius, 0 for a filled diamond. */
export function maskSources(size: number, hole = 0): InfluenceSample[] {
  const samples: InfluenceSample[] = [];
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      const x = (2 * (px + 0.5)) / size - 1;
      const y = (2 * (py + 0.5)) / size - 1;
      const radius = Math.abs(x) + Math.abs(y);
      if (radius > 1 || radius < hole) continue;
      samples.push({ x, y, source: sentimentSources(x, y) });
    }
  }
  return samples;
}

/**
 * Scale the three sources until their area-weighted influence matches the share.
 * Iterative proportional fitting in log space, damped if a step overshoots.
 */
export function fitInfluenceScales(sources: SourceEnergy[], target: InfluenceWeights): {
  scale: InfluenceWeights;
  diagnostic: InfluenceDiagnostic;
} {
  const active = activeKeys(target);
  const achieved = emptyWeights();
  if (sources.length === 0 || active.length === 0) {
    return {
      scale: emptyWeights(),
      diagnostic: { target, achieved, maxError: 0, iterations: 0, converged: active.length === 0 },
    };
  }
  if (active.length === 1) {
    achieved[active[0]] = 1;
    return {
      scale: { ...emptyWeights(), [active[0]]: 1 },
      diagnostic: { target, achieved, maxError: Math.abs(1 - target[active[0]]), iterations: 0, converged: true },
    };
  }

  const log = emptyWeights();
  let damping = 1;
  let previousError = Number.POSITIVE_INFINITY;
  let bestError = Number.POSITIVE_INFINITY;
  let bestLog = { ...log };
  let bestAchieved = emptyWeights();
  let iterations = 0;

  for (let iter = 1; iter <= FIT_ITERATIONS; iter += 1) {
    iterations = iter;
    const scale = scalesFromLog(log, active);
    const observed = averageInfluence(sources, scale, active);
    let maxError = 0;
    for (const key of active) maxError = Math.max(maxError, Math.abs(observed[key] - target[key]));
    if (maxError < bestError) {
      bestError = maxError;
      bestLog = { ...log };
      bestAchieved = observed;
    }
    if (maxError < FIT_TOLERANCE) {
      return {
        scale,
        diagnostic: { target, achieved: observed, maxError, iterations, converged: true },
      };
    }
    if (maxError > previousError * 1.01 && damping > 0.2) damping *= 0.5;
    previousError = maxError;
    for (const key of active) {
      const ratio = target[key] / Math.max(observed[key], 1e-15);
      log[key] = clamp(log[key] + damping * Math.log(ratio), -12, 12);
    }
    let mean = 0;
    for (const key of active) mean += log[key];
    mean /= active.length;
    for (const key of active) log[key] -= mean;
  }

  return {
    scale: scalesFromLog(bestLog, active),
    diagnostic: { target, achieved: bestAchieved, maxError: bestError, iterations, converged: bestError < FIT_TOLERANCE },
  };
}

export function calibrateInfluences(samples: InfluenceSample[], target: InfluenceWeights): {
  weights: InfluenceWeights[];
  scale: InfluenceWeights;
  diagnostic: InfluenceDiagnostic;
} {
  const fitted = fitInfluenceScales(
    samples.map((sample) => sample.source),
    target,
  );
  const active = activeKeys(target);
  return {
    ...fitted,
    weights: samples.map((sample) => influenceAt(sample.source, fitted.scale, active)),
  };
}

/** Readable calibration record: targets, achieved averages, error, and iteration count. */
export function influenceDiagnosticText(diagnostic: InfluenceDiagnostic): string {
  const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
  const line = (weights: InfluenceWeights) =>
    `${pct(weights.positive)} / ${pct(weights.mixed)} / ${pct(weights.negative)}`;
  return [
    `Target ${line(diagnostic.target)}`,
    `Achieved ${line(diagnostic.achieved)}`,
    `Max error ${diagnostic.maxError.toFixed(4)}`,
    `Iterations ${diagnostic.iterations}`,
  ].join("\n");
}

const scaleCache = new Map<string, { scale: InfluenceWeights; diagnostic: InfluenceDiagnostic }>();

/**
 * Paints one diamond layer from calibrated influences.
 * `hole` is the inner L1 radius as a fraction of `radius` (0 for a filled diamond).
 * A channel other than "color" paints that influence in grayscale.
 */
export function paintInfluenceDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  share: InfluenceWeights,
  palette: FieldPalette,
  hole = 0,
  channel: InfluenceChannel = "color",
): InfluenceDiagnostic {
  const blank = {
    target: share,
    achieved: emptyWeights(),
    maxError: 0,
    iterations: 0,
    converged: true,
  };
  if (radius < 2 || hole >= 1) return blank;
  const model = fieldModelFrom(
    [1, 1, 1, 1].map((t) => ({ distance: 1, t })),
    cx,
    cy,
    radius,
    palette,
  );
  if (!model) return blank;

  const pad = 2;
  const left = Math.floor(cx - radius - pad);
  const top = Math.floor(cy - radius - pad);
  const right = Math.ceil(cx + radius + pad);
  const bottom = Math.ceil(cy + radius + pad);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const raster = radius < 400 ? 2 : 1;
  const samples = collectSamples(cx, cy, radius, hole, left, top, width, height, raster);
  if (samples.length === 0) return blank;
  const fitted = scalesFor(samples, share, `${raster}|${radius.toFixed(3)}|${hole.toFixed(4)}|${left}|${top}`);
  paintSamples(ctx, model, samples, fitted.scale, share, channel, left, top, width, height, raster);
  return fitted.diagnostic;
}

/** Spin texture for the nested emblem. The ring clip uses only the visible band's calibration. */
export function influenceSpinSource(
  cx: number,
  cy: number,
  radius: number,
  share: InfluenceWeights,
  palette: FieldPalette,
  hole = 0,
): SpinSource | null {
  const model = fieldModelFrom(
    [1, 1, 1, 1].map((t) => ({ distance: 1, t })),
    cx,
    cy,
    radius,
    palette,
  );
  if (!model) return null;
  const left = Math.floor(cx - radius);
  const top = Math.floor(cy - radius);
  const right = Math.ceil(cx + radius);
  const bottom = Math.ceil(cy + radius);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const samples = collectSamples(cx, cy, radius, hole, left, top, width, height, 1);
  const fitted = scalesFor(samples, share, `spin|${radius.toFixed(3)}|${hole.toFixed(4)}|${left}|${top}`);
  const active = activeKeys(share);
  const image = new ImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const worldX = left + x + 0.5;
      const worldY = top + y + 0.5;
      const source = sentimentSources((worldX - cx) / radius, (worldY - cy) / radius);
      const color = mixColor(model, source, fitted.scale, active, "color", worldX, worldY);
      const index = (y * width + x) * 4;
      image.data[index] = color.r;
      image.data[index + 1] = color.g;
      image.data[index + 2] = color.b;
      image.data[index + 3] = 255;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.putImageData(image, 0, 0);
  return {
    canvas,
    left,
    top,
    cx,
    cy,
    vertices: [0, 1, 2, 3].map((index) => radarPoint(cx, cy, radius, index, 4, 1)),
  };
}

type RasterSample = { index: number; x: number; y: number; source: SourceEnergy };

function collectSamples(
  cx: number,
  cy: number,
  radius: number,
  hole: number,
  left: number,
  top: number,
  width: number,
  height: number,
  raster: number,
): RasterSample[] {
  const samples: RasterSample[] = [];
  const span = width * raster;
  for (let y = 0; y < height * raster; y += 1) {
    for (let x = 0; x < width * raster; x += 1) {
      const worldX = left + (x + 0.5) / raster;
      const worldY = top + (y + 0.5) / raster;
      const nx = (worldX - cx) / radius;
      const ny = (worldY - cy) / radius;
      const l1 = Math.abs(nx) + Math.abs(ny);
      if (l1 > 1 || l1 < hole) continue;
      samples.push({ index: y * span + x, x: worldX, y: worldY, source: sentimentSources(nx, ny) });
    }
  }
  return samples;
}

function scalesFor(samples: RasterSample[], share: InfluenceWeights, geometryKey: string) {
  const key = `${geometryKey}|${share.positive}|${share.mixed}|${share.negative}`;
  const cached = scaleCache.get(key);
  if (cached) return cached;
  const fitted = fitInfluenceScales(
    samples.map((sample) => sample.source),
    share,
  );
  if (scaleCache.size > 32) scaleCache.clear();
  scaleCache.set(key, fitted);
  return fitted;
}

function paintSamples(
  ctx: CanvasRenderingContext2D,
  model: NonNullable<ReturnType<typeof fieldModelFrom>>,
  samples: RasterSample[],
  scale: InfluenceWeights,
  share: InfluenceWeights,
  channel: InfluenceChannel,
  left: number,
  top: number,
  width: number,
  height: number,
  raster: number,
) {
  const active = activeKeys(share);
  const image = ctx.createImageData(width * raster, height * raster);
  for (const sample of samples) {
    const color = mixColor(model, sample.source, scale, active, channel, sample.x, sample.y);
    const index = sample.index * 4;
    image.data[index] = color.r;
    image.data[index + 1] = color.g;
    image.data[index + 2] = color.b;
    image.data[index + 3] = 255;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(rasterCanvas(image), left, top, width, height);
}

function mixColor(
  model: NonNullable<ReturnType<typeof fieldModelFrom>>,
  source: SourceEnergy,
  scale: InfluenceWeights,
  active: Key[],
  channel: InfluenceChannel,
  x: number,
  y: number,
): { r: number; g: number; b: number } {
  const weights = influenceAt(source, scale, active);
  if (channel !== "color") {
    const gray = Math.round(clamp(weights[channel], 0, 1) * 255);
    return { r: gray, g: gray, b: gray };
  }
  return shadeField(model, mixLab(weights, model), x, y);
}

/** Yellow gold, in OKLab hue. Caution tokens sit browner than this, toward orange. */
const GOLD_HUE = (88 * Math.PI) / 180;

/**
 * The bar's gold is the caution color lightened, which reads yellow.
 * The diamond keeps that hue and raises chroma, the way its red already
 * stays on the bar's red instead of drifting brown.
 */
function goldMixed(lab: Lab): Lab {
  const chroma = Math.hypot(lab[1], lab[2]);
  if (chroma < 1e-4) return lab;
  const hue = Math.atan2(lab[2], lab[1]);
  let delta = GOLD_HUE - hue;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  const warmed = hue + delta * 0.45;
  const lifted = chroma * 1.18;
  return [lab[0], Math.cos(warmed) * lifted, Math.sin(warmed) * lifted];
}

function mixLab(weights: InfluenceWeights, anchors: { positive: Lab; mixed: Lab; negative: Lab }): Lab {
  const mixed = goldMixed(anchors.mixed);
  return [
    anchors.positive[0] * weights.positive + mixed[0] * weights.mixed + anchors.negative[0] * weights.negative,
    anchors.positive[1] * weights.positive + mixed[1] * weights.mixed + anchors.negative[1] * weights.negative,
    anchors.positive[2] * weights.positive + mixed[2] * weights.mixed + anchors.negative[2] * weights.negative,
  ];
}

function scalesFromLog(log: InfluenceWeights, active: Key[]): InfluenceWeights {
  const scale = emptyWeights();
  for (const key of active) scale[key] = Math.exp(log[key]);
  return scale;
}

function averageInfluence(sources: SourceEnergy[], scale: InfluenceWeights, active: Key[]): InfluenceWeights {
  const observed = emptyWeights();
  for (const source of sources) {
    const weights = influenceAt(source, scale, active);
    for (const key of active) observed[key] += weights[key];
  }
  const count = sources.length;
  for (const key of active) observed[key] /= count;
  return observed;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

function rasterCanvas(image: ImageData): CanvasImageSource {
  if (typeof OffscreenCanvas === "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d")?.putImageData(image, 0, 0);
    return canvas;
  }
  const canvas = new OffscreenCanvas(image.width, image.height);
  canvas.getContext("2d")?.putImageData(image, 0, 0);
  return canvas;
}
