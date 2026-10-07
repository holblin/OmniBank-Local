import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useQuery } from "@tanstack/react-query";
import { Field } from "../components/Page";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { useRecordActions } from "../lib/useRecordActions";
import { get } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
interface Compression {
  compressing: boolean;
  compressed_context: string | null;
}
export function AssistantTools({
  id,
  profileId,
  role,
  busy,
}: {
  id: number;
  profileId?: string;
  role: string;
  busy: boolean;
}) {
  const { t } = useLanguage();
  const a = useRecordActions("chat", profileId);
  const [edit, setEdit] = useState(false);
  const [instruction, setInstruction] = useState("");
  const context = useQuery({
    queryKey: ["chat", profileId, id, "compression"],
    queryFn: () =>
      get<Compression>(`/api/chat/sessions/${id}/compression-status`),
    enabled: Boolean(id && profileId),
    refetchInterval: (q) => (q.state.data?.compressing ? 1500 : false),
  });
  return (
    <VStack gap={3}>
      <Field label={t("assistant_role")}>
        <select
          value={role}
          disabled={busy || a.mutation.isPending}
          onChange={(e) =>
            a.save({
              path: `/api/chat/sessions/${id}`,
              method: "PUT",
              body: { role: e.target.value },
            })
          }
          {...stylex.props(s.fieldSelect)}
        >
          {[
            "advisor",
            "simulator",
            "alerts",
            "optimizer",
            "budget_planner",
            "forecaster",
            "auditor",
          ].map((value) => (
            <option value={value} key={value}>
              {t(value)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t("compression_instruction")}>
        <textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          {...stylex.props(s.fieldInput)}
        />
      </Field>
      <Button
        label={t("compress_context")}
        isDisabled={busy || context.data?.compressing}
        isLoading={a.mutation.isPending}
        onClick={() =>
          a.save({
            path: `/api/chat/sessions/${id}/regenerate-compressed-context`,
            body: { instruction: instruction || null },
          })
        }
      />
      <Button
        label={t("restore_context")}
        variant="secondary"
        isDisabled={busy}
        onClick={() =>
          a.confirm(
            {
              path: `/api/chat/sessions/${id}/compressed-context`,
              method: "DELETE",
            },
            t("restore_context"),
          )
        }
      />
      <Button
        label={t("edit_context")}
        variant="secondary"
        isDisabled={busy}
        onClick={() => setEdit(true)}
      />
      <Button
        label={t("notify_completion")}
        variant="secondary"
        onClick={() =>
          a.save({
            path: `/api/chat/sessions/${id}/notify-on-complete`,
            body: { enabled: true },
          })
        }
      />
      {context.data?.compressing && <p role="status">{t("compressing")}</p>}
      {context.data?.compressed_context && (
        <details>
          <summary>{t("compressed_context")}</summary>
          <p>{context.data.compressed_context}</p>
        </details>
      )}
      {a.mutation.isError && <p role="alert">{t("assistant_error")}</p>}
      {edit && (
        <RecordEditor
          title={t("edit_context")}
          initial={{
            compressed_context: context.data?.compressed_context || "",
          }}
          fields={[{ name: "compressed_context", type: "textarea" }]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setEdit(false)}
          onSave={async (body) => {
            const result = await a.save({
              path: `/api/chat/sessions/${id}/context`,
              method: "PUT",
              body,
            });
            if (result) setEdit(false);
          }}
        />
      )}
      <Confirmation {...a.confirmation} />
    </VStack>
  );
}
