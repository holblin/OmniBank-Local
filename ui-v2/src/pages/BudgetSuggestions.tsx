import { AdvancedTools } from "../components/AdvancedTools";
import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { useRecordActions } from "../lib/useRecordActions";
import { mutate, get } from "../lib/http";
import { useLanguage } from "../lib/i18n";
interface Proposal {
  name: string;
  categories: string[];
  suggested_amount: number;
  suggested_period: string;
  justification: string;
}
interface Suggestions {
  proposals: Proposal[];
  unclassified_categories: Record<string, unknown>[];
}
export function BudgetSuggestions({ profileId }: { profileId?: string }) {
  const { t, money, language } = useLanguage();
  const a = useRecordActions("budgets", profileId);
  const [window, setWindow] = useState(3);
  const [sensitivity, setSensitivity] = useState(2);
  const [result, setResult] = useState<Suggestions | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const capacity = useQuery({
    queryKey: ["budgets", profileId, "capacity"],
    queryFn: () =>
      get<
        Record<
          "monthly" | "yearly",
          {
            budgeted: number;
            average_income: number;
            engagement_ratio: number;
            details_fr: string;
            details_en: string;
            budgeted_details_fr: string;
            budgeted_details_en: string;
          }
        >
      >("/api/budgets/capacity"),
    enabled: Boolean(profileId),
  });
  const [edit, setEdit] = useState<number | null>(null);
  const analyze = useMutation({
    mutationFn: (kind: string) =>
      mutate<Suggestions>(
        `/api/budgets/ai_suggest${kind ? `/${kind}` : ""}`,
        "POST",
        {
          window_months: window,
          outlier_sensitivity: sensitivity,
          lang: language,
          existing_proposals: result?.proposals || [],
          unclassified_categories: result?.unclassified_categories || [],
        },
      ),
    onSuccess: (data) => {
      setResult(data);
      setSelected(data.proposals.map((_, index) => index));
    },
  });
  const status = useQuery({
    queryKey: ["budgets", profileId, "analysis-status"],
    queryFn: () =>
      get<{ state: string; elapsed_seconds: number; error?: string }>(
        "/api/budgets/ai_suggest/status",
      ),
    enabled: analyze.isPending,
    refetchInterval: analyze.isPending ? 1500 : false,
  });
  async function accept(indices: number[]) {
    if (!result) return;
    const accepted: number[] = [];
    for (const index of indices) {
      const row = result.proposals[index];
      if (!row) continue;
      const saved = await a.save({
        path: "/api/budgets/",
        body: {
          name: row.name,
          monthly_amount: row.suggested_amount,
          period: row.suggested_period,
          categories: row.categories,
          is_project: false,
        },
      });
      if (!saved) break;
      accepted.push(index);
    }
    setResult({
      ...result,
      proposals: result.proposals.filter(
        (_, index) => !accepted.includes(index),
      ),
    });
    setSelected([]);
  }
  return (
    <AdvancedTools title={t("budget_suggestions")}>
      <VStack gap={3}>
        {capacity.data && (
          <Records
            title="budget_capacity"
            rows={(["monthly", "yearly"] as const).map((period) => ({
              period,
              ...capacity.data![period],
            }))}
            columns={[
              { key: "period", render: (row) => t(row.period) },
              {
                key: "average_income",
                render: (row) => money(row.average_income),
              },
              { key: "budgeted", render: (row) => money(row.budgeted) },
              {
                key: "engagement_ratio",
                render: (row) => `${row.engagement_ratio}%`,
              },
              {
                key: "details",
                render: (row) =>
                  language === "fr" ? row.details_fr : row.details_en,
              },
              {
                key: "budgeted_details",
                render: (row) =>
                  language === "fr"
                    ? row.budgeted_details_fr
                    : row.budgeted_details_en,
              },
            ]}
          />
        )}
        {capacity.isError && <p role="alert">{t("connection_error")}</p>}
        <Field label={t("window_months")}>
          <select
            value={window}
            onChange={(e) => setWindow(Number(e.target.value))}
          >
            {[3, 6, 12].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("outlier_sensitivity")}>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
          />
        </Field>
        <Button
          label={t("analyze_budgets")}
          isLoading={analyze.isPending}
          onClick={() => analyze.mutate("")}
        />
        {analyze.isPending && (
          <>
            <p role="status">
              {t("analysis_running")}: {status.data?.elapsed_seconds || 0}s
            </p>
            <Button
              label={t("cancel")}
              onClick={() =>
                a.save({ path: "/api/budgets/ai_suggest/cancel", body: {} })
              }
            />
          </>
        )}
        {result && (
          <>
            <Button
              label={t("refine_budgets")}
              isDisabled={analyze.isPending}
              onClick={() => analyze.mutate("refine")}
            />
            <Button
              label={t("recalculate_budgets")}
              isDisabled={analyze.isPending}
              onClick={() => analyze.mutate("recalculate")}
            />
            <Button
              label={t("accept_selected")}
              isDisabled={!selected.length || a.mutation.isPending}
              onClick={() => accept(selected)}
            />
            <Records
              title="budget_suggestions"
              rows={result.proposals.map((row, index) => ({ ...row, index }))}
              columns={[
                {
                  key: "selected",
                  label: "select",
                  render: (row) => (
                    <input
                      type="checkbox"
                      aria-label={`${t("select")} ${row.name}`}
                      checked={selected.includes(row.index)}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...selected, row.index]
                            : selected.filter((index) => index !== row.index),
                        )
                      }
                    />
                  ),
                },
                { key: "name" },
                {
                  key: "categories",
                  render: (row) => row.categories.join(", "),
                },
                {
                  key: "suggested_amount",
                  label: "amount",
                  render: (row) => money(row.suggested_amount),
                },
                {
                  key: "suggested_period",
                  label: "period",
                  render: (row) => t(row.suggested_period),
                },
                { key: "justification", label: "reason" },
              ]}
              actions={(row) => (
                <>
                  <Button
                    label={t("edit")}
                    onClick={() => setEdit(row.index)}
                  />
                  <Button
                    label={t("accept")}
                    isDisabled={a.mutation.isPending}
                    onClick={() => accept([row.index])}
                  />
                </>
              )}
            />
          </>
        )}
        {(analyze.isError || a.mutation.isError) && (
          <p role="alert">{t("assistant_error")}</p>
        )}
        {edit !== null && result && (
          <RecordEditor
            title={t("edit_budget")}
            initial={{
              ...result.proposals[edit],
              categories: result.proposals[edit].categories.join(", "),
            }}
            fields={[
              { name: "name", required: true },
              {
                name: "suggested_amount",
                label: "amount",
                type: "number",
                min: 0,
              },
              {
                name: "suggested_period",
                label: "period",
                options: [{ value: "monthly" }, { value: "yearly" }],
              },
              { name: "categories" },
            ]}
            onClose={() => setEdit(null)}
            onSave={(body) => {
              setResult({
                ...result,
                proposals: result.proposals.map((row, index) =>
                  index === edit
                    ? {
                        ...row,
                        name: String(body.name),
                        suggested_amount: Number(body.suggested_amount),
                        suggested_period: String(body.suggested_period),
                        categories: String(body.categories)
                          .split(",")
                          .map((v) => v.trim())
                          .filter(Boolean),
                      }
                    : row,
                ),
              });
              setEdit(null);
            }}
          />
        )}
      </VStack>
    </AdvancedTools>
  );
}
