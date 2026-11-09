import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from '@/app/router';
import { createAppServices, ServicesContext } from '@/app/services';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider } from '@/features/auth/SessionProvider';

export function App() {
  const [services] = useState(createAppServices);
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }),
  );

  return (
    <MotionConfig reducedMotion="user">
      <ServicesContext value={services}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <TooltipProvider delayDuration={300}>
              <RouterProvider router={router} />
              <Toaster />
            </TooltipProvider>
          </SessionProvider>
        </QueryClientProvider>
      </ServicesContext>
    </MotionConfig>
  );
}
