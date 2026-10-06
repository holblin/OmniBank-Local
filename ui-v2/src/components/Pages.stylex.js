import * as stylex from "@stylexjs/stylex";
import {
  colorVars,
  spacingVars,
  radiusVars,
  textSizeVars,
} from "@astryxdesign/core/theme/tokens.stylex";
export const styles = stylex.create({
  heading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingVars["--spacing-4"],
    marginBottom: spacingVars["--spacing-6"],
    flexWrap: "wrap",
  },
  headingH1: {
    margin: "0",
    fontSize: {
      default: textSizeVars["--font-size-3xl"],
      "@media (max-width: 600px)": textSizeVars["--font-size-2xl"],
    },
  },
  headingH2: {
    margin: "0",
    fontSize: textSizeVars["--font-size-xl"],
  },
  headingP: {
    margin: "var(--spacing-2) 0 0",
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
    lineHeight: "1.6",
  },
  actions: {
    display: {
      default: "flex",
      "@media print": "none",
    },
    flexWrap: "wrap",
    alignItems: "end",
    gap: spacingVars["--spacing-2"],
  },
  filters: {
    display: {
      default: "flex",
      "@media print": "none",
    },
    flexWrap: "wrap",
    alignItems: "end",
    gap: spacingVars["--spacing-2"],
    padding: spacingVars["--spacing-4"],
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-container"],
    marginBottom: spacingVars["--spacing-5"],
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: spacingVars["--spacing-1-5"],
    fontSize: textSizeVars["--font-size-sm"],
    minWidth: "0",
  },
  fieldInput: {
    width: "100%",
    minHeight: "36px",
    padding: "var(--spacing-2) var(--spacing-2)",
    color: colorVars["--color-text-primary"],
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
  },
  fieldSelect: {
    width: "100%",
    minHeight: {
      default: "36px",
      ":is([multiple])": "95px",
    },
    padding: "var(--spacing-2) var(--spacing-2)",
    color: colorVars["--color-text-primary"],
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
  },
  fieldTextarea: {
    width: "100%",
    minHeight: "36px",
    padding: "var(--spacing-2) var(--spacing-2)",
    color: colorVars["--color-text-primary"],
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
  },
  check: {
    display: "inline-flex",
    alignItems: "center",
    gap: spacingVars["--spacing-2"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
    gap: spacingVars["--spacing-4"],
    marginBottom: spacingVars["--spacing-5"],
  },
  card: {
    padding: {
      default: spacingVars["--spacing-5"],
      "@media (max-width: 600px)": spacingVars["--spacing-4"],
    },
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-container"],
    minWidth: "0",
  },
  panel: {
    padding: {
      default: spacingVars["--spacing-5"],
      "@media (max-width: 600px)": spacingVars["--spacing-4"],
    },
    backgroundColor: colorVars["--color-background-card"],
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-container"],
    minWidth: "0",
  },
  cardH2: {
    margin: "0 0 var(--spacing-1-5)",
    fontSize: textSizeVars["--font-size-lg"],
    overflowWrap: "anywhere",
  },
  cardP: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
    lineHeight: "1.6",
  },
  note: {
    color: colorVars["--color-text-secondary"],
    fontSize: textSizeVars["--font-size-sm"],
    lineHeight: "1.6",
  },
  cardStrong: {
    display: "block",
    fontSize: textSizeVars["--font-size-2xl"],
    margin: "var(--spacing-4) 0",
  },
  cardDl: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: spacingVars["--spacing-2"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  cardDt: {
    color: colorVars["--color-text-secondary"],
  },
  cardDd: {
    margin: "0",
    fontVariantNumeric: "tabular-nums",
  },
  cardActions: {
    marginTop: spacingVars["--spacing-5"],
  },
  form: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      "@media (max-width: 600px)": "1fr",
    },
    gap: spacingVars["--spacing-4"],
  },
  formActions: {
    gridColumn: "1 / -1",
  },
  formError: {
    gridColumn: "1 / -1",
  },
  formFieldset: {
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-inner"],
    padding: spacingVars["--spacing-3"],
    display: "flex",
    gap: spacingVars["--spacing-3"],
    flexWrap: "wrap",
  },
  formLegend: {
    fontSize: textSizeVars["--font-size-sm"],
    color: colorVars["--color-text-secondary"],
  },
  error: {
    color: colorVars["--color-error"],
    padding: spacingVars["--spacing-3"],
    border: "1px solid var(--color-error)",
    borderRadius: radiusVars["--radius-inner"],
  },
  empty: {
    padding: "var(--spacing-9) var(--spacing-5)",
    textAlign: "center",
    color: colorVars["--color-text-secondary"],
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid var(--color-border)",
    borderRadius: radiusVars["--radius-container"],
    backgroundColor: colorVars["--color-background-card"],
    overflow: null,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: textSizeVars["--font-size-sm"],
  },
  tableCaption: {
    textAlign: "left",
    padding: spacingVars["--spacing-4"],
    fontSize: textSizeVars["--font-size-lg"],
    fontWeight: "600",
  },
  tableTh: {
    padding: "var(--spacing-3) var(--spacing-4)",
    textAlign: "left",
    borderBottom: "1px solid var(--color-border)",
    backgroundColor: colorVars["--color-background-muted"],
    color: colorVars["--color-text-secondary"],
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
  tableTd: {
    padding: "var(--spacing-3) var(--spacing-4)",
    textAlign: "left",
    borderBottom: "1px solid var(--color-border)",
    fontVariantNumeric: "tabular-nums",
  },
  tableTdSmall: {
    display: "block",
    color: colorVars["--color-text-secondary"],
    marginTop: spacingVars["--spacing-1"],
  },
  tableNumber: {
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  tableSelected: {
    backgroundColor: colorVars["--color-accent-muted"],
  },
  pagination: {
    display: {
      default: "flex",
      "@media print": "none",
    },
    gap: spacingVars["--spacing-3"],
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingVars["--spacing-5"],
    fontSize: textSizeVars["--font-size-sm"],
  },
  rowActions: {
    display: {
      default: "flex",
      "@media print": "none",
    },
    gap: spacingVars["--spacing-1-5"],
    flexWrap: "wrap",
  },
  actionsButton: {
    fontSize: textSizeVars["--font-size-sm"],
  },
  closed: {
    opacity: "0.65",
  },
  compactCard: {
    padding: spacingVars["--spacing-4"],
  },
  compactPanel: {
    padding: spacingVars["--spacing-4"],
  },
  compactTableTd: {
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactTableTh: {
    paddingBlock: spacingVars["--spacing-2"],
  },
  compactGrid: {
    gap: spacingVars["--spacing-3"],
  },
  compactFilters: {
    padding: spacingVars["--spacing-3"],
    marginBottom: spacingVars["--spacing-4"],
  },
  filtersChild: {
    flex: {
      default: null,
      "@media (max-width: 600px)": "1 1 120px",
    },
  },
  historyTable: {
    minWidth: "980px",
  },
  sectionSpacing: {
    marginTop: spacingVars["--spacing-6"],
  },
  chartLegend: {
    fontSize: textSizeVars["--font-size-sm"],
    color: colorVars["--color-text-secondary"],
  },
});
