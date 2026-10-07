import * as stylex from "@stylexjs/stylex";
import React, { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { SideNav, SideNavItem, SideNavSection } from "@astryxdesign/core/SideNav";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { workflow } from "./Workflow.stylex";
import { useCompactNavigation } from "../lib/useCompactNavigation";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Icon } from "./Icon";
import { useLanguage } from "../lib/i18n";
import { useAppTheme, themeNames } from "../lib/theme";
import { legacyUrl } from "../lib/navigation";
import { styles as s } from "./Shell.stylex";
import { GlobalActions } from "./GlobalActions";
export function Shell({
  children,
  profile,
}: React.PropsWithChildren<{
  profile?: import("../lib/server/workspaces").Profile;
}>) {
  const { t, language, setLanguage } = useLanguage();
  const { name, setTheme, compact, toggleCompact } = useAppTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const page =
    pathname
      .replace(/^\/v2(?=\/|$)/, "")
      .split("/")
      .filter(Boolean)[0] || "dashboard";
  const pageKey =
    (
      {
        budgets: "budgets",
        summary: "summary",
        history: "history",
        accounts: "accounts",
        categories: "categories",
        recurrences: "recurrences",
        trends: "trends",
        simulator: "simulator",
        assistant: "assistant",
        settings: "settings",
        "bank-sync": "bank_sync",
        journal: "journal",
        imports: "imports",
        notifications: "notifications",
        overview: "overview",
        setup: "setup",
        unlock: "unlock_workspace",
      } as Record<string, string>
    )[page] || "dashboard";
  const mobile = useCompactNavigation();
  const navigate = useNavigate();
  useEffect(() => { setMenuOpen(false); }, [pathname, mobile]);
  const groups = [
    ["finance", [["/", "grid", "dashboard"], ["/history", "arrows", "history"], ["/accounts", "wallet", "accounts"], ["/budgets", "target", "budgets"], ["/recurrences", "calendar", "recurrences"]]],
    ["analysis", [["/overview", "grid", "overview"], ["/summary", "chart", "summary"], ["/trends", "chart", "trends"], ["/simulator", "chart", "simulator"]]],
    ["data_management", [["/bank-sync", "bank", "bank_sync"], ["/imports", "arrows", "imports"], ["/categories", "target", "categories"]]],
    ["tools", [["/assistant", "spark", "assistant"], ["/notifications", "calendar", "notifications"], ["/journal", "arrows", "journal"], ["/settings", "settings", "settings"]]],
  ] as const;
  const classicView = ({history: "all_operations", summary: "analytics", assistant: "chat", settings: "config", journal: "history", "bank-sync": "bank_sync"} as Record<string, string>)[page] || page;
  const appearance = <>
    <select aria-label={t("theme")} value={name} onChange={event => setTheme(event.target.value)} {...stylex.props(s.theme)}>
      {themeNames.map(theme => <option key={theme} value={theme}>{theme === "neutral" ? t("theme_neutral") : theme === "y2k" ? "Y2K" : theme[0].toUpperCase() + theme.slice(1)}</option>)}
    </select>
    <button aria-pressed={compact} onClick={toggleCompact} {...stylex.props(s.density)}>{t("compact")}</button>
    <button onClick={() => setLanguage(language === "fr" ? "en" : "fr")} aria-label={t("change_language")} {...stylex.props(s.lang)}>
      {language.toUpperCase()} <span {...stylex.props(s.langSpan)}>⌄</span>
    </button>
  </>;
  const navigation = <SideNav aria-label={t("navigation")} xstyle={workflow.navigation}
    header={<VStack gap={3} padding={2}>
      <Link to="/" {...stylex.props(s.brand)}><Icon name="bank" size={24} />OmniBank</Link>
      <Link to="/settings" search={{ section: "profiles" }} {...stylex.props(s.workspace, compact && s.compactWorkspace, workflow.workspace)}>
        <strong {...stylex.props(s.workspaceStrong)}>{profile?.name || t("workspace")}</strong>
        <Icon name="chevron" size={15} />
      </Link>
      {mobile && <HStack gap={2} wrap="wrap">{appearance}</HStack>}
    </VStack>}
    footer={<VStack gap={2} padding={2} xstyle={workflow.navigationFooter}>
      <HStack gap={2} vAlign="center"><Icon name="shield" size={16} /><Text type="supporting">{t("on_device")}</Text></HStack>
      <a href={legacyUrl(classicView)} {...stylex.props(s.return)}>{t("return_v1")}</a>
    </VStack>}>
    {groups.map(([heading, links]) => <SideNavSection key={heading} title={t(heading)}>
      {links.map(([view, icon, key]) => <SideNavItem key={view} label={t(key)} icon={<Icon name={icon} />}
        href={`/v2${view}`} isSelected={pageKey === key} size={compact ? "sm" : "md"}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); setMenuOpen(false); void navigate({to: view});
        }} />)}
    </SideNavSection>)}
  </SideNav>;
  return (
    <div
      data-ui-density={compact ? "compact" : "comfortable"}
      {...stylex.props(s.shell)}
    >
      <a href="#main" {...stylex.props(s.skip)}>
        {t("skip")}
      </a>
      {mobile ? <Dialog isOpen={menuOpen} width={360} maxHeight="90dvh" padding={3} onOpenChange={setMenuOpen}>
        <DialogHeader title={t("navigation")} />
        <Button label={t("close_menu")} variant="secondary" onClick={() => setMenuOpen(false)} />
        {navigation}
      </Dialog> : <aside aria-label={t("navigation")} {...stylex.props(s.sidebar, compact && s.compactSidebar, workflow.sidebarFrame)}>{navigation}</aside>}
      <div {...stylex.props(s.main)}>
        <header {...stylex.props(s.topbar, compact && s.compactTopbar)}>
          <div {...stylex.props(s.breadcrumb, mobile && workflow.mobileBreadcrumb)}>
            <Button
              label={menuOpen ? t("close_menu") : t("open_menu")}
              isIconOnly
              icon={<Icon name={menuOpen ? "close" : "menu"} />}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              xstyle={[s.menu]}
            />
            <span {...stylex.props(s.breadcrumbSpan)}>{t("workspace")}</span>
            <Icon name="chevron" size={13} {...stylex.props(s.breadcrumbSvg)} />
            <strong {...stylex.props(s.breadcrumbStrong, mobile && workflow.mobileTitle)}>{t(pageKey)}</strong>
          </div>
          <div {...stylex.props(s.topActions, mobile && workflow.mobileTopActions)}>
            <GlobalActions profileId={profile?.id} />
            {!mobile && appearance}
            <span {...stylex.props(s.local)}>
              <i {...stylex.props(s.localI)} />
              {t("local_storage")}
            </span>
          </div>
        </header>
        <main
          id="main"
          {...stylex.props(s.content, compact && s.compactContent)}
        >
          {children}
        </main>
        <footer data-app-footer {...stylex.props(s.footer)}>
          <span {...stylex.props(s.footerSpan)}>
            OmniBank Local <span {...stylex.props(s.footerSpanSpan)}>·</span>{" "}
            {t("footer")}
          </span>
          <span {...stylex.props(s.footerSpan)}>
            <Icon name="shield" size={13} />
            {t("private")}
          </span>
        </footer>
      </div>
    </div>
  );
}
