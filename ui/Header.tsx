import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../branding/logo';
import { useStore } from '../data/store';
import { useAuthStore } from '../modules/auth/store';
import { Globe, Menu, LogOut, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { i18n } = useTranslation();
  const { language, setLanguage, brandLogoBase64, theme, setTheme } = useStore();
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  
  // Sync theme with DOM on mount and change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  const toggleLanguage = () => {
    const newLang = language === 'nl' ? 'fr' : 'nl';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-zinc-950 border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <button 
          onClick={onToggleSidebar}
          className="text-zinc-400 hover:text-white mr-2 focus:outline-none md:hidden"
          aria-label="Toggle Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative cursor-pointer" onClick={() => navigate('/')}>
          {brandLogoBase64 ? (
            <img src={brandLogoBase64} alt="Brand Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="h-10 px-3 bg-zinc-900 border border-apex-gold rounded flex items-center justify-center">
              <span className="text-apex-gold font-bold tracking-widest">APEX</span>
            </div>
          )}
        </div>

        <h1 className="text-zinc-900 dark:text-white font-bold tracking-widest uppercase hidden md:block pl-2">
          {APP_NAME}
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <button 
          onClick={toggleTheme}
          className="p-2 text-zinc-400 hover:text-apex-gold transition-colors rounded-lg hover:bg-zinc-800"
          title="Schakel thema"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleLanguage}
          className="flex items-center space-x-2 text-zinc-400 hover:text-apex-gold transition-colors border border-zinc-800 rounded px-3 py-1 bg-zinc-900"
        >
          <Globe className="w-4 h-4" />
          <span className="uppercase font-bold text-sm">{language.toUpperCase()}</span>
        </button>
        
        <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-apex-gold border border-apex-gold font-bold shadow-sm shadow-apex-gold/20 cursor-default">
          A
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