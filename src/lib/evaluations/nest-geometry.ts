/** Same spacing tokens as `.emblem` on the game list. */
export const EMBLEM_FACET_REM = 15;
export const EMBLEM_GUTTER_REM = 0.45;
export const EMBLEM_DIAMOND = 0.44;

/**
 * Share of the outer radius used by the execution frame.
 * The reference sketch's band, without its widened gap or outline.
 */
export const FRAME_SHARE = 0.25;

export type NestGeometry = {
  outerRadius: number;
  /** Center-to-vertex thickness of the execution frame. */
  frame: number;
  holeRadius: number;
  innerRadius: number;
  /** Gutter token, in the same units as the radii. */
  gutter: number;
};

/** Execution frame around an enjoyment diamond. Radii are center-to-vertex. */
export function nestGeometry(outerRadius: number): NestGeometry {
  const gutter = outerRadius / ((EMBLEM_FACET_REM / EMBLEM_GUTTER_REM) * EMBLEM_DIAMOND * 2 + 1);
  const frame = outerRadius * FRAME_SHARE;
  const holeRadius = outerRadius - frame;
  return {
    outerRadius,
    frame,
    holeRadius,
    innerRadius: holeRadius - 2 * gutter,
    gutter,
  };
}

/** Center-to-vertex radius of the four-diamond emblem, in CSS pixels at 16px root. */
export function clusterOuterRadius(scale: number, rem = 16): number {
  const facet = EMBLEM_FACET_REM * rem * scale;
  const gutter = EMBLEM_GUTTER_REM * rem * scale;
  return facet * EMBLEM_DIAMOND * 2 + gutter;
}

/** Perpendicular gap between neighboring diamonds on the four-diamond emblem. */
export function clusterGap(scale: number, rem = 16): number {
  return EMBLEM_GUTTER_REM * rem * scale * Math.SQRT2;
}
