/** Inhale length. The exhale is 50% faster, so it lasts two thirds as long. */
export const BREATH_INHALE_SECONDS = 3;
export const BREATH_EXHALE_SECONDS = BREATH_INHALE_SECONDS / 1.5;

/** How far the color field zooms in from the still emblem. */
const DEPTH = 0.14;

const CYCLE = BREATH_INHALE_SECONDS + BREATH_EXHALE_SECONDS;

function easeInOut(amount: number) {
  const t = Math.min(1, Math.max(0, amount));
  return 0.5 - Math.cos(Math.PI * t) / 2;
}

/**
 * Zoom of the rotating color field.
 * 1 matches the still emblem. Inhale eases up from there; exhale eases back to it.
 */
export function breathScale(elapsedSeconds: number): number {
  const time = ((elapsedSeconds % CYCLE) + CYCLE) % CYCLE;
  if (time <= BREATH_INHALE_SECONDS) return 1 + DEPTH * easeInOut(time / BREATH_INHALE_SECONDS);
  const exhale = (time - BREATH_INHALE_SECONDS) / BREATH_EXHALE_SECONDS;
  return 1 + DEPTH * (1 - easeInOut(exhale));
}
