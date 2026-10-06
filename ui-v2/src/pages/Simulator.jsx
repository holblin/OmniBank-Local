import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Page } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { BalanceChart } from "../components/BalanceChart";
import { useServerQueries, accounts } from "../lib/server/queries";
import { resource } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { mutate } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { localDate } from "../lib/navigation";
export function Simulator() {
  const r = useServerQueries((id) => ({
    items: resource("simulator", id, "scenarios", "/api/simulator/scenarios"),
    accounts: accounts.list(id),
  }));
  const a = useRecordActions("simulator", r.profile?.id);
  const { t, money } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [runEditor, setRunEditor] = useState(false);
  const client = useQueryClient();
  const simulation = useMutation({
    mutationKey: ["simulator", r.profile?.id, "run"],
    mutationFn: (body) => mutate("/api/simulator/run", "POST", body),
    onSuccess: (data, body) =>
      client.setQueryData(["simulator", r.profile?.id, "result", body], data),
  });
  const scenario = r.data?.items.find((row) => row.id === selected);
  const accountOptions = [
    { value: "", label: t("all_accounts") },
    ...(r.data?.accounts || []).map((row) => ({
      value: row.id,
      label: row.name,
    })),
  ];
  const eventFields = [
    { name: "label", label: "description", required: true },
    {
      name: "event_type",
      options: [
        "one_off_expense",
        "one_off_income",
        "recurring_expense",
        "recurring_income",
        "percentage_adjustment",
      ].map((value) => ({ value })),
    },
    { name: "amount", type: "number", required: true },
    { name: "start_date", type: "date", required: true },
    { name: "end_date", type: "date", nullable: true },
    { name: "duration_months", type: "number", min: 1, step: 1 },
    { name: "account_id", options: accountOptions, nullable: true },
    { name: "category" },
    { name: "notes", type: "textarea" },
    { name: "is_active", type: "checkbox" },
  ];
  return (
    <Page
      title="simulator"
      subtitle="simulator_body"
      resource={r}
      actions={
        <Button
          label={t("new_scenario")}
          onClick={() => a.edit({ name: "", description: "", is_active: true })}
        />
      }
    >
      <VStack gap={4}>
        <Records
          title="scenarios"
          rows={r.data?.items || []}
          columns={[
            { key: "name" },
            { key: "description" },
            { key: "events", render: (row) => row.events.length },
          ]}
          actions={(row) => (
            <>
              <ActionButton
                label={t("select_scenario")}
                icon="target"
                onClick={() => {
                  setSelected(row.id);
                  simulation.reset();
                }}
              />
              <ActionButton
                label={t("edit")}
                icon="edit"
                onClick={() => a.edit(row)}
              />
              <ActionButton
                label={t("duplicate")}
                icon="duplicate"
                onClick={() =>
                  a.save({
                    path: `/api/simulator/scenarios/${row.id}/duplicate`,
                    body: {},
                  })
                }
              />
              <ActionButton
                label={t("delete")}
                icon="delete"
                onClick={() =>
                  a.confirm({
                    path: `/api/simulator/scenarios/${row.id}`,
                    method: "DELETE",
                  })
                }
              />
            </>
          )}
        />
        {scenario && (
          <>
            <h2>{scenario.name}</h2>
            <Button
              label={t("new_event")}
              onClick={() =>
                a.edit({
                  event: true,
                  label: "",
                  amount: 0,
                  event_type: "one_off_expense",
                  start_date: localDate(),
                  is_active: true,
                })
              }
            />
            <Records
              title="events"
              rows={scenario.events}
              columns={[
                { key: "label", label: "description" },
                { key: "event_type", render: (row) => t(row.event_type) },
                {
                  key: "amount",
                  render: (row) => money(row.amount, r.profile?.currency),
                },
                { key: "start_date", label: "date" },
              ]}
              actions={(row) => (
                <>
                  <ActionButton
                    label={t("edit")}
                    icon="edit"
                    onClick={() => a.edit({ ...row, event: true })}
                  />
                  <ActionButton
                    label={t("delete")}
                    icon="delete"
                    onClick={() =>
                      a.confirm({
                        path: `/api/simulator/events/${row.id}`,
                        method: "DELETE",
                      })
                    }
                  />
                </>
              )}
            />
          </>
        )}
        <Button
          label={t("run_simulation")}
          isLoading={simulation.isPending}
          onClick={() => setRunEditor(true)}
        />
        {simulation.isError && <p role="alert">{t("simulation_error")}</p>}
        {simulation.data && (
          <>
            <p>
              {t("baseline_final_balance")}:{" "}
              {money(
                simulation.data.baseline_final_balance,
                r.profile?.currency,
              )}
            </p>
            <p>
              {t("simulated_final_balance")}:{" "}
              {money(
                simulation.data.simulated_final_balance,
                r.profile?.currency,
              )}
            </p>
            <BalanceChart
              history={simulation.data.monthly_data.map((row) => ({
                date: `${row.month}-01`,
                balance: row.simulated_end_balance,
              }))}
              currency={r.profile?.currency}
            />
          </>
        )}
      </VStack>
      {a.editor && (
        <RecordEditor
          title={t(a.editor.event ? "new_event" : "new_scenario")}
          fields={
            a.editor.event
              ? eventFields
              : [
                  { name: "name", required: true },
                  { name: "description", type: "textarea" },
                  { name: "is_active", type: "checkbox" },
                ]
          }
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) => {
            if (a.editor.event)
              body.account_id = body.account_id
                ? Number(body.account_id)
                : null;
            a.save({
              path: a.editor.event
                ? a.editor.id
                  ? `/api/simulator/events/${a.editor.id}`
                  : `/api/simulator/scenarios/${selected}/events`
                : `/api/simulator/scenarios${a.editor.id ? `/${a.editor.id}` : ""}`,
              method: a.editor.id ? "PUT" : "POST",
              body,
            });
          }}
        />
      )}
      {runEditor && (
        <RecordEditor
          title={t("run_simulation")}
          fields={[
            {
              name: "horizon_months",
              type: "number",
              min: 1,
              max: 300,
              step: 1,
              required: true,
            },
            { name: "account_id", options: accountOptions, nullable: true },
            {
              name: "income_mode",
              options: ["historical_n1", "average", "custom", "none"].map(
                (value) => ({ value }),
              ),
            },
            { name: "custom_income_amount", type: "number", min: 0 },
            { name: "inflation_rate", type: "number", min: 0, max: 1 },
            {
              name: "variable_expense_adjustment_pct",
              type: "number",
              min: -1,
              max: 1,
            },
          ]}
          initial={{
            horizon_months: 36,
            income_mode: "historical_n1",
            inflation_rate: 0,
            variable_expense_adjustment_pct: 0,
          }}
          busy={simulation.isPending}
          error={simulation.isError}
          onClose={() => setRunEditor(false)}
          onSave={async (body) => {
            try {
              await simulation.mutateAsync({
                ...body,
                account_id: body.account_id ? Number(body.account_id) : null,
                scenario_id: scenario?.id || null,
              });
              setRunEditor(false);
            } catch {}
          }}
        />
      )}
      <Confirmation {...a.confirmation} />
    </Page>
  );
}
