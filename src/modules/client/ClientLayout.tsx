import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../auth/store';
import { useStore } from '../../data/store';
import {
  LayoutDashboard, CalendarCheck, Clock, FileText,
  AlertTriangle, User, LogOut, Menu, X, Building2
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/client', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/client/aanvragen', label: 'Aanvragen', icon: CalendarCheck },
  { to: '/client/shifts', label: 'Shifts', icon: Clock },
  { to: '/client/facturen', label: 'Facturen', icon: FileText },
  { to: '/client/incidenten', label: 'Incidenten', icon: AlertTriangle },
  { to: '/client/profiel', label: 'Profiel', icon: User },
];

export const ClientLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { brandLogoBase64, shiftRequests } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingRequests = shiftRequests.filter(r => r.clientId === user?.clientId && r.status === 'Pending').length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        {brandLogoBase64 ? (
          <img src={brandLogoBase64} alt="Logo" className="h-10 object-contain" />
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-950 border border-emerald-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="font-black text-white text-sm uppercase tracking-widest">Apex Ops</span>
          </div>
        )}
        <div className="mt-3 px-2 py-1.5 bg-emerald-900/20 border border-emerald-800/50 rounded-lg">
          <p className="text-xs text-emerald-400 font-bold truncate">{user?.username}</p>
          <p className="text-[10px] text-zinc-500">Klantportaal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all',
              isActive
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-800/50'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            {label === 'Aanvragen' && pendingRequests > 0 && (
              <span className="ml-auto bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingRequests}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-zinc-500 hover:text-red-400 hover:bg-red-900/10 transition-all">
          <LogOut className="w-4 h-4" /> Uitloggen
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-white text-sm uppercase tracking-widest">Klantportaal</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
