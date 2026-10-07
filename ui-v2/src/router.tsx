import React, { useEffect, useRef } from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  lazyRouteComponent,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { Budgets } from "./pages/Budgets";
import { Summary } from "./pages/Summary";
import { History } from "./pages/History";
import { Dashboard } from "./pages/Dashboard";
const Accounts = lazyRouteComponent(
  () => import("./pages/Accounts"),
  "Accounts",
);
const Categories = lazyRouteComponent(
  () => import("./pages/Categories"),
  "Categories",
);
const Recurrences = lazyRouteComponent(
  () => import("./pages/Recurrences"),
  "Recurrences",
);
const Trends = lazyRouteComponent(() => import("./pages/Trends"), "Trends");
const Simulator = lazyRouteComponent(
  () => import("./pages/Simulator"),
  "Simulator",
);
const Assistant = lazyRouteComponent(
  () => import("./pages/Assistant"),
  "Assistant",
);
const Settings = lazyRouteComponent(
  () => import("./pages/Settings"),
  "Settings",
);
const BankSync = lazyRouteComponent(
  () => import("./pages/BankSync"),
  "BankSync",
);
const Journal = lazyRouteComponent(() => import("./pages/Journal"), "Journal");
const Imports = lazyRouteComponent(() => import("./pages/Imports"), "Imports");
const Notifications = lazyRouteComponent(
  () => import("./pages/Notifications"),
  "Notifications",
);
const Unlock = lazyRouteComponent(() => import("./pages/Unlock"), "Unlock");
const Setup = lazyRouteComponent(() => import("./pages/Setup"), "Setup");
const Overview = lazyRouteComponent(
  () => import("./pages/Overview"),
  "Overview",
);
import { Shell } from "./components/Shell";
import { useLanguage } from "./lib/i18n";
import { useWorkspace } from "./lib/server/workspaces";

function SetupEntry() {
  const status = useWorkspace<{ needs_setup: boolean }>("setup", "/api/setup/status");
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();
  const checkedProfiles = useRef(new Set<string>());
  useEffect(() => {
    const id = status.profile?.id;
    if (!id || !status.data || checkedProfiles.current.has(id)) return;
    checkedProfiles.current.add(id);
    // Check once per profile on entry, so setup links and dismissal stay usable.
    if (status.data.items.needs_setup && /^\/$/.test(pathname.replace(/^\/v2(?=\/|$)/, "") || "/")) {
      void navigate({ to: "/setup", replace: true });
    }
  }, [status.profile?.id, status.data, pathname, navigate]);
  return <Outlet />;
}

function Root() {
  const pathname = useLocation({ select: (location) => location.pathname });
  // Unlock must remain accessible before any profile-scoped queries run.
  return pathname.replace(/^\/v2(?=\/|$)/, "") === "/unlock" ? <Outlet /> : <SetupEntry />;
}

function NotFound() {
  const { t } = useLanguage();
  return (
    <Shell>
      <h1>{t("page_not_found")}</h1>
      <p>{t("page_not_found_body")}</p>
      <Link to="/">{t("dashboard")}</Link>
    </Shell>
  );
}

const rootRoute = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
});
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});
const budgetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/budgets",
  component: Budgets,
});
const summaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/summary",
  component: Summary,
});
const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  validateSearch: (
    search: Record<string, unknown>,
  ): { new?: number; category?: string; search?: string } => ({
    ...(search.new ? { new: Number(search.new) } : {}),
    ...(typeof search.category === "string"
      ? { category: search.category }
      : {}),
    ...(typeof search.search === "string" ? { search: search.search } : {}),
  }),
  component: History,
});
function pageRoute<const TPath extends string>(
  path: TPath,
  component: import("@tanstack/react-router").RouteComponent,
) {
  return createRoute({ getParentRoute: () => rootRoute, path, component });
}
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    dashboardRoute,
    budgetsRoute,
    summaryRoute,
    historyRoute,
    pageRoute("/unlock", Unlock),
    pageRoute("/accounts", Accounts),
    pageRoute("/categories", Categories),
    pageRoute("/recurrences", Recurrences),
    pageRoute("/trends", Trends),
    pageRoute("/simulator", Simulator),
    pageRoute("/assistant", Assistant),
    pageRoute("/settings", Settings),
    pageRoute("/bank-sync", BankSync),
    pageRoute("/journal", Journal),
    pageRoute("/imports", Imports),
    pageRoute("/notifications", Notifications),
    pageRoute("/overview", Overview),
    pageRoute("/setup", Setup),
  ]),
  basepath: "/v2",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
