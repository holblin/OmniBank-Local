import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { Link } from "@tanstack/react-router";
import { Page } from "../components/Page";
import { Confirmation } from "../components/Confirmation";
import { useWorkspace } from "../lib/server/workspaces";
import { useRecordActions } from "../lib/useRecordActions";
import { useLanguage } from "../lib/i18n";
export function Setup() {
  const r = useWorkspace("setup", "/api/setup/status");
  const a = useRecordActions("journal", r.profile?.id);
  const { t } = useLanguage();
  return (
    <Page title="setup" subtitle="setup_body" resource={r}>
      <VStack gap={5}>
        <h2>{t("setup_account")}</h2>
        <Link to="/accounts">{t("new_account")}</Link>
        <h2>{t("setup_preferences")}</h2>
        <Link to="/settings">{t("settings")}</Link>
        <h2>{t("setup_statement")}</h2>
        <Link to="/imports">{t("imports")}</Link>
        <p>{t("setup_demo_help")}</p>
        <Button
          label={t("load_demo")}
          variant="secondary"
          isDisabled={!r.data?.items.needs_setup}
          onClick={() =>
            a.confirm(
              { path: "/api/setup/seed-demo", body: {} },
              t("load_demo"),
              t("load_demo_warning"),
            )
          }
        />
        {a.mutation.isSuccess && <Link to="/">{t("dashboard")}</Link>}
        <Confirmation {...a.confirmation} />
      </VStack>
    </Page>
  );
}
