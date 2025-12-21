import React, { createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken, setLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }

    const externalLogout = () => {
      setIsAuthenticated(false);
      setAuthToken(null);
      localStorage.removeItem('token');
    };

    window.addEventListener('logout', externalLogout);
    setLogoutHandler(() => externalLogout);

    return () => {
      window.removeEventListener('logout', externalLogout);
      setLogoutHandler(null);
    };
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('logout'));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}