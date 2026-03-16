// execution/frontend/src/theme.js
// Light / Dark palette + React context

import { createContext, useContext } from "react";

export const light = {
  bg:              "#F2F2F7",
  card:            "#FFFFFF",
  cardShadow:      "0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  text:            "#000000",
  textSec:         "#8E8E93",
  border:          "#E5E5EA",
  inputBg:         "#F2F2F7",
  accent:          "#007AFF",
  segBg:           "rgba(0,0,0,0.05)",
  segActive:       "#FFFFFF",
  segActiveText:   "#000000",
  segText:         "#8E8E93",
  divider:         "rgba(0,0,0,0.06)",
  headerBorder:    "rgba(0,0,0,0.08)",
  btnPrimary:      "#000000",
  btnPrimaryText:  "#FFFFFF",
  chipActive:      "#000000",
  chipActiveText:  "#FFFFFF",
  chipInactive:    "#F2F2F7",
  chipInactiveText:"#8E8E93",
};

export const dark = {
  bg:              "#000000",
  card:            "#1C1C1E",
  cardShadow:      "none",
  text:            "#FFFFFF",
  textSec:         "#8E8E93",
  border:          "#38383A",
  inputBg:         "#2C2C2E",
  accent:          "#0A84FF",
  segBg:           "rgba(255,255,255,0.06)",
  segActive:       "#3A3A3C",
  segActiveText:   "#FFFFFF",
  segText:         "#8E8E93",
  divider:         "rgba(255,255,255,0.07)",
  headerBorder:    "rgba(255,255,255,0.08)",
  btnPrimary:      "#FFFFFF",
  btnPrimaryText:  "#000000",
  chipActive:      "#FFFFFF",
  chipActiveText:  "#000000",
  chipInactive:    "#2C2C2E",
  chipInactiveText:"#8E8E93",
};

export const ThemeContext = createContext({ T: light, isDark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);
