import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Page, Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { useServerQueries, accounts } from "../lib/server/queries";
import { useRecordActions } from "../lib/useRecordActions";
import { mutate } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
interface ImportRow {
  date_operation: string;
  description: string;
  amount: number;
  category?: string;
  is_reconciled: boolean;
  already_reconciled: boolean;
  matched_db_id?: number;
  attachments?: string;
  selected: boolean;
  db_description?: string;
}
interface Inspection {
  sections: string[];
  recommended_section: string | null;
  confidence: number;
}
export function Imports() {
  const r = useServerQueries((id) => ({ items: accounts.list(id) }));
  const { t, money } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [account, setAccount] = useState(
    new URLSearchParams(location.search).get("account") || "",
  );
  const [section, setSection] = useState("");
  const [mode, setMode] = useState("statement");
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [alerts, setAlerts] = useState<Record<string, boolean>>({});
  const [fileBalance, setFileBalance] = useState<number | null>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [importCounts, setImportCounts] = useState<{
    imported: number;
    skipped?: number;
  } | null>(null);
  const [done, setDone] = useState(false);
  const [restore, setRestore] = useState(false);
  const a = useRecordActions("imports", r.profile?.id);
  const client = useQueryClient();
  async function send<T>(endpoint: string): Promise<T> {
    if (!file) throw new Error("Fichier requis");
    const body = new FormData();
    body.set("file", file);
    if (account) body.set("account_id", account);
    if (section) body.set("section_title", section);
    const response = await fetch(
      endpoint.startsWith("/api/") ? endpoint : `/api/csv/${endpoint}`,
      {
        method: "POST",
        body,
      },
    );
    if (!response.ok) throw new Error("Import impossible");
    return response.json();
  }
  const inspect = useMutation({
    mutationFn: () => send<Inspection>("inspect_file"),
    onSuccess: (data) => {
      setInspection(data);
      setSection(data.recommended_section || "");
    },
  });
  const preview = useMutation({
    mutationFn: (ai: boolean) =>
      send<{
        transactions: Omit<ImportRow, "selected">[];
        alerts: Record<string, boolean>;
        file_balance: number | null;
      }>(ai ? "/api/ai/import_csv" : "analyze_heuristic"),
    onSuccess: (data) => {
      setAlerts(data.alerts || {});
      setFileBalance(data.file_balance);
      setRows(
        data.transactions.map((row) => ({
          ...row,
          selected: !row.already_reconciled,
        })),
      );
    },
  });
  const categorize = useMutation({
    mutationFn: async () => {
      const data = await mutate<{
        categories: Record<string, string>;
        error?: string;
      }>("/api/ai/categorize_batch", "POST", {
        descriptions:
          rows?.filter((row) => row.selected).map((row) => row.description) ||
          [],
      });
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) =>
      setRows(
        (current) =>
          current?.map((row) =>
            row.selected && data.categories[row.description]
              ? { ...row, category: data.categories[row.description] }
              : row,
          ) || null,
      ),
  });
  const upload = useMutation({
    mutationFn: () => send("import_to_pending"),
    onSuccess: () => client.invalidateQueries(),
  });
  const save = useMutation({
    mutationFn: async () => {
      const mapping: Record<string, string> = {};
      if (attachments.length) {
        const body = new FormData();
        attachments.forEach((file) => body.append("files", file));
        body.set(
          "relative_paths",
          JSON.stringify(
            attachments.map((file) => file.webkitRelativePath || file.name),
          ),
        );
        const response = await fetch("/api/csv/upload_attachments", {
          method: "POST",
          body,
        });
        if (!response.ok)
          throw new Error("Restauration des documents impossible");
        const data: { saved: Record<string, string> } = await response.json();
        Object.assign(mapping, data.saved);
        const filenames = Object.keys(data.saved).map((path) =>
          path.split("/").at(-1),
        );
        for (const [path, saved] of Object.entries(data.saved)) {
          const filename = path.split("/").at(-1);
          if (
            filename &&
            filenames.filter((name) => name === filename).length === 1
          ) {
            mapping[filename] = saved;
            mapping[`uploads/${filename}`] = saved;
          }
        }
      }
      const imported =
        mode === "native"
          ? await send<{ imported: number; skipped?: number }>("import")
          : await mutate<{ imported: number; skipped?: number }>(
              "/api/csv/save_batch",
              "POST",
              {
                account_id: Number(account),
                transactions: rows
                  ?.filter((row) => row.selected)
                  .map((row) => ({
                    ...row,
                    attachments: row.attachments
                      ? mapping[row.attachments] || row.attachments
                      : row.attachments,
                  })),
              },
            );
      setImportCounts(imported);
      if (mode === "native" && Object.keys(mapping).length)
        await mutate("/api/csv/update_imported_attachments", "POST", {
          mapping,
        });
    },
    onSuccess: () => {
      setRestore(false);
      setDone(true);
      setAttachments([]);
      setRows(null);
      setAlerts({});
      setFileBalance(null);
      client.invalidateQueries();
    },
  });
  const busy =
    inspect.isPending ||
    preview.isPending ||
    categorize.isPending ||
    upload.isPending ||
    save.isPending;
  return (
    <Page title="imports" subtitle="imports_body" resource={r}>
      <VStack gap={4}>
        <Field label={t("import_mode")}>
          <select
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setRows(null);
              setAlerts({});
              setFileBalance(null);
              setDone(false);
            }}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="statement">{t("statement_import")}</option>
            <option value="native">{t("native_restore")}</option>
          </select>
        </Field>
        {mode === "statement" && (
          <Field label={t("select_account")}>
            <select
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                setRows(null);
                setAlerts({});
                setFileBalance(null);
                setInspection(null);
              }}
              {...stylex.props(s.fieldSelect)}
            >
              <option value="">{t("detect_accounts")}</option>
              {r.data?.items.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label={t("statement_file")}>
          <input
            type="file"
            accept={mode === "native" ? ".csv" : ".csv,.xlsx,.xls"}
            disabled={busy}
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setRows(null);
              setAlerts({});
              setFileBalance(null);
              setInspection(null);
              setDone(false);
              upload.reset();
              save.reset();
              preview.reset();
              inspect.reset();
            }}
          />
        </Field>
        {mode === "statement" ? (
          <>
            <Button
              label={t("inspect_file")}
              isDisabled={!file || busy}
              onClick={() => inspect.mutate()}
            />
            {inspection && (
              <>
                <p>
                  {t("confidence")}: {inspection.confidence}%
                </p>
                {inspection.sections.length > 0 && (
                  <Field label={t("file_section")}>
                    <select
                      value={section}
                      onChange={(e) => {
                        setSection(e.target.value);
                        setRows(null);
                        setAlerts({});
                        setFileBalance(null);
                      }}
                      {...stylex.props(s.fieldSelect)}
                    >
                      {inspection.sections.map((title) => (
                        <option key={title}>{title}</option>
                      ))}
                    </select>
                  </Field>
                )}
              </>
            )}
            {section && account && (
              <Button
                label={t("remember_mapping")}
                onClick={() =>
                  a.save({
                    path: "/api/csv/save_account_mapping",
                    body: {
                      section_title: section,
                      account_id: Number(account),
                    },
                  })
                }
              />
            )}
            <Button
              label={t("preview_import")}
              isDisabled={!file || !account || busy}
              onClick={() => preview.mutate(false)}
            />
            <Button
              label={t("prepare_import")}
              isLoading={upload.isPending}
              isDisabled={!file || busy}
              onClick={() => upload.mutate()}
            />
            <Button
              label={t("ai_parse_file")}
              isDisabled={!file || !account || busy}
              isLoading={preview.isPending}
              onClick={() => preview.mutate(true)}
            />
            {Object.entries(alerts)
              .filter(
                ([key, value]) =>
                  value &&
                  [
                    "all_duplicate",
                    "is_old_file",
                    "has_gap",
                    "is_old_compared_to_today",
                  ].includes(key),
              )
              .map(([key]) => (
                <p role="status" key={key}>
                  {t(key)}
                </p>
              ))}
            {fileBalance !== null && (
              <p>
                {t("file_balance")}: {money(fileBalance)}
              </p>
            )}
            {rows && (
              <>
                <label>
                  <input
                    type="checkbox"
                    checked={rows.every(
                      (row) => row.selected || row.already_reconciled,
                    )}
                    onChange={(e) =>
                      setRows(
                        rows.map((row) => ({
                          ...row,
                          selected: e.target.checked && !row.already_reconciled,
                        })),
                      )
                    }
                  />
                  {t("select_all")}
                </label>
                <Button
                  label={t("categorize_selection")}
                  isLoading={categorize.isPending}
                  isDisabled={!rows.some((row) => row.selected) || busy}
                  onClick={() => categorize.mutate()}
                />
                <Records
                  title="preview_import"
                  rows={rows.map((row, index) => ({ ...row, index }))}
                  columns={[
                    {
                      key: "selected",
                      label: "select",
                      render: (row) => (
                        <input
                          aria-label={`${t("select")} ${row.description}`}
                          type="checkbox"
                          checked={row.selected}
                          disabled={row.already_reconciled}
                          onChange={(e) =>
                            setRows(
                              rows.map((value, i) =>
                                i === row.index
                                  ? { ...value, selected: e.target.checked }
                                  : value,
                              ),
                            )
                          }
                        />
                      ),
                    },
                    { key: "date_operation", label: "date" },
                    { key: "description" },
                    {
                      key: "amount",
                      render: (row) => money(row.amount, r.profile?.currency),
                    },
                    { key: "category" },
                    { key: "db_description" },
                    {
                      key: "status",
                      render: (row) =>
                        t(
                          row.already_reconciled
                            ? "reconciled"
                            : row.is_reconciled
                              ? "matched"
                              : "new_transaction",
                        ),
                    },
                  ]}
                  actions={(row) => (
                    <Button
                      label={t("edit")}
                      onClick={() => setEditing(row.index)}
                    />
                  )}
                />
                <Button
                  label={t("save_batch")}
                  isDisabled={!rows.some((row) => row.selected) || busy}
                  onClick={() => setRestore(true)}
                />
              </>
            )}
          </>
        ) : (
          <>
            <p>{t("native_restore_help")}</p>
            <Button
              label={t("native_restore")}
              isDisabled={!file || busy}
              onClick={() => setRestore(true)}
            />
          </>
        )}
        <Field label={t("restore_documents")}>
          <input
            type="file"
            multiple
            onChange={(e) => setAttachments(Array.from(e.target.files || []))}
          />
        </Field>
        <Field label={t("restore_document_folder")}>
          <input
            type="file"
            multiple
            {...{ webkitdirectory: "" }}
            onChange={(event) =>
              setAttachments(Array.from(event.target.files || []))
            }
          />
        </Field>
        {(inspect.isError ||
          preview.isError ||
          categorize.isError ||
          upload.isError ||
          save.isError ||
          a.mutation.isError) && <p role="alert">{t("import_error")}</p>}
        {(done || upload.isSuccess) && (
          <p role="status">{t(done ? "import_saved" : "import_prepared")}</p>
        )}
        {done && importCounts && (
          <p>
            {t("imported_count")}: {importCounts.imported} ·{" "}
            {t("skipped_count")}: {importCounts.skipped || 0}
          </p>
        )}
        <Link to="/bank-sync">{t("pending_review")}</Link>
        <a href="/api/csv/export">{t("export_csv")}</a>
      </VStack>
      {editing !== null && rows && (
        <RecordEditor
          title={t("edit_transaction")}
          initial={rows[editing]}
          fields={[
            { name: "description", required: true },
            { name: "date_operation", type: "date", required: true },
            { name: "amount", type: "number", required: true },
            { name: "category" },
          ]}
          onClose={() => setEditing(null)}
          onSave={(body) => {
            setRows(
              rows.map((row, i) =>
                i === editing
                  ? {
                      ...row,
                      ...body,
                      description: String(body.description),
                      date_operation: String(body.date_operation),
                      amount: Number(body.amount),
                    }
                  : row,
              ),
            );
            setEditing(null);
          }}
        />
      )}
      <Confirmation
        pending={
          restore
            ? { label: t("save_batch"), description: t("import_confirm") }
            : null
        }
        busy={save.isPending}
        error={save.isError}
        onClose={() => setRestore(false)}
        onConfirm={() => save.mutate()}
      />
      <Confirmation {...a.confirmation} />
    </Page>
  );
}
