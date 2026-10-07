import * as stylex from "@stylexjs/stylex";
import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { useRestoreFocus } from "../lib/useRestoreFocus";
import { Shell } from "./Shell";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "./Pages.stylex";
export function Page({
  title,
  subtitle,
  resource,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  resource: import("../lib/ui-types").ResourceState;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
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
            isLoading={resource.fetching}
            variant="secondary"
            xstyle={[s.actionsButton]}
          />
          {actions}
        </div>
      </div>
      {Boolean(resource.data) && resource.error && (
        <p role="alert" {...stylex.props(s.error)}>
          {t("stale_data")}
        </p>
      )}
      {Boolean(resource.data) && resource.fetching && (
        <p role="status">{t("refreshing")}</p>
      )}
      {resource.error && !resource.data ? (
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
export function Field({
  label,
  children,
  xstyle,
}: {
  label: React.ReactNode;
  children?: React.ReactNode;
  xstyle?: import("../lib/ui-types").XStyle;
}) {
  return (
    <label {...stylex.props(s.field, xstyle)}>
      <span>{label}</span>
      {React.isValidElement<{ "aria-label"?: string }>(children) &&
      typeof children.type === "string" &&
      ["input", "select", "textarea"].includes(children.type)
        ? React.cloneElement(children, {
            "aria-label":
              children.props["aria-label"] ??
              (typeof label === "string" ? label : undefined),
          })
        : children}
    </label>
  );
}
export function Editor({
  title,
  onClose,
  children,
  busy,
  error,
}: import("../lib/ui-types").EditorProps) {
  useRestoreFocus();
  const { t } = useLanguage();
  return (
    <Dialog
      isOpen
      purpose={busy ? "required" : "form"}
      width={720}
      maxHeight="85dvh"
      padding={0}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Layout
        padding={4}
        header={
          <DialogHeader
            title={title}
            hasDivider
            onOpenChange={
              busy
                ? undefined
                : (open) => {
                    if (!open) onClose();
                  }
            }
          />
        }
        content={
          <LayoutContent>
            {error && (
              <p role="alert" {...stylex.props(s.error)}>
                {t("save_error")}
              </p>
            )}
            {children}
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <Button
              label={t("cancel")}
              variant="secondary"
              isDisabled={busy}
              onClick={onClose}
            />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
