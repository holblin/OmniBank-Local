import { useSearch } from "@tanstack/react-router";
import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Page, Field, Editor } from "../components/Page";
import { get, mutate, localDate, legacyUrl } from "../lib/api";
import { useResource } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import s from "../components/Pages.module.css";

export const transactionTypes = [
  "income",
  "expense_var",
  "expense_fixed",
  "transfer",
  "neutral",
];
const PAGE_SIZE = 40;
export function History() {
  const { t, money, date } = useLanguage();
  const [filters, setFilters] = useState({
    search: "",
    account_id: "",
    date_start: "",
    date_end: "",
    transaction_type: "",
    reconciled: "all",
  });
  const [draftSearch, setDraftSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const search = useSearch({ strict: false });
  const [editor, setEditor] = useState(search.new ? {} : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  function filter(key, value) {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setOffset(0);
  }
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  );
  query.set("skip", offset);
  query.set("limit", PAGE_SIZE + 1);
  const resource = useResource(async (signal) => {
    const [transactions, accounts, budgets] = await Promise.all([
      get(`/api/transactions/?${query}`, signal),
      get("/api/accounts/", signal),
      get("/api/budgets/", signal),
    ]);
    return { transactions, accounts, budgets };
  }, query.toString());
  async function action(path, method, body) {
    setBusy(true);
    setError(false);
    try {
      await mutate(path, method, body);
      setEditor(null);
      resource.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const data = resource.data;
  const accountName = (id) =>
    data.accounts.find((a) => a.id === id)?.name || "—";
  return (
    <Page
      title="history"
      subtitle="history_intro"
      resource={resource}
      actions={
        <Button
          label={t("new_transaction")}
          variant="primary"
          onClick={() => {
            setEditor({});
            setError(false);
          }}
        />
      }
    >
      <form
        className={s.filters}
        onSubmit={(event) => {
          event.preventDefault();
          filter("search", draftSearch);
        }}
      >
        <Field label={t("search")}>
          <input
            type="search"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            placeholder={t("search_placeholder")}
          />
        </Field>
        <Button type="submit" label={t("search")} variant="secondary" />
        <Field label={t("select_account")}>
          <select
            value={filters.account_id}
            onChange={(e) => filter("account_id", e.target.value)}
          >
            <option value="">{t("all_accounts")}</option>
            {data?.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("date_start")}>
          <input
            type="date"
            value={filters.date_start}
            max={filters.date_end || undefined}
            onChange={(e) => filter("date_start", e.target.value)}
          />
        </Field>
        <Field label={t("date_end")}>
          <input
            type="date"
            value={filters.date_end}
            min={filters.date_start || undefined}
            onChange={(e) => filter("date_end", e.target.value)}
          />
        </Field>
        <Field label={t("transaction_type")}>
          <select
            value={filters.transaction_type}
            onChange={(e) => filter("transaction_type", e.target.value)}
          >
            <option value="">{t("all_types")}</option>
            {transactionTypes.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("status")}>
          <select
            value={filters.reconciled}
            onChange={(e) => filter("reconciled", e.target.value)}
          >
            {["all", "reconciled", "unreconciled"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
      </form>
      {error && (
        <p className={s.error} role="alert">
          {t("save_error")}
        </p>
      )}
      {editor && (
        <TransactionEditor
          key={editor.id || "new"}
          transaction={editor}
          accounts={data?.accounts || []}
          budgets={data?.budgets || []}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={(payload) =>
            action(
              `/api/transactions/${editor.id || ""}`,
              editor.id ? "PUT" : "POST",
              payload,
            )
          }
        />
      )}
      <div className={s.tableWrap}>
        <table className={`${s.table} ${s.historyTable}`}>
          <caption>{t("history")}</caption>
          <thead>
            <tr>
              <th>{t("transaction")}</th>
              <th>{t("date")}</th>
              <th>{t("accounts")}</th>
              <th>{t("status")}</th>
              <th className={s.number}>{t("amount")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data?.transactions.slice(0, PAGE_SIZE).map((tx) => {
              const account = data.accounts.find(
                (a) =>
                  a.id ===
                  (tx.type === "income"
                    ? tx.to_account_id
                    : tx.from_account_id),
              );
              return (
                <tr key={tx.id}>
                  <td>
                    {tx.description}
                    <small>
                      {tx.category || t("uncategorised")} · {t(tx.type)}
                      {tx.is_skipped ? ` · ${t("skipped")}` : ""}
                    </small>
                  </td>
                  <td>{date(tx.date_operation)}</td>
                  <td>
                    {accountName(tx.from_account_id)}
                    {tx.to_account_id
                      ? ` → ${accountName(tx.to_account_id)}`
                      : ""}
                  </td>
                  <td>
                    <Badge
                      label={t(
                        tx.reconciliation_date ? "reconciled" : "pending",
                      )}
                      variant={tx.reconciliation_date ? "success" : "neutral"}
                    />
                  </td>
                  <td className={s.number}>
                    {tx.type === "income"
                      ? "+ "
                      : tx.type.startsWith("expense")
                        ? "− "
                        : ""}
                    {money(
                      Math.abs(tx.amount),
                      account?.currency || resource.profile?.currency || "EUR",
                    )}
                  </td>
                  <td>
                    <div className={s.rowActions}>
                      <Button
                        label={t("edit")}
                        variant="secondary"
                        isDisabled={busy}
                        onClick={() => {
                          setEditor(tx);
                          setError(false);
                        }}
                      />
                      <Button
                        label={t(
                          tx.reconciliation_date ? "unreconcile" : "reconcile",
                        )}
                        variant="secondary"
                        isDisabled={busy}
                        onClick={() =>
                          action(`/api/transactions/${tx.id}`, "PUT", {
                            reconciliation_date: tx.reconciliation_date
                              ? null
                              : localDate(),
                          })
                        }
                      />
                      <Button
                        label={t("delete")}
                        variant="secondary"
                        isDisabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `${t("confirm_delete_transaction")} ${tx.description}`,
                            )
                          )
                            action(`/api/transactions/${tx.id}`, "DELETE");
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data?.transactions.length && (
          <p className={s.empty}>{t("no_transactions")}</p>
        )}
      </div>
      <div className={s.pagination}>
        <Button
          label={t("previous")}
          variant="secondary"
          isDisabled={offset === 0 || busy}
          onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
        />
        <span>
          {t("page")} {offset / PAGE_SIZE + 1}
        </span>
        <Button
          label={t("next")}
          variant="secondary"
          isDisabled={!data || data.transactions.length <= PAGE_SIZE || busy}
          onClick={() => setOffset((value) => value + PAGE_SIZE)}
        />
      </div>
    </Page>
  );
}

function TransactionEditor({
  transaction,
  accounts,
  budgets,
  busy,
  onClose,
  onSave,
}) {
  const { t } = useLanguage();
  const [type, setType] = useState(transaction.type || "expense_var");
  const [from, setFrom] = useState(String(transaction.from_account_id || ""));
  const [to, setTo] = useState(String(transaction.to_account_id || ""));
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (from && to && from === to) return;
    const payload = {
      description: form.get("description").trim(),
      amount: Number(form.get("amount")),
      type,
      category: form.get("category").trim() || null,
      date_operation: form.get("date"),
      from_account_id: from ? Number(from) : null,
      to_account_id: to ? Number(to) : null,
      budget_id: form.get("budget") ? Number(form.get("budget")) : null,
      reconciliation_date: form.get("reconciliation") || null,
      is_skipped: form.has("skipped"),
    };
    if (!transaction.id) payload.date_saisie = localDate();
    onSave(payload);
  }
  const options = (
    <>
      <option value="">{t("none")}</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </>
  );
  return (
    <Editor
      title={t(transaction.id ? "edit_transaction" : "new_transaction")}
      onClose={onClose}
    >
      <form className={s.form} onSubmit={submit}>
        <Field label={t("description")}>
          <input
            name="description"
            required
            pattern=".*\S.*"
            defaultValue={transaction.description || ""}
          />
        </Field>
        <Field label={t("amount")}>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={transaction.id ? transaction.amount : ""}
          />
        </Field>
        <Field label={t("transaction_type")}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {transactionTypes.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("date")}>
          <input
            name="date"
            type="date"
            min="1900-01-01"
            max="2200-12-31"
            required
            defaultValue={transaction.date_operation || localDate()}
          />
        </Field>
        <Field label={t("from_account")}>
          <select
            value={from}
            required={type.startsWith("expense") || type === "transfer"}
            onChange={(e) => setFrom(e.target.value)}
          >
            {options}
          </select>
        </Field>
        <Field label={t("to_account")}>
          <select
            value={to}
            required={type === "income" || type === "transfer"}
            onChange={(e) => setTo(e.target.value)}
          >
            {options}
          </select>
        </Field>
        <Field label={t("category")}>
          <input name="category" defaultValue={transaction.category || ""} />
        </Field>
        <Field label={t("assigned_budget")}>
          <select name="budget" defaultValue={transaction.budget_id || ""}>
            <option value="">{t("none")}</option>
            {budgets
              .filter(
                (b) =>
                  b.is_project ||
                  b.envelope_type === "savings" ||
                  b.id === transaction.budget_id,
              )
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label={t("reconciliation_date")}>
          <input
            name="reconciliation"
            type="date"
            defaultValue={transaction.reconciliation_date || ""}
          />
        </Field>
        <label className={s.check}>
          <input
            type="checkbox"
            name="skipped"
            defaultChecked={transaction.is_skipped}
          />
          {t("skipped")}
        </label>
        {from && from === to && (
          <p className={s.error} role="alert">
            {t("different_accounts")}
          </p>
        )}
        <div className={s.actions}>
          <Button
            label={t("save")}
            variant="primary"
            type="submit"
            isLoading={busy}
          />
          <a href={legacyUrl("all_operations")} className={s.note}>
            {t("advanced_transaction_tools")}
          </a>
        </div>
      </form>
    </Editor>
  );
}
