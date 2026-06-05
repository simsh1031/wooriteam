import { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthState {
  token: string | null;
  nickname: string | null;
  userId: number | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, nickname: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseUserId(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.uid ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    nickname: localStorage.getItem('nickname'),
    userId: parseUserId(localStorage.getItem('token')),
  });

  const login = (token: string, nickname: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('nickname', nickname);
    setAuth({ token, nickname, userId: parseUserId(token) });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nickname');
    setAuth({ token: null, nickname: null, userId: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isLoggedIn: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}