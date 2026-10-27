"use client";
import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string, serverFallback = true) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

/** md breakpoint – tablet & desktop */
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
