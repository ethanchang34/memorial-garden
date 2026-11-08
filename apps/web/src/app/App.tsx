import { MotionConfig } from 'motion/react';
import { RouterProvider } from 'react-router';
import { router } from '@/app/router';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={300}>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}
