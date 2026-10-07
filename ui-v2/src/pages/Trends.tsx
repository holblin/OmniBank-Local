import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Page, Field } from "../components/Page";
import { BalanceChart } from "../components/BalanceChart";
import SummaryChart from "../components/SummaryChart";
import { Records } from "../components/Records";
import {
  useServerQueries,
  accounts,
  useTrend,
  useSummary,
} from "../lib/server/queries";
import { useLanguage } from "../lib/i18n";
import { localDate } from "../lib/navigation";
import { styles as s } from "../components/Pages.stylex";
export function Trends() {
  const r = useServerQueries((id) => ({ items: accounts.list(id) }));
  const { t, money } = useLanguage();
  const [selected, setSelected] = useState("");
  const [period, setPeriod] = useState("12");
  const [alignment, setAlignment] = useState("rolling");
  const [mode, setMode] = useState("balance");
  const [overlay, setOverlay] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const account =
    r.data?.items.find((row) => String(row.id) === selected) ||
    r.data?.items.find((row) => !row.is_closed);
  const trend = useTrend(
    selected === "total" ? "total" : String(account?.id || ""),
  );
  const cutoff = new Date();
  if (alignment === "calendar") {
    const months = period === "all" ? 12 : Number(period);
    cutoff.setMonth(Math.floor(cutoff.getMonth() / months) * months, 1);
  } else cutoff.setMonth(cutoff.getMonth() - Number(period));
  const lower = start || (period === "all" ? "1900-01-01" : localDate(cutoff));
  const upper = end || localDate();
  const summary = useSummary({
    account_ids: selected === "total" ? "" : String(account?.id || ""),
    date_start: lower,
    date_end: upper,
    reconciled: "all",
  });
  const history = (trend.data?.history || []).filter(
    (row) => row.date >= lower && row.date <= upper,
  );
  const comparisons = overlay
    ? [1, 2, 3]
        .map((offset) => ({
          label: `${t("previous_year")} -${offset}`,
          history: (trend.data?.history || [])
            .map((row) => {
              const d = new Date(`${row.date}T12:00:00`);
              d.setFullYear(d.getFullYear() + offset);
              return { ...row, date: localDate(d) };
            })
            .filter((row) => row.date >= lower && row.date <= upper),
        }))
        .filter((series) => series.history.length)
    : [];
  const points = (summary.data?.summary.months || []).map((month) => {
    const data = summary.data!.summary.by_type;
    return {
      month,
      income: data.income?.totals_per_month[month] || 0,
      expense:
        (Math.round((data.expense_var?.totals_per_month[month] || 0) * 100) +
          Math.round(
            (data.expense_fixed?.totals_per_month[month] || 0) * 100,
          )) /
        100,
    };
  });
  return (
    <Page title="trends" subtitle="trends_body" resource={r}>
      <VStack gap={4}>
        <Field label={t("select_account")}>
          <select
            value={selected === "total" ? "total" : account?.id || ""}
            onChange={(e) => setSelected(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="total">{t("all_accounts")}</option>
            {r.data?.items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("period")}>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setStart("");
              setEnd("");
            }}
            {...stylex.props(s.fieldSelect)}
          >
            {["1", "3", "6", "9", "12", "all"].map((value) => (
              <option key={value} value={value}>
                {value === "all" ? t("all") : `${value} ${t("months")}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("alignment")}>
          <select
            value={alignment}
            onChange={(e) => setAlignment(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="rolling">{t("rolling")}</option>
            <option value="calendar">{t("calendar")}</option>
          </select>
        </Field>
        <Field label={t("chart_mode")}>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {["balance", "expenses", "income_expenses", "monthly_net"].map(
              (value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ),
            )}
          </select>
        </Field>
        <label>
          <input
            type="checkbox"
            checked={overlay}
            onChange={(e) => setOverlay(e.target.checked)}
          />
          {t("overlay_years")}
        </label>
        <Field label={t("date_start")}>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("date_end")}>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Button
          label={t("reset_zoom")}
          onClick={() => {
            setStart("");
            setEnd("");
          }}
        />
        {(trend.isError || summary.error) && (
          <p role="alert">{t("connection_error")}</p>
        )}
        {trend.data && (
          <>
            <p>
              {t("current_balance")}:{" "}
              <strong>
                {money(trend.data.current_balance, account?.currency)}
              </strong>
            </p>
            {history.length > 0 && (
              <Records
                title="statistics"
                rows={[
                  {
                    name: t("variation"),
                    amount: history.at(-1)!.balance - history[0].balance,
                  },
                  {
                    name: t("minimum"),
                    amount: Math.min(...history.map((row) => row.balance)),
                  },
                  {
                    name: t("maximum"),
                    amount: Math.max(...history.map((row) => row.balance)),
                  },
                  {
                    name: t("average"),
                    amount:
                      history.reduce(
                        (sum, row) => sum + Math.round(row.balance * 100),
                        0,
                      ) /
                      history.length /
                      100,
                  },
                ]}
                columns={[
                  { key: "name" },
                  {
                    key: "amount",
                    render: (row) => money(row.amount, account?.currency),
                  },
                ]}
              />
            )}
            {mode === "balance" ? (
              <BalanceChart
                history={history}
                comparisons={comparisons}
                currency={account?.currency}
              />
            ) : mode === "monthly_net" ? (
              <BalanceChart
                history={points.map((row) => ({
                  date: `${row.month}-01`,
                  balance:
                    (Math.round(row.income * 100) -
                      Math.round(row.expense * 100)) /
                    100,
                }))}
                currency={account?.currency}
              />
            ) : (
              <SummaryChart
                points={points.map((row) => ({
                  ...row,
                  income: mode === "expenses" ? 0 : row.income,
                }))}
                currency={account?.currency || "EUR"}
              />
            )}
          </>
        )}
      </VStack>
    </Page>
  );
}
