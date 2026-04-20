
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../branding/logo';
import { useStore } from '../data/store';
import { useAuthStore } from '../modules/auth/store';
import { Globe, Menu, LogOut, Bell } from 'lucide-react';

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { i18n } = useTranslation();
  const { language, setLanguage, brandLogoBase64, applications, incidents, employees } = useStore();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const notificationCount = (() => {
    if (user?.role !== 'admin') return 0;
    const pendingApps = applications.filter(a => a.status === 'PENDING').length;
    const openIncidents = incidents.filter(i => i.status === 'Submitted').length;
    const expiredBadges = employees.filter(e => {
      if (!e.badgeExpiry || e.status !== 'Active') return false;
      return new Date(e.badgeExpiry) < new Date();
    }).length;
    return pendingApps + openIncidents + expiredBadges;
  })();
  
  const toggleLanguage = () => {
    const newLang = language === 'nl' ? 'fr' : 'nl';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="h-16 bg-[#08090a]/95 backdrop-blur-md border-b border-white/[0.06] px-6 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Hamburger, Logo & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="text-[#8a8f98] hover:text-white mr-2 focus:outline-none md:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="relative cursor-pointer" onClick={() => navigate('/')}>
            {brandLogoBase64 ? (
              <img src={brandLogoBase64} alt="Brand Logo" className="h-9 w-auto object-contain" />
            ) : (
              <div className="h-9 px-3 bg-[#0f1011] border border-white/10 rounded-lg flex items-center justify-center">
                <span className="text-[#7170ff] font-semibold tracking-widest text-sm">APEX</span>
              </div>
            )}
          </div>

          <h1 className="text-[#f7f8f8] font-semibold tracking-widest uppercase hidden md:block pl-1 text-sm">
            {APP_NAME}
          </h1>
        </div>

        {/* Right: Language, Notifications, Profile & Logout */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/')}
              className="relative p-2 text-[#8a8f98] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Notificaties"
            >
              <Bell className="w-[18px] h-[18px]" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-[#8a8f98] hover:text-white transition-colors border border-white/[0.07] hover:border-white/20 rounded-lg px-2.5 py-1.5"
            title="Taal wisselen"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase font-medium text-[11px] hidden sm:inline">{language.toUpperCase()}</span>
          </button>

          <div
            className="w-8 h-8 bg-[#5e6ad2]/15 border border-[#5e6ad2]/40 rounded-full flex items-center justify-center text-[#7170ff] font-semibold text-xs cursor-default"
            title={user?.username}
          >
            {user ? getInitials(user.username) : '?'}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-[#8a8f98] hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Uitloggen"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </header>
    </>
  );
};
