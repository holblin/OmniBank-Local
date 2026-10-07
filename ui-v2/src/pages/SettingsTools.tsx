import type { FieldDefinition, FormValues } from "../lib/ui-types";
import type {
  SharedStorageInfo,
  MaintenancePreview,
} from "../lib/server/workflow-models";
import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Field } from "../components/Page";
import { styles as s } from "../components/Pages.stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { useWorkspace } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
import { ActionButton } from "../components/ActionButton";

const collections: Record<
  string,
  {
    domain: string;
    path: string;
    fields: FieldDefinition[];
    columns: string[];
    createOnly?: boolean;
  }
> = {
  label_rules: {
    domain: "smart-labels",
    path: "/api/smart-labels/mappings",
    fields: [
      { name: "raw_pattern", required: true },
      { name: "clean_description" },
      { name: "category" },
      { name: "is_manual", type: "checkbox" },
      { name: "is_multi_category", type: "checkbox" },
      { name: "is_ignored", type: "checkbox" },
    ],
    columns: ["raw_pattern", "clean_description", "category"],
  },
  exchange_rates: {
    domain: "exchange-rates",
    path: "/api/config/exchange-rates",
    fields: [
      { name: "from_currency", required: true },
      { name: "to_currency", required: true },
      {
        name: "rate",
        type: "number",
        step: "0.000001",
        min: "0.000001",
        required: true,
      },
    ],
    columns: ["from_currency", "to_currency", "rate"],
    createOnly: true,
  },
  assistant_memory: {
    domain: "chat",
    path: "/api/chat/facts",
    fields: [
      { name: "fact_key", required: true },
      { name: "fact_value", type: "textarea", required: true },
    ],
    columns: ["fact_key", "fact_value"],
    createOnly: true,
  },
};
export function SettingsCollection({ name }: { name: string }) {
  const definition = collections[name];
  const r = useWorkspace<FormValues[]>(definition.domain, definition.path);
  const a = useRecordActions<FormValues>(definition.domain, r.profile?.id);
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  return (
    <VStack gap={4}>
      <h2>{t(name)}</h2>
      <Button
        label={t("add")}
        onClick={() =>
          a.edit({
            is_manual: true,
            is_ignored: false,
            is_multi_category: false,
          })
        }
      />
      {r.loading && <p role="status">{t("loading")}</p>}
      {r.error && (
        <p role="alert">{t(r.data ? "stale_data" : "connection_error")}</p>
      )}
      <Field label={t("search")}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          {...stylex.props(s.fieldInput)}
        />
      </Field>
      <Records
        title={name}
        rows={(r.data?.items || []).filter((row) =>
          Object.values(row).some((value) =>
            String(value)
              .toLocaleLowerCase()
              .includes(search.toLocaleLowerCase()),
          ),
        )}
        columns={definition.columns.map((key) => ({ key }))}
        actions={(row) => (
          <>
            {name === "label_rules" &&
              ["toggle-manual", "toggle-multi", "toggle"].map((action) => (
                <Button
                  key={action}
                  label={t(action)}
                  onClick={() =>
                    a.save({
                      path: `${definition.path}/${row.id}/${action}`,
                      body: {},
                    })
                  }
                  variant="secondary"
                />
              ))}
            {!definition.createOnly && (
              <ActionButton
                label={t("edit")}
                icon="edit"
                onClick={() => a.edit(row)}
              />
            )}
            <ActionButton
              label={t("delete")}
              icon="delete"
              onClick={() =>
                a.confirm({
                  path: `${definition.path}/${row.id}`,
                  method: "DELETE",
                })
              }
            />
          </>
        )}
      />
      {a.editor && (
        <RecordEditor
          title={t(name)}
          fields={definition.fields}
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.save({
              path: `${definition.path}${a.editor?.id ? `/${a.editor?.id}` : ""}`,
              method: a.editor?.id ? "PUT" : "POST",
              body,
            })
          }
        />
      )}
      <Confirmation {...a.confirmation} />
    </VStack>
  );
}
export function SharedStorage() {
  const r = useWorkspace<SharedStorageInfo>(
    "shared-mode",
    "/api/config/shared-mode",
  );
  const a = useRecordActions("shared-mode", r.profile?.id);
  const { t } = useLanguage();
  return (
    <VStack gap={4}>
      <h2>{t("shared_storage")}</h2>
      <p>{t("shared_storage_help")}</p>
      {r.loading && <p>{t("loading")}</p>}
      {r.error && <p role="alert">{t("connection_error")}</p>}
      {r.data && (
        <>
          <p>
            {t("storage_path")}:{" "}
            {r.data.items.current_data_dir || r.data.items.path}
          </p>
          <p>{t(r.data.items.active ? "enabled" : "disabled")}</p>
        </>
      )}
      <Button
        label={t("configure_shared_storage")}
        onClick={() => a.edit({ mode: "custom", custom_path: "" })}
      />
      {r.data?.items.active && (
        <Button
          label={t("disable_shared_storage")}
          variant="secondary"
          onClick={() =>
            a.confirm(
              { path: "/api/config/shared-mode", method: "DELETE" },
              t("disable_shared_storage"),
              t("shared_storage_warning"),
            )
          }
        />
      )}
      {a.editor && (
        <RecordEditor
          title={t("shared_storage")}
          fields={[
            {
              name: "mode",
              options: [
                { value: "custom", label: t("custom") },
                { value: "programdata", label: "ProgramData" },
              ],
            },
            { name: "custom_path", label: "storage_path" },
          ]}
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.confirm(
              { path: "/api/config/shared-mode", body },
              t("confirm"),
              t("shared_storage_warning"),
            )
          }
        />
      )}
      {a.mutation.isSuccess && <p role="status">{t("restart_required")}</p>}
      <Confirmation {...a.confirmation} />
    </VStack>
  );
}
export function Maintenance() {
  const [kind, setKind] = useState("fix_type_mismatch");
  const r = useWorkspace<MaintenancePreview>(
    "journal",
    `/api/maintenance/${kind}/preview`,
  );
  const a = useRecordActions("journal", r.profile?.id);
  const { t } = useLanguage();
  const rows =
    r.data?.items.sample ||
    r.data?.items.groups?.flatMap((group) => group.transactions) ||
    r.data?.items.transactions ||
    [];
  return (
    <VStack gap={4}>
      <h2>{t("maintenance")}</h2>
      <Field label={t("maintenance_task")}>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          {...stylex.props(s.fieldSelect)}
        >
          {[
            "fix_type_mismatch",
            "orphan_recurrences",
            "convert_zeroed_to_skipped",
          ].map((value) => (
            <option key={value} value={value}>
              {t(value)}
            </option>
          ))}
        </select>
      </Field>
      {r.loading && <p role="status">{t("loading")}</p>}
      {r.error && <p role="alert">{t("connection_error")}</p>}
      <p>
        {t("affected_count")}: {r.data?.items.count ?? rows.length}
      </p>
      <Records
        title="affected_records"
        rows={rows}
        columns={[
          { key: "description" },
          { key: "amount" },
          { key: "date_operation", label: "date" },
          { key: "category" },
        ]}
      />
      <Button
        label={t("apply_correction")}
        isDisabled={!rows.length}
        onClick={() =>
          a.confirm(
            {
              path: `/api/maintenance/${kind}/${kind === "orphan_recurrences" ? "cleanup" : "apply"}`,
              body:
                kind === "fix_type_mismatch" ? {} : rows.map((row) => row.id),
            },
            t("apply_correction"),
            t("financial_write_warning"),
          )
        }
      />
      <Confirmation {...a.confirmation} />
    </VStack>
  );
}
