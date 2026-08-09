import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { AppShell } from './components/layout/AppShell';
import { SearchPage } from './components/search/SearchPage';
import { SettingsPage } from './components/settings/SettingsPage';

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const searchSchema = z.object({
  q: z.string().default(''),
  strategy: z.enum(['zlibrary', 'source']).default('source'),
  zlibraryUrl: z.string().default(''),
  sourceUrl: z.string().default(''),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search) => searchSchema.parse(search),
  component: SearchPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
