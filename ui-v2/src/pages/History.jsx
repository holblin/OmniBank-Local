import { ActionButton } from "../components/ActionButton";
import { Confirmation } from "../components/Confirmation";
import { TableRow, TableCell, TableHeaderCell } from "@astryxdesign/core/Table";
import { VirtualTable } from "../components/VirtualTable";
import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import { useSearch } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import React, { useState, useRef } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Page, Field, Editor } from "../components/Page";
import { localDate, legacyUrl } from "../lib/navigation";
import { useHistory, useWrite } from "../lib/server/queries";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex.js";
export const transactionTypes = [
  "income",
  "expense_var",
  "expense_fixed",
  "transfer",
  "neutral",
];
const PAGE_SIZE = 40;
export function History() {
  const pagination = useRef(null);
  const { compact } = useAppTheme();
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
  const search = useSearch({
    strict: false,
  });
  const [pending, setPending] = useState(null);
  const [editor, setEditor] = useState(search.new ? {} : null);
  const [error, setError] = useState(false);
  function filter(key, value) {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
    setOffset(0);
  }
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value),
  );
  query.set("skip", offset);
  query.set("limit", PAGE_SIZE + 1);
  const resource = useHistory(Object.fromEntries(query));
  const mutation = useWrite("transactions", resource.profile?.id);
  const busy = mutation.isPending;
  async function action(path, method, body) {
    setError(false);
    try {
      await mutation.mutateAsync({ path, method, body });
      setPending(null);
      setEditor(null);
    } catch {
      setError(true);
    }
  }
  const data = resource.data;
  const accountName = (id) =>
    data.accounts.find((a) => a.id === id)?.name || "—";
  return (
    <>
      <Confirmation
        pending={pending}
        busy={busy}
        error={error}
        onClose={() => {
          setPending(null);
          setError(false);
        }}
        onConfirm={() => action(pending.path, pending.method, pending.body)}
      />
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
          onSubmit={(event) => {
            event.preventDefault();
            filter("search", draftSearch);
          }}
          {...stylex.props(s.filters, compact && s.compactFilters)}
        >
          <Field label={t("search")} xstyle={[s.field, s.filtersChild]}>
            <input
              type="search"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder={t("search_placeholder")}
              {...stylex.props(s.fieldInput)}
            />
          </Field>
          <Button
            type="submit"
            label={t("search")}
            variant="secondary"
            xstyle={[s.filtersChild]}
          />
          <Field label={t("select_account")} xstyle={[s.field, s.filtersChild]}>
            <select
              value={filters.account_id}
              onChange={(e) => filter("account_id", e.target.value)}
              {...stylex.props(s.fieldSelect)}
            >
              <option value="">{t("all_accounts")}</option>
              {data?.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("date_start")} xstyle={[s.field, s.filtersChild]}>
            <input
              type="date"
              value={filters.date_start}
              max={filters.date_end || undefined}
              onChange={(e) => filter("date_start", e.target.value)}
              {...stylex.props(s.fieldInput)}
            />
          </Field>
          <Field label={t("date_end")} xstyle={[s.field, s.filtersChild]}>
            <input
              type="date"
              value={filters.date_end}
              min={filters.date_start || undefined}
              onChange={(e) => filter("date_end", e.target.value)}
              {...stylex.props(s.fieldInput)}
            />
          </Field>
          <Field
            label={t("transaction_type")}
            xstyle={[s.field, s.filtersChild]}
          >
            <select
              value={filters.transaction_type}
              onChange={(e) => filter("transaction_type", e.target.value)}
              {...stylex.props(s.fieldSelect)}
            >
              <option value="">{t("all_types")}</option>
              {transactionTypes.map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("status")} xstyle={[s.field, s.filtersChild]}>
            <select
              value={filters.reconciled}
              onChange={(e) => filter("reconciled", e.target.value)}
              {...stylex.props(s.fieldSelect)}
            >
              {["all", "reconciled", "unreconciled"].map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </Field>
        </form>
        {error && !editor && !pending && (
          <p role="alert" {...stylex.props(s.error)}>
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
            error={error}
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
        <div {...stylex.props(s.tableWrap)}>
          <VirtualTable
            rows={data?.transactions.slice(0, PAGE_SIZE)}
            renderRow={(tx) => {
              const account = data.accounts.find(
                (a) =>
                  a.id ===
                  (tx.type === "income"
                    ? tx.to_account_id
                    : tx.from_account_id),
              );
              return (
                <TableRow key={tx.id}>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    {tx.description}
                    <small {...stylex.props(s.tableTdSmall)}>
                      {tx.category || t("uncategorised")} · {t(tx.type)}
                      {tx.is_skipped ? ` · ${t("skipped")}` : ""}
                    </small>
                  </TableCell>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    {date(tx.date_operation)}
                  </TableCell>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    {accountName(tx.from_account_id)}
                    {tx.to_account_id
                      ? ` → ${accountName(tx.to_account_id)}`
                      : ""}
                  </TableCell>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    <Badge
                      label={t(
                        tx.reconciliation_date ? "reconciled" : "pending",
                      )}
                      variant={tx.reconciliation_date ? "success" : "neutral"}
                    />
                  </TableCell>
                  <TableCell
                    xstyle={[
                      s.tableTd,
                      compact && s.compactTableTd,
                      s.tableNumber,
                    ]}
                  >
                    {tx.type === "income"
                      ? "+ "
                      : tx.type.startsWith("expense")
                        ? "− "
                        : ""}
                    {money(
                      Math.abs(tx.amount),
                      account?.currency || resource.profile?.currency || "EUR",
                    )}
                  </TableCell>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    <div {...stylex.props(s.rowActions)}>
                      <ActionButton
                        icon="edit"
                        label={t("edit")}
                        isDisabled={busy}
                        onClick={() => {
                          setEditor(tx);
                          setError(false);
                        }}
                      />
                      <ActionButton
                        icon="duplicate"
                        label={t("duplicate")}
                        isDisabled={busy}
                        onClick={() => {
                          setError(false);
                          setEditor({
                            ...tx,
                            id: undefined,
                            reconciliation_date: null,
                          });
                        }}
                      />
                      <ActionButton
                        icon={tx.reconciliation_date ? "close" : "check"}
                        label={t(
                          tx.reconciliation_date ? "unreconcile" : "reconcile",
                        )}
                        isDisabled={busy}
                        onClick={() =>
                          action(`/api/transactions/${tx.id}`, "PUT", {
                            reconciliation_date: tx.reconciliation_date
                              ? null
                              : localDate(),
                          })
                        }
                      />
                      <ActionButton
                        icon="delete"
                        label={t("delete")}
                        isDisabled={busy}
                        onClick={() => {
                          setError(false);
                          setPending({
                            path: `/api/transactions/${tx.id}`,
                            method: "DELETE",
                            description: `${t("confirm_delete_transaction")} ${tx.description}`,
                          });
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            }}
            header={
              <>
                <TableRow isHeaderRow>
                  <TableHeaderCell
                    xstyle={[s.tableTh, compact && s.compactTableTh]}
                    scope="col"
                  >
                    {t("transaction")}
                  </TableHeaderCell>
                  <TableHeaderCell
                    xstyle={[s.tableTh, compact && s.compactTableTh]}
                    scope="col"
                  >
                    {t("date")}
                  </TableHeaderCell>
                  <TableHeaderCell
                    xstyle={[s.tableTh, compact && s.compactTableTh]}
                    scope="col"
                  >
                    {t("accounts")}
                  </TableHeaderCell>
                  <TableHeaderCell
                    xstyle={[s.tableTh, compact && s.compactTableTh]}
                    scope="col"
                  >
                    {t("status")}
                  </TableHeaderCell>
                  <TableHeaderCell
                    xstyle={[
                      s.tableTh,
                      compact && s.compactTableTh,
                      s.tableNumber,
                    ]}
                    scope="col"
                  >
                    {t("amount")}
                  </TableHeaderCell>
                  <TableHeaderCell
                    xstyle={[s.tableTh, compact && s.compactTableTh]}
                    scope="col"
                  >
                    {t("actions")}
                  </TableHeaderCell>
                </TableRow>
              </>
            }
            columnCount={6}
            columnWidths={["26%", "10%", "14%", "14%", "12%", "24%"]}
            xstyle={[s.table, s.historyTable]}
            caption={
              <caption {...stylex.props(s.tableCaption)}>
                {t("history")}
              </caption>
            }
            estimateSize={72}
            resetKey={query.toString()}
            rowOffset={offset}
            unknownTotal
            fillViewport
            bottomRef={pagination}
            emptyState={
              !data?.transactions.length && (
                <p {...stylex.props(s.empty)}>{t("no_transactions")}</p>
              )
            }
          />
        </div>
        <div ref={pagination} {...stylex.props(s.pagination)}>
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
    </>
  );
}
function TransactionEditor({
  transaction,
  accounts,
  budgets,
  busy,
  error,
  onClose,
  onSave,
}) {
  const { t } = useLanguage();
  const [type, setType] = useState(transaction.type || "expense_var");
  const [from, setFrom] = useState(String(transaction.from_account_id || ""));
  const [to, setTo] = useState(String(transaction.to_account_id || ""));
  const [attachments, setAttachments] = useState(
    (transaction.attachments || "").split(",").filter(Boolean),
  );
  const [removeAttachment, setRemoveAttachment] = useState(null);
  const upload = useMutation({
    mutationKey: ["transactions", transaction.id, "attachment"],
    mutationFn: async (file) => {
      const data = new FormData();
      data.set("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Téléversement impossible");
      return response.json();
    },
    onSuccess: (data) => setAttachments((paths) => [...paths, data.path]),
  });
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
      attachments: attachments.join(",") || null,
      check_slip_number: form.get("check_slip_number") || null,
      recurrence_id: form.get("recurrence_id")
        ? Number(form.get("recurrence_id"))
        : null,
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
      busy={busy}
      error={error}
    >
      <form onSubmit={submit} {...stylex.props(s.form)}>
        <Field label={t("description")} xstyle={[s.field]}>
          <input
            name="description"
            required
            pattern=".*\S.*"
            defaultValue={transaction.description || ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("amount")} xstyle={[s.field]}>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={transaction.amount ?? ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("transaction_type")} xstyle={[s.field]}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {transactionTypes.map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("date")} xstyle={[s.field]}>
          <input
            name="date"
            type="date"
            min="1900-01-01"
            max="2200-12-31"
            required
            defaultValue={transaction.date_operation || localDate()}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("from_account")} xstyle={[s.field]}>
          <select
            value={from}
            required={type.startsWith("expense") || type === "transfer"}
            onChange={(e) => setFrom(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {options}
          </select>
        </Field>
        <Field label={t("to_account")} xstyle={[s.field]}>
          <select
            value={to}
            required={type === "income" || type === "transfer"}
            onChange={(e) => setTo(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {options}
          </select>
        </Field>
        <Field label={t("category")} xstyle={[s.field]}>
          <input
            name="category"
            defaultValue={transaction.category || ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("assigned_budget")} xstyle={[s.field]}>
          <select
            name="budget"
            defaultValue={transaction.budget_id || ""}
            {...stylex.props(s.fieldSelect)}
          >
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
        <Field label={t("reconciliation_date")} xstyle={[s.field]}>
          <input
            name="reconciliation"
            type="date"
            defaultValue={transaction.reconciliation_date || ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <label {...stylex.props(s.check)}>
          <input
            type="checkbox"
            name="skipped"
            defaultChecked={transaction.is_skipped}
          />
          {t("skipped")}
        </label>
        <Field label={t("recurrence_id")}>
          <input
            name="recurrence_id"
            type="number"
            min="1"
            step="1"
            defaultValue={transaction.recurrence_id || ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("check_slip_number")}>
          <input
            name="check_slip_number"
            defaultValue={transaction.check_slip_number || ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("attachments")}>
          <input
            type="file"
            disabled={upload.isPending || busy}
            onChange={(event) => {
              const file = event.target.files[0];
              if (file) upload.mutate(file);
              event.target.value = "";
            }}
          />
        </Field>
        {attachments.map((path) => (
          <span key={path}>
            {/^\/?uploads\//.test(path) ? (
              <a
                href={path.startsWith("/") ? path : `/${path}`}
                target="_blank"
                rel="noreferrer"
              >
                {path.split("/").pop()}
              </a>
            ) : (
              path.split("/").pop()
            )}
            <ActionButton
              label={t("remove_attachment")}
              icon="delete"
              onClick={() => setRemoveAttachment(path)}
            />
          </span>
        ))}
        {upload.isError && <p role="alert">{t("upload_error")}</p>}
        {from && from === to && (
          <p role="alert" {...stylex.props(s.formError, s.error)}>
            {t("different_accounts")}
          </p>
        )}
        <div {...stylex.props(s.actions, s.formActions)}>
          <Button
            label={t("save")}
            variant="primary"
            type="submit"
            isLoading={busy}
            isDisabled={upload.isPending}
            xstyle={[s.actionsButton]}
          />
          <Link to="/recurrences" {...stylex.props(s.note)}>
            {t("recurrences")}
          </Link>
        </div>
      </form>
      <Confirmation
        pending={
          removeAttachment
            ? {
                label: t("remove_attachment"),
                description: t("remove_attachment_warning"),
              }
            : null
        }
        onClose={() => setRemoveAttachment(null)}
        onConfirm={() => {
          setAttachments((paths) =>
            paths.filter((path) => path !== removeAttachment),
          );
          setRemoveAttachment(null);
        }}
      />
    </Editor>
  );
}
