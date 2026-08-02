import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('nimbus_user');
    const token = localStorage.getItem('nimbus_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, remember) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('nimbus_token', data.token);
    localStorage.setItem('nimbus_user', JSON.stringify(data.user));
    if (remember) {
      localStorage.setItem('nimbus_remember', '1');
    }
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('nimbus_token', data.token);
    localStorage.setItem('nimbus_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('nimbus_token');
    localStorage.removeItem('nimbus_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
