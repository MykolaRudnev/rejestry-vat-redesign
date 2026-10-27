"use client";
import { useEffect } from "react";
import { useTheme } from "next-themes";

/** `?theme=dark|light` forces a theme — used for review screenshots and demo links. */
export function ThemeFromQuery() {
  const { setTheme } = useTheme();
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("theme");
    if (t === "dark" || t === "light") setTheme(t);
  }, [setTheme]);
  return null;
}
