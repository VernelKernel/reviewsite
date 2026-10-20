"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const SpinEpochContext = createContext(0);
const ResetSpinContext = createContext<() => void>(() => {});

/** Shared rotation clock. Resetting it returns every nested emblem inside to its first frame. */
export function SpinClock({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);
  const reset = useCallback(() => setEpoch((value) => value + 1), []);
  return (
    <SpinEpochContext.Provider value={epoch}>
      <ResetSpinContext.Provider value={reset}>{children}</ResetSpinContext.Provider>
    </SpinEpochContext.Provider>
  );
}

export function useSpinEpoch() {
  return useContext(SpinEpochContext);
}

export function ResetSpinButton() {
  const reset = useContext(ResetSpinContext);
  return (
    <button type="button" className="btn btn-ghost emblem-download" aria-label="Reset rotation" title="Reset rotation" onClick={reset}>
      <ResetIcon />
    </button>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M19.4 8.1A7.2 7.2 0 1 0 18.6 15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path fill="currentColor" d="m16.1 3.4 4.5 4.2-5.4 1.2Z" />
    </svg>
  );
}
