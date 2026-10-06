import { TableRow, TableCell, TableHeaderCell } from "@astryxdesign/core/Table";
import { VirtualTable } from "../components/VirtualTable";
import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import React, { lazy, Suspense, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Page, Field } from "../components/Page";
import { MetricCard } from "../components/MetricCard";
import { get } from "../lib/api";
import { useResource } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import { transactionTypes } from "./History";
import { styles as s } from "../components/Pages.stylex.js";
const SummaryChart = lazy(() => import("../components/SummaryChart"));
const cents = (amount) => Math.round((amount || 0) * 100);
export function Summary() {
  const { compact } = useAppTheme();
  const { t, money, locale } = useLanguage();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [account, setAccount] = useState("");
  const [reconciled, setReconciled] = useState("all");
  const [range, setRange] = useState(false);
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);
  const params = new URLSearchParams({
    reconciled,
    ...(range
      ? {
          date_start: start,
          date_end: end,
        }
      : {
          year,
        }),
  });
  if (account) params.set("account_ids", account);
  const resource = useResource(async (signal) => {
    const [summary, accounts] = await Promise.all([
      get(`/api/stats/categories_by_month?${params}`, signal),
      get("/api/accounts/", signal),
    ]);
    return {
      summary,
      accounts,
    };
  }, params.toString());
  const data = resource.data?.summary;
  const currency =
    resource.data?.accounts.find((a) => String(a.id) === account)?.currency ||
    resource.profile?.currency ||
    "EUR";
  const income = data?.by_type.income?.grand_total || 0;
  const expense =
    (cents(data?.by_type.expense_var?.grand_total) +
      cents(data?.by_type.expense_fixed?.grand_total)) /
    100;
  const net = (cents(income) - cents(expense)) / 100;
  const monthLabel = (month) =>
    new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    }).format(new Date(`${month}-01T12:00:00`));
  const points =
    data?.months.map((month) => ({
      month,
      income: data.by_type.income?.totals_per_month[month] || 0,
      expense:
        (cents(data.by_type.expense_var?.totals_per_month[month]) +
          cents(data.by_type.expense_fixed?.totals_per_month[month])) /
        100,
    })) || [];
  function exportCsv() {
    const rows = [
      [t("transaction_type"), t("category"), ...data.months, t("total")],
    ];
    for (const type of transactionTypes)
      for (const [category, months] of Object.entries(
        data.by_type[type]?.categories || {},
      ))
        rows.push([
          t(type),
          category,
          ...data.months.map((month) => (months[month] || 0).toFixed(2)),
          data.by_type[type].totals_per_cat[category].toFixed(2),
        ]);
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map((cell) => '"' + String(cell).replaceAll('"', '""') + '"')
            .join(";"),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "synthese.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Page
      title="summary"
      subtitle="summary_intro"
      resource={resource}
      actions={
        <>
          <Button
            label={t("export_csv")}
            variant="secondary"
            isDisabled={resource.loading || resource.error}
            onClick={exportCsv}
          />
          <Button
            label={t("print")}
            variant="secondary"
            onClick={() => window.print()}
          />
        </>
      }
    >
      <div {...stylex.props(s.filters, compact && s.compactFilters)}>
        <Field label={t("year")} xstyle={[s.field, s.filtersChild]}>
          <input
            type="number"
            min="1900"
            max="2200"
            value={year}
            disabled={range}
            onChange={(e) => {
              if (
                Number(e.target.value) >= 1900 &&
                Number(e.target.value) <= 2200
              )
                setYear(e.target.value);
            }}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("select_account")} xstyle={[s.field, s.filtersChild]}>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="">{t("all_accounts")}</option>
            {resource.data?.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("status")} xstyle={[s.field, s.filtersChild]}>
          <select
            value={reconciled}
            onChange={(e) => setReconciled(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {["all", "reconciled", "unreconciled"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <label {...stylex.props(s.check, s.filtersChild)}>
          <input
            type="checkbox"
            checked={range}
            onChange={(e) => setRange(e.target.checked)}
          />
          {t("custom")}
        </label>
        {range && (
          <>
            <Field label={t("date_start")} xstyle={[s.field, s.filtersChild]}>
              <input
                type="date"
                required
                value={start}
                max={end}
                onChange={(e) => {
                  if (e.target.value) setStart(e.target.value);
                }}
                {...stylex.props(s.fieldInput)}
              />
            </Field>
            <Field label={t("date_end")} xstyle={[s.field, s.filtersChild]}>
              <input
                type="date"
                required
                value={end}
                min={start}
                onChange={(e) => {
                  if (e.target.value) setEnd(e.target.value);
                }}
                {...stylex.props(s.fieldInput)}
              />
            </Field>
          </>
        )}
      </div>
      <div {...stylex.props(s.grid, compact && s.compactGrid)}>
        <MetricCard
          label={t("income")}
          value={money(income, currency)}
          detail={t("selected_period")}
          icon="down"
        />
        <MetricCard
          label={t("expenses")}
          value={money(expense, currency)}
          detail={t("selected_period")}
          icon="up"
        />
        <MetricCard
          label={t("net_result")}
          value={money(net, currency)}
          detail={t("transfers_excluded")}
          icon="chart"
          featured
        />
      </div>
      <section {...stylex.props(s.panel, compact && s.compactPanel)}>
        <h2>{t("monthly_cashflow")}</h2>
        <p {...stylex.props(s.note)}>{t("summary_forecast_note")}</p>
        <Suspense fallback={<p role="status">{t("loading")}</p>}>
          <SummaryChart points={points} currency={currency} />
        </Suspense>
      </section>
      <div {...stylex.props(s.tableWrap, s.sectionSpacing)}>
        <VirtualTable
          rows={points}
          renderRow={(point) => (
            <TableRow key={point.month}>
              <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                {monthLabel(point.month)}
              </TableCell>
              <TableCell
                xstyle={[s.tableTd, s.tableNumber, compact && s.compactTableTd]}
              >
                {money(point.income, currency)}
              </TableCell>
              <TableCell
                xstyle={[s.tableTd, s.tableNumber, compact && s.compactTableTd]}
              >
                {money(point.expense, currency)}
              </TableCell>
              <TableCell
                xstyle={[s.tableTd, s.tableNumber, compact && s.compactTableTd]}
              >
                {money(
                  (cents(point.income) - cents(point.expense)) / 100,
                  currency,
                )}
              </TableCell>
            </TableRow>
          )}
          header={
            <>
              <TableRow isHeaderRow>
                <TableHeaderCell
                  xstyle={[s.tableTh, compact && s.compactTableTh]}
                  scope="col"
                >
                  {t("month")}
                </TableHeaderCell>
                <TableHeaderCell
                  xstyle={[
                    s.tableTh,
                    s.tableNumber,
                    compact && s.compactTableTh,
                  ]}
                  scope="col"
                >
                  {t("income")}
                </TableHeaderCell>
                <TableHeaderCell
                  xstyle={[
                    s.tableTh,
                    s.tableNumber,
                    compact && s.compactTableTh,
                  ]}
                  scope="col"
                >
                  {t("expenses")}
                </TableHeaderCell>
                <TableHeaderCell
                  xstyle={[
                    s.tableTh,
                    s.tableNumber,
                    compact && s.compactTableTh,
                  ]}
                  scope="col"
                >
                  {t("net_result")}
                </TableHeaderCell>
              </TableRow>
            </>
          }
          columnCount={4}
          xstyle={[s.table]}
          caption={
            <caption {...stylex.props(s.tableCaption)}>
              {t("monthly_cashflow")}
            </caption>
          }
        />
      </div>
      {transactionTypes.map(
        (type) =>
          data?.by_type[type] && (
            <section key={type} {...stylex.props(s.sectionSpacing)}>
              <div {...stylex.props(s.tableWrap)}>
                <VirtualTable
                  rows={Object.entries(data.by_type[type].categories)}
                  renderRow={([category, months]) => (
                    <TableRow key={category}>
                      <TableHeaderCell
                        scope="row"
                        xstyle={[s.tableTh, compact && s.compactTableTh]}
                      >
                        {category}
                      </TableHeaderCell>
                      {data.months.map((month) => (
                        <TableCell
                          key={month}
                          xstyle={[
                            s.tableTd,
                            s.tableNumber,
                            compact && s.compactTableTd,
                          ]}
                        >
                          {money(months[month] || 0, currency)}
                        </TableCell>
                      ))}
                      <TableCell
                        xstyle={[
                          s.tableTd,
                          s.tableNumber,
                          compact && s.compactTableTd,
                        ]}
                      >
                        {money(
                          data.by_type[type].totals_per_cat[category],
                          currency,
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  header={
                    <>
                      <TableRow isHeaderRow>
                        <TableHeaderCell
                          xstyle={[s.tableTh, compact && s.compactTableTh]}
                          scope="col"
                        >
                          {t("category")}
                        </TableHeaderCell>
                        {data.months.map((month) => (
                          <TableHeaderCell
                            key={month}
                            xstyle={[
                              s.tableTh,
                              s.tableNumber,
                              compact && s.compactTableTh,
                            ]}
                            scope="col"
                          >
                            {monthLabel(month)}
                          </TableHeaderCell>
                        ))}
                        <TableHeaderCell
                          xstyle={[
                            s.tableTh,
                            s.tableNumber,
                            compact && s.compactTableTh,
                          ]}
                          scope="col"
                        >
                          {t("total")}
                        </TableHeaderCell>
                      </TableRow>
                    </>
                  }
                  columnCount={data.months.length + 2}
                  xstyle={[s.table]}
                  caption={
                    <caption {...stylex.props(s.tableCaption)}>
                      {t(type)} ·{" "}
                      {money(data.by_type[type].grand_total, currency)}
                    </caption>
                  }
                />
              </div>
            </section>
          ),
      )}
      {data && !Object.keys(data.by_type).length && (
        <p {...stylex.props(s.empty)}>{t("no_summary_data")}</p>
      )}
    </Page>
  );
}
