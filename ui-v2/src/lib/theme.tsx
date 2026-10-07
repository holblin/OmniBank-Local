import React, { createContext, useContext, useState } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { matchaTheme } from "@astryxdesign/theme-matcha/built";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import "@astryxdesign/theme-matcha/theme.css";
import "@astryxdesign/theme-neutral/theme.css";

import { stoneTheme } from "@astryxdesign/theme-stone/built";
import "@astryxdesign/theme-stone/theme.css";

import { gothicTheme } from "@astryxdesign/theme-gothic/built";
import "@astryxdesign/theme-gothic/theme.css";

import { y2kTheme } from "@astryxdesign/theme-y2k/built";
import "@astryxdesign/theme-y2k/theme.css";

import { butterTheme } from "@astryxdesign/theme-butter/built";
import "@astryxdesign/theme-butter/theme.css";

const themes = {
  neutral: neutralTheme,
  stone: stoneTheme,
  gothic: gothicTheme,
  matcha: matchaTheme,
  y2k: y2kTheme,
  butter: butterTheme,
};
export const themeNames = Object.keys(themes);
type ThemeName = keyof typeof themes;
interface AppTheme {
  name: ThemeName;
  setTheme: (value: string) => void;
  compact: boolean;
  toggleCompact: () => void;
  accent: string;
  border: string;
  muted: string;
}
const ThemeContext = createContext<AppTheme | null>(null);
export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [name, setName] = useState<ThemeName>(() => {
    const saved = localStorage.getItem("omni_v2_theme");
    return saved && Object.hasOwn(themes, saved)
      ? (saved as ThemeName)
      : "matcha";
  });
  const [compactThemes, setCompactThemes] = useState<
    Partial<Record<ThemeName, boolean>>
  >(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("omni_v2_compact_themes") || "{}",
      );
      return Object.fromEntries(
        themeNames.map((key) => [key, saved?.[key] === true]),
      );
    } catch {
      return {};
    }
  });
  const compact = compactThemes[name] === true;
  function toggleCompact() {
    const next = { ...compactThemes, [name]: !compact };
    localStorage.setItem("omni_v2_compact_themes", JSON.stringify(next));
    setCompactThemes(next);
  }
  function setTheme(value: string) {
    if (!Object.hasOwn(themes, value)) return;
    localStorage.setItem("omni_v2_theme", value);
    setName(value as ThemeName);
  }
  const theme = themes[name];
  // Charts receive resolved light palette values; Astryx consumes its own tokens.
  const color = (key: keyof typeof theme.tokens) =>
    theme.tokens[key].match(/#[0-9a-f]{8}|#[0-9a-f]{6}/i)?.[0] ??
    "currentColor";
  const accent = color("--color-accent");
  const border = color("--color-border");
  return (
    <Theme theme={theme} mode={name === "gothic" ? "dark" : "light"}>
      <ThemeContext.Provider
        value={{
          name,
          setTheme,
          compact,
          toggleCompact,
          accent,
          border,
          muted: color("--color-text-secondary"),
        }}
      >
        {children}
      </ThemeContext.Provider>
    </Theme>
  );
}
export function useAppTheme(): AppTheme {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("Contexte de thème indisponible");
  return value;
}
