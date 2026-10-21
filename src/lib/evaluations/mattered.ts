export const MATTERED_VALUES = ["A_LITTLE", "QUITE_A_BIT", "MATTERS_A_LOT"] as const;

export type MatteredName = (typeof MATTERED_VALUES)[number];

export const MATTERED_LABEL: Record<MatteredName, string> = {
  A_LITTLE: "A little bit",
  QUITE_A_BIT: "Quite a bit",
  MATTERS_A_LOT: "Matters a lot",
};

/** Share of the chart radius. These sit on the three guide rings: inner, middle, outer. */
export const MATTERED_RADIUS: Record<MatteredName, number> = {
  A_LITTLE: 1 / 3,
  QUITE_A_BIT: 2 / 3,
  MATTERS_A_LOT: 1,
};

export function isMattered(value: string): value is MatteredName {
  return (MATTERED_VALUES as readonly string[]).includes(value);
}

export function usesMattered(axes: { mattered?: MatteredName | null }[]): boolean {
  return axes.length > 0 && axes.every((axis) => Boolean(axis.mattered));
}
