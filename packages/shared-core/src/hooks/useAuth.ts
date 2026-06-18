'use client';

import { useAuthStore } from '@/lib/store/useAuthStore';
import { useMemo } from 'react';

export function useUser() {
    const { user, isAuthenticated } = useAuthStore();
    
    return useMemo(() => ({
        data: user,
        isLoading: false,
        isAuthenticated,
        error: null,
    }), [user, isAuthenticated]);
}

export function useLogin() {
    const { login, isLoading } = useAuthStore();

    return {
        mutateAsync: async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
            await login(credentials, 'customer');
            return { success: true };
        },
        isLoading,
    };
}

export function useLogout() {
    const { logout, isLoading } = useAuthStore();

    return {
        mutateAsync: async () => {
            await logout();
        },
        isLoading,
    };
}
