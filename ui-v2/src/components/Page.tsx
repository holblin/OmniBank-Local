import * as stylex from "@stylexjs/stylex";
import React from "react";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Spinner } from "@astryxdesign/core/Spinner";
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
      <HStack xstyle={s.heading} wrap="wrap" vAlign="center" hAlign="between">
        <VStack gap={1}>
          <Heading level={1} xstyle={s.headingH1}>{t(title)}</Heading>
          <Text type="supporting">{t(subtitle)}</Text>
        </VStack>
        <HStack gap={2} wrap="wrap" xstyle={s.actions}>
          <Button
            label={t("refresh")}
            onClick={resource.refresh}
            isLoading={resource.fetching}
            variant="secondary"
            xstyle={[s.actionsButton]}
          />
          {actions}
        </HStack>
      </HStack>
      {Boolean(resource.data) && resource.error && (
        <p role="alert" {...stylex.props(s.error)}>
          {t("stale_data")}
        </p>
      )}
      {Boolean(resource.data) && resource.fetching && (
        <p role="status">{t("refreshing")}</p>
      )}
      {resource.error && !resource.data ? (
        <section role="alert">
          <EmptyState title={t("connection_error")} description={t("connection_error_body")}
            actions={<Button label={t("retry")} onClick={resource.refresh} />} />
        </section>
      ) : resource.loading ? (
        <HStack gap={2} vAlign="center" role="status"><Spinner /><Text>{t("loading")}</Text></HStack>
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
  actions,
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
          <LayoutFooter hasDivider>
            <HStack gap={2} hAlign="end" wrap="wrap" width="100%">
            <Button
              label={t("cancel")}
              variant="secondary"
              isDisabled={busy}
              onClick={onClose}
            />
            {actions}
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
