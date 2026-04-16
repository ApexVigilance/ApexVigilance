import { create } from 'zustand';

export type UserRole = 'admin' | 'agent' | 'client';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  clientId?: string;
  employeeId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loginError: string | null;
  // New unified login
  login: (username: string, password: string) => boolean;
  // Legacy (kept for test scripts)
  loginAsAdmin: () => void;
  loginAsAgent: () => void;
  loginAsClient: (clientId: string, clientName: string) => void;
  logout: () => void;
  clearError: () => void;
}

const STORAGE_KEY = 'apex_auth_session';
const ADMIN_CREDS_KEY = 'apex_admin_credentials';

const getUserFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

const getAdminCredentials = (): { username: string; password: string } => {
  try {
    const stored = localStorage.getItem(ADMIN_CREDS_KEY);
    return stored ? JSON.parse(stored) : { username: 'admin', password: 'admin' };
  } catch { return { username: 'admin', password: 'admin' }; }
};

const setSession = (user: User) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getUserFromStorage(),
  isAuthenticated: !!getUserFromStorage(),
  loginError: null,

  login: (username: string, password: string): boolean => {
    const u = username.trim().toLowerCase();
    const p = password.trim();

    // ── Admin ──────────────────────────────────────────
    const adminCreds = getAdminCredentials();
    if (u === adminCreds.username.toLowerCase() && p === adminCreds.password) {
      const user: User = { id: 'admin', username: 'Admin', role: 'admin' };
      setSession(user);
      set({ user, isAuthenticated: true, loginError: null });
      return true;
    }

    // ── Agent (lees employees uit localStorage) ────────
    try {
      const employees = JSON.parse(localStorage.getItem('apex_employees') || '[]');
      const emp = employees.find((e: any) =>
        e.status === 'Active' &&
        e.portalPassword &&
        (e.portalUsername || e.email || e.name)?.toLowerCase() === u &&
        e.portalPassword === p
      );
      if (emp) {
        const user: User = { id: emp.id, username: emp.name, role: 'agent', employeeId: emp.id };
        setSession(user);
        set({ user, isAuthenticated: true, loginError: null });
        return true;
      }
    } catch {}

    // ── Client (lees clients uit localStorage) ─────────
    try {
      const clients = JSON.parse(localStorage.getItem('apex_clients') || '[]');
      const client = clients.find((c: any) =>
        c.status === 'Active' &&
        c.portalPassword &&
        (c.portalUsername || c.clientRef || c.email || c.name)?.toLowerCase() === u &&
        c.portalPassword === p
      );
      if (client) {
        const user: User = { id: client.id, username: client.name, role: 'client', clientId: client.id };
        setSession(user);
        set({ user, isAuthenticated: true, loginError: null });
        return true;
      }
    } catch {}

    set({ loginError: 'Ongeldige gebruikersnaam of wachtwoord.' });
    return false;
  },

  // ── Legacy helpers ─────────────────────────────────
  loginAsAdmin: () => {
    const user: User = { id: 'admin', username: 'Admin', role: 'admin' };
    setSession(user);
    set({ user, isAuthenticated: true, loginError: null });
  },
  loginAsAgent: () => {
    const user: User = { id: 'agent-demo', username: 'Agent', role: 'agent', employeeId: 'agent-demo' };
    setSession(user);
    set({ user, isAuthenticated: true, loginError: null });
  },
  loginAsClient: (clientId: string, clientName: string) => {
    const user: User = { id: clientId, username: clientName, role: 'client', clientId };
    setSession(user);
    set({ user, isAuthenticated: true, loginError: null });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, isAuthenticated: false, loginError: null });
  },
  clearError: () => set({ loginError: null }),
}));

export const ADMIN_CREDS_KEY_EXPORT = ADMIN_CREDS_KEY;
