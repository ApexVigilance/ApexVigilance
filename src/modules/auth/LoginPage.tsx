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
    <div className="min-h-screen bg-[#F0F9FF] text-[#0C4A6E] flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Fira_Sans',sans-serif]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,105,161,0.08),rgba(14,165,233,0.03)_38%,rgba(255,255,255,0.92)_100%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-[radial-gradient(circle_at_top,rgba(3,105,161,0.18),transparent_58%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[28px] border border-sky-200 bg-white/90 shadow-[0_24px_80px_rgba(12,74,110,0.12)] backdrop-blur-sm overflow-hidden">
          <div className="px-8 pt-8 pb-6 bg-[linear-gradient(180deg,#0369A1_0%,#0EA5E9_100%)] text-white text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/20 bg-slate-950/10 shadow-[0_0_10px_rgba(255,255,255,0.18)]">
              {brandLogoBase64 ? (
                <img src={brandLogoBase64} alt="Logo" className="h-14 object-contain" />
              ) : (
                <span className="text-4xl font-semibold font-['Fira_Code',monospace] text-white">A</span>
              )}
            </div>
            <h1 className="text-[30px] leading-none tracking-[0.18em] uppercase font-semibold font-['Fira_Code',monospace]">Apex Ops</h1>
            <p className="mt-3 text-sm text-sky-50/90">Beveiligingsbeheer platform</p>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-[32px] font-semibold leading-tight font-['Fira_Code',monospace] text-[#0C4A6E] mb-2">Inloggen</h2>
            <p className="text-sm text-sky-800/80 mb-6">Veilige toegang tot het operationeel platform.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center gap-2 text-sm text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/80 mb-2 font-['Fira_Code',monospace]">
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
                  className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-[#0C4A6E] text-sm shadow-[0_0_10px_rgba(3,105,161,0.06)] outline-none transition-all placeholder:text-sky-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700/80 mb-2 font-['Fira_Code',monospace]">
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
                    className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 pr-11 text-[#0C4A6E] text-sm shadow-[0_0_10px_rgba(3,105,161,0.06)] outline-none transition-all placeholder:text-sky-300 focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sky-500 hover:text-sky-700 transition-colors cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!username || !password || loading}
                className="w-full rounded-2xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(34,197,94,0.18)]"
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
        </div>

        <div className="mt-6 text-center text-[#0C4A6E]/45 text-xs font-['Fira_Code',monospace]">
          Apex Vigilance Group &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
