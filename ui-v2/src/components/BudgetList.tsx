import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import React from "react";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Icon } from "./Icon";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "./Dashboard.stylex";
export function BudgetList({
  budgets,
  currency,
}: {
  budgets: import("../lib/server/models").BudgetStatus[];
  currency?: string;
}) {
  const { compact } = useAppTheme();
  const { t, money } = useLanguage();
  const spending = budgets
    .filter((b) => !b.is_closed && b.envelope_type !== "savings")
    .slice(0, 3);
  return (
    <section {...stylex.props(s.panel)}>
      <div {...stylex.props(s.panelHeading, compact && s.compactPanelHeading)}>
        <div>
          <h2 {...stylex.props(s.panelHeadingH2)}>{t("budgets")}</h2>
          <p {...stylex.props(s.panelHeadingP)}>{t("budget_subtitle")}</p>
        </div>
        <Link
          to="/budgets"
          aria-label={t("manage_budgets")}
          {...stylex.props(s.iconLink)}
        >
          <Icon name="arrow" size={17} />
        </Link>
      </div>
      {spending.length ? (
        <div {...stylex.props(s.budgetList, compact && s.compactBudgetList)}>
          {spending.map((b) => {
            const total = b.budget_amount + (b.income || 0);
            const used = b.expenses || 0;
            const percent = total > 0 ? (used / total) * 100 : 0;
            return (
              <div key={b.id}>
                <div {...stylex.props(s.budgetTop)}>
                  <strong {...stylex.props(s.budgetTopStrong)}>{b.name}</strong>
                  <span {...stylex.props(s.budgetTopSpan)}>
                    {Math.round(percent)} %
                  </span>
                </div>
                <ProgressBar
                  label={b.name}
                  isLabelHidden
                  value={Math.min(100, Math.max(0, percent))}
                  variant={
                    percent > 100
                      ? "error"
                      : percent > 80
                        ? "warning"
                        : "accent"
                  }
                />
                <div {...stylex.props(s.budgetBottom)}>
                  <span {...stylex.props(s.budgetBottomSpan)}>
                    {money(used, currency)}{" "}
                    <span {...stylex.props(s.budgetBottomSpanSpan)}>
                      / {money(total, currency)}
                    </span>
                  </span>
                  <span {...stylex.props(s.budgetBottomSpan)}>
                    {t(percent > 100 ? "over_budget" : "spent")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div {...stylex.props(s.empty)}>
          <Icon name="target" size={28} />
          <strong {...stylex.props(s.emptyStrong)}>{t("no_budgets")}</strong>
          <p {...stylex.props(s.emptyP)}>{t("no_budgets_body")}</p>
          <Link to="/budgets" {...stylex.props(s.emptyA)}>
            {t("create_budget")} <Icon name="arrow" size={14} />
          </Link>
        </div>
      )}
      <Link
        to="/budgets"
        {...stylex.props(s.panelFooter, compact && s.compactPanelFooter)}
      >
        {t("manage_budgets")}
        <Icon name="arrow" size={15} />
      </Link>
    </section>
  );
}
