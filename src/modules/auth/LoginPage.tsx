import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { useStore } from '../../data/store';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginError, clearError, isAuthenticated, user } = useAuthStore();
  const { brandLogoBase64 } = useStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Already logged in — redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') navigate('/', { replace: true });
      else if (user.role === 'agent') navigate('/agent', { replace: true });
      else if (user.role === 'client') navigate('/client', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    clearError();
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // small UX delay
    const ok = login(username, password);
    setLoading(false);
    if (ok) {
      const u = useAuthStore.getState().user;
      if (u?.role === 'admin') navigate('/');
      else if (u?.role === 'agent') navigate('/agent');
      else if (u?.role === 'client') navigate('/client');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          {brandLogoBase64 ? (
            <img src={brandLogoBase64} alt="Logo" className="h-20 object-contain mb-5" />
          ) : (
            <div className="w-16 h-16 bg-zinc-950 border-2 border-yellow-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-yellow-600/20">
              <span className="text-3xl font-black text-yellow-500">A</span>
            </div>
          )}
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Apex Ops</h1>
          <p className="text-zinc-500 text-sm mt-1">Beveiligingsbeheer platform</p>
        </div>

        {/* Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-black text-white mb-6">Inloggen</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {loginError && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Gebruikersnaam
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => { setUsername(e.target.value); clearError(); }}
                placeholder="Voer uw gebruikersnaam in"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/30 outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Wachtwoord
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError(); }}
                  placeholder="Voer uw wachtwoord in"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 pr-11 text-white text-sm focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600/30 outline-none transition-all placeholder:text-zinc-600"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!username || !password || loading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-yellow-600/20"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          {/* Role hint */}
          <div className="mt-6 pt-5 border-t border-zinc-800 space-y-1.5">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-2">Standaard toegang</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Admin</span>
              <span className="font-mono text-zinc-400">admin / admin</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Agent</span>
              <span className="text-zinc-600 italic">Ingesteld door admin</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Klant</span>
              <span className="text-zinc-600 italic">Ingesteld door admin</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-zinc-700 text-xs font-mono">
          Apex Vigilance Group &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
