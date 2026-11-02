import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'gkmetal_crm_token';
const USER_KEY = 'gkmetal_crm_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate session token on mount
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await api.getCurrentUser();
        if (isMounted && res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        } else if (isMounted) {
          // If session is expired or invalid, clear credentials
          logout();
        }
      } catch {
        // If offline or network error, keep existing cached session
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res.success && res.token && res.user) {
      setToken(res.token);
      setCurrentUser(res.user);
      try {
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      } catch (e) {
        console.error('Failed to store auth tokens:', e);
      }
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const logout = () => {
    setToken(null);
    setCurrentUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear auth tokens:', e);
    }
  };

  const updateUser = (updatedFields) => {
    setCurrentUser(prev => {
      const next = { ...prev, ...updatedFields };
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to update local user cache:', e);
      }
      return next;
    });
  };

  // Check if current user has permission to access a specific page
  const hasPageAccess = (pageId) => {
    if (!currentUser) return false;
    // Admins have access to everything
    if (currentUser.role === 'Admin') return true;

    // Normalize pageId (e.g. 'invoices', 'customers', etc.)
    const cleanId = String(pageId || '').toLowerCase().trim();

    if (Array.isArray(currentUser.allowedPages)) {
      return currentUser.allowedPages.map(p => p.toLowerCase()).includes(cleanId);
    }

    // Default restricted pages for non-admin if allowedPages not configured
    if (cleanId === 'employees' || cleanId === 'settings') {
      return false;
    }
    return true;
  };

  // Backwards compatibility for simulation
  const switchRole = (newRole) => {
    updateUser({ role: newRole });
  };

  const isAuthenticated = Boolean(token && currentUser);

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        isAuthenticated,
        loading,
        login,
        logout,
        updateUser,
        hasPageAccess,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
