import React from 'react';
import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router';
import { Dashboard } from './pages/Dashboard';
import { Shell } from './components/Shell';
import { useLanguage } from './lib/i18n';

function NotFound() {
  const { t } = useLanguage();
  return <Shell><h1>{t('page_not_found')}</h1><p>{t('page_not_found_body')}</p><Link to="/">{t('dashboard')}</Link></Shell>;
}

const rootRoute = createRootRoute({ component: Outlet, notFoundComponent: NotFound });
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Dashboard });
export const router = createRouter({ routeTree: rootRoute.addChildren([dashboardRoute]), basepath: '/v2', scrollRestoration: true });
