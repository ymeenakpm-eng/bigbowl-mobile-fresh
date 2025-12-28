import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { deleteStoredItem, getStoredItem, setStoredItem } from '../utils/storage';

type AuthUser = {
  id: string;
  phone: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

type AuthContextValue = {
  state: AuthState;
  setAuth: (next: AuthState) => void;
  signIn: (next: AuthState) => Promise<void>;
  signOut: () => Promise<void>;
  hydrated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const KEY_AUTH = 'bb_auth_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });
  const [hydrated, setHydrated] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await getStoredItem(KEY_AUTH);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const token = typeof parsed?.token === 'string' ? parsed.token : null;
        const user = parsed?.user && typeof parsed.user?.id === 'string' ? parsed.user : null;
        setState({ token, user });
      } catch {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      state,
      hydrated,
      setAuth: (next) => setState(next),
      signIn: async (next) => {
        setState(next);
        try {
          await setStoredItem(KEY_AUTH, JSON.stringify(next));
        } catch {
          // ignore
        }
      },
      signOut: async () => {
        setState({ token: null, user: null });
        await deleteStoredItem(KEY_AUTH);
      },
    };
  }, [hydrated, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
