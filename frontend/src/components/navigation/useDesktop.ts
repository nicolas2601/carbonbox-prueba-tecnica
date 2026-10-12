"use client";

import { useSyncExternalStore } from "react";
const DESKTOP_QUERY = "(min-width: 1024px)";
function subscribe(update: () => void): () => void {
  const query = window.matchMedia?.(DESKTOP_QUERY);
  query?.addEventListener("change", update);
  return () => query?.removeEventListener("change", update);
}
export function useDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia ? window.matchMedia(DESKTOP_QUERY).matches : true, () => false);
}
