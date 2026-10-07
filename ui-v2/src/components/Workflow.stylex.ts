import * as stylex from "@stylexjs/stylex";
import { colorVars, spacingVars, radiusVars } from "@astryxdesign/core/theme/tokens.stylex";

export const workflow = stylex.create({
  section: { minWidth: 0, width: "100%" },
  flexible: { minWidth: 0, flex: 1 },
  toolbar: { marginBottom: spacingVars["--spacing-4"], minWidth: 0 },
  filters: { paddingBlock: spacingVars["--spacing-3"], minWidth: 0 },
  historyFilters: { marginBottom: 0, padding: spacingVars["--spacing-3"] },
  bottomControls: { display: "flow-root" },
  settings: {
    display: "grid",
    gridTemplateColumns: { default: "220px minmax(0, 1fr)", "@media (max-width: 900px)": "minmax(0, 1fr)" },
    gap: spacingVars["--spacing-6"],
    alignItems: "start",
  },
  settingsNav: {
    width: "100%", minWidth: 0, height: "auto",
    borderRadius: radiusVars["--radius-container"],
    backgroundColor: colorVars["--color-background-card"],
  },
  settingsDesktop: { display: { default: "block", "@media (max-width: 900px)": "none" } },
  settingsMobile: { display: { default: "none", "@media (max-width: 900px)": "block" } },
  sidebarFrame: { padding: spacingVars["--spacing-1"], overflow: "hidden" },
  workspace: { margin: 0, minWidth: 0 },
  mobileTopActions: { width: "auto", flexShrink: 0 },
  mobileBreadcrumb: { minWidth: 0 },
  mobileTitle: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  navigation: { width: "100%", maxWidth: "100%", minWidth: 0, height: "100%", minHeight: 0, backgroundColor: "transparent" },
  navigationFooter: { borderTop: "1px solid var(--color-border)", paddingTop: spacingVars["--spacing-3"] },
  panel: { minWidth: 0, outline: "none" },
  disclosure: { paddingBlock: spacingVars["--spacing-1"], borderBottom: "1px solid var(--color-border)" },
});
