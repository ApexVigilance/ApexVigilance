
import React, { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useStore } from '../data/store';

export const App: React.FC = () => {
  const { runDailyBadgeCheck, employees, hydrateConfig } = useStore();
  const ranOnce = useRef(false);

  useEffect(() => {
    // HYDRATE CONFIGURATION (Pricing, SMTP, Logo, etc)
    hydrateConfig();

    // GUARD: Ensure data is loaded first
    if (!employees || employees.length === 0) return;

    // GUARD: Run once per mount (Fixes duplicates in StrictMode and ensures run on refresh)
    if (!ranOnce.current) {
        runDailyBadgeCheck();
        ranOnce.current = true;
    }
  }, [runDailyBadgeCheck, employees, hydrateConfig]);

  return (
    <>
      <style>{`
        /* Global Modal Fix: Lift modals (z-50) above sticky headers (z-50) but keep below higher z-indexes (60+) */
        .fixed.z-50 { z-index: 55 !important; }
      `}</style>
      <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />
    </>
  );
};
