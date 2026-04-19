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
    <div className="min-h-screen bg-[#020617] text-[#e0f2fe] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(14,165,233,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.22)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center mb-10 text-center">
          {brandLogoBase64 ? (
            <img src={brandLogoBase64} alt="Logo" className="h-20 object-contain mb-5 drop-shadow-[0_0_24px_rgba(14,165,233,0.2)]" />
          ) : (
            <div className="w-16 h-16 rounded-2xl border border-sky-400/30 bg-slate-950/90 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(14,165,233,0.18)]">
              <span className="text-3xl font-black text-sky-400">A</span>
            </div>
          )}
          <h1 className="text-[28px] font-semibold tracking-[0.18em] uppercase text-white">Apex Ops</h1>
          <p className="text-sky-100/65 text-sm mt-2 font-medium">Beveiligingsbeheer platform</p>
        </div>

        <div className="rounded-2xl border border-sky-300/10 bg-slate-950/80 backdrop-blur-xl p-8 shadow-[0_20px_80px_rgba(2,6,23,0.65)]">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Inloggen</h2>
            <p className="text-sm text-sky-100/55 mt-1">Veilige toegang tot het operationeel platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-emerald-500/8 border border-emerald-400/20 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-emerald-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-sky-100/55 uppercase tracking-[0.18em] mb-2">
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
                className="w-full bg-slate-900/90 border border-sky-200/10 rounded-xl px-4 py-3 text-white text-sm focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all placeholder:text-sky-100/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-sky-100/55 uppercase tracking-[0.18em] mb-2">
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
                  className="w-full bg-slate-900/90 border border-sky-200/10 rounded-xl px-4 py-3 pr-11 text-white text-sm focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all placeholder:text-sky-100/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-100/40 hover:text-sky-100/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!username || !password || loading}
              className="w-full bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-[0_0_24px_rgba(34,197,94,0.18)]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sky-100/30 text-xs font-medium tracking-[0.08em]">
          Apex Vigilance Group &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
