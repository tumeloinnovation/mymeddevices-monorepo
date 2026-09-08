'use client';

import { useState, useEffect } from 'react';
import { SessionExpiredModal } from '@mymeddevices/shared-ui';
import { useAuthStore } from '@mymeddevices/shared-core';

export function SessionExpiredWatcher() {
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
    // Validate stored tokens on mount
    const store = useAuthStore.getState();
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    if (store.isAuthenticated && !store.isDemo && !refreshToken) {
      console.log('🔄 [SessionExpiredWatcher] Authenticated but no refresh token found, triggering session-expired event');
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    }
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      const store = useAuthStore.getState();
      if (store.user?.email) {
        setEmail(store.user.email);
        setIsOpen(true);
      } else {
        store.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    };

    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, []);

  const handleLogin = async (password: string) => {
    const store = useAuthStore.getState();
    await store.login({ email, password }, 'customer');
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    useAuthStore.getState().clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
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

