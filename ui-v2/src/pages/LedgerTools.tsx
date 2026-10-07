import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@astryxdesign/core/Button";
import { Confirmation } from "../components/Confirmation";
import { useLanguage } from "../lib/i18n";
export function LedgerTools() {
  const { t } = useLanguage();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const clear = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/transactions/all/clear", {
        method: "DELETE",
        headers: { "X-Confirm-Danger": "clear" },
      });
      if (!response.ok) throw new Error("Suppression impossible");
      return response.json();
    },
    onSuccess: () => {
      setConfirm(false);
      client.invalidateQueries();
    },
  });
  return (
    <>
      <Button
        label={t("clear_ledger")}
        variant="secondary"
        isDisabled={clear.isPending}
        onClick={() => {
          clear.reset();
          setConfirm(true);
        }}
      />
      <Confirmation
        pending={
          confirm
            ? {
                label: t("clear_ledger"),
                description: t("clear_ledger_warning"),
              }
            : null
        }
        busy={clear.isPending}
        error={clear.isError}
        onClose={() => setConfirm(false)}
        onConfirm={() => clear.mutate()}
      />
    </>
  );
}
