import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Page } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useWorkspace } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
export const transactionTypes = [
  "income",
  "expense_var",
  "expense_fixed",
  "transfer",
  "neutral",
].map((value) => ({ value }));
export function Categories() {
  const r = useWorkspace("categories", "/api/categories/");
  const a = useRecordActions("categories", r.profile?.id);
  const { t } = useLanguage();
  return (
    <Page
      title="categories"
      subtitle="categories_body"
      resource={r}
      actions={
        <Button
          label={t("new_category")}
          onClick={() =>
            a.edit({ name: "", type: "expense_var", is_closed: false })
          }
        />
      }
    >
      <Records
        title="categories"
        rows={r.data?.items || []}
        columns={[
          { key: "name" },
          { key: "type", render: (row) => t(row.type) },
          {
            key: "status",
            render: (row) => t(row.is_closed ? "closed" : "active"),
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
              label={t(row.is_closed ? "reopen" : "close_record")}
              icon="archive"
              onClick={() =>
                a.confirm(
                  {
                    path: `/api/categories/${row.id}`,
                    method: "PUT",
                    body: {
                      name: row.name,
                      type: row.type,
                      is_closed: !row.is_closed,
                    },
                  },
                  t(row.is_closed ? "reopen" : "close_record"),
                )
              }
            />
            <ActionButton
              label={t("delete")}
              icon="delete"
              onClick={() =>
                a.edit({ ...row, deleting: true, reallocate_to: "" })
              }
            />
          </>
        )}
      />
      {a.editor && (
        <RecordEditor
          title={t(
            a.editor.deleting
              ? "delete"
              : a.editor.id
                ? "edit"
                : "new_category",
          )}
          fields={
            a.editor.deleting
              ? [
                  {
                    name: "reallocate_to",
                    label: "reallocate_category",
                    options: [
                      { value: "", label: t("none") },
                      ...(r.data?.items || [])
                        .filter((row) => row.id !== a.editor.id)
                        .map((row) => ({ value: row.name, label: row.name })),
                    ],
                  },
                ]
              : [
                  { name: "name", required: true },
                  { name: "type", options: transactionTypes },
                  { name: "is_closed", type: "checkbox" },
                ]
          }
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.editor.deleting
              ? a.confirm({
                  path: `/api/categories/${a.editor.id}?${new URLSearchParams(body.reallocate_to ? { reallocate_to: body.reallocate_to } : {})}`,
                  method: "DELETE",
                })
              : a.save({
                  path: `/api/categories/${a.editor.id || ""}`,
                  method: a.editor.id ? "PUT" : "POST",
                  body,
                })
          }
        />
      )}
      <Confirmation {...a.confirmation} />
    </Page>
  );
}
