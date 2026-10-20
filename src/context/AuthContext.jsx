import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Keeps track of who is signed in and shares it with every component.
 * The session itself lives in a secure HttpOnly cookie that JavaScript
 * cannot read; this context only stores the public user details.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((data) => {
        setUser(data.user);
        setDemoMode(Boolean(data.demoMode));
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const demoLogin = useCallback(async (role) => {
    const data = await api.post('/api/auth/demo', { role });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const data = await api.post('/api/auth/register', details);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, demoMode, isAdmin: user?.role === 'admin', login, demoLogin, register, logout }),
    [user, ready, demoMode, login, demoLogin, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  return useContext(AuthContext);
}
