import type { ColorMode, ColorTokens, Theme } from "./theme-types";
import { themeList } from "./themes";

function colorVars(colors: ColorTokens): string {
  return [
    `--color-canvas: ${colors.canvas}`,
    `--color-surface: ${colors.surface}`,
    `--color-surface-elevated: ${colors.surfaceElevated}`,
    `--color-text-primary: ${colors.textPrimary}`,
    `--color-text-secondary: ${colors.textSecondary}`,
    `--color-text-muted: ${colors.textMuted}`,
    `--color-border: ${colors.border}`,
    `--color-border-strong: ${colors.borderStrong}`,
    `--color-accent: ${colors.accent}`,
    `--color-accent-hover: ${colors.accentHover}`,
    `--color-accent-active: ${colors.accentActive}`,
    `--color-accent-contrast: ${colors.accentContrast}`,
    `--color-focus-ring: ${colors.focusRing}`,
    `--color-positive: ${colors.positive}`,
    `--color-caution: ${colors.caution}`,
    `--color-negative: ${colors.negative}`,
    `--color-positive-soft: ${colors.positiveSoft}`,
    `--color-caution-soft: ${colors.cautionSoft}`,
    `--color-negative-soft: ${colors.negativeSoft}`,
  ].join("; ");
}

function themeBlock(theme: Theme, mode: ColorMode): string {
  const elevation = theme.elevation[mode];
  const declarations = [
    colorVars(theme.colors[mode]),
    `--font-body: ${theme.typography.fontBody}`,
    `--font-display: ${theme.typography.fontDisplay}`,
    `--text-display: ${theme.typography.headingScale.display}`,
    `--text-h1: ${theme.typography.headingScale.h1}`,
    `--text-h2: ${theme.typography.headingScale.h2}`,
    `--text-h3: ${theme.typography.headingScale.h3}`,
    `--text-body: ${theme.typography.bodySize}`,
    `--text-meta: ${theme.typography.metadataSize}`,
    `--text-micro: ${theme.typography.microSize}`,
    `--leading-body: ${theme.typography.bodyLineHeight}`,
    `--radius-sm: ${theme.shape.radiusSm}`,
    `--radius-md: ${theme.shape.radiusMd}`,
    `--radius-lg: ${theme.shape.radiusLg}`,
    `--border-width: ${theme.shape.borderWidth}`,
    `--shadow-card: ${elevation.card}`,
    `--shadow-floating: ${elevation.floating}`,
    `--shadow-modal: ${elevation.modal}`,
    `--space-1: ${theme.spacing.s1}`,
    `--space-2: ${theme.spacing.s2}`,
    `--space-3: ${theme.spacing.s3}`,
    `--space-4: ${theme.spacing.s4}`,
    `--space-5: ${theme.spacing.s5}`,
    `--space-6: ${theme.spacing.s6}`,
    `--space-7: ${theme.spacing.s7}`,
    `--space-8: ${theme.spacing.s8}`,
    `--page-gutter: ${theme.spacing.page}`,
    `--content-max: ${theme.spacing.contentMax}`,
    `--measure: ${theme.spacing.measure}`,
    `--motion-fast: ${theme.motion.fast}`,
    `--motion-normal: ${theme.motion.normal}`,
    `--motion-slow: ${theme.motion.slow}`,
    `--hover-lift: ${theme.motion.hoverLift}`,
    `--image-scale: ${theme.motion.imageScale}`,
    `--hero-treatment: ${theme.media.heroTreatment}`,
    `--card-treatment: ${theme.media.cardTreatment}`,
    `--overlay-strength: ${theme.media.overlayStrength}`,
    `--hero-bleed: ${theme.media.heroBleed}`,
    `--hero-ratio: ${theme.media.heroRatio}`,
    `--hero-columns: ${theme.media.heroColumns}`,
  ].join("; ");

  return `[data-mood="${theme.id}"][data-mode="${mode}"] { ${declarations}; }`;
}

export function themeStylesheet(): string {
  return themeList
    .flatMap((theme) => [themeBlock(theme, "light"), themeBlock(theme, "dark")])
    .join("\n");
}
