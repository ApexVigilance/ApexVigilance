import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import { useStore } from '../../../data/store';
import { useNavigate } from 'react-router-dom';

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

interface AgentHeaderProps {
  onToggleSidebar: () => void;
}

export const AgentHeader: React.FC<AgentHeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthStore();
  const { brandLogoBase64 } = useStore();
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
          {brandLogoBase64 ? (
            <img src={brandLogoBase64} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 px-2 bg-zinc-900 border border-yellow-600/50 rounded flex items-center justify-center">
              <span className="text-yellow-500 font-black tracking-widest text-xs">APEX</span>
            </div>
          )}
          <span className="font-bold tracking-wider uppercase text-sm hidden sm:block text-white">Agent Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm text-zinc-400 font-medium">{user?.username}</span>
        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-yellow-500 border border-zinc-700 font-bold text-xs cursor-default" title={user?.username}>
          {user ? getInitials(user.username) : '?'}
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