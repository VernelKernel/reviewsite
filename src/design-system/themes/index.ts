import { cinematicArchiveTheme } from "./cinematic-archive";
import { coreTheme } from "./core";
import { editorialObservatoryTheme } from "./editorial-observatory";
import { gameNativeTheme } from "./game-native";
import { modernCulturalIndexTheme } from "./modern-cultural-index";
import { isColorMode, isThemeId, type ColorMode, type Theme, type ThemeId } from "../theme-types";

export const themes: Record<ThemeId, Theme> = {
  core: coreTheme,
  "editorial-observatory": editorialObservatoryTheme,
  "cinematic-archive": cinematicArchiveTheme,
  "modern-cultural-index": modernCulturalIndexTheme,
  "game-native": gameNativeTheme,
};

export const themeList: Theme[] = Object.values(themes);

export function defaultMood(): ThemeId {
  const configured = process.env.NEXT_PUBLIC_DEFAULT_MOOD;
  return isThemeId(configured) ? configured : "core";
}

export function defaultMode(): ColorMode {
  const configured = process.env.NEXT_PUBLIC_DEFAULT_MODE;
  return isColorMode(configured) ? configured : "light";
}
