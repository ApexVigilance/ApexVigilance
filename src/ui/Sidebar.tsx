
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../modules/auth/store';
import { useStore } from '../data/store';
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
  Settings,
  UserPlus
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { pendingRegistrations } = useStore();
  const pendingRegCount = pendingRegistrations.filter(r => r.status === 'PENDING').length;

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

  const registratiesItem = { path: '/registraties', label: 'Registraties', icon: UserPlus };

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
          "w-64 bg-[#08090a]/98 backdrop-blur-md border-r border-white/[0.06] h-[calc(100vh-64px)] overflow-y-auto fixed left-0 top-16 z-40 transition-transform duration-300 flex flex-col justify-between",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => clsx(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                  isActive
                    ? "bg-[#5e6ad2]/12 text-[#7170ff] border border-[#5e6ad2]/25"
                    : "text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.05] border border-transparent"
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="font-medium text-sm">{t(item.label)}</span>
              </NavLink>
            );
          })}

          <NavLink
            to={registratiesItem.path}
            onClick={onClose}
            className={({ isActive }) => clsx(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
              isActive
                ? "bg-[#5e6ad2]/12 text-[#7170ff] border border-[#5e6ad2]/25"
                : "text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/[0.05] border border-transparent"
            )}
          >
            <UserPlus className="w-[18px] h-[18px] shrink-0" />
            <span className="font-medium text-sm flex-1">{registratiesItem.label}</span>
            {pendingRegCount > 0 && (
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingRegCount}
              </span>
            )}
          </NavLink>
        </nav>

        {/* Settings Link (admin only) */}
        <div className="p-3 border-t border-white/[0.06]">
          {user?.role === 'admin' && (
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) => clsx(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 group border",
                isActive
                  ? "bg-white/[0.05] text-white border-white/10"
                  : "text-[#62666d] hover:text-[#f7f8f8] hover:bg-white/[0.04] border-transparent"
              )}
            >
              <Settings className="w-[18px] h-[18px]" />
              <span className="font-medium text-sm">Instellingen</span>
            </NavLink>
          )}
          <div className="mt-3 text-[10px] text-[#3a3d44] text-center uppercase tracking-[0.2em]">
            Apex Ops v1.1
          </div>
        </div>
      </aside>
    </>
  );
};
