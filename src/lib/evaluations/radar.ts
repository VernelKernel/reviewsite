import { STANCE_RADIUS } from "@/lib/intake/judgments";

export type StanceName = keyof typeof STANCE_RADIUS;

export type RadarAxis = {
  name: string;
  stance: StanceName;
};

export const STANCE_RINGS: { stance: StanceName; label: string }[] = [
  { stance: "NEGATIVE", label: "Negative" },
  { stance: "MIXED", label: "Mixed" },
  { stance: "POSITIVE", label: "Positive" },
];

export function radarPoint(cx: number, cy: number, radius: number, index: number, total: number, distance: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: cx + Math.cos(angle) * radius * distance,
    y: cy + Math.sin(angle) * radius * distance,
    angle,
  };
}

export function stanceDistance(stance: StanceName): number {
  return STANCE_RADIUS[stance];
}
