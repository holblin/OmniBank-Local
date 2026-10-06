import { TableRow, TableCell, TableHeaderCell } from "@astryxdesign/core/Table";
import { VirtualTable } from "../components/VirtualTable";
import { useAppTheme } from "../lib/theme";
import * as stylex from "@stylexjs/stylex";
import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Page, Field, Editor } from "../components/Page";
import { get, mutate, localDate, legacyUrl } from "../lib/api";
import { useResource } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex.js";
export function Budgets() {
  const { compact } = useAppTheme();
  const { t, money } = useLanguage();
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [filter, setFilter] = useState("active");
  const [editor, setEditor] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const resource = useResource(async (signal) => {
    const [budgets, status, accounts] = await Promise.all([
      get("/api/budgets/", signal),
      get(
        `/api/budgets/status?period_filter=all&year=${month.slice(0, 4)}&month=${Number(month.slice(5))}`,
        signal,
      ),
      get("/api/accounts/", signal),
    ]);
    return {
      budgets,
      status: status.budgets,
      accounts,
    };
  }, month);
  const currency = resource.profile?.currency || "EUR";
  async function action(path, method, body) {
    setBusy(true);
    setError(false);
    try {
      await mutate(path, method, body);
      setEditor(null);
      setDetail(null);
      resource.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  const data = resource.data;
  const visible =
    data?.budgets.filter((b) =>
      filter === "closed"
        ? b.is_closed
        : !b.is_closed &&
          (filter === "active" ||
            (filter === "savings"
              ? b.envelope_type === "savings"
              : filter === "project"
                ? b.is_project
                : b.envelope_type !== "savings" && !b.is_project)),
    ) || [];
  return (
    <Page
      title="budgets"
      subtitle="budgets_intro"
      resource={resource}
      actions={
        <Button
          label={t("new_budget")}
          variant="primary"
          onClick={() => {
            setEditor({});
            setDetail(null);
            setError(false);
          }}
        />
      }
    >
      <div {...stylex.props(s.filters, compact && s.compactFilters)}>
        <Field label={t("month")} xstyle={[s.field, s.filtersChild]}>
          <input
            type="month"
            required
            value={month}
            onChange={(e) => {
              if (e.target.value) {
                setMonth(e.target.value);
                setDetail(null);
              }
            }}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("show")} xstyle={[s.field, s.filtersChild]}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {["active", "spending", "savings", "project", "closed"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <a
          href={legacyUrl("budgets")}
          {...stylex.props(s.note, s.filtersChild)}
        >
          {t("advanced_budget_tools")}
        </a>
      </div>
      {error && (
        <p role="alert" {...stylex.props(s.error)}>
          {t("save_error")}
        </p>
      )}
      {editor && (
        <BudgetEditor
          key={editor.id || "new"}
          budget={editor}
          accounts={data?.accounts || []}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={(payload) =>
            action(
              `/api/budgets/${editor.id || ""}`,
              editor.id ? "PUT" : "POST",
              payload,
            )
          }
        />
      )}
      {detail && (
        <BudgetDetail
          budget={detail}
          month={month}
          currency={currency}
          onClose={() => setDetail(null)}
          onRefresh={resource.refresh}
        />
      )}
      {!visible.length ? (
        <div {...stylex.props(s.empty)}>{t("no_budgets")}</div>
      ) : (
        <div {...stylex.props(s.grid, compact && s.compactGrid)}>
          {visible.map((b) => {
            const status = data.status.find((value) => value.id === b.id);
            const savings = b.envelope_type === "savings";
            return (
              <article
                key={b.id}
                {...stylex.props(
                  s.card,
                  b.is_closed && s.closed,
                  compact && s.compactCard,
                )}
              >
                <h2 {...stylex.props(s.cardH2)}>{b.name}</h2>
                <p {...stylex.props(s.cardP)}>
                  {t(
                    savings
                      ? "savings"
                      : b.is_project
                        ? "project"
                        : b.period || "monthly",
                  )}
                  {b.is_locked ? ` · ${t("locked")}` : ""}
                </p>
                <strong {...stylex.props(s.cardStrong)}>
                  {money(
                    savings ? status?.balance || 0 : b.monthly_amount,
                    currency,
                  )}
                </strong>
                {status ? (
                  <>
                    <ProgressBar
                      label={b.name}
                      isLabelHidden
                      value={Math.max(0, Math.min(status.percent, 100))}
                      aria-label={b.name}
                    />
                    <dl {...stylex.props(s.cardDl)}>
                      <dt {...stylex.props(s.cardDt)}>
                        {t(savings ? "target_amount" : "spent")}
                      </dt>
                      <dd {...stylex.props(s.cardDd)}>
                        {money(
                          savings ? b.monthly_amount : status.spent,
                          currency,
                        )}
                      </dd>
                      <dt {...stylex.props(s.cardDt)}>{t("remaining")}</dt>
                      <dd {...stylex.props(s.cardDd)}>
                        {money(status.remaining, currency)}
                      </dd>
                    </dl>
                  </>
                ) : (
                  <p {...stylex.props(s.cardP)}>{t("closed")}</p>
                )}
                <p {...stylex.props(s.cardP)}>
                  {b.categories.join(" · ") || t("assigned_operations")}
                </p>
                <div {...stylex.props(s.actions, s.cardActions)}>
                  <Button
                    label={t("details")}
                    variant="secondary"
                    onClick={() => {
                      setDetail(b);
                      setEditor(null);
                    }}
                    xstyle={[s.actionsButton]}
                  />
                  <Button
                    label={t("edit")}
                    variant="secondary"
                    isDisabled={busy}
                    onClick={() => {
                      setEditor(b);
                      setDetail(null);
                      setError(false);
                    }}
                    xstyle={[s.actionsButton]}
                  />
                  <Button
                    label={t(b.is_closed ? "reopen" : "archive")}
                    variant="secondary"
                    isDisabled={busy}
                    onClick={() =>
                      action(`/api/budgets/${b.id}`, "PUT", {
                        is_closed: !b.is_closed,
                      })
                    }
                    xstyle={[s.actionsButton]}
                  />
                  <Button
                    label={t("delete")}
                    variant="secondary"
                    isDisabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          `${t("confirm_delete_budget")} ${b.name}`,
                        )
                      )
                        action(`/api/budgets/${b.id}`, "DELETE");
                    }}
                    xstyle={[s.actionsButton]}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Page>
  );
}
function BudgetEditor({ budget, accounts, busy, onClose, onSave }) {
  const { t } = useLanguage();
  const [kind, setKind] = useState(
    budget.envelope_type === "savings"
      ? "savings"
      : budget.is_project
        ? "project"
        : "spending",
  );
  const [period, setPeriod] = useState(budget.period || "monthly");
  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: form.get("name").trim(),
      monthly_amount: Number(form.get("amount")),
      period,
      is_project: kind === "project",
      envelope_type: kind === "savings" ? "savings" : "spending",
      categories:
        kind === "spending"
          ? form
              .get("categories")
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
      start_date: period === "custom" ? form.get("start") : null,
      end_date: period === "custom" ? form.get("end") : null,
      account_ids: form.getAll("accounts").map(Number),
      is_locked: form.has("locked"),
    });
  }
  return (
    <Editor
      title={t(budget.id ? "edit_budget" : "new_budget")}
      onClose={onClose}
    >
      <form onSubmit={submit} {...stylex.props(s.form)}>
        <Field label={t("name")} xstyle={[s.field]}>
          <input
            name="name"
            required
            pattern=".*\S.*"
            defaultValue={budget.name || ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("target_amount")} xstyle={[s.field]}>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={budget.monthly_amount ?? ""}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <Field label={t("envelope_type")} xstyle={[s.field]}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {["spending", "project", "savings"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("period")} xstyle={[s.field]}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            {["monthly", "yearly", "indefinite", "custom"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        {period === "custom" && (
          <>
            <Field label={t("date_start")} xstyle={[s.field]}>
              <input
                name="start"
                type="date"
                required
                defaultValue={budget.start_date || ""}
                {...stylex.props(s.fieldInput)}
              />
            </Field>
            <Field label={t("date_end")} xstyle={[s.field]}>
              <input
                name="end"
                type="date"
                required
                defaultValue={budget.end_date || ""}
                {...stylex.props(s.fieldInput)}
              />
            </Field>
          </>
        )}
        {kind === "spending" && (
          <Field label={t("categories_comma")} xstyle={[s.field]}>
            <input
              name="categories"
              defaultValue={budget.categories?.join(", ") || ""}
              {...stylex.props(s.fieldInput)}
            />
          </Field>
        )}
        <Field label={t("account_scope")} xstyle={[s.field]}>
          <select
            name="accounts"
            multiple
            defaultValue={budget.account_ids?.map(String) || []}
            {...stylex.props(s.fieldSelect)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <small>{t("all_accounts_if_empty")}</small>
        </Field>
        <label {...stylex.props(s.check)}>
          <input
            name="locked"
            type="checkbox"
            defaultChecked={budget.is_locked}
          />
          {t("locked")}
        </label>
        <div {...stylex.props(s.actions, s.formActions)}>
          <Button
            label={t("save")}
            variant="primary"
            type="submit"
            isLoading={busy}
            xstyle={[s.actionsButton]}
          />
        </div>
      </form>
    </Editor>
  );
}
function BudgetDetail({ budget, month, currency, onClose, onRefresh }) {
  const { compact } = useAppTheme();
  const { t, money, date } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const resource = useResource(async (signal) => {
    const [transactions, allocations] = await Promise.all([
      get(
        `/api/budgets/${budget.id}/transactions?year=${month.slice(0, 4)}&month=${Number(month.slice(5))}`,
        signal,
      ),
      get(`/api/budgets/${budget.id}/allocations`, signal),
    ]);
    return {
      transactions,
      allocations,
    };
  }, `${budget.id}:${month}`);
  async function removeAllocation(id) {
    if (!window.confirm(t("confirm_delete_allocation"))) return;
    setBusy(true);
    setError(false);
    try {
      await mutate(`/api/budgets/${budget.id}/allocations/${id}`, "DELETE");
      resource.refresh();
      onRefresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  async function allocation(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(false);
    try {
      await mutate(`/api/budgets/${budget.id}/allocations`, "POST", {
        amount: Number(form.get("amount")) * Number(form.get("direction")),
        date: form.get("date"),
        note: form.get("note"),
      });
      resource.refresh();
      onRefresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Editor title={`${t("details")} · ${budget.name}`} onClose={onClose}>
      {resource.loading ? (
        <p role="status">{t("loading")}</p>
      ) : resource.error ? (
        <p role="alert">
          {t("connection_error")}{" "}
          <Button label={t("retry")} onClick={resource.refresh} />
        </p>
      ) : (
        <>
          <div {...stylex.props(s.tableWrap)}>
            <VirtualTable
              rows={resource.data.transactions}
              renderRow={(tx) => (
                <TableRow key={tx.id}>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    {tx.description}
                  </TableCell>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    {date(tx.date)}
                  </TableCell>
                  <TableCell xstyle={[s.tableTd, compact && s.compactTableTd]}>
                    {money(tx.amount, currency)}
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
                      {t("amount")}
                    </TableHeaderCell>
                  </TableRow>
                </>
              }
              columnCount={3}
              xstyle={[s.table]}
              caption={
                <caption {...stylex.props(s.tableCaption)}>
                  {t("assigned_operations")}
                </caption>
              }
            />
            {!resource.data.transactions.length && (
              <p {...stylex.props(s.empty)}>{t("no_transactions")}</p>
            )}
          </div>
          {(budget.envelope_type === "savings" ||
            budget.period === "indefinite") && (
            <>
              <h3>{t("allocations")}</h3>
              <p {...stylex.props(s.note)}>{t("allocation_note")}</p>
              <form
                onSubmit={allocation}
                {...stylex.props(s.filters, compact && s.compactFilters)}
              >
                <Field label={t("amount")} xstyle={[s.field, s.filtersChild]}>
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    {...stylex.props(s.fieldInput)}
                  />
                </Field>
                <Field
                  label={t("direction")}
                  xstyle={[s.field, s.filtersChild]}
                >
                  <select name="direction" {...stylex.props(s.fieldSelect)}>
                    <option value="1">{t("deposit")}</option>
                    <option value="-1">{t("withdraw")}</option>
                  </select>
                </Field>
                <Field label={t("date")} xstyle={[s.field, s.filtersChild]}>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={localDate()}
                    {...stylex.props(s.fieldInput)}
                  />
                </Field>
                <Field label={t("note")} xstyle={[s.field, s.filtersChild]}>
                  <input name="note" {...stylex.props(s.fieldInput)} />
                </Field>
                <Button
                  label={t("save")}
                  variant="primary"
                  type="submit"
                  isLoading={busy}
                  xstyle={[s.filtersChild]}
                />
              </form>
              {error && <p role="alert">{t("save_error")}</p>}
              <ul>
                {resource.data.allocations.map((a) => (
                  <li key={a.id}>
                    {date(a.date)} · {money(a.amount, currency)} · {a.note}{" "}
                    <Button
                      label={t("delete_allocation")}
                      variant="secondary"
                      isDisabled={busy}
                      onClick={() => removeAllocation(a.id)}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Editor>
  );
}
