import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Page, Field, Editor } from "../components/Page";
import { get, mutate, localDate, legacyUrl } from "../lib/api";
import { useResource } from "../lib/useResource";
import { useLanguage } from "../lib/i18n";
import s from "../components/Pages.module.css";

export function Budgets() {
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
    return { budgets, status: status.budgets, accounts };
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
      <div className={s.filters}>
        <Field label={t("month")}>
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
          />
        </Field>
        <Field label={t("show")}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {["active", "spending", "savings", "project", "closed"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <a className={s.note} href={legacyUrl("budgets")}>
          {t("advanced_budget_tools")}
        </a>
      </div>
      {error && (
        <p className={s.error} role="alert">
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
        <div className={s.empty}>{t("no_budgets")}</div>
      ) : (
        <div className={s.grid}>
          {visible.map((b) => {
            const status = data.status.find((value) => value.id === b.id);
            const savings = b.envelope_type === "savings";
            return (
              <article
                key={b.id}
                className={`${s.card} ${b.is_closed ? s.closed : ""}`}
              >
                <h2>{b.name}</h2>
                <p>
                  {t(
                    savings
                      ? "savings"
                      : b.is_project
                        ? "project"
                        : b.period || "monthly",
                  )}
                  {b.is_locked ? ` · ${t("locked")}` : ""}
                </p>
                <strong>
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
                    <dl>
                      <dt>{t(savings ? "target_amount" : "spent")}</dt>
                      <dd>
                        {money(
                          savings ? b.monthly_amount : status.spent,
                          currency,
                        )}
                      </dd>
                      <dt>{t("remaining")}</dt>
                      <dd>{money(status.remaining, currency)}</dd>
                    </dl>
                  </>
                ) : (
                  <p>{t("closed")}</p>
                )}
                <p>{b.categories.join(" · ") || t("assigned_operations")}</p>
                <div className={s.actions}>
                  <Button
                    label={t("details")}
                    variant="secondary"
                    onClick={() => {
                      setDetail(b);
                      setEditor(null);
                    }}
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
      <form className={s.form} onSubmit={submit}>
        <Field label={t("name")}>
          <input
            name="name"
            required
            pattern=".*\S.*"
            defaultValue={budget.name || ""}
          />
        </Field>
        <Field label={t("target_amount")}>
          <input
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={budget.monthly_amount ?? ""}
          />
        </Field>
        <Field label={t("envelope_type")}>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["spending", "project", "savings"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("period")}>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {["monthly", "yearly", "indefinite", "custom"].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </Field>
        {period === "custom" && (
          <>
            <Field label={t("date_start")}>
              <input
                name="start"
                type="date"
                required
                defaultValue={budget.start_date || ""}
              />
            </Field>
            <Field label={t("date_end")}>
              <input
                name="end"
                type="date"
                required
                defaultValue={budget.end_date || ""}
              />
            </Field>
          </>
        )}
        {kind === "spending" && (
          <Field label={t("categories_comma")}>
            <input
              name="categories"
              defaultValue={budget.categories?.join(", ") || ""}
            />
          </Field>
        )}
        <Field label={t("account_scope")}>
          <select
            name="accounts"
            multiple
            defaultValue={budget.account_ids?.map(String) || []}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <small>{t("all_accounts_if_empty")}</small>
        </Field>
        <label className={s.check}>
          <input
            name="locked"
            type="checkbox"
            defaultChecked={budget.is_locked}
          />
          {t("locked")}
        </label>
        <div className={s.actions}>
          <Button
            label={t("save")}
            variant="primary"
            type="submit"
            isLoading={busy}
          />
        </div>
      </form>
    </Editor>
  );
}

function BudgetDetail({ budget, month, currency, onClose, onRefresh }) {
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
    return { transactions, allocations };
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
          <div className={s.tableWrap}>
            <table className={s.table}>
              <caption>{t("assigned_operations")}</caption>
              <thead>
                <tr>
                  <th>{t("transaction")}</th>
                  <th>{t("date")}</th>
                  <th>{t("amount")}</th>
                </tr>
              </thead>
              <tbody>
                {resource.data.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.description}</td>
                    <td>{date(tx.date)}</td>
                    <td>{money(tx.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!resource.data.transactions.length && (
              <p className={s.empty}>{t("no_transactions")}</p>
            )}
          </div>
          {(budget.envelope_type === "savings" ||
            budget.period === "indefinite") && (
            <>
              <h3>{t("allocations")}</h3>
              <p className={s.note}>{t("allocation_note")}</p>
              <form className={s.filters} onSubmit={allocation}>
                <Field label={t("amount")}>
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </Field>
                <Field label={t("direction")}>
                  <select name="direction">
                    <option value="1">{t("deposit")}</option>
                    <option value="-1">{t("withdraw")}</option>
                  </select>
                </Field>
                <Field label={t("date")}>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={localDate()}
                  />
                </Field>
                <Field label={t("note")}>
                  <input name="note" />
                </Field>
                <Button
                  label={t("save")}
                  variant="primary"
                  type="submit"
                  isLoading={busy}
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
