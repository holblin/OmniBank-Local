import React from "react";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { useLanguage } from "../lib/i18n";
import { useRestoreFocus } from "../lib/useRestoreFocus";

export function Confirmation({ pending, busy, error, onClose, onConfirm }) {
  return (
    pending && (
      <ConfirmationDialog
        pending={pending}
        busy={busy}
        error={error}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )
  );
}
function ConfirmationDialog({ pending, busy, error, onClose, onConfirm }) {
  useRestoreFocus();
  const { t } = useLanguage();
  return (
    pending && (
      <AlertDialog
        isOpen
        title={pending.label || t("delete")}
        description={`${pending.description}${error ? ` ${t("save_error")}` : ""}`}
        actionLabel={pending.label || t("delete")}
        cancelLabel={t("cancel")}
        isActionLoading={busy}
        onOpenChange={(open) => {
          if (!open && !busy) onClose();
        }}
        onAction={onConfirm}
      />
    )
  );
}
