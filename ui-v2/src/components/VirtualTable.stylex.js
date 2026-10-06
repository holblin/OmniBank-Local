import * as stylex from "@stylexjs/stylex";
import { colorVars, radiusVars } from "@astryxdesign/core/theme/tokens.stylex";

export const styles = stylex.create({
  viewport: {
    maxHeight: { default: "min(65vh, 560px)", "@media print": "none" },
    overflow: { default: "auto", "@media print": "visible" },
    position: "relative",
    borderRadius: radiusVars["--radius-element"],
    scrollbarGutter: "stable",
    overscrollBehavior: "contain",
  },
  table: { width: "100%", borderCollapse: "separate", borderSpacing: 0 },
  column: (width) => ({ width }),
  wide: (count) => ({ minWidth: `${count * 96 + 120}px` }),
  header: {
    position: { default: "sticky", "@media print": "static" },
    top: 0,
    zIndex: 2,
    backgroundColor: colorVars["--color-background-card"],
  },
  spacer: (height) => ({
    height: `${height}px`,
    padding: 0,
    borderWidth: 0,
    lineHeight: 0,
  }),
});
