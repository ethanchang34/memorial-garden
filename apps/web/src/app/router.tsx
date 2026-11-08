import { createBrowserRouter, type RouteObject } from 'react-router';
import { RootLayout } from '@/app/RootLayout';
import { HomePage } from '@/features/home/HomePage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';

const uiPreviewRoutes: RouteObject[] =
  import.meta.env.DEV || import.meta.env.VITE_UI_PREVIEW === 'true'
    ? [
        {
          path: 'dev/ui',
          lazy: async () => ({
            Component: (await import('@/features/dev/UiPreviewPage')).UiPreviewPage,
          }),
        },
      ]
    : [];

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      ...uiPreviewRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
