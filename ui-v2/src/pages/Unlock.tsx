import type { Profile } from "../lib/server/workspaces";
import type { OrganizationUser } from "../lib/server/workflow-models";
import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Shell } from "../components/Shell";
import { Field } from "../components/Page";
import { get, mutate } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
export function Unlock() {
  const { t } = useLanguage();
  const [pin, setPin] = useState("");
  const [user, setUser] = useState("");
  const profile = useQuery({
    queryKey: ["profiles", "active"],
    queryFn: ({ signal }) => get<Profile>("/api/profiles/active", signal),
  });
  const config = useQuery({
    queryKey: ["configuration"],
    queryFn: ({ signal }) =>
      get<Record<string, string>>("/api/config/", signal),
  });
  const org = config.data?.enable_org_mode === "true";
  const users = useQuery({
    queryKey: ["org-users", profile.data?.id, "access"],
    queryFn: ({ signal }) => get<OrganizationUser[]>("/api/org-users/", signal),
    enabled: Boolean(org && profile.data),
  });
  const client = useQueryClient();
  const unlock = useMutation({
    mutationKey: ["profiles", "unlock"],
    mutationFn: async () => {
      if (!profile.data) throw new Error("Profil indisponible");
      if (
        profile.data.has_pin &&
        sessionStorage.getItem("omni_is_locked") !== "false"
      )
        await mutate(`/api/profiles/${profile.data.id}/activate`, "POST", {
          pin,
        });
      if (org && !user) throw new Error("Utilisateur requis");
      sessionStorage.setItem("omni_is_locked", "false");
      if (org) sessionStorage.setItem("omni_current_user", user);
    },
    onSuccess: () => {
      client.clear();
      window.location.replace("/v2");
    },
  });
  return (
    <Shell profile={profile.data}>
      <VStack gap={5} maxWidth={480}>
        <h1>{t("unlock_workspace")}</h1>
        <p>{t("unlock_body")}</p>
        {profile.isPending && <p role="status">{t("loading")}</p>}
        {(profile.isError || config.isError) && (
          <p role="alert">{t("connection_error")}</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            unlock.mutate();
          }}
        >
          <VStack gap={4}>
            {profile.data?.has_pin &&
              sessionStorage.getItem("omni_is_locked") !== "false" && (
                <Field label={t("pin")}>
                  <input
                    type="password"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    autoComplete="off"
                    {...stylex.props(s.fieldInput)}
                  />
                </Field>
              )}
            {org && (
              <Field label={t("user")}>
                <select
                  required
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  {...stylex.props(s.fieldSelect)}
                >
                  <option value="">{t("select_user")}</option>
                  {users.data
                    ?.filter((row) => row.is_active)
                    .map((row) => (
                      <option key={row.id} value={row.name}>
                        {row.name}
                      </option>
                    ))}
                </select>
              </Field>
            )}
            {unlock.isError && <p role="alert">{t("unlock_error")}</p>}
            <Button
              type="submit"
              label={t("unlock_workspace")}
              isLoading={unlock.isPending}
              isDisabled={!profile.data || !config.data}
            />
          </VStack>
        </form>
      </VStack>
    </Shell>
  );
}
