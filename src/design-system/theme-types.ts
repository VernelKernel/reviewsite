export const THEME_IDS = [
  "core",
  "editorial-observatory",
  "cinematic-archive",
  "modern-cultural-index",
  "game-native",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export type ColorMode = "light" | "dark";

export type ColorTokens = {
  canvas: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  accentContrast: string;
  focusRing: string;
  positive: string;
  caution: string;
  negative: string;
  positiveSoft: string;
  cautionSoft: string;
  negativeSoft: string;
};

export type Theme = {
  id: ThemeId;
  label: string;
  description: string;
  colors: Record<ColorMode, ColorTokens>;
  typography: {
    fontBody: string;
    fontDisplay: string;
    headingScale: Record<"display" | "h1" | "h2" | "h3", string>;
    bodySize: string;
    metadataSize: string;
    microSize: string;
    bodyLineHeight: string;
  };
  shape: {
    radiusSm: string;
    radiusMd: string;
    radiusLg: string;
    borderWidth: string;
  };
  elevation: Record<ColorMode, { card: string; floating: string; modal: string }>;
  spacing: {
    s1: string;
    s2: string;
    s3: string;
    s4: string;
    s5: string;
    s6: string;
    s7: string;
    s8: string;
    page: string;
    contentMax: string;
    measure: string;
  };
  motion: {
    fast: string;
    normal: string;
    slow: string;
    hoverLift: string;
    imageScale: string;
  };
  media: {
    heroTreatment: string;
    cardTreatment: string;
    overlayStrength: string;
    heroBleed: string;
    heroRatio: string;
    heroColumns: string;
  };
};

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function isColorMode(value: string | null | undefined): value is ColorMode {
  return value === "light" || value === "dark";
}
