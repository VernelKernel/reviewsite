"use client";

import { nestExportLayout, paintNest, readNestPalette } from "@/components/evaluations/nest-paint";
import { diamondGeometry } from "@/components/evaluations/shape-mark";
import type { Distribution } from "@/lib/aggregation/landscape";
import { fieldModelFrom, paintField, type FieldPalette } from "@/lib/evaluations/field";
import { radarPoint } from "@/lib/evaluations/radar";
import { saveFile } from "@/components/share/share-assets";

type IconName = "glasses" | "heart" | "audience" | "gear";

export type EmblemMark = "cluster" | "nest";

export type EmblemReading = {
  critics: { enjoyment: Distribution; execution: Distribution };
  audience: { enjoyment: Distribution; execution: Distribution };
};

/** Four times the on-page emblem, whose facets are 15rem. */
const HI_RES_SCALE = 4;
const REM = 16;

const ICON_SRC: Record<IconName, string> = {
  heart: "/media/emblem/heart.png?v=2",
  gear: "/media/emblem/gear.png?v=2",
  glasses: "/media/emblem/glasses.png?v=2",
  audience: "/media/emblem/audience.png?v=2",
};

/** rem width and height, matching `.emblem-icon-*`. */
const ICON_REM: Record<IconName, [number, number]> = {
  heart: [2.05 * 1.5, 1.95 * 1.5],
  gear: [2.05 * 1.5, 2.15 * 1.5],
  glasses: [2.7 * 1.5, 1.4 * 1.5],
  audience: [2.85 * 1.5, 1.55 * 1.5],
};

const FACETS: { place: "north" | "east" | "south" | "west"; who: IconName; what: IconName; reading: (input: EmblemReading) => Distribution }[] = [
  { place: "north", who: "glasses", what: "heart", reading: (input) => input.critics.enjoyment },
  { place: "west", who: "glasses", what: "gear", reading: (input) => input.critics.execution },
  { place: "east", who: "audience", what: "heart", reading: (input) => input.audience.enjoyment },
  { place: "south", who: "audience", what: "gear", reading: (input) => input.audience.execution },
];

const icons = new Map<IconName, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the image."));
    image.src = src;
  });
}

function loadIcon(name: IconName): Promise<HTMLImageElement> {
  const pending = icons.get(name);
  if (pending) return pending;
  const next = loadImage(ICON_SRC[name]).catch((error: unknown) => {
    icons.delete(name);
    throw error;
  });
  icons.set(name, next);
  return next;
}

function readPalette(): { field: FieldPalette; empty: string; ink: string } {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const probe = document.createElement("span");
  probe.className = "emblem-icon emblem-icon-heart";
  document.body.append(probe);
  const ink = getComputedStyle(probe).backgroundColor || "#162a46";
  probe.remove();
  return {
    field: {
      positive: read("--color-positive", "#1F7A4D"),
      mixed: read("--color-caution", "#E7B008"),
      negative: read("--color-negative", "#E15A4A"),
    },
    empty: read("--color-border", "#D5DEE6"),
    ink,
  };
}

function layout(scale: number) {
  const facet = Math.max(1, Math.round(15 * REM * scale));
  const gutter = Math.max(0, Math.round(0.45 * REM * scale));
  const offset = Math.round(facet * 0.44) + gutter;
  const size = offset * 2 + facet;
  const gap = Math.max(0, Math.round(0.65 * REM * scale));
  return { facet, offset, size, gap };
}

/** Scale whose laid-out emblem is the given pixel size, so the cover copy is not resized afterward. */
function scaleForPixels(pixels: number): number {
  return pixels / layout(1).size;
}

function scaleForNestPixels(pixels: number): number {
  return pixels / nestExportLayout(1).size;
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

function paintDiamond(distribution: Distribution, palette: { field: FieldPalette; empty: string }, facet: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = facet;
  canvas.height = facet;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const cx = facet / 2;
  const cy = facet / 2;
  const radius = facet * 0.44;
  if (!distribution.count) {
    traceDiamond(ctx, cx, cy, radius);
    ctx.fillStyle = palette.empty;
    ctx.fill();
    return canvas;
  }
  const model = fieldModelFrom(diamondGeometry(distribution), cx, cy, radius, palette.field);
  if (!model) return canvas;
  const coverSize = facet < 400;
  paintField(ctx, model, { scale: coverSize ? 2 : 1, edge: !coverSize });
  return canvas;
}

function tint(image: HTMLImageElement, width: number, height: number, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

export async function renderEmblem(input: EmblemReading, scale = HI_RES_SCALE): Promise<HTMLCanvasElement> {
  const [heart, gear, glasses, audience] = await Promise.all([
    loadIcon("heart"),
    loadIcon("gear"),
    loadIcon("glasses"),
    loadIcon("audience"),
  ]);
  const loaded: Record<IconName, HTMLImageElement> = { heart, gear, glasses, audience };
  const palette = readPalette();
  const { facet, offset, size, gap } = layout(scale);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");

  const center = size / 2;
  const origin = {
    north: { x: center, y: center - offset },
    south: { x: center, y: center + offset },
    west: { x: center - offset, y: center },
    east: { x: center + offset, y: center },
  };

  for (const facetSpec of FACETS) {
    const diamond = paintDiamond(facetSpec.reading(input), palette, facet);
    const point = origin[facetSpec.place];
    const left = Math.round(point.x - facet / 2);
    const top = Math.round(point.y - facet / 2);
    ctx.drawImage(diamond, left, top);

    const [whoW, whoH] = iconBox(facetSpec.who, scale);
    const [whatW, whatH] = iconBox(facetSpec.what, scale);
    const stack = whoH + gap + whatH;
    let y = top + Math.round((facet - stack) / 2);
    ctx.drawImage(tint(loaded[facetSpec.who], whoW, whoH, palette.ink), left + Math.round((facet - whoW) / 2), y);
    y += whoH + gap;
    ctx.drawImage(tint(loaded[facetSpec.what], whatW, whatH, palette.ink), left + Math.round((facet - whatW) / 2), y);
  }

  return canvas;
}

function iconBox(name: IconName, scale: number): [number, number] {
  const [width, height] = ICON_REM[name];
  return [Math.max(1, Math.round(width * REM * scale)), Math.max(1, Math.round(height * REM * scale))];
}

function artUrl(src: string): string {
  if (src.startsWith("/")) return src;
  return `/game-list/art?src=${encodeURIComponent(src)}`;
}

/** Steam's larger box-art file, when the stored URL is the smaller one. */
function higherResSrc(src: string): string | null {
  const swaps: [RegExp, string][] = [
    [/library_capsule(?!_2x)(\.[a-z]+)/i, "library_capsule_2x$1"],
    [/library_600x900(?!_2x)(\.[a-z]+)/i, "library_600x900_2x$1"],
    [/header(?!_2x)(\.[a-z]+)/i, "header_2x$1"],
  ];
  for (const [pattern, replacement] of swaps) {
    if (pattern.test(src)) return src.replace(pattern, replacement);
  }
  return null;
}

export async function loadCoverArt(src: string): Promise<HTMLImageElement> {
  const higher = higherResSrc(src);
  if (higher) {
    try {
      return await loadImage(artUrl(higher));
    } catch {
      // This game has no larger file. Use the one we stored.
    }
  }
  return loadImage(artUrl(src));
}

async function encode(canvas: HTMLCanvasElement, name: string): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the image.");
  return new File([blob], name, { type: "image/png" });
}

export async function renderNestEmblem(input: EmblemReading, scale = HI_RES_SCALE): Promise<HTMLCanvasElement> {
  const { size, frame } = nestExportLayout(scale);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  paintNest(ctx, frame, input.critics.execution, input.critics.enjoyment, readNestPalette(), scale >= 1);
  return canvas;
}

export async function downloadEmblem(input: EmblemReading, slug: string, mark: EmblemMark = "cluster") {
  const canvas = mark === "nest" ? await renderNestEmblem(input) : await renderEmblem(input);
  saveFile(await encode(canvas, `${slug}-emblem.png`));
}

export async function downloadCover(input: EmblemReading, slug: string, artSrc: string, mark: EmblemMark = "cluster") {
  const image = await loadCoverArt(artSrc);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width < 2 || height < 2) throw new Error("Could not read the cover.");
  const pad = Math.max(8, Math.round(Math.min(width, height) * 0.02));
  const markPx = Math.round(Math.min(width, height) * 0.42 * 0.75 * 0.75);
  const emblem =
    mark === "nest" ? await renderNestEmblem(input, scaleForNestPixels(markPx)) : await renderEmblem(input, scaleForPixels(markPx));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the image.");
  ctx.drawImage(image, 0, 0);
  ctx.drawImage(emblem, width - pad - emblem.width, height - pad - emblem.height);
  saveFile(await encode(canvas, `${slug}-cover.png`));
}
