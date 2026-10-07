import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useQuery } from "@tanstack/react-query";
import { Editor, Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
import { get } from "../lib/http";
import { styles as s } from "../components/Pages.stylex";
import type { Recurrence } from "../lib/server/workspaces";
import type { Transaction } from "../lib/server/models";
export function RecurrenceTools({
  items,
  profileId,
  fields,
}: {
  items: Recurrence[];
  fields: import("../lib/ui-types").FieldDefinition[];
  profileId?: string;
}) {
  const { t, money } = useLanguage();
  const a = useRecordActions("recurrences", profileId);
  const [adding, setAdding] = useState(false);
  const [newTemplates, setNewTemplates] = useState<
    import("../lib/ui-types").FormValues[]
  >([]);
  const [wizard, setWizard] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [updates, setUpdates] = useState<(Recurrence & { renew: boolean })[]>(
    [],
  );
  const [selected, setSelected] = useState("");
  const [origin, setOrigin] = useState<Transaction | null>(null);
  const [generate, setGenerate] = useState(true);
  const tx = useQuery({
    queryKey: ["transactions", profileId, "recurrence", selected],
    queryFn: () => get<Transaction[]>("/api/transactions/?limit=100000"),
    enabled: Boolean(selected && profileId),
  });
  return (
    <VStack gap={4}>
      <Button
        label={t("annual_wizard")}
        variant="secondary"
        onClick={() => {
          setUpdates(items.map((row) => ({ ...row, renew: !row.is_closed })));
          setNewTemplates([]);
          setWizard(true);
        }}
      />
      <Field label={t("recurrence_instances")}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          {...stylex.props(s.fieldSelect)}
        >
          <option value="">{t("none")}</option>
          {items.map((row) => (
            <option key={row.id} value={row.id}>
              {row.description}
            </option>
          ))}
        </select>
      </Field>
      {selected && (
        <>
          <Records
            title="recurrence_instances"
            rows={(tx.data || []).filter(
              (row) => String(row.recurrence_id) === selected,
            )}
            columns={[
              { key: "date_operation", label: "date" },
              { key: "description" },
              { key: "amount", render: (row) => money(row.amount) },
              { key: "reconciliation_date", label: "reconciliation_date" },
              {
                key: "status",
                render: (row) =>
                  t(
                    row.is_skipped
                      ? "skipped"
                      : row.reconciliation_date
                        ? "reconciled"
                        : "pending",
                  ),
              },
            ]}
            actions={(row) => (
              <Button
                label={t("propagate")}
                isDisabled={Boolean(row.reconciliation_date)}
                onClick={() => setOrigin(row)}
              />
            )}
          />
          {tx.isError && <p role="alert">{t("connection_error")}</p>}
        </>
      )}
      {wizard && (
        <Editor
          title={t("annual_wizard")}
          onClose={() => setWizard(false)}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
        >
          <VStack gap={4}>
            <Field label={t("year")}>
              <input
                type="number"
                min={1900}
                max={2200}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                {...stylex.props(s.fieldInput)}
              />
            </Field>
            <label>
              <input
                type="checkbox"
                checked={generate}
                onChange={(e) => setGenerate(e.target.checked)}
              />
              {t("generate_instances")}
            </label>
            {updates.map((row, index) => (
              <fieldset key={row.id}>
                <legend>{row.description}</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={row.renew}
                    onChange={(e) =>
                      setUpdates(
                        updates.map((v, i) =>
                          i === index ? { ...v, renew: e.target.checked } : v,
                        ),
                      )
                    }
                  />
                  {t("renew")}
                </label>
                {(["amount", "day_of_month", "category"] as const).map(
                  (key) => (
                    <Field key={key} label={t(key)}>
                      <input
                        type={key === "category" ? "text" : "number"}
                        step={key === "amount" ? "0.01" : "1"}
                        min={key === "day_of_month" ? 1 : undefined}
                        max={key === "day_of_month" ? 31 : undefined}
                        value={row[key] || ""}
                        onChange={(e) =>
                          setUpdates(
                            updates.map((v, i) =>
                              i === index
                                ? {
                                    ...v,
                                    [key]:
                                      key === "category"
                                        ? e.target.value
                                        : Number(e.target.value),
                                  }
                                : v,
                            ),
                          )
                        }
                        {...stylex.props(s.fieldInput)}
                      />
                    </Field>
                  ),
                )}
              </fieldset>
            ))}
            <Records
              title="new_recurrence"
              rows={newTemplates.map((row, index) => ({
                description: row.description,
                amount: row.amount,
                frequency: row.frequency,
                index,
              }))}
              columns={[
                { key: "description" },
                { key: "amount", render: (row) => money(Number(row.amount)) },
                {
                  key: "frequency",
                  render: (row) => t(String(row.frequency).toLowerCase()),
                },
              ]}
              actions={(row) => (
                <Button
                  label={t("delete")}
                  onClick={() =>
                    setNewTemplates(
                      newTemplates.filter((_, index) => index !== row.index),
                    )
                  }
                />
              )}
            />
            <Button
              label={t("new_recurrence")}
              onClick={() => setAdding(true)}
            />
            <Button
              label={t("apply_renewal")}
              isLoading={a.mutation.isPending}
              onClick={async () => {
                const result = await a.save({
                  path: "/api/recurrences/wizard_generate",
                  body: {
                    target_year: year,
                    updates: updates.map((row) => ({
                      id: row.id,
                      renew: row.renew,
                      amount: row.amount,
                      day_of_month: row.day_of_month,
                      category: row.category,
                      frequency: row.frequency,
                    })),
                    new_templates: newTemplates,
                    generate_instances: generate,
                  },
                });
                if (result) setWizard(false);
              }}
            />
          </VStack>
        </Editor>
      )}
      {adding && (
        <RecordEditor
          title={t("new_recurrence")}
          fields={fields}
          initial={{
            description: "",
            amount: 0,
            type: "expense_var",
            frequency: "Monthly",
            day_of_month: 1,
          }}
          onClose={() => setAdding(false)}
          onSave={(body) => {
            for (const key of ["from_account_id", "to_account_id"])
              body[key] = body[key] ? Number(body[key]) : null;
            setNewTemplates([...newTemplates, body]);
            setAdding(false);
          }}
        />
      )}
      {origin && (
        <RecordEditor
          title={t("propagate")}
          initial={{
            new_amount: origin.amount,
            new_date: origin.date_operation,
          }}
          fields={[
            {
              name: "new_amount",
              label: "amount",
              type: "number",
              required: true,
            },
            { name: "new_date", label: "date", type: "date", required: true },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setOrigin(null)}
          onSave={async (body) => {
            const result = await a.save({
              path: `/api/recurrences/${selected}/propagate`,
              body: { ...body, transaction_id: origin.id },
            });
            if (result) setOrigin(null);
          }}
        />
      )}
      <Confirmation {...a.confirmation} />
    </VStack>
  );
}
