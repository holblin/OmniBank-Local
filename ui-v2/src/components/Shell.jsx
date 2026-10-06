import * as stylex from "@stylexjs/stylex";
import React, { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Link, useLocation } from "@tanstack/react-router";
import { Icon } from "./Icon";
import { useLanguage } from "../lib/i18n";
import { useAppTheme, themeNames } from "../lib/theme";
import { legacyUrl } from "../lib/navigation";
import { styles as s } from "./Shell.stylex.js";
export function Shell({ children, profile }) {
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
      setup:'setup',unlock:'unlock_workspace',
    }[page] || "dashboard";
  const links = [
    ["/history", "arrows", "history"],
    ["/accounts", "wallet", "accounts"],
    ["/budgets", "target", "budgets"],
    ["/summary", "chart", "summary"],
    ["/recurrences", "calendar", "recurrences"],
    ["/categories", "target", "categories"],
    ["/trends", "chart", "trends"],
    ["/simulator", "chart", "simulator"],
  ];
  return (
    <div
      data-ui-density={compact ? "compact" : "comfortable"}
      {...stylex.props(s.shell)}
    >
      <a href="#main" {...stylex.props(s.skip)}>
        {t("skip")}
      </a>
      {menuOpen && (
        <button
          aria-label={t("close_menu")}
          onClick={() => setMenuOpen(false)}
          {...stylex.props(s.backdrop)}
        />
      )}
      <aside
        aria-label={t("navigation")}
        {...stylex.props(
          s.sidebar,
          menuOpen && s.sidebarOpen,
          compact && s.compactSidebar,
        )}
      >
        <Link to="/" {...stylex.props(s.brand)}>
          <span {...stylex.props(s.mark)}>
            <Icon name="bank" size={24} />
          </span>
          <span>
            OmniBank<small {...stylex.props(s.brandSmall)}>LOCAL</small>
          </span>
        </Link>
        <Link
          to="/settings"
          {...stylex.props(s.workspace, compact && s.compactWorkspace)}
        >
          <span {...stylex.props(s.avatar)}>
            {(profile?.name || "O").slice(0, 1).toUpperCase()}
          </span>
          <div {...stylex.props(s.workspaceDiv)}>
            <strong {...stylex.props(s.workspaceStrong)}>
              {profile?.name || t("workspace")}
            </strong>
            <small {...stylex.props(s.workspaceSmall)}>
              {t("personal_space")}
            </small>
          </div>
          <Icon name="chevron" size={15} />
        </Link>
        <p {...stylex.props(s.navLabel)}>{t("finance")}</p>
        <nav {...stylex.props(s.nav, compact && s.compactNav)}>
          <Link
            to="/"
            aria-current={pageKey === "dashboard" ? "page" : undefined}
            {...stylex.props(
              s.navA,
              pageKey === "dashboard" && s.navActive,
              compact && s.compactNavA,
            )}
          >
            <Icon name="grid" />
            <span>{t("dashboard")}</span>
            {pageKey === "dashboard" && <span {...stylex.props(s.activeDot)} />}
          </Link>
          {links.map(([view, icon, key]) =>
            view.startsWith("/") ? (
              <Link
                key={view}
                to={view}
                aria-current={pageKey === key ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                {...stylex.props(
                  s.navA,
                  pageKey === key && s.navActive,
                  compact && s.compactNavA,
                )}
              >
                <Icon name={icon} />
                <span>{t(key)}</span>
                {pageKey === key && <span {...stylex.props(s.activeDot)} />}
              </Link>
            ) : (
              <a
                key={view}
                href={legacyUrl(view)}
                title={t("opens_v1")}
                {...stylex.props(s.navA, compact && s.compactNavA)}
              >
                <Icon name={icon} />
                <span>{t(key)}</span>
                <span {...stylex.props(s.legacyLabel)}>V1</span>
              </a>
            ),
          )}
        </nav>
        <p {...stylex.props(s.navLabel)}>{t("tools")}</p>
        <nav {...stylex.props(s.nav, compact && s.compactNav)}>
          <Link
            to="/assistant"
            onClick={()=>setMenuOpen(false)}
            aria-current={pageKey==='assistant'?'page':undefined}
            {...stylex.props(s.navA,pageKey==='assistant'&&s.navActive, compact && s.compactNavA)}
          >
            <Icon name="spark" />
            <span>{t("assistant")}</span>
          </Link>
          <Link
            to="/settings"
            onClick={()=>setMenuOpen(false)}
            aria-current={pageKey==='settings'?'page':undefined}
            {...stylex.props(s.navA,pageKey==='settings'&&s.navActive, compact && s.compactNavA)}
          >
            <Icon name="settings" />
            <span>{t("settings")}</span>
          </Link>
        </nav>
        <div {...stylex.props(s.sidebarBottom)}>
          <div {...stylex.props(s.privacy)}>
            <Icon name="shield" size={24} />
            <strong {...stylex.props(s.privacyStrong)}>
              {t("privacy_title")}
            </strong>
            <p {...stylex.props(s.privacyP)}>{t("privacy_body")}</p>
            <span {...stylex.props(s.privacySpan)}>
              <i {...stylex.props(s.privacyI)} />
              {t("on_device")}
            </span>
          </div>
          <a
            href={legacyUrl(
              {
                history: "all_operations",
                summary: "analytics",
                budgets: "budgets",
                accounts: "accounts",
                categories: "categories",
                recurrences: "recurrences",
                trends: "trends",
                simulator: "simulator",
                assistant: "chat",
                settings: "config",
                "bank-sync": "bank_sync",
                journal: "history",
                overview: "overview",
              }[page] || "dashboard",
            )}
            {...stylex.props(s.return)}
          >
            <Icon name="arrows" size={16} />
            {t("return_v1")}
          </a>
        </div>
      </aside>
      <div {...stylex.props(s.main)}>
        <header {...stylex.props(s.topbar, compact && s.compactTopbar)}>
          <div {...stylex.props(s.breadcrumb)}>
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
            <strong {...stylex.props(s.breadcrumbStrong)}>{t(pageKey)}</strong>
          </div>
          <div {...stylex.props(s.topActions)}>
            <select
              aria-label={t("theme")}
              value={name}
              onChange={(event) => setTheme(event.target.value)}
              {...stylex.props(s.theme)}
            >
              {themeNames.map((theme) => (
                <option key={theme} value={theme}>
                  {theme === "neutral"
                    ? t("theme_neutral")
                    : theme === "y2k"
                      ? "Y2K"
                      : theme[0].toUpperCase() + theme.slice(1)}
                </option>
              ))}
            </select>
            <button
              aria-pressed={compact}
              onClick={toggleCompact}
              {...stylex.props(s.density)}
            >
              {t("compact")}
            </button>
            <Badge
              label={t("beta")}
              variant="neutral"
              xstyle={[s.topActionsBadge]}
            />
            <span {...stylex.props(s.local)}>
              <i {...stylex.props(s.localI)} />
              {t("local_storage")}
            </span>
            <button
              onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
              aria-label={t("change_language")}
              {...stylex.props(s.lang)}
            >
              {language.toUpperCase()}{" "}
              <span {...stylex.props(s.langSpan)}>⌄</span>
            </button>
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
