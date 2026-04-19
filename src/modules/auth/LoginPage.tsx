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
    await new Promise(r => setTimeout(r, 400));
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
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(113,112,255,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(94,106,210,0.10),transparent_28%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 text-center">
          {brandLogoBase64 ? (
            <img src={brandLogoBase64} alt="Logo" className="h-20 object-contain mb-5 opacity-95" />
          ) : (
            <div className="w-16 h-16 rounded-2xl border border-white/10 bg-[#0f1011] flex items-center justify-center mb-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <span className="text-3xl font-semibold text-[#f7f8f8]">A</span>
            </div>
          )}
          <h1 className="text-[28px] font-semibold tracking-[0.22em] uppercase text-white">Apex Ops</h1>
          <p className="text-[#8a8f98] text-sm mt-2">Beveiligingsbeheer platform</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-[#0f1011]/96 backdrop-blur-xl p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_60px_rgba(0,0,0,0.45)]">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-white">Inloggen</h2>
            <p className="text-sm text-[#8a8f98] mt-1">Toegang tot het operationeel platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f98] uppercase tracking-[0.18em] mb-2">
                Gebruikersnaam
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  clearError();
                }}
                placeholder="Voer uw gebruikersnaam in"
                className="w-full bg-[#191a1b] border border-white/8 rounded-xl px-4 py-3 text-[#f7f8f8] text-sm outline-none transition-all placeholder:text-[#62666d] focus:border-[#7170ff] focus:ring-2 focus:ring-[#7170ff]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#8a8f98] uppercase tracking-[0.18em] mb-2">
                Wachtwoord
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="Voer uw wachtwoord in"
                  className="w-full bg-[#191a1b] border border-white/8 rounded-xl px-4 py-3 pr-11 text-[#f7f8f8] text-sm outline-none transition-all placeholder:text-[#62666d] focus:border-[#7170ff] focus:ring-2 focus:ring-[#7170ff]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8f98] hover:text-[#d0d6e0] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!username || !password || loading}
              className="w-full bg-[#5e6ad2] hover:bg-[#7170ff] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_10px_30px_rgba(94,106,210,0.22)]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-[#62666d] text-xs">
          Apex Vigilance Group &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
