import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { useQuery } from "@tanstack/react-query";
import { get } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { useRecordActions } from "../lib/useRecordActions";
import { localDate } from "../lib/navigation";
import type { Account, Transaction } from "../lib/server/models";
interface Profile {
  id: string;
  name: string;
}
export function CrossProfileTransfers({
  profileId,
  accounts,
}: {
  profileId?: string;
  accounts: Account[];
}) {
  const { t, money } = useLanguage();
  const a = useRecordActions("transactions", profileId);
  const [target, setTarget] = useState("");
  const [edit, setEdit] = useState(false);
  const profiles = useQuery({
    queryKey: ["profiles", "transfer-options"],
    queryFn: () => get<{ profiles: Profile[] }>("/api/profiles/"),
    enabled: Boolean(profileId),
  });
  const remote = useQuery({
    queryKey: ["profiles", target, "transfer-accounts"],
    queryFn: () =>
      get<{ id: number; name: string }[]>(
        `/api/cross-profile/${target}/accounts`,
      ),
    enabled: Boolean(target && profileId),
  });
  const pending = useQuery({
    queryKey: ["transactions", profileId, "cross-profile-pending"],
    queryFn: () =>
      get<
        (Transaction & {
          cross_profile_link_id: string;
          cross_profile_label: string;
        })[]
      >("/api/cross-profile/pending"),
    enabled: Boolean(profileId),
  });
  return (
    <details>
      <summary>{t("cross_profile_transfers")}</summary>
      <VStack gap={3}>
        <Field label={t("target_profile")}>
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">{t("none")}</option>
            {profiles.data?.profiles
              .filter((row) => row.id !== profileId)
              .map((row) => (
                <option value={row.id} key={row.id}>
                  {row.name}
                </option>
              ))}
          </select>
        </Field>
        <Button
          label={t("new_transfer")}
          isDisabled={!remote.data?.length}
          onClick={() => setEdit(true)}
        />
        <Records
          title="pending_transfers"
          rows={pending.data || []}
          columns={[
            { key: "description" },
            { key: "cross_profile_label", label: "target_profile" },
            { key: "amount", render: (row) => money(row.amount) },
            { key: "date_operation", label: "date" },
          ]}
          actions={(row) => (
            <>
              {["accept", "reject"].map((action) => (
                <Button
                  key={action}
                  label={t(action)}
                  onClick={() =>
                    a.confirm(
                      {
                        path: `/api/cross-profile/validate/${row.cross_profile_link_id}`,
                        body: { action },
                      },
                      t(action),
                    )
                  }
                />
              ))}
            </>
          )}
        />
        {(remote.isError || pending.isError || a.mutation.isError) && (
          <p role="alert">{t("save_error")}</p>
        )}
        {edit && (
          <RecordEditor
            title={t("new_transfer")}
            initial={{
              description: t("new_transfer"),
              amount: 0,
              date_operation: localDate(),
            }}
            fields={[
              {
                name: "source_account_id",
                label: "from_account",
                required: true,
                options: accounts.map((row) => ({
                  value: row.id,
                  label: row.name,
                })),
              },
              {
                name: "target_account_id",
                label: "to_account",
                required: true,
                options: (remote.data || []).map((row) => ({
                  value: row.id,
                  label: row.name,
                })),
              },
              { name: "description", required: true },
              { name: "amount", type: "number", min: 0.01, required: true },
              {
                name: "date_operation",
                label: "date",
                type: "date",
                required: true,
              },
              { name: "category" },
            ]}
            busy={a.mutation.isPending}
            error={a.mutation.isError}
            onClose={() => setEdit(false)}
            onSave={async (body) => {
              const result = await a.save({
                path: "/api/cross-profile/transfer",
                body: {
                  ...body,
                  target_profile_id: target,
                  source_account_id: Number(body.source_account_id),
                  target_account_id: Number(body.target_account_id),
                  created_by: sessionStorage.getItem("omni_current_user"),
                },
              });
              if (result) setEdit(false);
            }}
          />
        )}
        <Confirmation {...a.confirmation} />
      </VStack>
    </details>
  );
}
