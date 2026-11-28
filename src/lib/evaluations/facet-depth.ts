/**
 * Neutral light on an already painted facet.
 * White and black are illumination, not theme or stance colors.
 * source-atop leaves transparent pixels, including the nest gutter, clear.
 */
export function paintFacetSheen(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  if (width < 2 || height < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const wash = ctx.createLinearGradient(width * 0.12, height * 0.02, width * 0.86, height);
  wash.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  wash.addColorStop(0.42, "rgba(255, 255, 255, 0.05)");
  wash.addColorStop(1, "rgba(0, 0, 0, 0.12)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** A hairline catch-light along a facet edge. The stroke is clipped to painted pixels. */
export function paintFacetRim(ctx: CanvasRenderingContext2D, trace: () => void) {
  if (ctx.canvas.width < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, ctx.canvas.width * 0.012);
  trace();
  ctx.stroke();
  ctx.restore();
}
