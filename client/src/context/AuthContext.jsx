import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState({
    id: 'emp_1',
    employeeId: 'EMP-01',
    name: 'G. Karthikeyan',
    email: 'karthik@gkmetallab.com',
    role: 'Admin',
    department: 'Management & Technical QA'
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const switchRole = (newRole) => {
    setCurrentUser(prev => ({
      ...prev,
      role: newRole
    }));
  };

  const login = (userPayload) => {
    setCurrentUser(userPayload);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, switchRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
