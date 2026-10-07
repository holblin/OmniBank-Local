import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/HStack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, mutate } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { Icon } from "./Icon";
export function GlobalActions({ profileId }: { profileId?: string }) {
  const { t, privacy, togglePrivacy } = useLanguage();
  const client = useQueryClient();
  const status = useQuery({
    queryKey: ["journal", profileId, "global-status"],
    enabled: Boolean(profileId),
    queryFn: () =>
      get<{ can_undo: boolean; can_redo: boolean }>("/api/history/status"),
  });
  const action = useMutation({
    mutationFn: (kind: string) =>
      mutate(`/api/history/${kind}_last`, "POST", {}),
    onSuccess: () => client.invalidateQueries(),
  });
  return (
    <HStack gap={1}>
      <Button
        isIconOnly
        label={t(privacy ? "show_amounts" : "hide_amounts")}
        aria-pressed={privacy}
        icon={<Icon name="lock" />}
        variant="secondary"
        onClick={togglePrivacy}
      />
      <Button
        isIconOnly
        label={t("undo")}
        icon={<Icon name="arrows" />}
        variant="secondary"
        isDisabled={!status.data?.can_undo || action.isPending}
        onClick={() => action.mutate("undo")}
      />
      <Button
        isIconOnly
        label={t("redo")}
        icon={<Icon name="refresh" />}
        variant="secondary"
        isDisabled={!status.data?.can_redo || action.isPending}
        onClick={() => action.mutate("redo")}
      />
      {action.isError && <p role="alert">{t("save_error")}</p>}
    </HStack>
  );
}
