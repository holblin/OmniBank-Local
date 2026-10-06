import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Shell } from "../components/Shell";
import { Icon } from "../components/Icon";
import { MetricCard } from "../components/MetricCard";
import { BudgetList } from "../components/BudgetList";
import { TransactionList } from "../components/TransactionList";
import {
  get,
  legacyUrl,
  loadDashboard,
  loadTransactions,
  localDate,
} from "../lib/api";
import { useProfileLock } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Dashboard.stylex.js";
const BalanceChart = lazy(() =>
  import("../components/BalanceChart").then((module) => ({
    default: module.BalanceChart,
  })),
);
export function Dashboard() {
  const { compact } = useAppTheme();
  const { t, money, date, locale } = useLanguage();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [accountId, setAccountId] = useState("");
  const [days, setDays] = useState(30);
  const [trend, setTrend] = useState({
    loading: true,
    history: [],
  });
  const [transactions, setTransactions] = useState({
    loading: true,
    items: [],
  });
  useProfileLock(data?.profile);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    loadDashboard(controller.signal)
      .then((result) => {
        setData(result);
        setAccountId((previous) =>
          result.accounts.some((a) => String(a.id) === previous)
            ? previous
            : String(
                result.stats.main_account_id || result.accounts[0]?.id || "",
              ),
        );
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    if (!data || loading || error) return;
    const controller = new AbortController();
    setTransactions({
      loading: true,
      items: [],
    });
    loadTransactions(accountId, controller.signal)
      .then((items) =>
        setTransactions({
          loading: false,
          items,
        }),
      )
      .catch((e) => {
        if (e.name !== "AbortError")
          setTransactions({
            loading: false,
            items: [],
            error: true,
          });
      });
    setTrend({
      loading: true,
      history: [],
    });
    if (accountId) {
      get(`/api/stats/trends/${accountId}`, controller.signal)
        .then((result) => {
          if (result.error) throw new Error(result.error);
          setTrend({
            loading: false,
            history: result.history,
            balance: result.current_balance,
          });
        })
        .catch((e) => {
          if (e.name !== "AbortError")
            setTrend({
              loading: false,
              history: [],
              error: true,
            });
        });
    } else
      setTrend({
        loading: false,
        history: [],
      });
    return () => controller.abort();
  }, [data, accountId, loading, error]);
  const account = data?.accounts.find((a) => String(a.id) === accountId);
  const currency = data?.profile.currency || "EUR";
  const chartCurrency = account?.currency || currency;
  const history = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    return trend.history.filter((point) => point.date >= localDate(cutoff));
  }, [trend.history, days]);
  const hasPayForecast = (stats) =>
    stats.next_pay_date && stats.next_pay_amount > 0;
  const stats = data?.stats;
  return (
    <Shell profile={data?.profile}>
      <div {...stylex.props(s.pageHeading, compact && s.compactPageHeading)}>
        <div>
          <div {...stylex.props(s.eyebrow)}>
            {new Intl.DateTimeFormat(locale, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </div>
          <h1 {...stylex.props(s.pageHeadingH1)}>{t("dashboard")}</h1>
          <p {...stylex.props(s.pageHeadingP)}>{t("intro")}</p>
        </div>
        <div {...stylex.props(s.actions)}>
          <Button
            label={t("refresh")}
            icon={<Icon name="refresh" size={16} />}
            variant="secondary"
            isLoading={loading}
            onClick={() => setRevision((v) => v + 1)}
            xstyle={[s.actionsButton]}
          />
          <Button
            label={t("new_transaction")}
            icon={<Icon name="plus" size={17} />}
            variant="primary"
            href="/v2/history?new=1"
            xstyle={[s.actionsButton]}
          />
        </div>
      </div>
      {error ? (
        <section role="alert" {...stylex.props(s.panel, s.error)}>
          <Icon name="refresh" size={30} {...stylex.props(s.errorSvg)} />
          <h2 {...stylex.props(s.errorH2)}>{t("connection_error")}</h2>
          <p {...stylex.props(s.errorP)}>{t("connection_error_body")}</p>
          <Button
            label={t("retry")}
            onClick={() => setRevision((v) => v + 1)}
          />
        </section>
      ) : loading ? (
        <div role="status" {...stylex.props(s.loading)}>
          {t("loading")}
          <div {...stylex.props(s.skeletonGrid)}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} {...stylex.props(s.skeletonGridDiv)} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div {...stylex.props(s.sectionLabel)}>
            <span {...stylex.props(s.sectionLabelSpan)}>{t("overview")}</span>
            <span {...stylex.props(s.sectionLabelSpan)}>
              <Icon name="check" size={12} />
              {t("reconciled_balances")}
            </span>
          </div>
          <div {...stylex.props(s.metrics, compact && s.compactMetrics)}>
            <MetricCard
              label={t("net_worth")}
              value={money(stats.net_worth, currency)}
              detail={`${data.accounts.length} ${t("active_accounts")}`}
              icon="wallet"
              featured
            />
            <MetricCard
              label={t("rest_to_live")}
              value={money(stats.rest_to_live, currency)}
              detail={t("until_payday")}
              icon="target"
              warning={stats.rest_to_live < 0}
            />
            <MetricCard
              label={t("pending_expenses")}
              value={money(stats.unreconciled_expenses, currency)}
              detail={t("before_payday")}
              icon="clock"
            />
            <MetricCard
              label={t("next_pay")}
              value={
                hasPayForecast(stats)
                  ? money(stats.next_pay_amount, currency)
                  : "—"
              }
              detail={
                hasPayForecast(stats)
                  ? `${t("estimated_on")} ${date(stats.next_pay_date)}`
                  : t("no_pay_forecast")
              }
              icon="calendar"
            />
          </div>
          {stats.overdraft_warning && (
            <div role="status" {...stylex.props(s.warning)}>
              <Icon name="clock" size={18} />
              {t("overdraft_warning")} {date(stats.overdraft_warning.date)}
            </div>
          )}
          <div {...stylex.props(s.midGrid, compact && s.compactMidGrid)}>
            <section {...stylex.props(s.panel)}>
              <div
                {...stylex.props(
                  s.panelHeading,
                  compact && s.compactPanelHeading,
                )}
              >
                <div>
                  <h2 {...stylex.props(s.panelHeadingH2)}>
                    {t("balance_evolution")}
                  </h2>
                  <p {...stylex.props(s.panelHeadingP)}>
                    {t("balance_subtitle")}
                  </p>
                </div>
                <div
                  role="group"
                  aria-label={t("period")}
                  {...stylex.props(s.periods)}
                >
                  {[30, 90].map((period) => (
                    <button
                      key={period}
                      onClick={() => setDays(period)}
                      aria-pressed={days === period}
                      {...stylex.props(
                        s.periodsButton,
                        days === period && s.periodsPeriodActive,
                      )}
                    >
                      {period} {t("days")}
                    </button>
                  ))}
                </div>
              </div>
              {data.accounts.length > 0 && (
                <div {...stylex.props(s.chartHeading)}>
                  <label {...stylex.props(s.accountSelect)}>
                    <Icon name="wallet" size={15} />
                    <span {...stylex.props(s.srOnly)}>
                      {t("select_account")}
                    </span>
                    <select
                      value={accountId}
                      onChange={(event) => setAccountId(event.target.value)}
                      aria-label={t("select_account")}
                      {...stylex.props(s.accountSelectSelect)}
                    >
                      {data.accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <strong {...stylex.props(s.chartHeadingStrong)}>
                    {!trend.loading && !trend.error
                      ? money(trend.balance, chartCurrency)
                      : "—"}
                  </strong>
                </div>
              )}
              {trend.loading ? (
                <div role="status" {...stylex.props(s.chartPlaceholder)}>
                  {t("loading")}
                </div>
              ) : trend.error ? (
                <div role="alert" {...stylex.props(s.chartPlaceholder)}>
                  {t("chart_error")}
                </div>
              ) : !history.length ? (
                <div {...stylex.props(s.chartPlaceholder)}>
                  {t(data.accounts.length ? "no_chart_data" : "no_accounts")}
                  <a
                    href={legacyUrl("accounts")}
                    {...stylex.props(s.chartPlaceholderA)}
                  >
                    {t("manage_accounts")}
                    <Icon name="arrow" size={14} />
                  </a>
                </div>
              ) : (
                <Suspense
                  fallback={
                    <div role="status" {...stylex.props(s.chartPlaceholder)}>
                      {t("loading")}
                    </div>
                  }
                >
                  <BalanceChart history={history} currency={chartCurrency} />
                </Suspense>
              )}
              <div {...stylex.props(s.chartNote)}>
                <span {...stylex.props(s.chartNoteSpan)}>
                  <i {...stylex.props(s.chartNoteI)} />
                  {t("account_balance")}
                </span>
                <span {...stylex.props(s.chartNoteSpan)}>
                  {t("all_operations_note")}
                </span>
              </div>
            </section>
            <BudgetList budgets={data.budgets} currency={currency} />
          </div>
          <div {...stylex.props(s.bottomGrid, compact && s.compactBottomGrid)}>
            <TransactionList
              transactions={transactions.items}
              accounts={data.accounts}
              loading={transactions.loading}
              error={transactions.error}
            />
            <section {...stylex.props(s.panel)}>
              <div
                {...stylex.props(
                  s.panelHeading,
                  compact && s.compactPanelHeading,
                )}
              >
                <div>
                  <h2 {...stylex.props(s.panelHeadingH2)}>
                    {t("my_accounts")}
                  </h2>
                  <p {...stylex.props(s.panelHeadingP)}>
                    {t("reconciled_balances")}
                  </p>
                </div>
                <a
                  href={legacyUrl("accounts")}
                  aria-label={t("manage_accounts")}
                  {...stylex.props(s.iconLink)}
                >
                  <Icon name="arrow" size={17} />
                </a>
              </div>
              {data.accounts.length ? (
                <div {...stylex.props(s.accountList)}>
                  {data.accounts.map((a) => (
                    <button
                      key={a.id}
                      aria-pressed={String(a.id) === accountId}
                      onClick={() => setAccountId(String(a.id))}
                      {...stylex.props(
                        s.account,
                        String(a.id) === accountId && s.accountActive,
                        compact && s.compactAccount,
                      )}
                    >
                      <span {...stylex.props(s.accountSpan, s.accountIcon)}>
                        <Icon name={a.is_loan ? "bank" : "wallet"} size={18} />
                      </span>
                      <span {...stylex.props(s.accountSpan)}>
                        <strong {...stylex.props(s.accountStrong)}>
                          {a.name}
                        </strong>
                        <small {...stylex.props(s.accountSmall)}>
                          {a.type}
                        </small>
                      </span>
                      <b {...stylex.props(s.accountB)}>
                        {money(a.balance, a.currency)}
                      </b>
                    </button>
                  ))}
                </div>
              ) : (
                <div {...stylex.props(s.empty)}>
                  <Icon name="wallet" size={28} />
                  <strong {...stylex.props(s.emptyStrong)}>
                    {t("no_accounts")}
                  </strong>
                  <a href={legacyUrl("accounts")} {...stylex.props(s.emptyA)}>
                    {t("add_account")}
                    <Icon name="plus" size={14} />
                  </a>
                </div>
              )}
              <a
                href={legacyUrl("accounts")}
                {...stylex.props(
                  s.panelFooter,
                  compact && s.compactPanelFooter,
                )}
              >
                {t("manage_accounts")}
                <Icon name="arrow" size={15} />
              </a>
              <div {...stylex.props(s.savings, compact && s.compactSavings)}>
                <span {...stylex.props(s.savingsIcon)}>
                  <Icon name="target" size={23} />
                </span>
                <div>
                  <strong {...stylex.props(s.savingsStrong)}>
                    {t("savings")}
                  </strong>
                  <p {...stylex.props(s.savingsP)}>{t("savings_subtitle")}</p>
                </div>
                <b {...stylex.props(s.savingsB)}>
                  {money(stats.savings_summary.balance, currency)}
                </b>
              </div>
            </section>
          </div>
          <div {...stylex.props(s.migrationNote)}>
            <Badge label={t("preview")} variant="neutral" />
            <span {...stylex.props(s.migrationNoteSpan)}>
              {t("migration_note")}
            </span>
            <a href={legacyUrl()} {...stylex.props(s.migrationNoteA)}>
              {t("return_v1")}
              <Icon name="arrow" size={14} />
            </a>
          </div>
        </>
      )}
    </Shell>
  );
}
