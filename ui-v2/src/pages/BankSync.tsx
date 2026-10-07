import type { BankConnection } from "../lib/server/workspaces";
import type { Account } from "../lib/server/models";
import type {
  VaultStatus,
  BankPending,
  BankChallenge,
  RemoteAccount,
  BankBackend,
  PendingRow,
} from "../lib/server/workflow-models";
import React, { useState, useRef, useEffect } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Page, Editor, Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useServerQueries, accounts } from "../lib/server/queries";
import { resource } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
import { readEventStream } from "../lib/stream";
import { mutate } from "../lib/http";
import { BankTools } from "./BankTools";
export function BankSync() {
  const r = useServerQueries((id) => ({
    items: resource<BankConnection[]>(
      "bank-sync",
      id,
      "connections",
      "/api/bank-sync/connections",
    ),
    vault: resource<VaultStatus>(
      "bank-sync",
      id,
      "vault",
      "/api/bank-sync/vault/status",
    ),
    pending: resource<BankPending>(
      "bank-sync",
      id,
      "pending",
      "/api/bank-sync/pending",
    ),
    accounts: accounts.list(id),
    transactions: resource<import("../lib/server/models").Transaction[]>(
      "transactions",
      id,
      "link-candidates",
      "/api/transactions/?limit=100000",
    ),
  }));
  const a = useRecordActions<
    BankConnection & { unlocking: boolean; master_password: string }
  >("bank-sync", r.profile?.id);
  const { t, money } = useLanguage();
  const [editPending, setEditPending] = useState<
    (PendingRow & { connection_id: number; account_id: number }) | null
  >(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [linkRow, setLinkRow] = useState<{
    csv_id: string;
    amount: number;
    date_operation: string;
    description: string;
    is_coming?: boolean;
  } | null>(null);
  const [since, setSince] = useState(90);
  const [adding, setAdding] = useState(false);
  const [session, setSession] = useState<{
    connection: BankConnection;
    mode: "test" | "sync";
  } | null>(null);
  const refreshMatching = useMutation({
    mutationFn: async () => {
      const preview = await mutate<BankPending>(
        "/api/bank-sync/re-evaluate-preview",
        "POST",
        { accounts: r.data?.pending.accounts || [] },
      );
      const connections = [
        ...new Set(preview.accounts.map((row) => row.connection_id)),
      ];
      for (const connection_id of connections)
        await mutate("/api/bank-sync/update-pending", "POST", {
          connection_id,
          accounts: preview.accounts.filter(
            (row) => row.connection_id === connection_id,
          ),
        });
    },
    onSuccess: () => r.refresh(),
  });
  const pending = (r.data?.pending?.accounts || []).flatMap((account) =>
    (account.transactions || [])
      .map((row, index) => ({
        ...row,
        id: `${account.connection_id}-${account.account_id}-${row.csv_id || index}`,
        account_id: account.account_id,
        connection_id: account.connection_id,
        account_name: account.label || account.name,
      }))
      .filter(
        (row) => !row.already_reconciled && (showExcluded || !row._excluded),
      ),
  );
  return (
    <Page
      title="bank_sync"
      subtitle="bank_sync_body"
      resource={r}
      actions={
        <Button label={t("new_connection")} onClick={() => setAdding(true)} />
      }
    >
      <VStack gap={4}>
        <BankTools profileId={r.profile?.id} />
        <Button
          label={t("refresh_matching")}
          isLoading={refreshMatching.isPending}
          isDisabled={!r.data?.pending.accounts.length}
          onClick={() => refreshMatching.mutate()}
        />
        {refreshMatching.isError && <p role="alert">{t("connection_error")}</p>}
        <Field label={t("since_days")}>
          <input
            type="number"
            min={1}
            max={3650}
            value={since}
            onChange={(e) => setSince(Number(e.target.value))}
            {...stylex.props(s.fieldInput)}
          />
        </Field>
        <label>
          <input
            type="checkbox"
            checked={showExcluded}
            onChange={(e) => setShowExcluded(e.target.checked)}
          />
          {t("show_excluded")}
        </label>
        <p>
          {t(r.data?.vault.is_unlocked ? "vault_unlocked" : "vault_locked")}
        </p>
        <Button
          label={t(r.data?.vault.is_unlocked ? "lock_vault" : "unlock_vault")}
          variant="secondary"
          onClick={() =>
            r.data?.vault.is_unlocked
              ? a.save({ path: "/api/bank-sync/vault/lock", body: {} })
              : a.edit({ unlocking: true, master_password: "" })
          }
        />
        <Records
          title="bank_connections"
          rows={r.data?.items || []}
          columns={[
            { key: "label", label: "name" },
            { key: "backend", label: "bank" },
            { key: "last_sync_status", label: "status" },
            { key: "last_error", label: "error" },
          ]}
          actions={(row) => (
            <>
              <ActionButton
                label={t("edit")}
                icon="edit"
                onClick={() => a.edit(row)}
              />
              <ActionButton
                label={t("map_accounts")}
                icon="wallet"
                isDisabled={!r.data?.vault.is_unlocked}
                onClick={() => setSession({ connection: row, mode: "test" })}
              />
              <ActionButton
                label={t("synchronize")}
                icon="refresh"
                isDisabled={a.mutation.isPending || !r.data?.vault.is_unlocked}
                onClick={() => setSession({ connection: row, mode: "sync" })}
              />
              <ActionButton
                label={t("delete")}
                icon="delete"
                onClick={() =>
                  a.confirm({
                    path: `/api/bank-sync/connections/${row.id}`,
                    method: "DELETE",
                  })
                }
              />
            </>
          )}
        />
        <h2>{t("pending_review")}</h2>
        <p>{t("sync_review_help")}</p>
        <Records
          title="pending_review"
          rows={pending}
          columns={[
            { key: "description" },
            { key: "account_name", label: "account" },
            { key: "date_operation", label: "date" },
            {
              key: "amount",
              render: (row) => money(row.amount, r.profile?.currency),
            },
            { key: "category" },
            { key: "status" },
          ]}
          actions={(row) => (
            <>
              <Button
                label={t("edit")}
                onClick={() => setEditPending(row)}
                variant="secondary"
              />
              <Button
                label={t("link_existing")}
                onClick={() => setLinkRow(row)}
                variant="secondary"
              />
              {row._excluded && (
                <Button
                  label={t("restore")}
                  onClick={() =>
                    a.save({
                      path: `/api/bank-sync/restore-ghost/${encodeURIComponent(row.csv_id)}`,
                      body: {},
                    })
                  }
                />
              )}
              <ActionButton
                label={t("accept")}
                icon="check"
                isDisabled={row.is_coming || !row.account_id}
                onClick={() =>
                  a.confirm(
                    {
                      path:
                        row.is_reconciled && row.matched_db_id
                          ? `/api/bank-sync/reconcile-fast/${row.matched_db_id}`
                          : "/api/bank-sync/commit-ghost",
                      body: {
                        connection_id: row.connection_id,
                        transaction: { ...row, account_id: row.account_id },
                      },
                    },
                    t("accept"),
                    t("commit_import_warning"),
                  )
                }
              />
              <ActionButton
                label={t("dismiss")}
                icon="close"
                onClick={() =>
                  a.confirm(
                    {
                      path: `/api/bank-sync/dismiss-ghost/${encodeURIComponent(row.csv_id)}`,
                      body: {},
                    },
                    t("dismiss"),
                  )
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
          title={t(a.editor?.unlocking ? "unlock_vault" : "edit")}
          fields={
            a.editor?.unlocking
              ? [{ name: "master_password", type: "password", required: true }]
              : [
                  { name: "label", label: "name", required: true },
                  { name: "is_active", type: "checkbox" },
                ]
          }
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.save({
              path: a.editor?.unlocking
                ? "/api/bank-sync/vault/unlock"
                : `/api/bank-sync/connections/${a.editor?.id}`,
              method: a.editor?.unlocking ? "POST" : "PUT",
              body,
            })
          }
        />
      )}
      {adding && (
        <NewConnection
          profileId={r.profile?.id}
          onClose={() => setAdding(false)}
        />
      )}
      {editPending && (
        <RecordEditor
          title={t("edit_transaction")}
          initial={editPending}
          fields={[
            { name: "description", required: true },
            {
              name: "date_operation",
              label: "date",
              type: "date",
              required: true,
            },
            { name: "amount", type: "number", required: true },
            { name: "category" },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setEditPending(null)}
          onSave={async (body) => {
            const accountRows = (r.data?.pending.accounts || [])
              .filter((row) => row.connection_id === editPending.connection_id)
              .map((account) => ({
                ...account,
                transactions: account.transactions.map((row) =>
                  row.csv_id === editPending.csv_id ? { ...row, ...body } : row,
                ),
              }));
            const result = await a.save({
              path: "/api/bank-sync/update-pending",
              body: {
                connection_id: editPending.connection_id,
                accounts: accountRows,
              },
            });
            if (result) setEditPending(null);
          }}
        />
      )}
      {linkRow && (
        <RecordEditor
          title={t("link_existing")}
          initial={{
            target_tx_id: "",
            description: linkRow.description,
            amount: linkRow.amount,
            date_operation: linkRow.date_operation,
          }}
          fields={[
            {
              name: "target_tx_id",
              label: "transaction",
              required: true,
              options: (r.data?.transactions || []).map((row) => ({
                value: row.id,
                label: `${row.date_operation} · ${row.description} · ${money(row.amount)}`,
              })),
            },
            { name: "description" },
            { name: "amount", type: "number" },
            { name: "date_operation", label: "date", type: "date" },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setLinkRow(null)}
          onSave={async (body) => {
            const result = await a.save({
              path: "/api/bank-sync/link-ghost",
              body: {
                ...linkRow,
                ...body,
                target_tx_id: Number(body.target_tx_id),
              },
            });
            if (result) setLinkRow(null);
          }}
        />
      )}
      <Confirmation {...a.confirmation} />
      {session && r.data && r.profile && (
        <BankSession
          since={since}
          connection={session.connection}
          mode={session.mode}
          vault={r.data.vault}
          accounts={r.data.accounts}
          profileId={r.profile.id}
          onClose={() => setSession(null)}
        />
      )}
    </Page>
  );
}
function BankSession({
  since,
  connection,
  mode,
  vault,
  accounts,
  profileId,
  onClose,
}: {
  since: number;
  connection: BankConnection;
  mode: "test" | "sync";
  vault: VaultStatus;
  accounts: Account[];
  profileId: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const a = useRecordActions<
    BankConnection & { unlocking: boolean; master_password: string }
  >("bank-sync", profileId);
  const [challenge, setChallenge] = useState<BankChallenge | null>(null);
  const [progress, setProgress] = useState("");
  const [remote, setRemote] = useState<RemoteAccount[] | null>(null);
  const controller = useRef<AbortController | null>(null);
  const client = useQueryClient();
  const stream = useMutation({
    mutationKey: ["bank-sync", profileId, connection.id, mode],
    mutationFn: async () => {
      controller.current = new AbortController();
      await readEventStream(
        `/api/bank-sync/connections/${connection.id}/${mode}-stream?${new URLSearchParams({ vault_token: vault.vault_token || "", since_days: String(since) })}`,
        undefined,
        controller.current.signal,
        (data, type) => {
          if (type === "progress") setProgress(data.message || data.step || "");
          if (
            type === "2fa_required" &&
            data.session_id &&
            data.type &&
            data.message
          )
            setChallenge({
              session_id: data.session_id,
              type: data.type,
              message: data.message,
            });
          if ((type === "done" || type === "accounts") && data.accounts)
            setRemote(data.accounts);
          if (type === "preview_ready") setProgress(t("import_prepared"));
        },
      );
    },
    onSettled: () =>
      client.invalidateQueries({ queryKey: ["bank-sync", profileId] }),
  });
  useEffect(() => {
    stream.mutate();
    return () => controller.current?.abort();
  }, []);
  const respond = useMutation({
    mutationKey: ["bank-sync", profileId, "2fa"],
    mutationFn: (body: Record<string, unknown>) =>
      mutate("/api/bank-sync/2fa/respond", "POST", body),
    onSuccess: () => setChallenge(null),
  });
  async function close() {
    if (challenge)
      try {
        await mutate("/api/bank-sync/2fa/respond", "POST", {
          session_id: challenge.session_id,
          response_type: "cancel",
        });
      } catch {}
    controller.current?.abort();
    onClose();
  }
  let mapping: Record<string, number> = {};
  try {
    mapping = JSON.parse(connection.account_mapping || "{}");
  } catch {}
  return (
    <Editor
      title={`${t(mode === "test" ? "map_accounts" : "synchronize")} · ${connection.label}`}
      onClose={close}
    >
      <VStack gap={4}>
        {stream.isPending && <p role="status">{progress || t("loading")}</p>}
        {stream.isError && <p role="alert">{t("sync_error")}</p>}
        {stream.isSuccess && mode === "sync" && <p>{t("import_prepared")}</p>}
        {challenge && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              respond.mutate({
                session_id: challenge.session_id,
                response_type:
                  challenge.type === "app" ? "app_validated" : "otp_code",
                value: form.get("otp") || null,
              });
            }}
          >
            <VStack gap={4}>
              <p>{challenge.message}</p>
              {challenge.type !== "app" && (
                <Field label={t("otp_code")}>
                  <input
                    name="otp"
                    required
                    autoComplete="one-time-code"
                    {...stylex.props(s.fieldInput)}
                  />
                </Field>
              )}
              {respond.isError && <p role="alert">{t("save_error")}</p>}
              <Button
                type="submit"
                label={t("confirm")}
                isLoading={respond.isPending}
              />
            </VStack>
          </form>
        )}
        {remote && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              const account_mapping = Object.fromEntries(
                remote
                  .filter((row) => values.get(row.id))
                  .map((row) => [row.id, Number(values.get(row.id))]),
              );
              const result = await a.save({
                path: `/api/bank-sync/connections/${connection.id}`,
                method: "PUT",
                body: { account_mapping },
              });
              if (result) onClose();
            }}
          >
            <VStack gap={4}>
              {remote.map((row) => (
                <Field key={row.id} label={row.label}>
                  <select
                    name={row.id}
                    defaultValue={mapping[row.id] || ""}
                    {...stylex.props(s.fieldSelect)}
                  >
                    <option value="">{t("none")}</option>
                    {accounts
                      .filter((account) => !account.is_closed)
                      .map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                  </select>
                </Field>
              ))}
              {a.mutation.isError && <p role="alert">{t("save_error")}</p>}
              <Button
                type="submit"
                label={t("save")}
                isLoading={a.mutation.isPending}
              />
            </VStack>
          </form>
        )}
      </VStack>
    </Editor>
  );
}
function NewConnection({
  profileId,
  onClose,
}: {
  profileId?: string;
  onClose: () => void;
}) {
  const r = useServerQueries((id) => ({
    items: resource<BankBackend[]>(
      "bank-sync",
      id,
      "backends",
      "/api/bank-sync/backends",
    ),
  }));
  const a = useRecordActions<
    BankConnection & { unlocking: boolean; master_password: string }
  >("bank-sync", profileId);
  const { t } = useLanguage();
  const [backend, setBackend] = useState("");
  const selected = r.data?.items.find((row) => row.name === backend);
  return (
    <Editor
      title={t("new_connection")}
      onClose={onClose}
      busy={a.mutation.isPending}
      error={a.mutation.isError}
    >
      <VStack gap={4}>
        <p>{t("bank_credentials_help")}</p>
        {r.error && <p role="alert">{t("bank_provider_error")}</p>}
        <Field label={t("bank")}>
          <select
            value={backend}
            onChange={(e) => setBackend(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="">{t("select_bank")}</option>
            {r.data?.items.map((row) => (
              <option key={row.name} value={row.name}>
                {row.description || row.name}
              </option>
            ))}
          </select>
        </Field>
        {selected && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const credentials = Object.fromEntries(
                selected.fields.map((field) => [
                  field.id,
                  form.get(`credential_${field.id}`),
                ]),
              );
              const result = await a.save({
                path: "/api/bank-sync/connections",
                body: {
                  backend,
                  label: form.get("label"),
                  master_password: form.get("master_password"),
                  credentials,
                },
              });
              if (result) onClose();
            }}
          >
            <VStack gap={4}>
              <Field label={t("name")}>
                <input
                  name="label"
                  required
                  defaultValue={selected.description}
                  {...stylex.props(s.fieldInput)}
                />
              </Field>
              <Field label={t("master_password")}>
                <input
                  name="master_password"
                  type="password"
                  required
                  autoComplete="off"
                  {...stylex.props(s.fieldInput)}
                />
              </Field>
              {selected.fields.map((field) => (
                <Field key={field.id} label={field.label}>
                  {field.choices ? (
                    <select
                      name={`credential_${field.id}`}
                      required={field.required}
                      {...stylex.props(s.fieldSelect)}
                    >
                      {Object.entries(field.choices).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={`credential_${field.id}`}
                      type={
                        field.type === "password"
                          ? "password"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      required={field.required}
                      autoComplete="off"
                      {...stylex.props(s.fieldInput)}
                    />
                  )}
                </Field>
              ))}
              <Button
                type="submit"
                label={t("save")}
                isLoading={a.mutation.isPending}
              />
            </VStack>
          </form>
        )}
      </VStack>
    </Editor>
  );
}
