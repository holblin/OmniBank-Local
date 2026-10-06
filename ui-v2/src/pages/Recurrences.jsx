import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Page } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useServerQueries, accounts } from "../lib/server/queries";
import { resource } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
import { transactionTypes } from "./Categories";
export function Recurrences() {
  const r = useServerQueries((id) => ({
    items: resource("recurrences", id, "list", "/api/recurrences/"),
    accounts: accounts.list(id),
  }));
  const a = useRecordActions("recurrences", r.profile?.id);
  const { t, money } = useLanguage();
  const [closed, setClosed] = useState(false);
  const blank = {
    description: "",
    amount: 0,
    type: "expense_var",
    frequency: "Monthly",
    day_of_month: 1,
    month_of_year: null,
    max_occurrences: null,
    is_closed: false,
    from_account_id: null,
    to_account_id: null,
  };
  const accountOptions = [
    { value: "", label: t("none") },
    ...(r.data?.accounts || []).map((row) => ({
      value: row.id,
      label: row.name,
    })),
  ];
  const fields = [
    { name: "description", required: true },
    { name: "amount", type: "number", required: true },
    { name: "type", options: transactionTypes },
    { name: "category" },
    {
      name: "frequency",
      options: ["Monthly", "Yearly", "Weekly", "Bi-Weekly", "Bi-Monthly"].map(
        (value) => ({ value, label: t(value.toLowerCase()) }),
      ),
    },
    { name: "day_of_month", type: "number", min: 1, max: 31, step: 1 },
    { name: "month_of_year", type: "number", min: 1, max: 12, step: 1 },
    { name: "max_occurrences", type: "number", min: 1, step: 1 },
    {
      name: "from_account_id",
      label: "from_account",
      options: accountOptions,
      nullable: true,
    },
    {
      name: "to_account_id",
      label: "to_account",
      options: accountOptions,
      nullable: true,
    },
  ];
  return (
    <Page
      title="recurrences"
      subtitle="recurrences_body"
      resource={r}
      actions={
        <>
          <Button
            label={t("generate_recurrences")}
            variant="secondary"
            isLoading={a.mutation.isPending}
            onClick={() =>
              a.confirm(
                { path: "/api/recurrences/generate_to_end_of_year", body: {} },
                t("generate_recurrences"),
                t("generate_recurrences_body"),
              )
            }
          />
          <Button label={t("new_recurrence")} onClick={() => a.edit(blank)} />
        </>
      }
    >
      <VStack gap={4}>
        <label>
          <input
            type="checkbox"
            checked={closed}
            onChange={(e) => setClosed(e.target.checked)}
          />
          {t("show_closed")}
        </label>
        <Records
          title="recurrences"
          rows={(r.data?.items || []).filter((row) => closed || !row.is_closed)}
          columns={[
            { key: "description" },
            { key: "category" },
            {
              key: "amount",
              render: (row) => money(row.amount, r.profile?.currency),
            },
            {
              key: "frequency",
              render: (row) => t(row.frequency.toLowerCase()),
            },
            { key: "day_of_month" },
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
                label={t("duplicate")}
                icon="duplicate"
                onClick={() =>
                  a.edit({
                    ...row,
                    id: undefined,
                    description: `${row.description} (${t("copy")})`,
                    is_closed: false,
                  })
                }
              />
              <ActionButton
                label={t(row.is_closed ? "reopen" : "close_record")}
                icon="archive"
                onClick={() =>
                  a.confirm(
                    {
                      path: `/api/recurrences/${row.id}/${row.is_closed ? "reopen" : "close"}`,
                      body: {},
                    },
                    t(row.is_closed ? "reopen" : "close_record"),
                    t("recurrence_close_warning"),
                  )
                }
              />
              <ActionButton
                label={t("delete")}
                icon="delete"
                onClick={() =>
                  a.confirm(
                    { path: `/api/recurrences/${row.id}`, method: "DELETE" },
                    t("delete"),
                    t("recurrence_delete_warning"),
                  )
                }
              />
            </>
          )}
        />
      </VStack>
      {a.editor && (
        <RecordEditor
          title={t(a.editor.id ? "edit_recurrence" : "new_recurrence")}
          fields={fields}
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) => {
            for (const key of ["from_account_id", "to_account_id"])
              body[key] = body[key] ? Number(body[key]) : null;
            a.save({
              path: `/api/recurrences/${a.editor.id || ""}`,
              method: a.editor.id ? "PUT" : "POST",
              body: { ...body, is_closed: a.editor.is_closed },
            });
          }}
        />
      )}
      <Confirmation {...a.confirmation} />
    </Page>
  );
}
