"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { PopulationSegment } from "@/components/evaluations/population-segment";
import type { ShapeMode } from "@/lib/aggregation/landscape";

type PopulationModeValue = {
  mode: ShapeMode;
  setMode: (mode: ShapeMode) => void;
};

const PopulationModeContext = createContext<PopulationModeValue | null>(null);

export function PopulationModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ShapeMode>("both");
  return <PopulationModeContext.Provider value={{ mode, setMode }}>{children}</PopulationModeContext.Provider>;
}

export function usePopulationMode(): ShapeMode {
  return useContext(PopulationModeContext)?.mode ?? "both";
}

export function PopulationModeToggle() {
  const value = useContext(PopulationModeContext);
  if (!value) return null;
  return <PopulationSegment mode={value.mode} onMode={value.setMode} />;
}
