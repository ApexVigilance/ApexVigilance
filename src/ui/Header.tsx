
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
      <header className="h-16 bg-apex-black border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Hamburger, Logo & Title */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onToggleSidebar}
            className="text-zinc-400 hover:text-white mr-2 focus:outline-none md:hidden"
            aria-label="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div 
            className="relative cursor-pointer" 
            onClick={() => navigate('/')}
          >
            {brandLogoBase64 ? (
              <img 
                src={brandLogoBase64} 
                alt="Brand Logo" 
                className="h-10 w-auto object-contain" 
              />
            ) : (
              <div className="h-10 px-3 bg-zinc-900 border border-apex-gold rounded flex items-center justify-center">
                <span className="text-apex-gold font-bold tracking-widest">APEX</span>
              </div>
            )}
          </div>

          <h1 className="text-white font-bold tracking-widest uppercase hidden md:block pl-2">
            {APP_NAME}
          </h1>
        </div>

        {/* Right: Language, Profile & Logout */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notification Bell */}
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/')}
              className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Notificaties"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 leading-none">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-zinc-400 hover:text-apex-gold transition-colors border border-zinc-700 rounded px-2 py-1"
            title="Taal wisselen"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase font-bold text-xs hidden sm:inline">{language.toUpperCase()}</span>
          </button>
          
          <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-apex-gold border border-apex-gold font-bold text-xs shadow-sm shadow-apex-gold/20 cursor-default" title={user?.username}>
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
    </>
  );
};
