import { LedgerTools } from "./LedgerTools";
import type {
  FieldDefinition,
  FormValues,
  ResourceState as Resource,
} from "../lib/ui-types";
import type { Profile } from "../lib/server/workspaces";
import type {
  BackupStatus,
  LicenseStatus,
  OrganizationUser,
} from "../lib/server/workflow-models";
import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@astryxdesign/core/Button";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { Selector } from "@astryxdesign/core/Selector";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { AdvancedTools } from "../components/AdvancedTools";
import { workflow } from "../components/Workflow.stylex";
import { VStack } from "@astryxdesign/core/VStack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Page, Field } from "../components/Page";
import { Records } from "../components/Records";
import { RecordEditor } from "../components/RecordEditor";
import { Confirmation } from "../components/Confirmation";
import { ActionButton } from "../components/ActionButton";
import { useWorkspace, resource } from "../lib/server/workspaces";
import { useServerQueries } from "../lib/server/queries";
import { useRecordActions } from "../lib/useRecordActions";
import { mutate } from "../lib/http";
import { useLanguage } from "../lib/i18n";
import { styles as s } from "../components/Pages.stylex";
import {
  SettingsCollection,
  SharedStorage,
  Maintenance,
} from "./SettingsTools";
import { ConfigurationTools } from "./ConfigurationTools";
const settingsFields: FieldDefinition[] = [
  { name: "base_currency" },
  { name: "base_pay_day", type: "number", min: 1, max: 31, step: 1 },
  { name: "base_pay_amount", type: "number", min: 0 },
  {
    name: "recurrence_generation_months",
    type: "number",
    min: 1,
    max: 120,
    step: 1,
  },
  { name: "enable_bimonthly", type: "checkbox" },
  { name: "enable_attachments", type: "checkbox" },
  { name: "enable_simulator", type: "checkbox" },
  { name: "enable_org_mode", type: "checkbox" },
  { name: "ollama_url", type: "url" },
  { name: "ollama_model" },
  { name: "ollama_context", type: "number", min: 1024, step: 1 },
  { name: "enable_ai", type: "checkbox" },
  { name: "ai_reports_enabled", type: "checkbox" },
  {
    name: "ai_reports_frequency",
    options: ["daily", "weekly", "monthly"].map((value) => ({ value })),
  },
  { name: "enable_check_slips", type: "checkbox" },
  { name: "enable_overview", type: "checkbox" },
  { name: "ollama_temperature", type: "number", min: 0, max: 2 },
  { name: "auto_backup_enabled", type: "checkbox" },
  {
    name: "auto_backup_frequency",
    options: ["daily", "weekly", "monthly"].map((value) => ({ value })),
  },
  { name: "auto_backup_max_count", type: "number", min: 1, max: 100, step: 1 },
];
export function Settings() {
  const r = useServerQueries((id) => ({
    items: resource<Record<string, string>>(
      "configuration",
      id,
      "preferences",
      "/api/config/",
    ),
  }));
  const a = useRecordActions("configuration", r.profile?.id);
  const { t } = useLanguage();
  const sections = [
    ["workspace", ["preferences", "profiles", "backups"]],
    ["automation", ["label_rules", "exchange_rates", "assistant_memory"]],
    ["organization", ["license", "org_users", "shared_storage"]],
    ["support", ["diagnostics", "maintenance"]],
  ] as const;
  const sectionNames = sections.flatMap(([, values]) => [...values]);
  const routeSearch = useSearch({ from: "/settings" });
  const navigate = useNavigate();
  const requested = routeSearch.section || location.hash.slice(1);
  const section = sectionNames.find(value => value === requested) || "preferences";
  const [preferenceGroup, setPreferenceGroup] = useState("general_preferences");
  function selectSection(value: string) {
    void navigate({ to: "/settings", search: { section: value }, replace: true });
  }
  const preferenceGroups: Record<string, string[]> = {
    general_preferences: ["base_currency", "base_pay_day", "base_pay_amount", "recurrence_generation_months"],
    feature_preferences: ["enable_bimonthly", "enable_attachments", "enable_simulator", "enable_org_mode", "enable_check_slips", "enable_overview"],
    ai_preferences: ["enable_ai", "ollama_url", "ollama_model", "ollama_context", "ollama_temperature", "ai_reports_enabled", "ai_reports_frequency"],
    backup_preferences: ["auto_backup_enabled", "auto_backup_frequency", "auto_backup_max_count"],
  };
  const visibleFields = settingsFields.filter(field => preferenceGroups[preferenceGroup].includes(field.name));
  const initial: FormValues = {
    base_currency: r.profile?.currency || "EUR",
    base_pay_day: 28,
    recurrence_generation_months: 12,
    auto_backup_enabled: "true",
    auto_backup_frequency: "daily",
    auto_backup_max_count: 5,
    enable_simulator: "true",
    ollama_context: 4096,
    ollama_temperature: 0.2,
    ...r.data?.items,
  };
  settingsFields
    .filter((field) => field.type === "checkbox")
    .forEach((field) => {
      initial[field.name] = initial[field.name] === "true";
    });
  return (
    <Page title="settings" subtitle="settings_body" resource={r}>
      <section aria-label={t("settings")} {...stylex.props(workflow.settings)}>
        <VStack gap={3} xstyle={workflow.settingsDesktop}>
          <SideNav aria-label={t("settings")} xstyle={workflow.settingsNav}>
            {sections.map(([heading, values]) => <SideNavSection title={t(heading)} key={heading}>
              {values.map(value => <SideNavItem label={t(value)} key={value} isSelected={section === value}
                aria-controls="settings-panel" onClick={() => selectSection(value)} />)}
            </SideNavSection>)}
          </SideNav>
        </VStack>
        <VStack gap={4} xstyle={workflow.panel}>
          <VStack xstyle={workflow.settingsMobile}>
            <Selector label={t("settings_sections")} value={section} onChange={value => selectSection(String(value))}
              options={sectionNames.map(value => ({value, label: t(value)}))} presentation="adaptive" />
          </VStack>
          <section id="settings-panel" aria-label={t(section)}>
          <VStack gap={4}>
          <Heading level={2}>{t(section)}</Heading>
        {section === "preferences" && (
          <>
            <p>{t("theme_settings_help")}</p>
            <TabList value={preferenceGroup} onChange={setPreferenceGroup} aria-label={t("preferences")} hasDivider>
              {Object.keys(preferenceGroups).map(value => <Tab value={value} label={t(value)} key={value} />)}
            </TabList>
            <Text type="supporting">{t(`${preferenceGroup}_body`)}</Text>
            <Button
              label={t("edit_preferences")}
              onClick={() => a.edit(initial)}
            />
            <Records
              title="preferences"
              rows={visibleFields.map((field) => ({
                id: field.name,
                name: t(field.name),
                value:
                  field.type === "checkbox"
                    ? t(initial[field.name] ? "enabled" : "disabled")
                    : String(initial[field.name] ?? "—"),
              }))}
              columns={[{ key: "name" }, { key: "value" }]}
            />
            {preferenceGroup === "ai_preferences" && <AdvancedTools title={t("ai_tools")}>
              <ConfigurationTools profileId={r.profile?.id} />
            </AdvancedTools>}
            <AdvancedTools title={t("setup")}><Link to="/setup">{t("setup")}</Link></AdvancedTools>
          </>
        )}
        {section === "profiles" && <Profiles />}
        {section === "backups" && <Backups />}
        {section === "diagnostics" && <Diagnostics />}
        {section === "license" && <License />}
        {section === "org_users" && <OrganizationUsers />}
        {["label_rules", "exchange_rates", "assistant_memory"].includes(
          section,
        ) && <SettingsCollection key={section} name={section} />}
        {section === "shared_storage" && <SharedStorage />}
        {section === "maintenance" && <Maintenance />}
          </VStack>
          </section>
        </VStack>
      </section>
      {a.editor && (
        <RecordEditor
          title={t("edit_preferences")}
          fields={visibleFields}
          initial={a.editor}
          busy={a.mutation.isPending}
          error={a.mutation.isError}
          onClose={() => a.edit(null)}
          onSave={(body) =>
            a.save({
              path: "/api/config/",
              body: Object.fromEntries(
                Object.entries(body)
                  .filter(([, value]) => value !== null)
                  .map(([key, value]) => [key, String(value)]),
              ),
            })
          }
        />
      )}
    </Page>
  );
}
function ResourceState({
  resource: r,
  children,
}: {
  resource: Resource;
  children?: React.ReactNode;
}) {
  const { t } = useLanguage();
  if (r.error && !r.data) return <p role="alert">{t("connection_error")}</p>;
  if (r.loading) return <p role="status">{t("loading")}</p>;
  return (
    <>
      {r.error && <p role="alert">{t("stale_data")}</p>}
      {children}
    </>
  );
}
function Profiles() {
  const r = useWorkspace<{ profiles: Profile[] }>("profiles", "/api/profiles/");
  const a = useRecordActions<
    Profile & {
      switching: boolean;
      pin: string;
      deleting: boolean;
      reset_pin: boolean;
      setting_pin: boolean;
      removingPin: boolean;
      pinEditor: boolean;
      current_pin: string;
    }
  >("profiles", r.profile?.id);
  const { t } = useLanguage();
  const client = useQueryClient();
  const switchProfile = async (body: FormValues) => {
    const result = await a.save({
      path: `/api/profiles/${a.editor?.id}/activate`,
      body,
    });
    if (result) {
      sessionStorage.removeItem("omni_current_user");
      sessionStorage.setItem("omni_is_locked", "false");
      client.clear();
      window.location.assign("/v2");
    }
  };
  return (
    <ResourceState resource={r}>
      <VStack gap={4}>
        <Button
          label={t("new_profile")}
          onClick={() =>
            a.edit({ name: "", currency: "EUR", pay_cycle_day: 28, pin: "" })
          }
        />
        <Records
          title="profiles"
          rows={r.data?.items.profiles || []}
          columns={[
            { key: "name" },
            { key: "currency" },
            {
              key: "status",
              render: (row) =>
                row.id === r.profile?.id ? t("active") : t("available"),
            },
          ]}
          actions={(row) => (
            <>
              <ActionButton
                label={t("switch_profile")}
                icon="arrows"
                onClick={() => a.edit({ ...row, switching: true, pin: "" })}
              />
              {row.id === r.profile?.id && (
                <>
                  <ActionButton
                    label={t("edit")}
                    icon="edit"
                    onClick={() => a.edit(row)}
                  />
                  <ActionButton
                    label={t("set_pin")}
                    icon="shield"
                    onClick={() =>
                      a.edit({
                        ...row,
                        pinEditor: true,
                        pin: "",
                        current_pin: "",
                      })
                    }
                  />
                  {row.has_pin && (
                    <ActionButton
                      label={t("remove_pin")}
                      icon="close"
                      onClick={() =>
                        a.edit({ ...row, removingPin: true, current_pin: "" })
                      }
                    />
                  )}
                  {row.id !== "default" && (
                    <ActionButton
                      label={t("delete")}
                      icon="delete"
                      onClick={() =>
                        a.confirm(
                          { path: `/api/profiles/${row.id}`, method: "DELETE" },
                          t("delete"),
                          t("delete_profile_warning"),
                        )
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
        />
        {a.editor && (
          <RecordEditor
            title={t(
              a.editor?.switching
                ? "switch_profile"
                : a.editor?.removingPin
                  ? "remove_pin"
                  : a.editor?.pinEditor
                    ? "set_pin"
                    : "profiles",
            )}
            fields={
              a.editor?.removingPin
                ? [{ name: "current_pin", type: "password", required: true }]
                : a.editor?.switching
                  ? [
                      {
                        name: "pin",
                        type: "password",
                        required: a.editor.has_pin,
                      },
                    ]
                  : a.editor?.pinEditor
                    ? [
                        {
                          name: "current_pin",
                          type: "password",
                          required: a.editor.has_pin,
                        },
                        { name: "pin", type: "password", required: true },
                      ]
                    : [
                        { name: "name", required: true },
                        { name: "currency", required: true },
                        {
                          name: "pay_cycle_day",
                          type: "number",
                          min: 1,
                          max: 31,
                          step: 1,
                        },
                        { name: "pin", type: "password" },
                      ]
            }
            initial={a.editor}
            busy={a.mutation.isPending}
            error={a.mutation.isError}
            onClose={() => a.edit(null)}
            onSave={(body) =>
              a.editor?.removingPin
                ? a.confirm(
                    {
                      path: `/api/profiles/${a.editor?.id}/pin`,
                      method: "DELETE",
                      body,
                    },
                    t("remove_pin"),
                    t("remove_pin_warning"),
                  )
                : a.editor?.switching
                  ? switchProfile(body)
                  : a.save({
                      path: a.editor?.pinEditor
                        ? `/api/profiles/${a.editor?.id}/pin`
                        : `/api/profiles/${a.editor?.id || ""}`,
                      method:
                        a.editor?.id && !a.editor?.pinEditor ? "PUT" : "POST",
                      body: { ...body, auto_activate: false },
                    })
            }
          />
        )}
        <Confirmation
          {...a.confirmation}
          onConfirm={async () => {
            if (!a.pending) return;
            const result = await a.save(a.pending.write);
            if (result) {
              client.clear();
              sessionStorage.removeItem("omni_current_user");
              sessionStorage.setItem("omni_is_locked", "true");
              window.location.assign("/v2");
            }
          }}
        />
      </VStack>
    </ResourceState>
  );
}
function Backups() {
  const r = useWorkspace<BackupStatus>("backups", "/api/backup/auto/status");
  const a = useRecordActions("backups", r.profile?.id);
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [scope, setScope] = useState("profile");
  const [pending, setPending] = useState(false);
  const client = useQueryClient();
  const restore = useMutation({
    mutationKey: ["backups", r.profile?.id, "restore"],
    mutationFn: async () => {
      const body = new FormData();
      if (!file) throw new Error("Fichier requis");
      body.set("file", file);
      const response = await fetch(
        scope === "all" ? "/api/backup/upload-all" : "/api/backup/upload",
        {
          method: "POST",
          body,
        },
      );
      if (!response.ok) throw new Error("Restauration impossible");
      return response.json();
    },
    onSuccess: () => {
      client.clear();
      sessionStorage.removeItem("omni_current_user");
      sessionStorage.setItem("omni_is_locked", "true");
      window.location.reload();
    },
  });
  return (
    <ResourceState resource={r}>
      <VStack gap={4}>
        <LedgerTools />
        <a href="/api/backup/download">{t("download_backup")}</a>
        <a href="/api/backup/download-all">{t("download_all_backups")}</a>
        <Button
          label={t("create_backup")}
          isLoading={a.mutation.isPending}
          onClick={() => a.save({ path: "/api/backup/auto/trigger", body: {} })}
        />
        <Records
          title="backups"
          rows={r.data?.items.files || []}
          columns={[
            { key: "filename", label: "name" },
            { key: "size", label: "size" },
          ]}
          actions={(row) => (
            <a
              href={`/api/backup/auto/download/${encodeURIComponent(row.filename)}`}
            >
              {t("download")}
            </a>
          )}
        />
        <Field label={t("restore_backup")}>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </Field>
        <Field label={t("backup_scope")}>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            {...stylex.props(s.fieldSelect)}
          >
            <option value="profile">{t("current_profile")}</option>
            <option value="all">{t("all_profiles")}</option>
          </select>
        </Field>
        <Button
          label={t("restore_backup")}
          isDisabled={!file}
          onClick={() => setPending(true)}
        />
        <Confirmation
          pending={
            pending
              ? {
                  label: t("restore_backup"),
                  description: t(
                    scope === "all" ? "restore_all_warning" : "restore_warning",
                  ),
                }
              : null
          }
          busy={restore.isPending}
          error={restore.isError}
          onClose={() => setPending(false)}
          onConfirm={() => restore.mutate()}
        />
        {a.mutation.isError && <p role="alert">{t("save_error")}</p>}
      </VStack>
    </ResourceState>
  );
}
function Diagnostics() {
  const r = useWorkspace("diagnostics", "/api/diagnostics/report");
  const a = useRecordActions("diagnostics", r.profile?.id);
  const { t } = useLanguage();
  return (
    <ResourceState resource={r}>
      <VStack gap={4}>
        <pre {...stylex.props(s.diagnostic)}>
          {JSON.stringify(r.data?.items, null, 2)}
        </pre>
        <Button
          label={t("clear_diagnostics")}
          variant="secondary"
          onClick={() =>
            a.confirm(
              { path: "/api/diagnostics/clear", body: {} },
              t("clear_diagnostics"),
            )
          }
        />
        <Confirmation {...a.confirmation} />
      </VStack>
    </ResourceState>
  );
}
function License() {
  const r = useWorkspace<LicenseStatus>("license", "/api/license/status");
  const a = useRecordActions<{ email: string; key: string }>(
    "license",
    r.profile?.id,
  );
  const { t } = useLanguage();
  return (
    <ResourceState resource={r}>
      <VStack gap={4}>
        <p>{t(r.data?.items.active ? "license_active" : "license_inactive")}</p>
        {r.data?.items.email && <p>{r.data.items.email}</p>}
        <Button
          label={t("activate_license")}
          onClick={() => a.edit({ email: "", key: "" })}
        />
        {r.data?.items.active && (
          <Button
            label={t("deactivate_license")}
            variant="secondary"
            onClick={() =>
              a.confirm(
                { path: "/api/license/deactivate", body: {} },
                t("deactivate_license"),
              )
            }
          />
        )}{" "}
        {a.editor && (
          <RecordEditor
            title={t("activate_license")}
            fields={[
              { name: "email", type: "email", required: true },
              { name: "key", label: "license_key", required: true },
            ]}
            initial={a.editor}
            busy={a.mutation.isPending}
            error={a.mutation.isError}
            onClose={() => a.edit(null)}
            onSave={(body) => a.save({ path: "/api/license/activate", body })}
          />
        )}
        <Confirmation {...a.confirmation} />
      </VStack>
    </ResourceState>
  );
}
function OrganizationUsers() {
  const r = useWorkspace<OrganizationUser[]>("org-users", "/api/org-users/");
  const a = useRecordActions<OrganizationUser>("org-users", r.profile?.id);
  const { t } = useLanguage();
  return (
    <ResourceState resource={r}>
      <VStack gap={4}>
        <Button
          label={t("new_user")}
          onClick={() => a.edit({ name: "", is_active: true })}
        />
        <Records
          title="org_users"
          rows={r.data?.items || []}
          columns={[
            { key: "name" },
            {
              key: "status",
              render: (row) => t(row.is_active ? "active" : "closed"),
            },
          ]}
          actions={(row) => (
            <>
              <ActionButton
                label={t("edit")}
                icon="edit"
                onClick={() => a.edit(row)}
              />
              <ActionButton
                label={t("delete")}
                icon="delete"
                onClick={() =>
                  a.confirm({
                    path: `/api/org-users/${row.id}`,
                    method: "DELETE",
                  })
                }
              />
            </>
          )}
        />
        {a.editor && (
          <RecordEditor
            title={t("org_users")}
            fields={[
              { name: "name", required: true },
              { name: "is_active", type: "checkbox" },
            ]}
            initial={a.editor}
            busy={a.mutation.isPending}
            error={a.mutation.isError}
            onClose={() => a.edit(null)}
            onSave={(body) =>
              a.save({
                path: `/api/org-users/${a.editor?.id || ""}`,
                method: a.editor?.id ? "PUT" : "POST",
                body,
              })
            }
          />
        )}
        <Confirmation {...a.confirmation} />
      </VStack>
    </ResourceState>
  );
}
