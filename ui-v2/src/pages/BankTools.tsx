import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useQuery } from "@tanstack/react-query";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { useRecordActions } from "../lib/useRecordActions";
import { get } from "../lib/http";
import { useLanguage } from "../lib/i18n";
interface AutoSettings {
  enabled: boolean;
  interval_hours: number;
  sync_on_vault_unlock: boolean;
}
export function BankTools({ profileId }: { profileId?: string }) {
  const { t } = useLanguage();
  const a = useRecordActions("bank-sync", profileId);
  const [edit, setEdit] = useState(false);
  const settings = useQuery({
    queryKey: ["bank-sync", profileId, "auto-settings"],
    queryFn: () => get<AutoSettings>("/api/bank-sync/settings/auto-sync"),
    enabled: Boolean(profileId),
  });
  return (
    <VStack gap={3}>
      <Button
        label={t("auto_sync_settings")}
        onClick={() => setEdit(true)}
        isDisabled={!settings.data}
      />
      {[
        ["trigger-auto-sync", "sync_now"],
        ["reconcile-all-pending", "reconcile_matches"],
        ["commit-all-ghosts", "commit_new_rows"],
        ["purge-pending", "purge_pending"],
        ["vault/reset", "reset_vault"],
      ].map(([path, label]) => (
        <Button
          key={path}
          label={t(label)}
          isDisabled={a.mutation.isPending}
          variant="secondary"
          onClick={() =>
            a.confirm({ path: `/api/bank-sync/${path}`, body: {} }, t(label))
          }
        />
      ))}
      {settings.isError && <p role="alert">{t("connection_error")}</p>}
      {edit && settings.data && (
        <RecordEditor
          title={t("auto_sync_settings")}
          initial={settings.data}
          fields={[
            { name: "enabled", type: "checkbox" },
            { name: "interval_hours", type: "number", min: 1, step: 1 },
            { name: "sync_on_vault_unlock", type: "checkbox" },
          ]}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => setEdit(false)}
          onSave={async (body) => {
            const result = await a.save({
              path: "/api/bank-sync/settings/auto-sync",
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
