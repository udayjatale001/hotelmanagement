
"use client";

import { useState, useEffect } from 'react';

const ADMIN_EMAIL = 'suyash001@gmail.com';
const ADMIN_PASS = '9981';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('harmony_auth');
    setIsAuthenticated(session === 'true');
  }, []);

  const login = (email: string, pass: string) => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
      localStorage.setItem('harmony_auth', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('harmony_auth');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
