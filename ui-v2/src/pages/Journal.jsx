import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Page } from "../components/Page";
import { Records } from "../components/Records";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useWorkspace } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
export function Journal() {
  const [offset, setOffset] = useState(0);
  const r = useWorkspace("journal", `/api/history?limit=51&offset=${offset}`);
  const a = useRecordActions("journal", r.profile?.id);
  const { t, locale } = useLanguage();
  return (
    <Page title="journal" subtitle="journal_body" resource={r}>
      <VStack gap={4}>
        <Records
          title="journal"
          rows={(r.data?.items || []).slice(0, 50)}
          columns={[
            {
              key: "timestamp",
              label: "date",
              render: (row) => new Date(row.timestamp).toLocaleString(locale),
            },
            {
              key: "entity_type",
              label: "record",
              render: (row) => `${t(row.entity_type)} #${row.entity_id}`,
            },
            {
              key: "action_type",
              label: "action",
              render: (row) => t(row.action_type.toLowerCase()),
            },
            { key: "user_name", label: "user" },
            {
              key: "status",
              render: (row) => t(row.is_undone ? "undone" : "applied"),
            },
          ]}
          actions={(row) => (
            <ActionButton
              label={t(row.is_undone ? "redo" : "undo")}
              icon="arrows"
              onClick={() =>
                a.confirm(
                  {
                    path: `/api/history/${row.id}/${row.is_undone ? "redo" : "undo"}`,
                    body: {},
                  },
                  t(row.is_undone ? "redo" : "undo"),
                  t("journal_warning"),
                )
              }
            />
          )}
        />
        <Button
          label={t("previous")}
          variant="secondary"
          isDisabled={!offset}
          onClick={() => setOffset((value) => Math.max(0, value - 50))}
        />
        <Button
          label={t("next")}
          variant="secondary"
          isDisabled={(r.data?.items.length || 0) <= 50}
          onClick={() => setOffset((value) => value + 50)}
        />
      </VStack>
      <Confirmation {...a.confirmation} />
    </Page>
  );
}
