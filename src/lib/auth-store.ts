
"use client";

import { useState, useEffect } from 'react';

const ADMIN_EMAIL = 'suyash001@gmail.com';
const ADMIN_PASS = '9981';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const session = localStorage.getItem('harmony_auth');
    const email = localStorage.getItem('harmony_user_email');
    if (session === 'true' && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = (email: string, pass: string) => {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
      localStorage.setItem('harmony_auth', 'true');
      localStorage.setItem('harmony_user_email', email);
      setIsAuthenticated(true);
      setUserEmail(email);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('harmony_auth');
    localStorage.removeItem('harmony_user_email');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return { isAuthenticated, userEmail, login, logout };
}
