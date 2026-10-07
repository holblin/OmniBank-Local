import * as stylex from "@stylexjs/stylex";
import {
  colorVars,
  spacingVars,
  radiusVars,
  textSizeVars,
} from "@astryxdesign/core/theme/tokens.stylex";
export const styles = stylex.create({
  pageHeading: {
    display: {
      default: "flex",
      "@media (max-width: 600px)": "block",
    },
    alignItems: {
      default: "center",
      "@media (max-width: 1000px)": "flex-start",
    },
    justifyContent: "space-between",
    gap: spacingVars["--spacing-6"],
    marginBottom: {
      default: spacingVars["--spacing-8"],
      "@media (max-width: 600px)": spacingVars["--spacing-6"],
    },
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: textSizeVars["--font-size-xs"],
    letterSpacing: "1.4px",
    color: colorVars["--color-text-secondary"],
    marginBottom: spacingVars["--spacing-2"],
    fontWeight: "500",
  },
  pageHeadingH1: {
    fontSize: {
      default: textSizeVars["--font-size-3xl"],
      "@media (max-width: 600px)": textSizeVars["--font-size-2xl"],
    },
    lineHeight: "1.3",
    letterSpacing: "-1.1px",
    fontWeight: "650",
    margin: "0",
  },
  pageHeadingP: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
    margin: "var(--spacing-2) 0 0",
    lineHeight: "1.7",
  },
  actions: {
    display: "flex",
    gap: spacingVars["--spacing-2"],
    flexShrink: "0",
    flexDirection: {
      default: null,
      "@media (max-width: 1000px)": "column",
      "@media (max-width: 600px)": "row",
    },
    marginTop: {
      default: null,
      "@media (max-width: 600px)": spacingVars["--spacing-5"],
    },
  },
  actionsA: {
    fontSize: {
      default: textSizeVars["--font-size-sm"],
      "@media (max-width: 600px)": textSizeVars["--font-size-sm"],
    },
    minHeight: {
      default: "36px",
      "@media (max-width: 600px)": "38px",
    },
    borderRadius: radiusVars["--radius-element"],
    paddingInline: spacingVars["--spacing-3"],
    flex: {
      default: null,
      "@media (max-width: 600px)": "1",
    },
  },
  actionsButton: {
    fontSize: {
      default: textSizeVars["--font-size-sm"],
      "@media (max-width: 600px)": textSizeVars["--font-size-sm"],
    },
    minHeight: {
      default: "36px",
      "@media (max-width: 600px)": "38px",
    },
    borderRadius: radiusVars["--radius-element"],
    paddingInline: spacingVars["--spacing-3"],
    flex: {
      default: null,
      "@media (max-width: 600px)": "1",
    },
  },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacingVars["--spacing-3"],
    marginBottom: spacingVars["--spacing-3"],
    fontSize: {
      default: textSizeVars["--font-size-sm"],
      "@media (max-width: 600px)": textSizeVars["--font-size-sm"],
    },
    fontWeight: "600",
  },
  sectionLabelSpan: {
    display: {
      default: null,
      ":last-child": "flex",
    },
    gap: {
      default: null,
      ":last-child": spacingVars["--spacing-1"],
    },
    alignItems: {
      default: null,
      ":last-child": "center",
    },
    fontSize: {
      default: null,
      ":last-child": textSizeVars["--font-size-xs"],
      "@media (max-width: 600px)": {
        default: null,
        ":last-child": textSizeVars["--font-size-xs"],
      },
    },
    color: {
      default: null,
      ":last-child": colorVars["--color-text-secondary"],
    },
    fontWeight: {
      default: null,
      ":last-child": "400",
    },
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(4, minmax(0, 1fr))",
      "@media (max-width: 1000px)": "repeat(2, minmax(0, 1fr))",
    },
    gap: {
      default: spacingVars["--spacing-3"],
      "@media (max-width: 600px)": spacingVars["--spacing-2"],
    },
    marginBottom: {
      default: spacingVars["--spacing-6"],
      "@media (max-width: 600px)": spacingVars["--spacing-4"],
    },
  },
  metric: {
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-container"],
    padding: {
      default: "var(--spacing-5) var(--spacing-4) var(--spacing-4)",
      "@media (max-width: 1200px)": "var(--spacing-4) var(--spacing-3)",
      "@media (max-width: 600px)": "var(--spacing-3) var(--spacing-3)",
    },
  },
  metricTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingVars["--spacing-1-5"],
    fontSize: {
      default: textSizeVars["--font-size-sm"],
      "@media (max-width: 1200px)": textSizeVars["--font-size-xs"],
      "@media (max-width: 600px)": textSizeVars["--font-size-xs"],
    },
    color: colorVars["--color-text-secondary"],
    marginBottom: {
      default: spacingVars["--spacing-4"],
      "@media (max-width: 600px)": spacingVars["--spacing-3"],
    },
  },
  metricIcon: {
    width: {
      default: "29px",
      "@media (max-width: 600px)": "23px",
    },
    height: {
      default: "29px",
      "@media (max-width: 600px)": "23px",
    },
    border: "1px solid var(--color-border)",
    display: "grid",
    placeItems: "center",
    borderRadius: radiusVars["--radius-element"],
    flexShrink: "0",
  },
  metricStrong: {
    display: "block",
    fontSize: {
      default: "clamp(var(--font-size-lg), 1.8vw, var(--font-size-3xl))",
      "@media (max-width: 1000px)": textSizeVars["--font-size-2xl"],
      "@media (max-width: 600px)": textSizeVars["--font-size-xl"],
    },
    lineHeight: "1.3",
    fontWeight: "600",
    letterSpacing: "-.7px",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  metricP: {
    fontSize: {
      default: textSizeVars["--font-size-xs"],
      "@media (max-width: 600px)": textSizeVars["--font-size-xs"],
    },
    color: colorVars["--color-text-secondary"],
    margin: "var(--spacing-3) 0 0",
    lineHeight: "1.6",
  },
  featured: {
    backgroundColor: colorVars["--color-accent"],
    borderColor: colorVars["--color-accent"],
    color: colorVars["--color-on-accent"],
  },
  featuredMetricTop: {
    color: colorVars["--color-on-accent"],
  },
  featuredMetricIcon: {
    color: colorVars["--color-on-accent"],
    borderColor: colorVars["--color-border"],
    backgroundColor: colorVars["--color-background-muted"],
  },
  featuredP: {
    color: colorVars["--color-on-accent"],
  },
  negative: {
    color: colorVars["--color-error"],
  },
  midGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1.9fr) minmax(280px, 1fr)",
      "@media (max-width: 1200px)": "minmax(0, 1.5fr) minmax(260px, 1fr)",
      "@media (max-width: 1000px)": "minmax(0, 1fr)",
    },
    gap: {
      default: spacingVars["--spacing-5"],
      "@media (max-width: 1200px)": spacingVars["--spacing-4"],
    },
    marginBottom: spacingVars["--spacing-5"],
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1.9fr) minmax(280px, 1fr)",
      "@media (max-width: 1200px)": "minmax(0, 1.5fr) minmax(260px, 1fr)",
      "@media (max-width: 1000px)": "minmax(0, 1fr)",
    },
    gap: {
      default: spacingVars["--spacing-5"],
      "@media (max-width: 1200px)": spacingVars["--spacing-4"],
    },
    marginBottom: spacingVars["--spacing-5"],
  },
  panel: {
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-container"],
    minWidth: "0",
    overflow: "hidden",
  },
  panelHeading: {
    padding: {
      default: "var(--spacing-5) var(--spacing-5) var(--spacing-4)",
      "@media (max-width: 600px)":
        "var(--spacing-5) var(--spacing-4) var(--spacing-4)",
    },
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingVars["--spacing-3"],
  },
  panelHeadingH2: {
    fontSize: {
      default: textSizeVars["--font-size-base"],
      "@media (max-width: 600px)": textSizeVars["--font-size-base"],
    },
    fontWeight: "600",
    letterSpacing: "-.2px",
    margin: "0",
  },
  panelHeadingP: {
    fontSize: textSizeVars["--font-size-xs"],
    color: colorVars["--color-text-secondary"],
    margin: "var(--spacing-1-5) 0 0",
    lineHeight: "1.6",
  },
  iconLink: {
    width: "28px",
    height: "28px",
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    display: "grid",
    placeItems: "center",
    color: {
      default: colorVars["--color-text-secondary"],
      ":hover": colorVars["--color-accent"],
    },
    flexShrink: "0",
    backgroundColor: {
      default: null,
      ":hover": colorVars["--color-accent-muted"],
    },
  },
  periods: {
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    padding: spacingVars["--spacing-0-5"],
    display: "flex",
    gap: spacingVars["--spacing-0-5"],
    flexShrink: "0",
  },
  periodsButton: {
    backgroundColor: "transparent",
    border: "0",
    cursor: "pointer",
    color: colorVars["--color-text-secondary"],
    fontSize: {
      default: textSizeVars["--font-size-xs"],
      "@media (max-width: 600px)": textSizeVars["--font-size-xs"],
    },
    borderRadius: radiusVars["--radius-inner"],
    padding: {
      default: "var(--spacing-1-5) var(--spacing-2)",
      "@media (max-width: 600px)": spacingVars["--spacing-1-5"],
    },
  },
  periodsPeriodActive: {
    backgroundColor: colorVars["--color-accent-muted"],
    color: colorVars["--color-accent"],
    fontWeight: "600",
  },
  chartHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: {
      default: "0 var(--spacing-5) var(--spacing-4)",
      "@media (max-width: 600px)": "0 var(--spacing-4) var(--spacing-3)",
    },
    gap: spacingVars["--spacing-3"],
  },
  chartHeadingStrong: {
    fontSize: {
      default: textSizeVars["--font-size-xl"],
      "@media (max-width: 600px)": textSizeVars["--font-size-lg"],
    },
    fontWeight: "600",
    letterSpacing: "-.4px",
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  accountSelect: {
    display: "flex",
    alignItems: "center",
    color: colorVars["--color-text-secondary"],
    gap: spacingVars["--spacing-1-5"],
    minWidth: "0",
  },
  accountSelectSelect: {
    fontSize: textSizeVars["--font-size-sm"],
    color: colorVars["--color-text-primary"],
    border: "0",
    backgroundColor: "transparent",
    cursor: "pointer",
    padding:
      "var(--spacing-1) var(--spacing-4) var(--spacing-1) var(--spacing-0-5)",
    minWidth: "0",
    maxWidth: {
      default: "220px",
      "@media (max-width: 600px)": "160px",
    },
  },
  chart: {
    height: "211px",
    margin: "0 var(--spacing-5) var(--spacing-1-5) var(--spacing-2)",
    position: "relative",
  },
  chartData: {
    position: "absolute",
    right: "0",
    bottom: {
      default: "-21px",
      ":is([open])": "0",
    },
    fontSize: textSizeVars["--font-size-xs"],
    color: colorVars["--color-text-secondary"],
    backgroundColor: colorVars["--color-background-card"],
    zIndex: "1",
    top: {
      default: null,
      ":is([open])": "0",
    },
    overflow: {
      default: null,
      ":is([open])": "auto",
    },
    padding: {
      default: null,
      ":is([open])": spacingVars["--spacing-2"],
    },
    border: {
      default: null,
      ":is([open])": "1px solid var(--color-border)",
    },
  },
  chartDataSummary: {
    cursor: "pointer",
  },
  chartDataTable: {
    width: "100%",
    fontSize: textSizeVars["--font-size-sm"],
    borderCollapse: "collapse",
  },
  chartDataTd: {
    padding: "var(--spacing-1) var(--spacing-3)",
    textAlign: "left",
  },
  chartDataTh: {
    padding: "var(--spacing-1) var(--spacing-3)",
    textAlign: "left",
  },
  chartNote: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: spacingVars["--spacing-2"],
    fontSize: textSizeVars["--font-size-xs"],
    color: colorVars["--color-text-secondary"],
    padding: "var(--spacing-3) var(--spacing-5) var(--spacing-5)",
  },
  chartNoteSpan: {
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-1-5"],
    width: {
      default: null,
      ":last-child": "100%",
    },
  },
  chartNoteI: {
    width: "6px",
    height: "6px",
    borderRadius: radiusVars["--radius-full"],
    backgroundColor: colorVars["--color-accent"],
  },
  chartPlaceholder: {
    height: "217px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: spacingVars["--spacing-4"],
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  chartPlaceholderA: {
    color: colorVars["--color-accent"],
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
  },
  budgetList: {
    display: "grid",
    gap: {
      default: spacingVars["--spacing-6"],
      "@media (max-width: 1000px)": spacingVars["--spacing-6"],
    },
    padding: {
      default: "var(--spacing-2) var(--spacing-5) var(--spacing-6)",
      "@media (max-width: 600px)":
        "var(--spacing-1-5) var(--spacing-4) var(--spacing-5)",
    },
    gridTemplateColumns: {
      default: null,
      "@media (max-width: 1000px)": "repeat(3, minmax(0, 1fr))",
      "@media (max-width: 600px)": "1fr",
    },
  },
  budgetTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacingVars["--spacing-3"],
    marginBottom: spacingVars["--spacing-3"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  budgetTopStrong: {
    fontWeight: "500",
  },
  budgetTopSpan: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-xs"],
  },
  budgetBottom: {
    display: "flex",
    justifyContent: "space-between",
    gap: spacingVars["--spacing-1-5"],
    marginTop: spacingVars["--spacing-2"],
    fontSize: textSizeVars["--font-size-xs"],
    flexWrap: {
      default: null,
      "@media (max-width: 1000px)": "wrap",
    },
  },
  budgetBottomSpanSpan: {
    color: colorVars["--color-text-secondary"],
  },
  budgetBottomSpan: {
    color: {
      default: null,
      ":last-child": colorVars["--color-text-secondary"],
    },
  },
  panelFooter: {
    borderTop: "1px solid var(--color-border)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    padding: "var(--spacing-3) var(--spacing-4)",
    color: colorVars["--color-accent"],
    fontSize: textSizeVars["--font-size-sm"],
    textDecoration: {
      default: null,
      ":hover": "underline",
    },
  },
  textLink: {
    textDecoration: {
      default: null,
      ":hover": "underline",
    },
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-1-5"],
    color: colorVars["--color-accent"],
    fontSize: textSizeVars["--font-size-xs"],
    whiteSpace: "nowrap",
  },
  tableScroll: {
    overflowX: "auto",
  },
  transactions: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: textSizeVars["--font-size-sm"],
    textAlign: "left",
  },
  transactionsTh: {
    color: colorVars["--color-text-secondary"],
    fontWeight: "500",
    fontSize: textSizeVars["--font-size-xs"],
    textTransform: "uppercase",
    letterSpacing: ".7px",
    padding: "var(--spacing-3) var(--spacing-4)",
    borderBlock: "1px solid var(--color-border)",
    backgroundColor: colorVars["--color-background-muted"],
    paddingLeft: {
      default: null,
      ":first-child": spacingVars["--spacing-5"],
    },
    textAlign: {
      default: null,
      ":last-child": "right",
    },
    paddingRight: {
      default: null,
      ":last-child": spacingVars["--spacing-5"],
      "@media (max-width: 600px)": {
        default: null,
        ":last-child": spacingVars["--spacing-4"],
      },
    },
    display: {
      default: null,
      "@media (max-width: 1200px)": {
        default: null,
        ":nth-child(3)": "none",
      },
      "@media (max-width: 600px)": {
        default: null,
        ":nth-child(2)": "none",
        ":nth-child(3)": "none",
      },
    },
  },
  transactionsTd: {
    padding: {
      default: "var(--spacing-3) var(--spacing-4)",
      "@media (max-width: 600px)": "var(--spacing-3) var(--spacing-3)",
    },
    borderBottom: "1px solid var(--color-border)",
    whiteSpace: {
      default: "nowrap",
      ":first-child": "normal",
    },
    paddingLeft: {
      default: null,
      ":first-child": spacingVars["--spacing-5"],
      "@media (max-width: 600px)": {
        default: null,
        ":first-child": spacingVars["--spacing-4"],
      },
    },
    textAlign: {
      default: null,
      ":last-child": "right",
    },
    paddingRight: {
      default: null,
      ":last-child": spacingVars["--spacing-5"],
      "@media (max-width: 600px)": {
        default: null,
        ":last-child": spacingVars["--spacing-4"],
      },
    },
    display: {
      default: null,
      "@media (max-width: 1200px)": {
        default: null,
        ":nth-child(3)": "none",
      },
      "@media (max-width: 600px)": {
        default: null,
        ":nth-child(2)": "none",
        ":nth-child(3)": "none",
      },
    },
  },
  transactionCell: {
    display: "flex",
    alignItems: "center",
    gap: {
      default: spacingVars["--spacing-2"],
      "@media (max-width: 600px)": spacingVars["--spacing-2"],
    },
  },
  transactionCellStrong: {
    display: "block",
    fontWeight: "500",
    fontSize: {
      default: textSizeVars["--font-size-sm"],
      "@media (max-width: 600px)": textSizeVars["--font-size-sm"],
    },
    overflowWrap: "anywhere",
    lineHeight: "1.5",
  },
  transactionCellSmall: {
    display: "block",
    marginTop: spacingVars["--spacing-1"],
    fontSize: textSizeVars["--font-size-xs"],
    color: colorVars["--color-text-secondary"],
    lineHeight: "1.5",
  },
  transactionIcon: {
    display: "grid",
    placeItems: "center",
    width: "31px",
    height: "31px",
    borderRadius: radiusVars["--radius-element"],
    backgroundColor: colorVars["--color-background-orange"],
    color: colorVars["--color-text-orange"],
    flexShrink: "0",
  },
  incomeIcon: {
    color: colorVars["--color-text-green"],
    backgroundColor: colorVars["--color-background-green"],
  },
  transferIcon: {
    color: colorVars["--color-text-blue"],
    backgroundColor: colorVars["--color-background-blue"],
  },
  amount: {
    fontWeight: "600",
    fontVariantNumeric: "tabular-nums",
  },
  income: {
    color: colorVars["--color-accent"],
  },
  accountList: {
    padding: "var(--spacing-0-5) var(--spacing-4) var(--spacing-4)",
    display: "grid",
    gap: spacingVars["--spacing-1-5"],
    maxHeight: "330px",
    overflowY: "auto",
  },
  account: {
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    padding: "var(--spacing-3) var(--spacing-1-5)",
    backgroundColor: {
      default: "none",
      ":hover": colorVars["--color-accent-muted"],
    },
    border: "1px solid transparent",
    borderRadius: radiusVars["--radius-element"],
    textAlign: "left",
    width: "100%",
    cursor: "pointer",
    borderColor: {
      default: null,
      ":hover": colorVars["--color-border"],
    },
  },
  accountActive: {
    backgroundColor: colorVars["--color-accent-muted"],
    borderColor: colorVars["--color-border"],
  },
  accountSpan: {
    minWidth: {
      default: null,
      ":nth-child(2)": "0",
    },
  },
  accountStrong: {
    fontSize: textSizeVars["--font-size-sm"],
    display: "block",
    fontWeight: "500",
    overflowWrap: "anywhere",
  },
  accountSmall: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-xs"],
    display: "block",
    marginTop: spacingVars["--spacing-1"],
  },
  accountB: {
    marginLeft: "auto",
    fontSize: textSizeVars["--font-size-sm"],
    fontWeight: "600",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  accountIcon: {
    width: "33px",
    height: "33px",
    borderRadius: radiusVars["--radius-element"],
    display: "grid",
    placeItems: "center",
    backgroundColor: colorVars["--color-accent-muted"],
    color: colorVars["--color-text-secondary"],
    flexShrink: "0",
  },
  savings: {
    backgroundColor: colorVars["--color-background-muted"],
    borderTop: "1px solid var(--color-border)",
    padding: spacingVars["--spacing-4"],
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-3"],
  },
  savingsIcon: {
    color: colorVars["--color-text-secondary"],
    display: "grid",
    placeItems: "center",
  },
  savingsStrong: {
    fontSize: textSizeVars["--font-size-sm"],
    fontWeight: "600",
  },
  savingsP: {
    fontSize: textSizeVars["--font-size-xs"],
    color: colorVars["--color-text-secondary"],
    marginTop: spacingVars["--spacing-1"],
    lineHeight: "1.5",
  },
  savingsB: {
    marginLeft: "auto",
    whiteSpace: "nowrap",
    fontSize: textSizeVars["--font-size-base"],
    fontWeight: "600",
  },
  migrationNote: {
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-xs"],
    lineHeight: "1.6",
    marginTop: spacingVars["--spacing-1-5"],
    flexWrap: {
      default: null,
      "@media (max-width: 600px)": "wrap",
    },
  },
  migrationNoteSpan: {
    flex: {
      default: null,
      ":nth-child(2)": "1",
    },
    flexBasis: {
      default: null,
      "@media (max-width: 600px)": {
        default: null,
        ":nth-child(2)": "75%",
      },
    },
  },
  migrationNoteA: {
    display: "flex",
    gap: spacingVars["--spacing-1-5"],
    alignItems: "center",
    color: colorVars["--color-accent"],
    whiteSpace: "nowrap",
    marginLeft: {
      default: null,
      "@media (max-width: 600px)": "auto",
    },
  },
  empty: {
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "var(--spacing-6) var(--spacing-5)",
    textAlign: "center",
    gap: spacingVars["--spacing-3"],
    color: colorVars["--color-text-secondary"],
  },
  emptyStrong: {
    color: colorVars["--color-text-primary"],
    fontSize: textSizeVars["--font-size-base"],
    fontWeight: "500",
  },
  emptyP: {
    fontSize: textSizeVars["--font-size-sm"],
    lineHeight: "1.7",
    maxWidth: "230px",
  },
  emptyA: {
    fontSize: textSizeVars["--font-size-sm"],
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    color: colorVars["--color-accent"],
  },
  error: {
    textAlign: "center",
    padding: "var(--spacing-12) var(--spacing-6)",
  },
  errorSvg: {
    margin: "0 auto var(--spacing-4)",
  },
  errorH2: {
    fontSize: textSizeVars["--font-size-xl"],
  },
  errorP: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-base"],
    margin: "var(--spacing-4) 0 var(--spacing-5)",
  },
  message: {
    color: colorVars["--color-text-secondary"],
    padding: "var(--spacing-12) var(--spacing-5)",
    textAlign: "center",
    fontSize: textSizeVars["--font-size-base"],
  },
  loading: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-base"],
  },
  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(4, 1fr)",
      "@media (max-width: 600px)": "repeat(2, 1fr)",
    },
    gap: spacingVars["--spacing-3"],
    marginTop: spacingVars["--spacing-5"],
  },
  skeletonGridDiv: {
    height: "150px",
    borderRadius: radiusVars["--radius-container"],
    backgroundColor: colorVars["--color-background-muted"],
  },
  warning: {
    color: colorVars["--color-text-yellow"],
    backgroundColor: colorVars["--color-warning-muted"],
    border: "1px solid var(--color-warning)",
    padding: "var(--spacing-3) var(--spacing-4)",
    marginBottom: spacingVars["--spacing-5"],
    display: "flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    fontSize: textSizeVars["--font-size-base"],
    borderRadius: radiusVars["--radius-element"],
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    clipPath: "inset(50%)",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  compactPageHeading: {
    marginBottom: spacingVars["--spacing-5"],
    gap: spacingVars["--spacing-4"],
  },
  compactMetrics: {
    gap: spacingVars["--spacing-2"],
    marginBottom: spacingVars["--spacing-4"],
  },
  compactMetric: {
    padding: "var(--spacing-3) var(--spacing-3)",
  },
  compactMetricTop: {
    marginBottom: spacingVars["--spacing-2"],
  },
  compactMetricStrong: {
    fontSize: "clamp(var(--font-size-lg), 1.6vw, var(--font-size-2xl))",
  },
  compactMidGrid: {
    gap: spacingVars["--spacing-3"],
    marginBottom: spacingVars["--spacing-3"],
  },
  compactBottomGrid: {
    gap: spacingVars["--spacing-3"],
    marginBottom: spacingVars["--spacing-3"],
  },
  compactPanelHeading: {
    padding: "var(--spacing-4) var(--spacing-4) var(--spacing-3)",
  },
  compactBudgetList: {
    gap: spacingVars["--spacing-4"],
    padding: "var(--spacing-1-5) var(--spacing-4) var(--spacing-4)",
  },
  compactTransactionsTd: {
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactPanelFooter: {
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactAccount: {
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactSavings: {
    padding: spacingVars["--spacing-3"],
  },
});
