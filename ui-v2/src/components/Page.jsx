import * as stylex from "@stylexjs/stylex";
import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Shell } from "./Shell";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "./Pages.stylex.js";
export function Page({ title, subtitle, resource, actions, children }) {
  const { t } = useLanguage();
  return (
    <Shell profile={resource.profile}>
      <div {...stylex.props(s.heading)}>
        <div>
          <h1 {...stylex.props(s.headingH1)}>{t(title)}</h1>
          <p {...stylex.props(s.headingP)}>{t(subtitle)}</p>
        </div>
        <div {...stylex.props(s.actions)}>
          <Button
            label={t("refresh")}
            onClick={resource.refresh}
            isLoading={resource.loading}
            variant="secondary"
            xstyle={[s.actionsButton]}
          />
          {actions}
        </div>
      </div>
      {resource.error ? (
        <div role="alert" {...stylex.props(s.empty)}>
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
export function Field({ label, children, xstyle }) {
  return (
    <label {...stylex.props(s.field, xstyle)}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Editor({ title, onClose, children }) {
  const { t } = useLanguage();
  return (
    <section aria-label={title} {...stylex.props(s.editor)}>
      <div {...stylex.props(s.heading)}>
        <h2 {...stylex.props(s.headingH2)}>{title}</h2>
        <Button label={t("cancel")} variant="secondary" onClick={onClose} />
      </div>
      {children}
    </section>
  );
}
