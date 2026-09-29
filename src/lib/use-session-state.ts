"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "is-session-state";

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode, sandboxed frame)
  }
}

/**
 * A string kept in sessionStorage, so a reload keeps it. Server render and the
 * first client render both see `null`, so there's no hydration mismatch.
 */
export function useSessionState(key: string): [string | null, (v: string | null) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);
  const set = useCallback((v: string | null) => {
    try {
      if (v === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, v);
    } catch { /* ignore */ }
    window.dispatchEvent(new Event(EVENT));
  }, [key]);
  return [value, set];
}
