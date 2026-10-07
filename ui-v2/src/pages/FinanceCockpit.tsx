import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mutate } from "../lib/http";
import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import SummaryChart from "../components/SummaryChart";
import {
  useServerQueries,
  accounts,
  transactions,
  statistics,
} from "../lib/server/queries";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
import { localDate } from "../lib/navigation";
import { styles as s } from "../components/Pages.stylex";
export function FinanceCockpit() {
  const { t, money } = useLanguage();
  const [account, setAccount] = useState("");
  const [scope, setScope] = useState("pending");
  const [period, setPeriod] = useState("6");
  const [granularity, setGranularity] = useState("month");
  const [pay, setPay] = useState(false);
  const [settings, setSettings] = useState(false);
  const from = new Date();
  from.setMonth(from.getMonth() - Number(period));
  const r = useServerQueries((id) => ({
    accounts: accounts.list(id),
    transactions: transactions.list(id, {
      limit: "100000",
      ...(account ? { account_id: account } : {}),
    }),
    summary: statistics.summary(id, {
      date_start: localDate(from),
      date_end: localDate(),
      ...(account ? { account_ids: account } : {}),
    }),
    stats: statistics.dashboard(id),
  }));
  const [bulk, setBulk] = useState(false);
  const client = useQueryClient();
  const reconcile = useMutation({
    mutationFn: async () => {
      for (const row of rows.filter(
        (row) => !row.reconciliation_date && row.date_operation <= localDate(),
      ))
        await mutate(`/api/transactions/${row.id}`, "PUT", {
          reconciliation_date: localDate(),
        });
    },
    onSuccess: () => setBulk(false),
    onSettled: () => client.invalidateQueries(),
  });
  const a = useRecordActions<import("../lib/server/models").Transaction>(
    "transactions",
    r.profile?.id,
  );
  const stats = r.data?.stats;
  const rows = (r.data?.transactions || [])
    .filter(
      (row) => scope === "all" || (!row.is_skipped && !row.reconciliation_date),
    )
    .sort((a, b) => a.date_operation.localeCompare(b.date_operation));
  const data = r.data?.summary;
  const points = (data?.months || []).map((month) => ({
    month,
    income: data?.by_type.income?.totals_per_month[month] || 0,
    expense:
      (Math.round(
        (data?.by_type.expense_var?.totals_per_month[month] || 0) * 100,
      ) +
        Math.round(
          (data?.by_type.expense_fixed?.totals_per_month[month] || 0) * 100,
        )) /
      100,
  }));
  const now = localDate();
  const lastDay = localDate(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  );
  const base = account
    ? r.data?.accounts.find((row) => String(row.id) === account)
        ?.current_balance || 0
    : stats?.net_worth || 0;
  const projectedCents = (r.data?.transactions || [])
    .filter(
      (row) =>
        !row.is_skipped &&
        !row.reconciliation_date &&
        row.date_operation >= now &&
        row.date_operation <= lastDay,
    )
    .reduce(
      (sum, row) =>
        sum +
        Math.round(row.amount * 100) *
          (account
            ? (String(row.to_account_id) === account ? 1 : 0) -
              (String(row.from_account_id) === account ? 1 : 0)
            : row.type === "income"
              ? 1
              : row.type.startsWith("expense")
                ? -1
                : 0),
      Math.round(base * 100),
    );
  const nbDays = Math.max(
    1,
    Math.round(
      (new Date(`${localDate()}T12:00:00`).getTime() -
        new Date(`${localDate(from)}T12:00:00`).getTime()) /
        86400000,
    ) + 1,
  );
  const divisor =
    granularity === "week"
      ? 7
      : granularity === "month"
        ? 365.25 / 12
        : granularity === "hour"
          ? 1 / 24
          : 1;
  const sums = { income: 0, expense_fixed: 0, expense_var: 0 };
  const top = new Map<string, number>();
  for (const row of (r.data?.transactions || []).filter(
    (row) =>
      !row.is_skipped &&
      row.date_operation >= localDate(from) &&
      row.date_operation <= now,
  )) {
    const amount = Math.round(Math.abs(row.amount) * 100);
    const type = account
      ? String(row.to_account_id) === account &&
        String(row.from_account_id) !== account
        ? "income"
        : String(row.from_account_id) === account &&
            String(row.to_account_id) !== account
          ? row.type === "expense_fixed"
            ? "expense_fixed"
            : "expense_var"
          : "neutral"
      : row.type;
    if (type === "income" || type === "expense_fixed" || type === "expense_var")
      sums[type] += amount;
    if (type.startsWith("expense"))
      top.set(
        row.category || t("none"),
        (top.get(row.category || t("none")) || 0) + amount,
      );
  }
  return (
    <VStack gap={4} xstyle={[s.contained]}>
      <h2>{t("financial_controls")}</h2>
      <Button label={t("override_pay")} onClick={() => setPay(true)} />
      <Button
        label={t("pay_settings")}
        variant="secondary"
        onClick={() => setSettings(true)}
      />
      <Button
        label={t("reset_pay")}
        variant="secondary"
        onClick={() =>
          a.confirm(
            { path: "/api/stats/override_paycheck", method: "DELETE" },
            t("reset_pay"),
          )
        }
      />
      <Button
        label={t("validate_pay")}
        variant="secondary"
        onClick={() =>
          a.confirm(
            {
              path: "/api/stats/validate_pay_period?action=validate",
              body: {},
            },
            t("validate_pay"),
          )
        }
      />
      {["force", "reset"].map((action) => (
        <Button
          key={action}
          label={t(action === "force" ? "force_pay_cycle" : "reset_pay_cycle")}
          variant="secondary"
          onClick={() =>
            a.confirm(
              {
                path: `/api/stats/validate_pay_period?action=${action}`,
                body: {},
              },
              t(action === "force" ? "force_pay_cycle" : "reset_pay_cycle"),
            )
          }
        />
      ))}
      {stats && (
        <Records
          title="financial_controls"
          rows={[
            {
              name: t("rest_with_income"),
              amount: stats.rest_to_live_with_income,
            },
            {
              name: t("unreconciled_expenses"),
              amount: stats.total_unreconciled_expenses,
            },
            {
              name: t("unreconciled_income"),
              amount: stats.total_unreconciled_income,
            },
            { name: t("liquid_net_worth"), amount: stats.liquid_net_worth },
            { name: t("loan_total"), amount: stats.loan_total },
          ]}
          columns={[
            { key: "name" },
            {
              key: "amount",
              render: (row) => money(row.amount, r.profile?.currency),
            },
          ]}
        />
      )}
      <Field label={t("select_account")}>
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          {...stylex.props(s.fieldSelect)}
        >
          <option value="">{t("all_accounts")}</option>
          {r.data?.accounts.map((row) => (
            <option value={row.id} key={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("period")}>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          {...stylex.props(s.fieldSelect)}
        >
          {["1", "3", "6", "12"].map((value) => (
            <option value={value} key={value}>
              {value} {t("months")}
            </option>
          ))}
        </select>
      </Field>
      <p>
        {t("month_end_projection")}:{" "}
        <strong>{money(projectedCents / 100, r.profile?.currency)}</strong> ·{" "}
        {lastDay}
      </p>
      <Field label={t("rhythm_unit")}>
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value)}
          {...stylex.props(s.fieldSelect)}
        >
          {["month", "week", "day", "hour"].map((value) => (
            <option key={value} value={value}>
              {t(value)}
            </option>
          ))}
        </select>
      </Field>
      <Records
        title="averages_rhythm"
        rows={[
          { name: t("income"), amount: (sums.income / 100 / nbDays) * divisor },
          {
            name: t("expense_fixed"),
            amount: (sums.expense_fixed / 100 / nbDays) * divisor,
          },
          {
            name: t("expense_var"),
            amount: (sums.expense_var / 100 / nbDays) * divisor,
          },
          {
            name: t("net_result"),
            amount:
              ((sums.income - sums.expense_fixed - sums.expense_var) /
                100 /
                nbDays) *
              divisor,
          },
        ]}
        columns={[
          { key: "name" },
          {
            key: "amount",
            render: (row) => money(row.amount, r.profile?.currency),
          },
        ]}
      />
      <Records
        title="top_expenses"
        rows={[...top.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([category, amount]) => ({ category, amount: amount / 100 }))}
        columns={[
          { key: "category" },
          {
            key: "amount",
            render: (row) => money(row.amount, r.profile?.currency),
          },
        ]}
      />
      <SummaryChart points={points} currency={r.profile?.currency || "EUR"} />
      <Field label={t("timeline")}>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          {...stylex.props(s.fieldSelect)}
        >
          <option value="pending">{t("pending")}</option>
          <option value="all">{t("all")}</option>
        </select>
      </Field>
      <Button
        label={t("reconcile_past")}
        isDisabled={
          a.mutation.isPending ||
          !rows.some(
            (row) =>
              !row.reconciliation_date && row.date_operation <= localDate(),
          )
        }
        onClick={() => setBulk(true)}
      />
      <Records
        title="timeline"
        rows={rows}
        columns={[
          { key: "date_operation", label: "date" },
          { key: "description" },
          { key: "category" },
          {
            key: "amount",
            render: (row) => money(row.amount, r.profile?.currency),
          },
          { key: "reconciliation_date" },
        ]}
        actions={(row) => (
          <>
            <Button
              label={t(row.reconciliation_date ? "unreconcile" : "reconcile")}
              onClick={() =>
                a.save({
                  path: `/api/transactions/${row.id}`,
                  method: "PUT",
                  body: {
                    reconciliation_date: row.reconciliation_date
                      ? null
                      : localDate(),
                  },
                })
              }
            />
            <Button
              label={t("edit")}
              onClick={() => a.edit(row)}
              variant="secondary"
            />
            <Button
              label={t("duplicate")}
              variant="secondary"
              onClick={() =>
                a.edit({ ...row, id: undefined, reconciliation_date: null })
              }
            />
            <Button
              label={t(row.is_skipped ? "unskip" : "skip_transaction")}
              variant="secondary"
              onClick={() =>
                a.save({
                  path: `/api/transactions/${row.id}`,
                  method: "PUT",
                  body: { is_skipped: !row.is_skipped },
                })
              }
            />
          </>
        )}
      />
      {(r.error || a.mutation.isError) && <p role="alert">{t("save_error")}</p>}
      {a.editor && (
        <RecordEditor
          title={t("edit_transaction")}
          initial={a.editor}
          fields={[
            { name: "description", required: true },
            { name: "amount", type: "number", min: 0, required: true },
            {
              name: "date_operation",
              label: "date",
              type: "date",
              required: true,
            },
            {
              name: "type",
              options: [
                "income",
                "expense_fixed",
                "expense_var",
                "transfer",
                "neutral",
              ].map((value) => ({ value, label: t(value) })),
            },
            { name: "category" },
            {
              name: "from_account_id",
              label: "from_account",
              nullable: true,
              options: [
                { value: "", label: t("none") },
                ...(r.data?.accounts || []).map((row) => ({
                  value: row.id,
                  label: row.name,
                })),
              ],
            },
            {
              name: "to_account_id",
              label: "to_account",
              nullable: true,
              options: [
                { value: "", label: t("none") },
                ...(r.data?.accounts || []).map((row) => ({
                  value: row.id,
                  label: row.name,
                })),
              ],
            },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.save({
              path: `/api/transactions/${a.editor?.id || ""}`,
              method: a.editor?.id ? "PUT" : "POST",
              body: {
                ...a.editor,
                ...body,
                from_account_id: body.from_account_id
                  ? Number(body.from_account_id)
                  : null,
                to_account_id: body.to_account_id
                  ? Number(body.to_account_id)
                  : null,
              },
            })
          }
        />
      )}
      {pay && (
        <RecordEditor
          title={t("override_pay")}
          initial={{
            date: stats?.next_pay_date || localDate(),
            amount: stats?.next_pay_amount || 0,
          }}
          fields={[
            { name: "date", type: "date", required: true },
            { name: "amount", type: "number", min: 0, required: true },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setPay(false)}
          onSave={async (body) => {
            const result = await a.save({
              path: "/api/stats/override_paycheck",
              body,
            });
            if (result) setPay(false);
          }}
        />
      )}
      {settings && (
        <RecordEditor
          title={t("pay_settings")}
          initial={{
            base_pay_day: r.config?.base_pay_day || 28,
            pay_category: r.config?.pay_category || "Salaire",
          }}
          fields={[
            { name: "base_pay_day", type: "number", min: 1, max: 31, step: 1 },
            { name: "pay_category" },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setSettings(false)}
          onSave={async (body) => {
            const result = await a.save({
              path: "/api/config/",
              body: Object.fromEntries(
                Object.entries(body).map(([key, value]) => [
                  key,
                  String(value),
                ]),
              ),
            });
            if (result) setSettings(false);
          }}
        />
      )}
      <Confirmation
        pending={
          bulk
            ? {
                label: t("reconcile_past"),
                description: t("confirm_record_action"),
              }
            : null
        }
        busy={reconcile.isPending}
        error={reconcile.isError}
        onClose={() => setBulk(false)}
        onConfirm={() => reconcile.mutate()}
      />
      <Confirmation {...a.confirmation} />
    </VStack>
  );
}
