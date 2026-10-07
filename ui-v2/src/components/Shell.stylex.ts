import * as stylex from "@stylexjs/stylex";
import {
  colorVars,
  spacingVars,
  radiusVars,
  textSizeVars,
} from "@astryxdesign/core/theme/tokens.stylex";
export const styles = stylex.create({
  shell: {
    minHeight: "100vh",
    display: "flex",
  },
  sidebar: {
    width: {
      default: "238px",
      "@media (max-width: 1100px)": "210px",
      "@media (max-width: 800px)": "238px",
    },
    flexShrink: "0",
    backgroundColor: colorVars["--color-background-card"],
    borderRight: "1px solid var(--color-border)",
    display: {
      default: "flex",
      "@media print": "none",
    },
    flexDirection: "column",
    padding: "var(--spacing-7) var(--spacing-4) var(--spacing-5)",
    position: "fixed",
    inset: "0 auto 0 0",
    zIndex: "20",
    overflowY: "auto",
    paddingInline: {
      default: null,
      "@media (max-width: 1100px)": spacingVars["--spacing-3"],
    },
    transform: {
      default: null,
      "@media (max-width: 800px)": "translateX(-100%)",
    },
    transition: {
      default: null,
      "@media (max-width: 800px)": "transform .18s ease",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    padding: "0 var(--spacing-3)",
    fontSize: textSizeVars["--font-size-xl"],
    fontWeight: "750",
    letterSpacing: "-.8px",
  },
  brandSmall: {
    display: "block",
    color: colorVars["--color-text-secondary"],
    letterSpacing: "3px",
    fontSize: textSizeVars["--font-size-xs"],
    fontWeight: "600",
    marginTop: spacingVars["--spacing-0-5"],
  },
  mark: {
    color: colorVars["--color-on-accent"],
    backgroundColor: colorVars["--color-accent"],
    display: "grid",
    placeItems: "center",
    width: "39px",
    height: "39px",
    borderRadius: radiusVars["--radius-container"],
  },
  workspace: {
    margin: "var(--spacing-8) 0 var(--spacing-7)",
    display: "flex",
    gap: spacingVars["--spacing-2"],
    alignItems: "center",
    backgroundColor: colorVars["--color-background-body"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-element"],
    padding: "var(--spacing-3) var(--spacing-2)",
    fontSize: textSizeVars["--font-size-base"],
  },
  workspaceDiv: {
    flex: "1",
    minWidth: "0",
  },
  workspaceStrong: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  workspaceSmall: {
    display: "block",
    marginTop: spacingVars["--spacing-1"],
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  avatar: {
    width: "31px",
    height: "31px",
    backgroundColor: colorVars["--color-accent-muted"],
    borderRadius: radiusVars["--radius-element"],
    display: "grid",
    placeItems: "center",
    color: colorVars["--color-accent"],
    fontWeight: "600",
  },
  navLabel: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-xs"],
    textTransform: "uppercase",
    letterSpacing: "1.7px",
    fontWeight: "600",
    margin: "0 var(--spacing-3) var(--spacing-3)",
  },
  nav: {
    display: "grid",
    gap: spacingVars["--spacing-1"],
    marginBottom: spacingVars["--spacing-4"],
  },
  navA: {
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    padding: "var(--spacing-2) var(--spacing-3)",
    borderRadius: radiusVars["--radius-element"],
    color: {
      default: colorVars["--color-text-secondary"],
      ":hover": colorVars["--color-text-primary"],
    },
    fontSize: textSizeVars["--font-size-sm"],
    fontWeight: "500",
    backgroundColor: {
      default: null,
      ":hover": colorVars["--color-background-body"],
    },
  },
  navActive: {
    backgroundColor: colorVars["--color-accent-muted"],
    color: colorVars["--color-accent"],
    fontWeight: "650",
  },
  activeDot: {
    width: "5px",
    height: "5px",
    borderRadius: radiusVars["--radius-full"],
    backgroundColor: colorVars["--color-accent"],
    marginLeft: "auto",
  },
  sidebarBottom: {
    marginTop: "auto",
    paddingTop: spacingVars["--spacing-5"],
  },
  privacy: {
    backgroundColor: colorVars["--color-accent-muted"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-element"],
    padding: "var(--spacing-4) var(--spacing-3)",
    color: colorVars["--color-accent"],
  },
  privacyStrong: {
    display: "block",
    marginTop: spacingVars["--spacing-3"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  privacyP: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
    lineHeight: "1.7",
    margin: "var(--spacing-1-5) 0 var(--spacing-3)",
  },
  privacySpan: {
    fontSize: textSizeVars["--font-size-xs"],
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-1-5"],
  },
  privacyI: {
    width: "5px",
    height: "5px",
    borderRadius: radiusVars["--radius-full"],
    backgroundColor: colorVars["--color-accent"],
    display: "inline-block",
  },
  localI: {
    width: "5px",
    height: "5px",
    borderRadius: radiusVars["--radius-full"],
    backgroundColor: colorVars["--color-accent"],
    display: "inline-block",
  },
  return: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacingVars["--spacing-2"],
    marginTop: spacingVars["--spacing-5"],
    fontSize: textSizeVars["--font-size-sm"],
    color: colorVars["--color-text-secondary"],
  },
  main: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100dvh",
    marginLeft: {
      default: "238px",
      "@media (max-width: 1100px)": "210px",
      "@media (max-width: 800px)": 0,
    },
    width: {
      default: "calc(100% - 238px)",
      "@media (max-width: 1100px)": "calc(100% - 210px)",
      "@media (max-width: 800px)": "100%",
    },
    minWidth: "0",
    margin: null,
  },
  topbar: {
    flexShrink: 0,
    height: {
      default: "73px",
      "@media (max-width: 800px)": "62px",
      "@media (max-width: 600px)": "auto",
    },
    borderBottom: "1px solid var(--color-border)",
    display: {
      default: "flex",
      "@media print": "none",
    },
    justifyContent: "space-between",
    alignItems: "center",
    padding: {
      default: "0 var(--spacing-9)",
      "@media (max-width: 800px)": "0 var(--spacing-4)",
    },
    backgroundColor: colorVars["--color-background-card"],
    gap: {
      default: spacingVars["--spacing-5"],
      "@media (max-width: 800px)": spacingVars["--spacing-2"],
    },
    paddingInline: {
      default: null,
      "@media (max-width: 1100px)": spacingVars["--spacing-6"],
      "@media (max-width: 480px)": spacingVars["--spacing-3"],
    },
    minHeight: {
      default: null,
      "@media (max-width: 600px)": "62px",
    },
    flexWrap: {
      default: null,
      "@media (max-width: 600px)": "wrap",
    },
    paddingBlock: {
      default: null,
      "@media (max-width: 600px)": spacingVars["--spacing-2"],
    },
  },
  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: {
      default: spacingVars["--spacing-3"],
      "@media (max-width: 800px)": spacingVars["--spacing-2"],
      "@media (max-width: 480px)": spacingVars["--spacing-1"],
    },
    fontSize: {
      default: textSizeVars["--font-size-sm"],
      "@media (max-width: 480px)": textSizeVars["--font-size-sm"],
    },
    color: colorVars["--color-text-secondary"],
    flex: {
      default: null,
      "@media (max-width: 600px)": "1",
    },
  },
  breadcrumbStrong: {
    color: colorVars["--color-text-primary"],
    fontWeight: "500",
  },
  topActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: {
      default: spacingVars["--spacing-5"],
      "@media (max-width: 800px)": spacingVars["--spacing-2"],
      "@media (max-width: 480px)": spacingVars["--spacing-1-5"],
      "@media (max-width: 600px)": spacingVars["--spacing-1-5"],
    },
    width: {
      default: null,
      "@media (max-width: 400px)": "100%",
    },
    justifyContent: {
      default: null,
      "@media (max-width: 400px)": "flex-end",
    },
  },
  local: {
    display: {
      default: "flex",
      "@media (max-width: 800px)": "none",
    },
    alignItems: "center",
    gap: spacingVars["--spacing-1-5"],
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  lang: {
    cursor: "pointer",
    color: colorVars["--color-text-primary"],
    fontWeight: "600",
    fontSize: textSizeVars["--font-size-sm"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    backgroundColor: colorVars["--color-background-card"],
    padding: "var(--spacing-2) var(--spacing-2)",
  },
  langSpan: {
    marginLeft: spacingVars["--spacing-2"],
    color: colorVars["--color-text-secondary"],
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: "1500px",
    margin: "0 auto",
    padding: {
      default: "var(--spacing-8) var(--spacing-9) var(--spacing-5)",
      "@media (max-width: 1100px)":
        "var(--spacing-7) var(--spacing-6) var(--spacing-4)",
      "@media (max-width: 800px)":
        "var(--spacing-6) var(--spacing-4) var(--spacing-3)",
    },
  },
  footer: {
    flexShrink: 0,
    display: {
      default: "flex",
      "@media print": "none",
    },
    justifyContent: "space-between",
    gap: spacingVars["--spacing-3"],
    padding: {
      default: "var(--spacing-5) var(--spacing-9) var(--spacing-6)",
      "@media (max-width: 800px)": spacingVars["--spacing-4"],
    },
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-xs"],
    flexWrap: {
      default: null,
      "@media (max-width: 800px)": "wrap",
    },
  },
  footerSpan: {
    display: {
      default: null,
      ":last-child": "flex",
    },
    alignItems: {
      default: null,
      ":last-child": "center",
    },
    gap: {
      default: null,
      ":last-child": spacingVars["--spacing-1-5"],
    },
  },
  footerSpanSpan: {
    margin: "0 var(--spacing-1-5)",
  },
  menu: {
    display: {
      default: "none",
      "@media (max-width: 800px)": "inline-flex",
    },
  },
  backdrop: {
    display: {
      default: "none",
      "@media (max-width: 800px)": "block",
    },
    position: {
      default: null,
      "@media (max-width: 800px)": "fixed",
    },
    inset: "0 0 0 238px",
    border: {
      default: null,
      "@media (max-width: 800px)": "0",
    },
    backgroundColor: {
      default: null,
      "@media (max-width: 800px)":
        "color-mix(in srgb, var(--color-background-inverted) 40%, transparent)",
    },
    zIndex: {
      default: null,
      "@media (max-width: 800px)": "19",
    },
  },
  skip: {
    position: "fixed",
    top: {
      default: "-100px",
      ":focus": "10px",
    },
    left: "20px",
    padding: spacingVars["--spacing-3"],
    backgroundColor: colorVars["--color-background-card"],
    zIndex: "50",
  },
  sidebarOpen: {
    transform: {
      default: null,
      "@media (max-width: 800px)": "translateX(0)",
    },
  },
  breadcrumbSpan: {
    display: {
      default: null,
      "@media (max-width: 800px)": "none",
    },
  },
  breadcrumbSvg: {
    display: {
      default: null,
      "@media (max-width: 800px)": "none",
    },
  },
  theme: {
    maxWidth: {
      default: "105px",
      "@media (max-width: 480px)": "84px",
    },
    padding: "var(--spacing-1-5) var(--spacing-2)",
    fontSize: textSizeVars["--font-size-sm"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    color: colorVars["--color-text-primary"],
    backgroundColor: colorVars["--color-background-card"],
    cursor: "pointer",
  },
  topActionsBadge: {
    display: {
      default: null,
      "@media (max-width: 480px)": "none",
      "@media (max-width: 600px)": "none",
    },
  },
  density: {
    cursor: "pointer",
    fontSize: textSizeVars["--font-size-sm"],
    padding: "var(--spacing-1-5) var(--spacing-2)",
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    backgroundColor: {
      default: colorVars["--color-background-card"],
      ':is([aria-pressed="true"])': colorVars["--color-accent"],
    },
    color: {
      default: colorVars["--color-text-primary"],
      ':is([aria-pressed="true"])': colorVars["--color-on-accent"],
    },
    borderColor: {
      default: null,
      ':is([aria-pressed="true"])': colorVars["--color-accent"],
    },
  },
  compactContent: {
    paddingBlock: "var(--spacing-5) var(--spacing-2)",
  },
  legacyLabel: {
    marginInlineStart: "auto",
    fontSize: textSizeVars["--font-size-xs"],
    color: colorVars["--color-text-secondary"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    paddingInline: spacingVars["--spacing-1"],
  },
  compactSidebar: {
    paddingBlock: "var(--spacing-5) var(--spacing-3)",
  },
  compactWorkspace: {
    marginBlock: "var(--spacing-5) var(--spacing-4)",
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactNav: {
    gap: spacingVars["--spacing-0-5"],
    marginBottom: spacingVars["--spacing-4"],
  },
  compactNavA: {
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactTopbar: {
    minHeight: "58px",
    height: "auto",
    paddingBlock: spacingVars["--spacing-2"],
  },
});
