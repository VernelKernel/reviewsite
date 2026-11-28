/** View box of a glance shape. Vertices are drawn inside this frame. */
export const GLANCE_WIDTH = 480;
export const GLANCE_HEIGHT = 320;
export const GLANCE_CX = GLANCE_WIDTH / 2;
export const GLANCE_CY = GLANCE_HEIGHT / 2;
/** Center-to-vertex radius. A shape at full distance reaches this ring. */
export const GLANCE_RADIUS = 102;

/**
 * Share of the glance frame taken by the bounding square of a shape at full radius.
 * Any glance shape fits inside this square. The click target adds padding outside it.
 */
export function glanceMaxSpan(): { width: number; height: number } {
  const side = GLANCE_RADIUS * 2;
  return { width: side / GLANCE_WIDTH, height: side / GLANCE_HEIGHT };
}
