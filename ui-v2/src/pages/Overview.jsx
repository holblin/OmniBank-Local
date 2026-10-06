import React from "react";
import { VStack } from "@astryxdesign/core/VStack";
import { Link } from "@tanstack/react-router";
import { Page } from "../components/Page";
import { Records } from "../components/Records";
import { useDashboard } from "../lib/server/queries";
import { useLanguage } from "../lib/i18n";
export function Overview() {
  const r = useDashboard();
  const { t, money } = useLanguage();
  return (
    <Page title="overview" subtitle="overview_body" resource={r}>
      <VStack gap={5}>
        <Records
          title="accounts"
          rows={r.data?.accounts || []}
          columns={[
            { key: "name" },
            {
              key: "balance",
              label: "current_balance",
              render: (row) => money(row.balance, row.currency),
            },
            { key: "currency" },
          ]}
        />
        <Records
          title="budgets"
          rows={r.data?.budgets.budgets || []}
          columns={[
            { key: "name" },
            {
              key: "spent",
              render: (row) => money(row.spent, r.profile?.currency),
            },
            {
              key: "remaining",
              render: (row) => money(row.remaining, r.profile?.currency),
            },
          ]}
        />
        <Link to="/history">{t("history")}</Link>
        <Link to="/summary">{t("summary")}</Link>
        <Link to="/trends">{t("trends")}</Link>
      </VStack>
    </Page>
  );
}
