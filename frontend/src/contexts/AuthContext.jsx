import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { setAuthToken, setLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer le profil utilisateur
  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      // Si erreur 401, le token est invalide
      if (error?.response?.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('token');
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      fetchProfile();
    }
    setLoading(false);

    const externalLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      setAuthToken(null);
      localStorage.removeItem('token');
    };

    window.addEventListener('logout', externalLogout);
    setLogoutHandler(() => externalLogout);

    return () => {
      window.removeEventListener('logout', externalLogout);
      setLogoutHandler(null);
    };
  }, [fetchProfile]);

  const login = (token, userData = null) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    setIsAuthenticated(true);
    if (userData) {
      setUser(userData);
    } else {
      fetchProfile();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event('logout'));
  };

  // Fonction pour rafraîchir les données utilisateur (après une action)
  const refreshUser = () => {
    if (isAuthenticated) {
      fetchProfile();
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}