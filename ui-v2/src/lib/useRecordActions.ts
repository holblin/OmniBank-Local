import { useState } from "react";
import { useWorkspaceWrite } from "./server/workspaces";
import { useLanguage } from "./i18n";
import type { Write, PendingAction } from "./ui-types";
export function useRecordActions<T extends object>(
  domain: string,
  profileId?: string,
) {
  const { t } = useLanguage();
  const mutation = useWorkspaceWrite(domain, profileId);
  const [editor, setEditor] = useState<Partial<T> | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const edit = (value: Partial<T> | null) => {
    mutation.reset();
    setEditor(value);
  };
  const confirm = (
    write: Write,
    label = t("delete"),
    description = t("confirm_record_action"),
  ) => {
    mutation.reset();
    setPending({ write, label, description });
  };
  const save = async (write: Write) => {
    try {
      const result = await mutation.mutateAsync(write);
      setEditor(null);
      setPending(null);
      return result;
    } catch {
      return undefined;
    }
  };
  return {
    mutation,
    editor,
    edit,
    pending,
    confirm,
    save,
    confirmation: {
      pending,
      busy: mutation.isPending,
      error: mutation.isError,
      onClose: () => setPending(null),
      onConfirm: () => (pending ? save(pending.write) : undefined),
    },
  };
}
