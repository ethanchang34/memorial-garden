import { createBrowserRouter, type RouteObject } from 'react-router';
import { RootLayout } from '@/app/RootLayout';
import { HomePage } from '@/features/home/HomePage';
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
      ...uiPreviewRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
