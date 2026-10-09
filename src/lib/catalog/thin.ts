/** Fewer than this many published critic readings is a thin sample. */
export const THIN_CRITIC_EVALUATIONS = 4;

export function isThin(criticCount: number): boolean {
  return criticCount < THIN_CRITIC_EVALUATIONS;
}
