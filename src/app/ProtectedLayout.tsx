import React, { useState, useEffect } from 'react';
import { Header } from '../ui/Header';
import { Sidebar } from '../ui/Sidebar';
import { Outlet, useLocation } from 'react-router-dom';

export const ProtectedLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-gray-100">
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="flex pt-16">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Main content: Remove left margin on mobile, keep on desktop */}
        <main className="flex-1 md:ml-64 p-8 min-h-[calc(100vh-64px)] overflow-y-auto transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};