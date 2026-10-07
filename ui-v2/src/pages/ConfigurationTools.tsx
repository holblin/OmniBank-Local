import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation } from "@tanstack/react-query";
import { Field } from "../components/Page";
import { useRecordActions } from "../lib/useRecordActions";
import { get, mutate } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
export function ConfigurationTools({ profileId }: { profileId?: string }) {
  const { t } = useLanguage();
  const a = useRecordActions("configuration", profileId);
  const [raw, setRaw] = useState("");
  const [ai, setAi] = useState(false);
  const models = useMutation({
    mutationFn: () =>
      get<{ models: { name: string; size: number }[] }>(
        "/api/config/ollama/models",
      ),
  });
  const label = useMutation({
    mutationFn: () =>
      mutate<{
        clean_description: string;
        category: string | null;
        source: string;
        confidence: number;
      }>("/api/smart-labels/simulate", "POST", {
        raw_label: raw,
        use_ai_fallback: ai,
        auto_fallback_category: false,
      }),
  });
  return (
    <VStack gap={3}>
      <Button
        label={t("discover_models")}
        isLoading={models.isPending}
        onClick={() => models.mutate()}
      />
      {models.data && (
        <Field label={t("ollama_model")}>
          <select
            defaultValue=""
            onChange={(e) =>
              a.save({
                path: "/api/config/",
                body: { ollama_model: e.target.value },
              })
            }
            {...stylex.props(s.fieldSelect)}
          >
            <option value="">{t("none")}</option>
            {models.data.models.map((row) => (
              <option key={row.name}>{row.name}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label={t("test_bank_label")}>
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          {...stylex.props(s.fieldInput)}
        />
      </Field>
      <label>
        <input
          type="checkbox"
          checked={ai}
          onChange={(e) => setAi(e.target.checked)}
        />
        {t("use_local_ai")}
      </label>
      <Button
        label={t("test_label")}
        isDisabled={!raw}
        isLoading={label.isPending}
        onClick={() => label.mutate()}
      />
      {label.data && (
        <p role="status">
          {label.data.clean_description} · {label.data.category || t("none")} ·{" "}
          {t("confidence")}: {label.data.confidence}
        </p>
      )}
      {(models.isError || label.isError || a.mutation.isError) && (
        <p role="alert">{t("local_service_error")}</p>
      )}
    </VStack>
  );
}
