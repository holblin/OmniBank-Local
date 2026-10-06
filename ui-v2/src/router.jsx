import React from "react";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  lazyRouteComponent,
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
  component: Outlet,
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
  component: History,
});
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    dashboardRoute,
    budgetsRoute,
    summaryRoute,
    historyRoute,
    ...Object.entries({
      unlock: Unlock,
      accounts: Accounts,
      categories: Categories,
      recurrences: Recurrences,
      trends: Trends,
      simulator: Simulator,
      assistant: Assistant,
      settings: Settings,
      "bank-sync": BankSync,
      journal: Journal,
      imports: Imports,
      notifications: Notifications,
      overview: Overview,
      setup: Setup,
    }).map(([path, component]) =>
      createRoute({
        getParentRoute: () => rootRoute,
        path: `/${path}`,
        component,
      }),
    ),
  ]),
  basepath: "/v2",
  scrollRestoration: true,
});
