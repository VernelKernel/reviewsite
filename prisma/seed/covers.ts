export type CoverMotif = "ring" | "horizon" | "bars" | "peak" | "planet" | "field" | "grid" | "steps" | "arch" | "orbit";

export function coverSvg(
  colors: { bg: string; ink: string; accent: string; mute: string },
  motif: CoverMotif,
): string {
  const { bg, ink, accent, mute } = colors;
  const motifMarkup: Record<CoverMotif, string> = {
    ring: `<circle cx="400" cy="520" r="180" fill="none" stroke="${accent}" stroke-width="18"/>
      <circle cx="400" cy="520" r="8" fill="${ink}"/>`,
    horizon: `<rect x="0" y="640" width="800" height="400" fill="${mute}"/>
      <circle cx="560" cy="640" r="46" fill="${accent}"/>
      <rect x="90" y="760" width="220" height="8" fill="${ink}"/>`,
    bars: `<rect x="140" y="420" width="70" height="360" fill="${ink}"/>
      <rect x="250" y="280" width="70" height="500" fill="${accent}"/>
      <rect x="360" y="360" width="70" height="420" fill="${mute}"/>
      <rect x="470" y="180" width="70" height="600" fill="${ink}"/>
      <rect x="580" y="320" width="70" height="460" fill="${accent}"/>`,
    peak: `<polygon points="400,180 620,860 180,860" fill="${ink}"/>
      <polygon points="400,300 540,860 260,860" fill="${accent}"/>`,
    planet: `<circle cx="400" cy="500" r="170" fill="${ink}"/>
      <ellipse cx="400" cy="500" rx="280" ry="48" fill="none" stroke="${accent}" stroke-width="14"/>
      <circle cx="470" cy="450" r="28" fill="${mute}"/>`,
    field: `<rect x="0" y="560" width="800" height="480" fill="${mute}"/>
      <circle cx="220" cy="360" r="70" fill="${accent}"/>
      <rect x="0" y="700" width="800" height="16" fill="${ink}" opacity="0.35"/>
      <rect x="0" y="820" width="800" height="10" fill="${ink}" opacity="0.25"/>`,
    grid: `<g stroke="${mute}" stroke-width="2">
        <path d="M80 200 H720 M80 400 H720 M80 600 H720 M80 800 H720"/>
        <path d="M160 120 V960 M320 120 V960 M480 120 V960 M640 120 V960"/>
      </g>
      <rect x="320" y="400" width="160" height="200" fill="${accent}"/>`,
    steps: `<rect x="120" y="700" width="560" height="36" fill="${ink}"/>
      <rect x="180" y="580" width="440" height="36" fill="${mute}"/>
      <rect x="240" y="460" width="320" height="36" fill="${accent}"/>
      <rect x="300" y="340" width="200" height="36" fill="${ink}"/>`,
    arch: `<path d="M160 860 V460 A240 240 0 0 1 640 460 V860" fill="none" stroke="${ink}" stroke-width="16"/>
      <rect x="360" y="620" width="80" height="240" fill="${accent}"/>`,
    orbit: `<ellipse cx="400" cy="520" rx="250" ry="90" fill="none" stroke="${mute}" stroke-width="8"/>
      <ellipse cx="400" cy="520" rx="150" ry="220" fill="none" stroke="${ink}" stroke-width="8"/>
      <circle cx="620" cy="470" r="16" fill="${accent}"/>
      <circle cx="400" cy="520" r="40" fill="${ink}"/>`,
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1040" role="img">
  <rect width="800" height="1040" fill="${bg}"/>
  ${motifMarkup[motif]}
</svg>`;
}
