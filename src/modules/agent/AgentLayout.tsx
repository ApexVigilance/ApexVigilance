import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AgentHeader } from './layout/AgentHeader';
import { AgentSidebar } from './layout/AgentSidebar';

export const AgentLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      <AgentHeader onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      
      <div className="flex flex-1 pt-0">
        <AgentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main Content: Push margin on desktop to accommodate sidebar */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)] w-full overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};