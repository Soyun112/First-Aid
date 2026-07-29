import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ACCESS_CODE, AUTH_STORAGE_KEY } from '../data/access';

const AuthContext = createContext(null);

function readAuth() {
  try {
    return sessionStorage.getItem(AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(readAuth);

  const login = useCallback((code) => {
    // TODO: 서버/API 인증 연동
    if (code.trim() !== ACCESS_CODE) {
      return { ok: false, message: '접근 코드가 올바르지 않습니다.' };
    }
    sessionStorage.setItem(AUTH_STORAGE_KEY, '1');
    setIsAuthenticated(true);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
