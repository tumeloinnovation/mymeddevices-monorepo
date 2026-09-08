'use client';

import { useState, useEffect } from 'react';
import { SessionExpiredModal } from './SessionExpiredModal';
import { useAuthStore } from '@mymeddevices/shared-core';

export interface SessionExpiredWatcherProps {
  role?: 'customer' | 'admin' | 'vendor';
  loginPath?: string;
}

export function SessionExpiredWatcher({
  role,
  loginPath = '/login',
}: SessionExpiredWatcherProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const isSessionExpired = useAuthStore((s) => s.isSessionExpired);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isSessionExpired && user?.email) {
      setEmail(user.email);
      setIsOpen(true);
    } else if (!isSessionExpired) {
      setIsOpen(false);
    }
  }, [isSessionExpired, user?.email]);

  useEffect(() => {
    const handleExpired = () => {
      const store = useAuthStore.getState();
      if (store.user?.email) {
        setEmail(store.user.email);
        setIsOpen(true);
      } else {
        store.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = loginPath;
        }
      }
    };

    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, [loginPath]);

  const handleLogin = async (password: string) => {
    const store = useAuthStore.getState();
    await store.login({ email, password }, role);
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = loginPath;
    }
  };

  return (
    <SessionExpiredModal
      open={isOpen}
      onOpenChange={setIsOpen}
      email={email}
      onLogin={handleLogin}
      onLogout={handleLogout}
    />
  );
}
