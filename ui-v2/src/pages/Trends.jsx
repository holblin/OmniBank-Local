import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { VStack } from "@astryxdesign/core/VStack";
import { Page, Field } from "../components/Page";
import { BalanceChart } from "../components/BalanceChart";
import { useServerQueries, accounts, useTrend } from "../lib/server/queries";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
export function Trends() {
  const r = useServerQueries((id) => ({ items: accounts.list(id) }));
  const { t, money } = useLanguage();
  const [selected, setSelected] = useState("");
  const account =
    (r.data?.items || []).find((row) => String(row.id) === selected) ||
    r.data?.items.find((row) => !row.is_closed);
  const trend = useTrend(String(account?.id || ""));
  return (
    <Page title="trends" subtitle="trends_body" resource={r}>
      <VStack gap={4}>
        <Field label={t("select_account")}>
          <select
            value={account?.id || ""}
            onChange={(event) => setSelected(event.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {r.data?.items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
        {!account && <p>{t("no_records")}</p>}
        {account && trend.isPending && <p role="status">{t("loading")}</p>}
        {trend.isError && (
          <p role="alert">
            {t(trend.data ? "stale_data" : "connection_error")}
          </p>
        )}
        {trend.data && (
          <>
            <p>
              {t("current_balance")}:{" "}
              <strong>
                {money(trend.data.current_balance, account.currency)}
              </strong>
            </p>
            <BalanceChart
              history={trend.data.history || []}
              currency={account.currency}
            />
          </>
        )}
      </VStack>
    </Page>
  );
}
