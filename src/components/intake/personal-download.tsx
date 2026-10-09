"use client";

import { useState } from "react";
import { STANCE_RADIUS, personalHeadline } from "@/lib/intake/judgments";
import type { PersonalAxis } from "./personal-shape";

const STANCE_LABEL = { POSITIVE: "Positive", MIXED: "Mixed", NEGATIVE: "Negative" };

export function PersonalDownload({
  title,
  headline,
  enjoyment,
  execution,
  axes,
  enabled,
}: {
  title: string;
  headline: string;
  enjoyment: "POSITIVE" | "MIXED" | "NEGATIVE";
  execution: "POSITIVE" | "MIXED" | "NEGATIVE";
  axes: PersonalAxis[];
  enabled: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");

  async function download() {
    setPending(true);
    setStatus("");
    try {
      const file = await renderPersonalCard({ title, headline, enjoyment, execution, axes });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Image downloaded");
    } catch {
      setStatus("Could not prepare the image.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="personal-download">
      <button className="btn btn-primary" type="button" disabled={!enabled || pending} aria-busy={pending} onClick={download}>
        {pending ? "Preparing image…" : "Download image"}
      </button>
      {enabled ? null : <p className="meta">Verify your email to download this chart.</p>}
      {status ? <p className="meta">{status}</p> : null}
    </div>
  );
}

async function renderPersonalCard(input: {
  title: string;
  headline: string;
  enjoyment: "POSITIVE" | "MIXED" | "NEGATIVE";
  execution: "POSITIVE" | "MIXED" | "NEGATIVE";
  axes: PersonalAxis[];
}): Promise<File> {
  await document.fonts.ready;
  const width = 1280;
  const height = 900;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.scale(dpr, dpr);
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const palette = {
    canvas: read("--color-canvas", "#f6f4ef"),
    text: read("--color-text-primary", "#17191c"),
    muted: read("--color-text-muted", "#667085"),
    border: read("--color-border", "#d8d5ce"),
    accent: read("--color-accent", "#3157D5"),
    positive: read("--color-positive", "#1F7A4D"),
    caution: read("--color-caution", "#9A6700"),
    negative: read("--color-negative", "#B42318"),
    body: getComputedStyle(document.body).fontFamily,
  };
  ctx.fillStyle = palette.canvas;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = palette.text;
  ctx.font = `700 42px ${palette.body}`;
  ctx.fillText(input.title.slice(0, 48), 64, 88);
  ctx.font = `400 22px ${palette.body}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(input.headline || personalHeadline(input.enjoyment, input.execution), 64, 128);

  if (input.axes.length >= 3) drawRadar(ctx, palette, input.axes, 80, 180, 680, 520);
  drawStance(ctx, palette, "Enjoyment", input.enjoyment, 820, 240);
  drawStance(ctx, palette, "Execution", input.execution, 820, 360);
  ctx.fillStyle = palette.text;
  ctx.fillRect(0, height - 72, width, 72);
  ctx.fillStyle = palette.canvas;
  ctx.font = `700 16px ${palette.body}`;
  ctx.fillText("FRAME", 64, height - 32);
  ctx.font = `400 16px ${palette.body}`;
  ctx.fillText("Your evaluation", 150, height - 32);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not encode the image.");
  const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "review";
  return new File([blob], `${slug}-frame.png`, { type: "image/png" });
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  palette: { border: string; text: string; accent: string; positive: string; caution: string; negative: string; body: string },
  axes: PersonalAxis[],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = 180;
  ctx.save();
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.font = `12px ${palette.body}`;
  ctx.fillStyle = palette.text;
  for (const ring of [STANCE_RADIUS.NEGATIVE, STANCE_RADIUS.MIXED, STANCE_RADIUS.POSITIVE]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * ring, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let index = 0; index < axes.length; index += 1) {
    const end = point(cx, cy, radius, index, axes.length, 1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.beginPath();
  axes.forEach((axis, index) => {
    const next = point(cx, cy, radius, index, axes.length, STANCE_RADIUS[axis.stance]);
    if (index === 0) ctx.moveTo(next.x, next.y);
    else ctx.lineTo(next.x, next.y);
  });
  ctx.closePath();
  ctx.fillStyle = hexAlpha(palette.accent, 0.22);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  axes.forEach((axis, index) => {
    const dot = point(cx, cy, radius, index, axes.length, STANCE_RADIUS[axis.stance]);
    ctx.beginPath();
    ctx.fillStyle = axis.stance === "POSITIVE" ? palette.positive : axis.stance === "NEGATIVE" ? palette.negative : palette.caution;
    ctx.arc(dot.x, dot.y, 5, 0, Math.PI * 2);
    ctx.fill();
    const label = point(cx, cy, radius + 36, index, axes.length, 1);
    ctx.fillStyle = palette.text;
    ctx.font = `600 14px ${palette.body}`;
    ctx.textAlign = Math.cos(label.angle) > 0.35 ? "left" : Math.cos(label.angle) < -0.35 ? "right" : "center";
    ctx.textBaseline = "middle";
    ctx.fillText(axis.name, label.x, label.y);
  });
  ctx.restore();
}

function drawStance(
  ctx: CanvasRenderingContext2D,
  palette: { text: string; border: string; positive: string; caution: string; negative: string; body: string },
  label: string,
  stance: "POSITIVE" | "MIXED" | "NEGATIVE",
  x: number,
  y: number,
) {
  ctx.fillStyle = palette.text;
  ctx.font = `700 22px ${palette.body}`;
  ctx.textAlign = "left";
  ctx.fillText(label, x, y);
  ctx.font = `400 16px ${palette.body}`;
  ctx.fillText(STANCE_LABEL[stance], x, y + 28);
  ctx.fillStyle = palette.border;
  ctx.fillRect(x, y + 48, 320, 12);
  ctx.fillStyle = stance === "POSITIVE" ? palette.positive : stance === "NEGATIVE" ? palette.negative : palette.caution;
  ctx.fillRect(x, y + 48, 320 * STANCE_RADIUS[stance], 12);
}

function point(cx: number, cy: number, radius: number, index: number, total: number, distance: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: cx + Math.cos(angle) * radius * distance, y: cy + Math.sin(angle) * radius * distance, angle };
}

function hexAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return color;
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
