'use client';

import { useState, useEffect } from 'react';
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthStore } from '@/lib/store/useAuthStore';

export function SessionExpiredWatcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const { login, forceLogout } = useAuth();

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
      if (store.user) {
        setEmail(store.user.email);
        setIsOpen(true);
      } else {
        forceLogout();
      }
    };

    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, [forceLogout]);

  const handleLogin = async (password: string) => {
    await login({ email, password });
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    forceLogout();
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
