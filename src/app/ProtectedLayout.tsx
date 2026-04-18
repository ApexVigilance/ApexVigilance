import React, { useState, useEffect } from 'react';
import { Header } from '../ui/Header';
import { Sidebar } from '../ui/Sidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../modules/auth/store';

export const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, resetIdleTimer, isAuthenticated } = useAuthStore();

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Session timeout: check every minute, reset on user activity
  useEffect(() => {
    const SESSION_MS = 8 * 60 * 60 * 1000;
    const LAST_ACTIVE_KEY = 'apex_last_active';

    const checkTimeout = () => {
      const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0', 10);
      if (lastActive > 0 && Date.now() - lastActive > SESSION_MS) {
        logout();
        navigate('/login');
      }
    };

    const onActivity = () => resetIdleTimer();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const interval = setInterval(checkTimeout, 60_000);
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
  }, [logout, navigate, resetIdleTimer]);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-gray-100">
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Main content: Remove left margin on mobile, keep on desktop */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)] overflow-y-auto transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};