"use client";

/**
 * The live demo shows the owner app and the phone in two same-origin iframes.
 * Pages report finished steps to the demo page with postMessage, and the demo
 * page asks them to reload after a fast-forward.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type DemoStep = "create" | "pay" | "remind" | "forward" | "brief" | "keep";

export function demoStep(step: DemoStep) {
  if (typeof window === "undefined") return;
  try {
    if (window.parent !== window) window.parent.postMessage({ type: "is-demo-step", step }, window.location.origin);
  } catch { /* not embedded */ }
}

/** Mounted in the app layout for demo accounts: reloads server data when the demo page asks. */
export function DemoReporter() {
  const router = useRouter();
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "is-demo-refresh") router.refresh();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);
  return null;
}
