import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Page, Field } from "../components/Page";
import { useServerQueries, accounts } from "../lib/server/queries";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
export function Imports() {
  const r = useServerQueries((id) => ({ items: accounts.list(id) }));
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [account, setAccount] = useState("");
  const client = useQueryClient();
  const upload = useMutation({
    mutationKey: ["imports", r.profile?.id, "preview"],
    mutationFn: async () => {
      if (!r.data || !file) throw new Error("Fichier requis");
      const body = new FormData();
      body.set("file", file);
      if (account) body.set("account_id", account);
      const response = await fetch("/api/csv/import_to_pending", {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error("Import impossible");
      return response.json();
    },
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["bank-sync", r.profile?.id] }),
  });
  return (
    <Page title="imports" subtitle="imports_body" resource={r}>
      <VStack gap={4}>
        <Field label={t("select_account")}>
          <select
            value={account}
            onChange={(event) => setAccount(event.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="">{t("detect_accounts")}</option>
            {r.data?.items.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("statement_file")}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => {
              setFile(event.target.files[0] || null);
              upload.reset();
            }}
          />
        </Field>
        <Button
          label={t("prepare_import")}
          isLoading={upload.isPending}
          isDisabled={!file}
          onClick={() => upload.mutate()}
        />
        {upload.isError && <p role="alert">{t("import_error")}</p>}
        {upload.isSuccess && <p role="status">{t("import_prepared")}</p>}
        <Link to="/bank-sync">{t("pending_review")}</Link>
        <a href="/api/csv/export">{t("export_csv")}</a>
      </VStack>
    </Page>
  );
}
