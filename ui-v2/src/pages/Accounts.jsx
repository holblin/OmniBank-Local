import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Link } from "@tanstack/react-router";
import { Page, Editor } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useServerQueries, accounts } from "../lib/server/queries";
import { resource, useWorkspace } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
const fields = [
  { name: "name", required: true },
  { name: "type", required: true },
  {
    name: "currency",
    required: true,
    options: ["EUR", "USD", "GBP", "CHF", "CAD", "JPY"].map((value) => ({
      value,
      label: value,
    })),
  },
  { name: "initial_balance", type: "number", required: true },
  { name: "interest_rate", type: "number", min: 0 },
  { name: "borrowed_amount", type: "number", min: 0 },
  { name: "monthly_payment", type: "number", min: 0 },
  { name: "loan_insurance", type: "number", min: 0 },
  { name: "loan_end_date", type: "date", nullable: true },
  { name: "is_closed", type: "checkbox" },
];
export function Accounts() {
  const r = useServerQueries((id) => ({
    items: accounts.list(id),
    main: resource("accounts", id, "main", "/api/stats/main_account"),
  }));
  const a = useRecordActions("accounts", r.profile?.id);
  const { t, money } = useLanguage();
  const [detail, setDetail] = useState(null);
  return (
    <Page
      title="accounts"
      subtitle="accounts_body"
      resource={r}
      actions={
        <Button
          label={t("new_account")}
          onClick={() =>
            a.edit({
              name: "",
              type: "Compte courant",
              currency: r.profile?.currency || "EUR",
              initial_balance: 0,
            })
          }
        />
      }
    >
      <VStack gap={4}>
        <Link to="/bank-sync">{t("bank_sync")}</Link>
        <Records
          title="accounts"
          rows={r.data?.items || []}
          columns={[
            {
              key: "name",
              render: (row) => (
                <VStack gap={1}>
                  <strong>{row.name}</strong>
                  {r.data?.main?.id === row.id && (
                    <small>{t("account_primary")}</small>
                  )}
                </VStack>
              ),
            },
            { key: "type" },
            { key: "currency" },
            {
              key: "current_balance",
              render: (row) => money(row.current_balance, row.currency),
            },
            {
              key: "status",
              render: (row) => t(row.is_closed ? "closed" : "status_active"),
            },
          ]}
          actions={(row) => (
            <>
              <ActionButton
                label={t("edit")}
                icon="edit"
                onClick={() => a.edit(row)}
              />
              <ActionButton
                label={t("financial_details")}
                icon="chart"
                onClick={() => setDetail(row)}
              />
              <ActionButton
                label={t("main_account")}
                icon="target"
                isDisabled={row.is_closed || r.data?.main?.id === row.id}
                onClick={() =>
                  a.save({
                    path: `/api/stats/main_account/${row.id}`,
                    body: {},
                  })
                }
              />
              <ActionButton
                label={t(row.is_closed ? "reopen" : "close_record")}
                icon="archive"
                onClick={() =>
                  a.confirm(
                    {
                      path: `/api/accounts/${row.id}`,
                      method: "PUT",
                      body: { ...row, is_closed: !row.is_closed },
                    },
                    t(row.is_closed ? "reopen" : "close_record"),
                  )
                }
              />
              <ActionButton
                label={t("delete")}
                icon="delete"
                onClick={() =>
                  a.confirm({
                    path: `/api/accounts/${row.id}`,
                    method: "DELETE",
                  })
                }
              />
            </>
          )}
        />
        {a.mutation.isError && !a.editor && !a.pending && (
          <p role="alert">{t("save_error")}</p>
        )}
      </VStack>
      {a.editor && (
        <RecordEditor
          title={t(a.editor.id ? "edit_account" : "new_account")}
          fields={fields}
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.save({
              path: `/api/accounts/${a.editor.id || ""}`,
              method: a.editor.id ? "PUT" : "POST",
              body: { ...body, color: a.editor.color || null },
            })
          }
        />
      )}
      <Confirmation {...a.confirmation} />
      {detail && (
        <AccountDetails account={detail} onClose={() => setDetail(null)} />
      )}
    </Page>
  );
}
function AccountDetails({ account, onClose }) {
  const r = useWorkspace(
    "accounts",
    `/api/accounts/${account.id}/financial-info`,
  );
  const a = useRecordActions("accounts", r.profile?.id);
  const { t, money } = useLanguage();
  const info = r.data?.items;
  return (
    <Editor title={account.name} onClose={onClose}>
      <VStack gap={4}>
        {r.loading && <p role="status">{t("loading")}</p>}
        {r.error && <p role="alert">{t("connection_error")}</p>}
        {info && (
          <>
            <p>
              {t("current_balance")}:{" "}
              {money(info.current_balance, account.currency)}
            </p>
            {info.type === "loan" ? (
              <>
                <p>
                  {t("repaid_amount")}:{" "}
                  {money(info.repaid_amount, account.currency)} (
                  {info.repaid_percent}%)
                </p>
                <p>
                  {t("capital_month")}:{" "}
                  {money(info.amortization.capital_month, account.currency)}
                </p>
                <p>
                  {t("interest_month")}:{" "}
                  {money(info.amortization.interest_month, account.currency)}
                </p>
                <p>
                  {t("total_monthly")}:{" "}
                  {money(info.amortization.total_monthly, account.currency)}
                </p>
              </>
            ) : (
              <>
                <p>
                  {t("estimated_interest")}:{" "}
                  {money(info.estimated_interest, account.currency)}
                </p>
                <Button
                  label={t("apply_interest")}
                  onClick={() =>
                    a.edit({
                      amount: info.estimated_interest,
                      date_operation: `${new Date().getFullYear()}-12-31`,
                      description: t("apply_interest"),
                    })
                  }
                />
              </>
            )}
            <Button
              label={t("adjust_balance")}
              variant="secondary"
              onClick={() =>
                a.edit({ adjusting: true, delta: 0, mode: "transaction" })
              }
            />
          </>
        )}
      </VStack>
      {a.editor && (
        <RecordEditor
          title={t(a.editor.adjusting ? "adjust_balance" : "apply_interest")}
          initial={a.editor}
          fields={
            a.editor.adjusting
              ? [
                  { name: "delta", type: "number", required: true },
                  {
                    name: "mode",
                    options: [
                      {
                        value: "transaction",
                        label: t("adjustment_transaction"),
                      },
                      { value: "initial_balance", label: t("initial_balance") },
                    ],
                  },
                ]
              : [
                  { name: "amount", type: "number", min: 0, required: true },
                  { name: "date_operation", type: "date", required: true },
                  { name: "description" },
                ]
          }
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.confirm(
              {
                path: `/api/accounts/${account.id}/${a.editor.adjusting ? "reconcile-balance-delta" : "apply-interest"}`,
                body,
              },
              t("confirm"),
              t("financial_write_warning"),
            )
          }
        />
      )}
      <Confirmation {...a.confirmation} />
    </Editor>
  );
}
