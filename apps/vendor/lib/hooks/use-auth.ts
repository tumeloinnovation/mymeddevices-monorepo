'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext } from '@/providers/AuthProvider';

export function useAuth() {
  return useAuthContext();
}

export function useRequireAuth() {
  const { user, isAuthenticated, isLoading, forceLogout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user && user.role !== 'vendor') {
      forceLogout();
    }
  }, [user, forceLogout]);

  return { user, isAuthenticated, isLoading };
}
