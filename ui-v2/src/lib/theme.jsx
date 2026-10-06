import React, { createContext, useContext, useState } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { matchaTheme } from '@astryxdesign/theme-matcha/built';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/theme-matcha/theme.css';
import '@astryxdesign/theme-neutral/theme.css';

const themes = { matcha: matchaTheme, neutral: neutralTheme };
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [name, setName] = useState(() => {
    const saved = localStorage.getItem('omni_v2_theme');
    return Object.hasOwn(themes, saved) ? saved : 'matcha';
  });
  function setTheme(value) {
    if (!Object.hasOwn(themes, value)) return;
    localStorage.setItem('omni_v2_theme', value);
    setName(value);
  }
  const theme = themes[name];
  // Charts receive resolved light palette values; Astryx consumes its own tokens.
  const accent = theme.tokens['--color-accent'].match(/#[0-9a-f]{6}/i)[0];
  const border = theme.tokens['--color-border'].match(/#[0-9a-f]{6}/i)[0];
  return <Theme theme={theme} mode="light"><ThemeContext.Provider value={{ name, setTheme, accent, border }}>{children}</ThemeContext.Provider></Theme>;
}
export function useAppTheme() { return useContext(ThemeContext); }
