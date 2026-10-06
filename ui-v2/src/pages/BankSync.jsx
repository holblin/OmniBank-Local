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
export function BankSync() {
  const r = useServerQueries((id) => ({
    items: resource(
      "bank-sync",
      id,
      "connections",
      "/api/bank-sync/connections",
    ),
    vault: resource("bank-sync", id, "vault", "/api/bank-sync/vault/status"),
    pending: resource("bank-sync", id, "pending", "/api/bank-sync/pending"),
    accounts: accounts.list(id),
  }));
  const a = useRecordActions("bank-sync", r.profile?.id);
  const { t, money } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [session, setSession] = useState(null);
  const pending = (r.data?.pending?.accounts || []).flatMap((account) =>
    (account.transactions || [])
      .map((row, index) => ({
        ...row,
        id: `${account.connection_id}-${account.account_id}-${row.csv_id || index}`,
        account_id: account.account_id,
        connection_id: account.connection_id,
        account_name: account.label || account.name,
      }))
      .filter((row) => !row.already_reconciled && !row._excluded),
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
          title={t(a.editor.unlocking ? "unlock_vault" : "edit")}
          fields={
            a.editor.unlocking
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
              path: a.editor.unlocking
                ? "/api/bank-sync/vault/unlock"
                : `/api/bank-sync/connections/${a.editor.id}`,
              method: a.editor.unlocking ? "POST" : "PUT",
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
      <Confirmation {...a.confirmation} />
      {session && (
        <BankSession
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
  connection,
  mode,
  vault,
  accounts,
  profileId,
  onClose,
}) {
  const { t } = useLanguage();
  const a = useRecordActions("bank-sync", profileId);
  const [challenge, setChallenge] = useState(null);
  const [progress, setProgress] = useState("");
  const [remote, setRemote] = useState(null);
  const controller = useRef(null);
  const client = useQueryClient();
  const stream = useMutation({
    mutationKey: ["bank-sync", profileId, connection.id, mode],
    mutationFn: async () => {
      controller.current = new AbortController();
      await readEventStream(
        `/api/bank-sync/connections/${connection.id}/${mode}-stream?${new URLSearchParams({ vault_token: vault.vault_token || "", since_days: "90" })}`,
        undefined,
        controller.current.signal,
        (data, type) => {
          if (type === "progress") setProgress(data.message || data.step || "");
          if (type === "2fa_required") setChallenge(data);
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
    mutationFn: (body) => mutate("/api/bank-sync/2fa/respond", "POST", body),
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
  let mapping = {};
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
function NewConnection({ profileId, onClose }) {
  const r = useServerQueries((id) => ({
    items: resource("bank-sync", id, "backends", "/api/bank-sync/backends"),
  }));
  const a = useRecordActions("bank-sync", profileId);
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
