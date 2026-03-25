import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

/**
 * Silently register the service worker and re-subscribe to push if permission
 * was previously granted. Called after every successful login/register flow.
 */
async function tryAutoSubscribePush() {
  try {
    if (
      Notification.permission !== 'granted' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) return;

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const { data } = await api.get('/push/vapid-public-key');
    const rawKey = data.publicKey;
    const padding = '='.repeat((4 - (rawKey.length % 4)) % 4);
    const base64 = (rawKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const bytes = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));

    const sub = existing || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
    await api.post('/push/subscribe', { subscription: sub.toJSON() });
  } catch (e) {
    // Silent fail — user can enable manually from Navbar
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data); tryAutoSubscribePush(); })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    tryAutoSubscribePush();
    return data;
  };

  const register = async (name, email, password, organizationId) => {
    const { data } = await api.post('/auth/register', { name, email, password, organizationId });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    tryAutoSubscribePush();
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    tryAutoSubscribePush();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, googleLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
