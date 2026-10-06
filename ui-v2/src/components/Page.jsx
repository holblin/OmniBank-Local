import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Shell } from "./Shell";
import { useLanguage } from "../lib/i18n";
import s from "./Pages.module.css";

export function Page({ title, subtitle, resource, actions, children }) {
  const { t } = useLanguage();
  return (
    <Shell profile={resource.profile}>
      <div className={s.heading}>
        <div>
          <h1>{t(title)}</h1>
          <p>{t(subtitle)}</p>
        </div>
        <div className={s.actions}>
          <Button
            label={t("refresh")}
            onClick={resource.refresh}
            isLoading={resource.loading}
            variant="secondary"
          />
          {actions}
        </div>
      </div>
      {resource.error ? (
        <div className={s.empty} role="alert">
          <h2>{t("connection_error")}</h2>
          <p>{t("connection_error_body")}</p>
          <Button label={t("retry")} onClick={resource.refresh} />
        </div>
      ) : resource.loading ? (
        <p role="status">{t("loading")}</p>
      ) : (
        children
      )}
    </Shell>
  );
}
export function Field({ label, children }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Editor({ title, onClose, children }) {
  const { t } = useLanguage();
  return (
    <section className={s.editor} aria-label={title}>
      <div className={s.heading}>
        <h2>{title}</h2>
        <Button label={t("cancel")} variant="secondary" onClick={onClose} />
      </div>
      {children}
    </section>
  );
}
