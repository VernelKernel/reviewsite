import { semantic } from "./semantic";

/** Component-level aliases. Buttons use accent for action, never evaluation color. */
export const componentTokens = {
  buttonPrimary: {
    background: semantic.accent,
    backgroundHover: semantic.accentHover,
    backgroundActive: semantic.accentActive,
    text: semantic.accentContrast,
  },
  buttonSecondary: {
    background: semantic.surface,
    text: semantic.textPrimary,
    border: semantic.borderStrong,
  },
  card: {
    background: semantic.surface,
    border: semantic.border,
    radius: semantic.radiusMd,
  },
  evaluation: {
    positive: semantic.positive,
    caution: semantic.caution,
    negative: semantic.negative,
  },
} as const;
