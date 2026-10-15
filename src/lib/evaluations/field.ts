import { radarPoint, stanceDistance, type StanceName } from "./radar";

export const STANCE_T: Record<StanceName, number> = {
  NEGATIVE: 0,
  MIXED: 0.5,
  POSITIVE: 1,
};

export type RGB = { r: number; g: number; b: number };

export type FieldPalette = {
  positive: string;
  mixed: string;
  negative: string;
};

type Lab = [number, number, number];

type Vertex = { x: number; y: number; t: number };

export type FieldModel = {
  cx: number;
  cy: number;
  radius: number;
  centerT: number;
  vertices: Vertex[];
  negative: Lab;
  mixed: Lab;
  positive: Lab;
};

const GUIDE_RINGS = [1 / 3, 2 / 3, 1];

export function guideRings(): readonly number[] {
  return GUIDE_RINGS;
}

export function canCloseField(count: number): boolean {
  return count >= 3;
}

export function centerStance(stances: StanceName[]): number {
  if (stances.length === 0) return 0.5;
  let sum = 0;
  for (const stance of stances) sum += STANCE_T[stance];
  return sum / stances.length;
}

export function parseColor(input: string): RGB {
  const value = input.trim();
  const hex = value.match(/^#([0-9a-fA-F]{6})$/);
  if (hex) {
    const digits = hex[1];
    return {
      r: Number.parseInt(digits.slice(0, 2), 16),
      g: Number.parseInt(digits.slice(2, 4), 16),
      b: Number.parseInt(digits.slice(4, 6), 16),
    };
  }
  const channels = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (channels) return { r: Number(channels[1]), g: Number(channels[2]), b: Number(channels[3]) };
  return { r: 128, g: 128, b: 128 };
}

export function fieldModel(
  axes: { stance: StanceName }[],
  cx: number,
  cy: number,
  radius: number,
  palette: FieldPalette,
): FieldModel | null {
  return fieldModelFrom(
    axes.map((axis) => ({ distance: stanceDistance(axis.stance), t: STANCE_T[axis.stance] })),
    cx,
    cy,
    radius,
    palette,
  );
}

/** Field from explicit points: distance from center (0 to 1) and stance position t (0 negative, 1 positive). */
export function fieldModelFrom(
  points: { distance: number; t: number }[],
  cx: number,
  cy: number,
  radius: number,
  palette: FieldPalette,
): FieldModel | null {
  if (!canCloseField(points.length)) return null;
  const vertices = points.map((item, index) => {
    const point = radarPoint(cx, cy, radius, index, points.length, item.distance);
    return { x: point.x, y: point.y, t: item.t };
  });
  return {
    cx,
    cy,
    radius,
    centerT: points.reduce((sum, item) => sum + item.t, 0) / points.length,
    vertices,
    negative: anchor(parseColor(palette.negative)),
    mixed: anchor(parseColor(palette.mixed)),
    positive: anchor(parseColor(palette.positive)),
  };
}

export function sampleFieldColor(model: FieldModel, x: number, y: number): RGB | null {
  const lab = sampleFieldLab(model, x, y);
  return lab ? labToRgb(lab) : null;
}

export function illuminatedFieldColor(model: FieldModel, x: number, y: number): RGB | null {
  const lab = sampleFieldLab(model, x, y);
  return lab ? labToRgb(vary(lab, x, y, model)) : null;
}

export function paintField(ctx: CanvasRenderingContext2D, model: FieldModel) {
  const { vertices } = model;
  let minX = model.cx;
  let maxX = model.cx;
  let minY = model.cy;
  let maxY = model.cy;
  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  }
  const pad = 2;
  const left = Math.max(0, Math.floor(minX - pad));
  const top = Math.max(0, Math.floor(minY - pad));
  const right = Math.ceil(maxX + pad);
  const bottom = Math.ceil(maxY + pad);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  const scale = 2;
  const image = ctx.createImageData(width * scale, height * scale);
  for (let y = 0; y < height * scale; y += 1) {
    for (let x = 0; x < width * scale; x += 1) {
      const worldX = left + (x + 0.5) / scale;
      const worldY = top + (y + 0.5) / scale;
      const lab = sampleFieldLab(model, worldX, worldY);
      if (!lab) continue;
      const color = labToRgb(vary(lab, worldX, worldY, model));
      const i = (y * width * scale + x) * 4;
      image.data[i] = color.r;
      image.data[i + 1] = color.g;
      image.data[i + 2] = color.b;
      image.data[i + 3] = 255;
    }
  }
  ctx.drawImage(rasterCanvas(image), left, top, width, height);
  paintEdgeEnergy(ctx, model);
}

function anchor(rgb: RGB): Lab {
  const lab = rgbToOklab(rgb);
  const lightness = Math.min(0.84, lab[0] * 0.32 + 0.58);
  const chroma = lab[0] < 0.2 ? 1.2 : Math.min(1.3, 0.62 / Math.max(lab[0], 0.28));
  return [lightness, lab[1] * chroma, lab[2] * chroma];
}

function labAt(t: number, model: Pick<FieldModel, "negative" | "mixed" | "positive">): Lab {
  const clamped = Math.min(1, Math.max(0, t));
  if (clamped <= 0.5) return lerp(model.negative, model.mixed, clamped / 0.5);
  return lerp(model.mixed, model.positive, (clamped - 0.5) / 0.5);
}

function sampleFieldLab(model: FieldModel, x: number, y: number): Lab | null {
  const { vertices, centerT, cx, cy } = model;
  for (let index = 0; index < vertices.length; index += 1) {
    const next = vertices[(index + 1) % vertices.length];
    const weights = barycentric({ x, y }, { x: cx, y: cy }, vertices[index], next);
    if (!weights) continue;
    const v = spreadMixed(weights.v, vertices[index].t);
    const w = spreadMixed(weights.w, next.t);
    const sum = weights.u + v + w;
    const t = lingerMixed((weights.u * centerT + v * vertices[index].t + w * next.t) / sum);
    const distance = Math.hypot(x - cx, y - cy);
    return glow(labAt(t, model), distance, model.radius);
  }
  return null;
}

function glow(lab: Lab, distance: number, radius: number): Lab {
  const falloff = 1 - Math.min(1, distance / Math.max(radius, 1));
  return [Math.min(0.9, lab[0] + 0.07 * falloff), lab[1], lab[2]];
}

function spreadMixed(weight: number, t: number): number {
  if (weight <= 0 || Math.abs(t - 0.5) > 0.06) return weight;
  return weight ** 0.76;
}

function lingerMixed(t: number): number {
  const delta = t - 0.5;
  if (Math.abs(delta) > 0.24) return t;
  const pull = 1 - Math.abs(delta) / 0.24;
  return t - delta * pull * 0.34;
}

function vary(lab: Lab, x: number, y: number, model: FieldModel): Lab {
  const scale = Math.max(model.radius, 1);
  const nx = (x - model.cx) / scale;
  const ny = (y - model.cy) / scale;
  const broad = fbm(nx * 0.85 + 2.4, ny * 0.85 + 0.6);
  const detail = fbm(nx * 1.9 + 8.1, ny * 1.9 + 3.7);
  const n = broad * 0.84 + detail * 0.16;
  const body = interiorLight(model, x, y);
  const lightness = Math.min(0.9, Math.max(0.16, lab[0] + n * 0.145 + body * 0.08));
  const chroma = 1 + broad * 0.12;
  return [lightness, lab[1] * chroma, lab[2] * chroma];
}

function interiorLight(model: FieldModel, x: number, y: number): number {
  const { vertices } = model;
  let nearest = Number.POSITIVE_INFINITY;
  for (let index = 0; index < vertices.length; index += 1) {
    nearest = Math.min(nearest, distanceToEdge(x, y, vertices[index], vertices[(index + 1) % vertices.length]));
  }
  const depth = Math.min(1, nearest / Math.max(model.radius * 0.36, 1));
  return depth * depth * (3 - 2 * depth);
}

function distanceToEdge(x: number, y: number, a: Vertex, b: Vertex): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  if (length < 1e-6) return Math.hypot(x - a.x, y - a.y);
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length));
  return Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy));
}

function fbm(x: number, y: number): number {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;
  let weight = 0;
  for (let octave = 0; octave < 3; octave += 1) {
    value += amplitude * valueNoise(x * frequency, y * frequency);
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / weight;
}

function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const a = lattice(x0, y0);
  const b = lattice(x0 + 1, y0);
  const c = lattice(x0, y0 + 1);
  const d = lattice(x0 + 1, y0 + 1);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

function lattice(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return ((n & 65535) / 65535) * 2 - 1;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function paintEdgeEnergy(ctx: CanvasRenderingContext2D, model: FieldModel) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const { vertices } = model;
  for (let index = 0; index < vertices.length; index += 1) {
    const start = vertices[index];
    const end = vertices[(index + 1) % vertices.length];
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, rgbCss(labToRgb(labAt(start.t, model))));
    gradient.addColorStop(1, rgbCss(labToRgb(labAt(end.t, model))));
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 10;
    ctx.shadowColor = rgbCss(labToRgb(labAt(start.t, model)));
    ctx.shadowBlur = 12;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  for (const vertex of vertices) {
    const color = labToRgb(labAt(vertex.t, model));
    const halo = ctx.createRadialGradient(vertex.x, vertex.y, 1, vertex.x, vertex.y, 16);
    halo.addColorStop(0, rgba(color, 0.36));
    halo.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function lerp(a: Lab, b: Lab, t: number): Lab {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function barycentric(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  const v0x = b.x - a.x;
  const v0y = b.y - a.y;
  const v1x = c.x - a.x;
  const v1y = c.y - a.y;
  const v2x = p.x - a.x;
  const v2y = p.y - a.y;
  const den = v0x * v1y - v1x * v0y;
  if (Math.abs(den) < 1e-6) return null;
  const v = (v2x * v1y - v1x * v2y) / den;
  const w = (v0x * v2y - v2x * v0y) / den;
  const u = 1 - v - w;
  if (u < -0.001 || v < -0.001 || w < -0.001) return null;
  return { u, v, w };
}

function rgbToOklab(rgb: RGB): Lab {
  const r = linearize(rgb.r / 255);
  const g = linearize(rgb.g / 255);
  const b = linearize(rgb.b / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function labToRgb(lab: Lab): RGB {
  const l = lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2];
  const m = lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2];
  const s = lab[0] - 0.0894841775 * lab[1] - 1.291485548 * lab[2];
  const l3 = l * l * l;
  const m3 = m * m * m;
  const s3 = s * s * s;
  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const b = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
  return { r: encode(r), g: encode(g), b: encode(b) };
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function encode(channel: number): number {
  const clamped = Math.min(1, Math.max(0, channel));
  const encoded = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, encoded)) * 255);
}

function rgbCss(rgb: RGB): string {
  return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
}

function rgba(rgb: RGB, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
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

function trace(ctx: CanvasRenderingContext2D, vertices: Vertex[]) {
  ctx.beginPath();
  vertices.forEach((vertex, index) => {
    if (index === 0) ctx.moveTo(vertex.x, vertex.y);
    else ctx.lineTo(vertex.x, vertex.y);
  });
  ctx.closePath();
}
