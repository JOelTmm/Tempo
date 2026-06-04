import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: "player" | "manager";
  xp: number;
  level: number;
  streaming: { spotify: boolean; deezer: boolean };
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name: string) => Promise<string | null>;
  logout: () => Promise<void>;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await window.tempo.auth.me();
    setUser(me);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await window.tempo.auth.login(email, password);
    if (!res.ok) return res.error || "Erreur";
    setUser(res.user);
    return null;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await window.tempo.auth.register(email, password, name);
    if (!res.ok) return res.error || "Erreur";
    setUser(res.user);
    return null;
  }, []);

  const logout = useCallback(async () => {
    await window.tempo.auth.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      login,
      register,
      logout,
      isManager: user?.role === "manager",
    }),
    [user, loading, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth hors AuthProvider");
  return ctx;
}