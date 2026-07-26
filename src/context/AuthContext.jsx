import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints.js';
import { setAccessToken, setSessionLostHandler } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);

  const clear = useCallback(() => {
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // On first paint, try to trade the httpOnly refresh cookie for a session.
  useEffect(() => {
    setSessionLostHandler(clear);
    (async () => {
      try {
        const { accessToken, user: me } = await authApi.refresh();
        setAccessToken(accessToken);
        setToken(accessToken);
        setUser(me);
      } catch {
        clear();
      } finally {
        setBooting(false);
      }
    })();
  }, [clear]);

  const login = useCallback(async (credentials) => {
    const { accessToken, user: me } = await authApi.login(credentials);
    setAccessToken(accessToken);
    setToken(accessToken);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { clear(); }
  }, [clear]);

  const value = useMemo(() => ({
    user,
    token,
    booting,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    siteIds: (user?.sites || []).map((s) => s.id || s._id || s),
  }), [user, token, booting, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
