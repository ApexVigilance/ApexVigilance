import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  FileText, 
  AlertTriangle, 
  UserCircle, 
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../auth/store';
import clsx from 'clsx';

interface AgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { path: '/agent', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/agent/shifts', label: 'Shifts', icon: CalendarDays, end: false },
    { path: '/agent/tijdregistratie', label: 'Tijdregistratie', icon: Clock, end: false },
    { path: '/agent/rapporten', label: 'Rapporten', icon: FileText, end: false },
    { path: '/agent/incidenten', label: 'Incidenten', icon: AlertTriangle, end: false },
    { path: '/agent/profiel', label: 'Profiel', icon: UserCircle, end: false },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={clsx(
          "w-64 bg-black border-r border-zinc-800 h-[calc(100vh-64px)] fixed left-0 top-16 z-40 transition-transform duration-300 flex flex-col justify-between",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 group",
                  isActive 
                    ? "bg-zinc-900 text-yellow-500 border-l-4 border-yellow-500" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <Icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* Bottom Logout */}
        <div className="p-4 border-t border-zinc-800">
           <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 w-full text-left text-zinc-500 hover:text-red-500 hover:bg-zinc-900 group"
           >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Uitloggen</span>
           </button>
        </div>
      </aside>
    </>
  );
};