
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ShieldAlert, 
  Clock, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  FileCheck,
  Settings 
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: 'nav.dashboard', icon: LayoutDashboard },
    { path: '/personeel', label: 'nav.personeel', icon: Users },
    { path: '/planning', label: 'nav.planning', icon: CalendarDays },
    { path: '/shifts', label: 'nav.shifts', icon: ShieldAlert },
    { path: '/tijdregistraties', label: 'nav.tijdregistraties', icon: Clock },
    { path: '/rapporten', label: 'nav.rapporten', icon: FileText },
    { path: '/incidenten', label: 'nav.incidenten', icon: AlertTriangle },
    { path: '/klanten', label: 'nav.klanten', icon: MapPin },
    { path: '/facturatie', label: 'nav.facturatie', icon: FileCheck },
  ];

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
          "w-64 bg-apex-black border-r border-zinc-800 h-[calc(100vh-64px)] overflow-y-auto fixed left-0 top-16 z-40 transition-transform duration-300 flex flex-col justify-between",
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
                onClick={onClose}
                className={({ isActive }) => clsx(
                  "flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 group",
                  isActive 
                    ? "bg-zinc-900 text-apex-gold border-l-4 border-apex-gold" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <Icon className="w-5 h-5 group-hover:scale-105 transition-transform" />
                <span className="font-medium text-sm tracking-wide">{t(item.label)}</span>
              </NavLink>
            );
          })}
        </nav>
        
        {/* Settings Link */}
        <div className="p-4 border-t border-zinc-800">
           <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 group",
                isActive ? "text-white bg-zinc-900" : "text-zinc-500 hover:text-white"
              )}
           >
              <Settings className="w-5 h-5" />
              <span className="font-medium text-sm">Instellingen</span>
           </NavLink>
           <div className="mt-2 text-xs text-zinc-700 text-center uppercase tracking-widest">
             Apex Ops v1.1
           </div>
        </div>
      </aside>
    </>
  );
};
