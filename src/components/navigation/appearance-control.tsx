"use client";

import { useEffect, useState, useTransition } from "react";
import { themeList } from "@/design-system/themes";
import { saveAppearance } from "@/lib/preferences/actions";

export function AppearanceControl({ mood, mode }: { mood: string; mode: string }) {
  const [currentMood, setCurrentMood] = useState(mood);
  const [currentMode, setCurrentMode] = useState(mode);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setCurrentMood(document.documentElement.dataset.mood ?? mood);
    setCurrentMode(document.documentElement.dataset.mode ?? mode);
  }, [mood, mode]);

  function apply(nextMood: string, nextMode: string) {
    document.documentElement.dataset.mood = nextMood;
    document.documentElement.dataset.mode = nextMode;
    localStorage.setItem("frame-mood", nextMood);
    localStorage.setItem("frame-mode", nextMode);
    setCurrentMood(nextMood);
    setCurrentMode(nextMode);
    startTransition(() => {
      void saveAppearance(nextMood, nextMode);
    });
  }

  return (
    <details className="appearance">
      <summary>Appearance</summary>
      <div className="appearance-panel">
        <label>
          Mood
          <select
            value={currentMood}
            onChange={(event) => apply(event.target.value, currentMode)}
            aria-label="Visual mood"
          >
            {themeList.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Color
          <select
            value={currentMode}
            onChange={(event) => apply(currentMood, event.target.value)}
            aria-label="Color mode"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </div>
    </details>
  );
}
