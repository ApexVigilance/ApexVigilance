import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { useNavigate } from 'react-router-dom';

interface AgentHeaderProps {
  onToggleSidebar: () => void;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-black border-b border-zinc-800 px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="text-zinc-400 hover:text-white mr-2 focus:outline-none md:hidden"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black border border-zinc-700 rounded flex items-center justify-center">
            <span className="font-black text-yellow-500 text-xs">A</span>
          </div>
          <span className="font-bold tracking-wider uppercase text-sm hidden sm:block text-white">Apex Agent</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{user?.username}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 rounded transition-colors"
          title="Uitloggen"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};