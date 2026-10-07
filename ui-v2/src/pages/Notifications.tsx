import type { Notification } from "../lib/server/workflow-models";
import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Page, Editor } from "../components/Page";
import { Records } from "../components/Records";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useWorkspace } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
export function Notifications() {
  const [archived, setArchived] = useState(false);
  const [detail, setDetail] = useState<Notification | null>(null);
  const r = useWorkspace<Notification[]>(
    "notifications",
    `/api/notifications?archived=${archived}`,
  );
  const a = useRecordActions("notifications", r.profile?.id);
  const { t } = useLanguage();
  return (
    <Page title="notifications" subtitle="notifications_body" resource={r}>
      <VStack gap={4}>
        <Button
          label={t("read_all")}
          variant="secondary"
          onClick={() =>
            a.save({
              path: "/api/notifications/read-all",
              method: "PUT",
              body: {},
            })
          }
        />
        <Button
          label={t("archive_all")}
          variant="secondary"
          onClick={() =>
            a.confirm(
              {
                path: "/api/notifications/archive-all",
                method: "PUT",
                body: {},
              },
              t("archive_all"),
            )
          }
        />
        <Button
          label={t("clear_archives")}
          variant="secondary"
          onClick={() =>
            a.confirm(
              { path: "/api/notifications/archives/clear", method: "DELETE" },
              t("clear_archives"),
            )
          }
        />
        <Button
          label={t("generate_ai_report")}
          variant="secondary"
          isLoading={a.mutation.isPending}
          onClick={() =>
            a.save({ path: "/api/notifications/generate-ai-report", body: {} })
          }
        />
        {a.mutation.isError && <p role="alert">{t("save_error")}</p>}
        <Button
          label={t(archived ? "show_active" : "show_archived")}
          variant="secondary"
          onClick={() => setArchived(!archived)}
        />
        <Records
          title="notifications"
          rows={r.data?.items || []}
          columns={[
            { key: "title", label: "description" },
            { key: "content", label: "message" },
            {
              key: "status",
              render: (row) => t(row.is_read ? "read" : "unread"),
            },
          ]}
          actions={(row) => (
            <>
              <ActionButton
                label={t("view_details")}
                icon="chart"
                onClick={() => {
                  setDetail(row);
                  a.save({
                    path: `/api/notifications/${row.id}/read`,
                    method: "PUT",
                    body: {},
                  });
                }}
              />
              <ActionButton
                label={t(row.is_archived ? "restore" : "archive")}
                icon="archive"
                onClick={() =>
                  a.confirm(
                    {
                      path: `/api/notifications/${row.id}/${row.is_archived ? "unarchive" : "archive"}`,
                      method: "PUT",
                      body: {},
                    },
                    t(row.is_archived ? "restore" : "archive"),
                  )
                }
              />
              <ActionButton
                label={t("delete")}
                icon="delete"
                onClick={() =>
                  a.confirm({
                    path: `/api/notifications/${row.id}`,
                    method: "DELETE",
                  })
                }
              />
            </>
          )}
        />
      </VStack>
      {detail && (
        <Editor title={detail.title} onClose={() => setDetail(null)}>
          <p>{detail.detailed_content || detail.content}</p>
        </Editor>
      )}
      <Confirmation {...a.confirmation} />
    </Page>
  );
}
