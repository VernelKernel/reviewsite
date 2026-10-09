import { STANCE_RADIUS } from "@/lib/intake/judgments";

export type PersonalAxis = {
  name: string;
  stance: "POSITIVE" | "MIXED" | "NEGATIVE";
};

const RINGS = [
  { radius: STANCE_RADIUS.NEGATIVE, label: "Negative" },
  { radius: STANCE_RADIUS.MIXED, label: "Mixed" },
  { radius: STANCE_RADIUS.POSITIVE, label: "Positive" },
] as const;

export function PersonalShape({ axes, labelledBy }: { axes: PersonalAxis[]; labelledBy: string }) {
  if (axes.length < 3) {
    return <p className="meta">The radar is drawn when at least three dimensions are judged. Enjoyment and execution are shown beside it.</p>;
  }

  const width = 720;
  const height = 640;
  const cx = 360;
  const cy = 312;
  const radius = 176;
  const points = axes.map((axis, index) => polar(cx, cy, radius, index, axes.length, STANCE_RADIUS[axis.stance]));

  return (
    <svg className="radar-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={labelledBy}>
      {RINGS.map((ring) => (
        <circle key={ring.label} className="radar-ring" cx={cx} cy={cy} r={radius * ring.radius} />
      ))}
      {axes.map((axis, index) => {
        const end = polar(cx, cy, radius, index, axes.length, 1);
        return <line key={axis.name} className="radar-spoke" x1={cx} y1={cy} x2={end.x} y2={end.y} />;
      })}
      <polygon className="radar-audience" points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
      {axes.map((axis, index) => {
        const point = points[index];
        return <circle key={`${axis.name}-dot`} className={`radar-dot radar-dot-${axis.stance.toLowerCase()}`} cx={point.x} cy={point.y} r={5} />;
      })}
      {axes.map((axis, index) => {
        const point = polar(cx, cy, radius + 56, index, axes.length, 1);
        const cos = Math.cos(point.angle);
        const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
        return (
          <text key={`${axis.name}-label`} className="radar-label" x={point.x} y={point.y} textAnchor={anchor} dominantBaseline="middle">
            {axis.name}
          </text>
        );
      })}
    </svg>
  );
}

function polar(cx: number, cy: number, radius: number, index: number, total: number, distance: number) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return { x: cx + Math.cos(angle) * radius * distance, y: cy + Math.sin(angle) * radius * distance, angle };
}
