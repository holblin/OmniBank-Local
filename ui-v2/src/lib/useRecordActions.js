import { useState } from "react";
import { useWorkspaceWrite } from "./server/workspaces";
import { useLanguage } from "./i18n";
export function useRecordActions(domain, profileId) {
  const { t } = useLanguage();
  const mutation = useWorkspaceWrite(domain, profileId);
  const [editor, setEditor] = useState(null);
  const [pending, setPending] = useState(null);
  const edit = (value) => {
    mutation.reset();
    setEditor(value);
  };
  const confirm = (
    write,
    label = t("delete"),
    description = t("confirm_record_action"),
  ) => {
    mutation.reset();
    setPending({ write, label, description });
  };
  const save = async (write) => {
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
      onConfirm: () => save(pending.write),
    },
  };
}
