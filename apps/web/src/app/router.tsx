import { createBrowserRouter, type RouteObject } from 'react-router';
import { RootLayout } from '@/app/RootLayout';
import { HomePage } from '@/features/home/HomePage';
import { CreateMemorialPage } from '@/features/memorials/CreateMemorialPage';
import { EditMemorialPage } from '@/features/memorials/EditMemorialPage';
import { MemorialPage } from '@/features/memorials/MemorialPage';
import { MyGardensPage } from '@/features/memorials/MyGardensPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { ProfileSettingsPage } from '@/features/profile/ProfileSettingsPage';

const uiPreviewRoutes: RouteObject[] =
  import.meta.env.DEV || import.meta.env.VITE_UI_PREVIEW === 'true'
    ? [
        {
          path: 'dev/ui',
          lazy: async () => ({
            Component: (await import('@/features/dev/UiPreviewPage')).UiPreviewPage,
          }),
        },
        {
          path: 'dev/art',
          lazy: async () => ({
            Component: (await import('@/features/dev/art/ArtPage')).ArtPage,
          }),
        },
        {
          path: 'dev/palettes',
          lazy: async () => ({
            Component: (await import('@/features/dev/palettes/PalettesPage')).PalettesPage,
          }),
        },
        {
          path: 'dev/og',
          lazy: async () => ({
            Component: (await import('@/features/dev/og/OgImagePage')).OgImagePage,
          }),
        },
        {
          path: 'dev/directions',
          lazy: async () => ({
            Component: (await import('@/features/dev/directions/DirectionsPage')).DirectionsPage,
          }),
        },
      ]
    : [];

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'settings/profile', element: <ProfileSettingsPage /> },
      { path: 'memorials', element: <MyGardensPage /> },
      { path: 'memorials/new', element: <CreateMemorialPage /> },
      { path: 'm/:slug', element: <MemorialPage /> },
      { path: 'm/:slug/edit', element: <EditMemorialPage /> },
      ...uiPreviewRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
